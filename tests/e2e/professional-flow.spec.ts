import { expect, test } from "@playwright/test";
import { REQUIRED_SAFETY_STATEMENT } from "../../src/domain/language";
import {
  DEMO_STORAGE_KEY,
  startWithCleanDemo,
  waitForStoredPlanStatus,
} from "./helpers";

test.describe("professional review and publication", () => {
  test.skip(
    ({ isMobile }) => Boolean(isMobile),
    "The professional workbench is covered in the desktop project.",
  );

  test("loads the seeded review, publishes it, and exposes the approved patient plan", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto("/professional");

    await expect(
      page.getByRole("heading", { name: "Medication review queue" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Open review" }).click();
    await expect(page).toHaveURL(
      /\/professional\/review\/episode-evelyn-post-discharge-2026-07$/,
    );
    await expect(
      page.getByRole("heading", {
        name: "Evelyn Carter · post-discharge",
      }),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate((storageKey) => {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) {
            return null;
          }
          const state = JSON.parse(raw) as {
            episode: {
              medicationEntries: Array<{
                id: string;
                confirmationStatus: string;
              }>;
              auditEvents: Array<{ action: string; entityId: string }>;
            };
          };
          const diltiazem = state.episode.medicationEntries.find(
            (entry) => entry.id === "med-diltiazem",
          );
          return {
            status: diltiazem?.confirmationStatus,
            falsePatientConfirmation:
              state.episode.auditEvents.some(
                (event) =>
                  event.action === "medication_confirmed" &&
                  event.entityId === "med-diltiazem",
              ),
          };
        }, DEMO_STORAGE_KEY),
      )
      .toEqual({
        status: "needs_confirmation",
        falsePatientConfirmation: false,
      });

    await page.getByRole("button", { name: "Load seeded review" }).click();
    await expect(
      page.locator(".plan-approval-status", { hasText: "Approved" }),
    ).toBeVisible();
    await expect(page.getByText("3/3 concerns reviewed")).toBeVisible();

    await page
      .getByRole("button", { name: "Publish patient plan" })
      .first()
      .click();
    await expect(
      page.getByText("The reviewed patient plan is published.").first(),
    ).toBeVisible();
    await waitForStoredPlanStatus(page, "approved");

    await page.goto("/patient/plan");
    await expect(
      page.getByRole("heading", {
        name: "Evelyn’s reviewed medication plan",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Plan approval status" }),
    ).toContainText("Approved by Amina Shah, pharmacist");
    await expect(page.getByText(REQUIRED_SAFETY_STATEMENT)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What happens next" }),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download summary" })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      "signalrx-medication-plan.txt",
    );

    await page.evaluate(() => {
      window.print = () => {
        document.body.dataset.printRequested = "true";
      };
    });
    await page.getByRole("button", { name: "Print plan" }).click();
    await expect(page.locator("body")).toHaveAttribute(
      "data-print-requested",
      "true",
    );
  });
});
