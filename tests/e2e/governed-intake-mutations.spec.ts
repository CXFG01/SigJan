import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_STORAGE_KEY,
  startWithCleanDemo,
  waitForStoredPlanStatus,
} from "./helpers";

type StoredMedication = {
  id: string;
  enteredName: string;
  dose: string | null;
  confirmationStatus: string;
};

async function readStoredMedications(page: Page): Promise<StoredMedication[] | null> {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const state = JSON.parse(raw) as {
      episode?: { medicationEntries?: StoredMedication[] };
    };
    return state.episode?.medicationEntries ?? null;
  }, DEMO_STORAGE_KEY);
}

test.describe("governed intake and medication mutation", () => {
  test.skip(
    ({ isMobile }) => Boolean(isMobile),
    "These state-governance regressions are covered in the desktop project.",
  );

  test("a fresh document-only import shows exactly four discharge candidates", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto("/patient/intake");

    await page
      .getByRole("button", { name: "Extract candidate fields" })
      .click();
    await expect(page.getByText("Discharge letter processed")).toBeVisible();
    await page
      .getByRole("link", { name: "Check extracted items" })
      .click();

    await expect(page).toHaveURL(/\/patient\/confirm$/);
    await expect(
      page.getByRole("button", { name: "All 4" }),
    ).toBeVisible();
    await expect(
      page.locator(".confirmation-list > article.source-and-editor"),
    ).toHaveCount(4);
    await expect(
      page.getByRole("heading", { name: /ibuprofen/iu }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /ginkgo/iu }),
    ).toHaveCount(0);

    await expect
      .poll(() => readStoredMedications(page))
      .toEqual([
        expect.objectContaining({ id: "med-apixaban" }),
        expect.objectContaining({ id: "med-diltiazem" }),
        expect.objectContaining({ id: "med-lisinopril" }),
        expect.objectContaining({ id: "med-spironolactone" }),
      ]);
  });

  test("an edited voice transcript mentioning only ibuprofen imports one candidate", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto("/patient/intake");

    await page
      .getByRole("button", { name: /^Voice recap/iu })
      .click();
    await page
      .getByLabel("Editable transcript")
      .fill("I sometimes take ibuprofen for my knee pain.");
    await page
      .getByRole("button", { name: "Extract candidate products" })
      .click();
    await expect(page.getByText("Voice recap processed")).toBeVisible();
    await page
      .getByRole("link", { name: "Check extracted items" })
      .click();

    await expect(page).toHaveURL(/\/patient\/confirm$/);
    await expect(
      page.getByRole("button", { name: "All 1" }),
    ).toBeVisible();
    await expect(
      page.locator(".confirmation-list > article.source-and-editor"),
    ).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Ibuprofen 200 mg" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /ginkgo/iu }),
    ).toHaveCount(0);

    await expect
      .poll(() => readStoredMedications(page))
      .toEqual([
        expect.objectContaining({
          id: "med-ibuprofen",
          enteredName: "Ibuprofen 200 mg",
        }),
      ]);
  });

  test("a material medication edit invalidates the approved plan and current review projections", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto(
      "/professional/review/episode-evelyn-post-discharge-2026-07",
    );

    await page.getByRole("button", { name: "Load seeded review" }).click();
    await expect(
      page.locator(".plan-approval-status", { hasText: "Approved" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Publish patient plan" })
      .first()
      .click();
    await waitForStoredPlanStatus(page, "approved");

    await page.goto("/patient/confirm");
    const apixaban = page
      .locator("article.source-and-editor")
      .filter({
        has: page.getByRole("heading", {
          name: "Eliquis 5 mg tablets",
        }),
      });
    await apixaban.getByRole("button", { name: "Edit fields" }).click();
    await apixaban.getByLabel("Dose actually taken").fill("2 tablets");
    await apixaban
      .getByRole("button", { name: "Save corrections" })
      .click();

    await expect
      .poll(() =>
        page.evaluate((storageKey) => {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) {
            return null;
          }
          const state = JSON.parse(raw) as {
            episode: {
              workflowState: string;
              medicationEntries: StoredMedication[];
              concerns: Array<{
                reviewStatus: string;
                reviewerDisposition: string | null;
                resolutionReason: string | null;
              }>;
              reviewActions: unknown[];
              auditEvents: Array<{
                action: string;
                details: Array<{ key: string; value: string }>;
              }>;
              patientPlan: {
                status: string;
                approvedBy: string | null;
                approvedAt: string | null;
                reviewItems: unknown[];
              };
            };
          };
          const invalidation = [...state.episode.auditEvents]
            .reverse()
            .find((event) => event.action === "patient_plan_invalidated");
          return {
            apixabanDose: state.episode.medicationEntries.find(
              (entry) => entry.id === "med-apixaban",
            )?.dose,
            workflowState: state.episode.workflowState,
            planStatus: state.episode.patientPlan.status,
            approvedBy: state.episode.patientPlan.approvedBy,
            approvedAt: state.episode.patientPlan.approvedAt,
            reviewItemCount: state.episode.patientPlan.reviewItems.length,
            activeConcernApprovalCount: state.episode.concerns.filter(
              (concern) =>
                concern.reviewStatus !== "unreviewed" ||
                concern.reviewerDisposition !== null ||
                concern.resolutionReason !== null,
            ).length,
            historicalReviewActionCount: state.episode.reviewActions.length,
            invalidationDetails: invalidation
              ? Object.fromEntries(
                  invalidation.details.map(({ key, value }) => [key, value]),
                )
              : null,
          };
        }, DEMO_STORAGE_KEY),
      )
      .toEqual({
        apixabanDose: "2 tablets",
        workflowState: "awaiting_confirmation",
        planStatus: "draft",
        approvedBy: null,
        approvedAt: null,
        reviewItemCount: 0,
        activeConcernApprovalCount: 0,
        historicalReviewActionCount: 3,
        invalidationDetails: expect.objectContaining({
          previousPlanStatus: "approved",
          previousWorkflowState: "resolved",
          reason: "medication_record_changed",
        }),
      });

    await page.goto("/patient/plan");
    await expect(
      page.getByRole("heading", { name: "Plan prepared for review" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Plan approval status" }),
    ).toContainText("Not yet approved");
    await expect(
      page.getByRole("heading", {
        name: "Professional decisions have not been published",
      }),
    ).toBeVisible();
    await expect(page.getByText(/Approved by Amina Shah/iu)).toHaveCount(0);
  });
});
