import { expect, test } from "@playwright/test";
import { DEMO_STORAGE_KEY, startWithCleanDemo } from "./helpers";

test.describe("caregiver administration attribution", () => {
  test.skip(
    ({ isMobile }) => Boolean(isMobile),
    "The complete caregiver transaction is covered in the desktop project.",
  );

  test("records who administered a medicine with caregiver provenance and audit details", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto("/caregiver");

    await expect(
      page.getByRole("heading", { name: "Record actual use" }),
    ).toBeVisible();

    const medication = page
      .locator("article.caregiver-medication")
      .filter({ has: page.getByRole("heading", { name: "Lisinopril" }) });
    const administrator = medication.getByRole("combobox", {
      name: "Who administered this medicine?",
    });

    await expect(administrator).toHaveValue("Evelyn Carter");
    await administrator.selectOption("Daniel Carter");
    await medication
      .getByLabel("Optional observation for the review record")
      .fill("Daniel checked the morning medicines with Evelyn.");
    await medication
      .getByRole("button", { name: "Taken", exact: true })
      .click();

    await expect(
      medication.getByText("Daniel Carter", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Administered by Daniel Carter; update recorded by Daniel Carter.",
    );

    await expect
      .poll(() =>
        page.evaluate((storageKey) => {
          const stored = window.localStorage.getItem(storageKey);
          if (!stored) {
            return null;
          }
          const state = JSON.parse(stored) as {
            episode: {
              medicationEntries: Array<{
                id: string;
                administeredBy: string;
                administrationStatus: string;
                provenance: Array<{
                  field: string;
                  editorRole: string;
                  normalizedValue: string;
                }>;
              }>;
              auditEvents: Array<{
                action: string;
                entityId: string;
                details: Array<{ key: string; value: string }>;
              }>;
            };
          };
          const entry = state.episode.medicationEntries.find(
            (candidate) => candidate.id === "med-lisinopril",
          );
          const audit = [...state.episode.auditEvents]
            .reverse()
            .find(
              (event) =>
                event.action === "caregiver_status_recorded" &&
                event.entityId === "med-lisinopril",
            );
          return {
            administeredBy: entry?.administeredBy,
            administrationStatus: entry?.administrationStatus,
            caregiverProvenance: entry?.provenance
              .filter(
                (record) =>
                  record.editorRole === "caregiver" &&
                  ["administeredBy", "administrationStatus"].includes(
                    record.field,
                  ),
              )
              .map((record) => ({
                field: record.field,
                normalizedValue: record.normalizedValue,
              })),
            auditDetails: audit
              ? Object.fromEntries(
                  audit.details.map(({ key, value }) => [key, value]),
                )
              : null,
          };
        }, DEMO_STORAGE_KEY),
      )
      .toMatchObject({
        administeredBy: "Daniel Carter",
        administrationStatus: "taken",
        caregiverProvenance: expect.arrayContaining([
          {
            field: "administrationStatus",
            normalizedValue: "taken",
          },
          {
            field: "administeredBy",
            normalizedValue: "Daniel Carter",
          },
        ]),
        auditDetails: {
          administrationStatus: "taken",
          administeredBy: "Daniel Carter",
          previousAdministrationStatus: "taken",
          previousAdministeredBy: "Evelyn Carter",
        },
      });
  });
});
