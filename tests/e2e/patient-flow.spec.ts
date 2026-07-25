import { expect, test } from "@playwright/test";
import { startWithCleanDemo } from "./helpers";

test.describe("patient reconciliation journey", () => {
  test.skip(
    ({ isMobile }) => Boolean(isMobile),
    "The complete workflow is covered in the desktop project.",
  );

  test("imports seeded sources, confirms clear candidates, and reaches reconciliation", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto("/patient/intake");

    await expect(
      page.getByRole("heading", { name: "What is Evelyn taking now?" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Use Evelyn’s seeded sources" })
      .click();

    await expect(page.getByText("3 of 3 demo sources imported")).toBeVisible();
    await expect(page.getByText("Demo sources ready")).toBeVisible();

    await page
      .getByRole("link", { name: "Check extracted items" })
      .click();
    await expect(page).toHaveURL(/\/patient\/confirm$/);
    await expect(
      page.getByRole("heading", {
        name: "Check every medicine and product",
      }),
    ).toBeVisible();

    const confirmClearCandidates = page.getByRole("button", {
      name: "Confirm clear candidates",
    });
    await expect(confirmClearCandidates).toBeEnabled();
    await confirmClearCandidates.click();

    await expect(confirmClearCandidates).toBeDisabled();
    await expect(page.getByText("Ready to compare sources")).toBeVisible();

    await page
      .getByRole("link", { name: "Compare the full list" })
      .click();
    await expect(page).toHaveURL(/\/patient\/reconcile$/);
    await expect(
      page.getByRole("heading", {
        name: "One list, without hiding the differences",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Ready for a bounded concern review",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", {
        name: "Medication list completeness",
      }),
    ).toBeVisible();
  });
});

