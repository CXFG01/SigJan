import { expect, test } from "@playwright/test";
import {
  findProhibitedPhrases,
  REQUIRED_SAFETY_STATEMENT,
} from "../../src/domain/language";
import {
  startWithCleanDemo,
  waitForStoredPlanStatus,
} from "./helpers";

test.describe("patient-output language guard", () => {
  test.skip(
    ({ isMobile }) => Boolean(isMobile),
    "The approved-output language scan is covered in the desktop project.",
  );

  test("approved patient output contains no prohibited autonomous clinical wording", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto(
      "/professional/review/episode-evelyn-post-discharge-2026-07",
    );

    await page.getByRole("button", { name: "Load seeded review" }).click();
    await waitForStoredPlanStatus(page, "approved");
    await page.goto("/patient/plan");

    const patientOutput = await page.locator("main").innerText();
    expect(
      findProhibitedPhrases(patientOutput),
      "Patient-facing output must not contain binary safety claims, autonomous treatment changes, causal diagnoses, or AI recommendations.",
    ).toEqual([]);
    expect(patientOutput).toContain(REQUIRED_SAFETY_STATEMENT);
  });
});

test.describe("mobile patient rendering", () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    "This assertion targets the configured patient-mobile project.",
  );

  test("renders the patient intake route without horizontal overflow", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    await page.goto("/patient/intake");

    await expect(
      page.getByRole("heading", { name: "What is Evelyn taking now?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "patient journey" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Use Evelyn’s seeded sources" }),
    ).toBeVisible();

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  });
});

