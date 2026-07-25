import { expect, test } from "@playwright/test";
import { startWithCleanDemo } from "./helpers";

const requiredRoutes = [
  "/",
  "/demo",
  "/patient/intake",
  "/patient/confirm",
  "/patient/reconcile",
  "/patient/concerns",
  "/patient/timeline",
  "/patient/plan",
  "/caregiver",
  "/professional",
  "/professional/review/episode-evelyn-post-discharge-2026-07",
  "/research",
  "/about/safety",
] as const;

test.describe("required route health", () => {
  test.skip(
    ({ isMobile }) => Boolean(isMobile),
    "The complete route matrix is checked once in desktop Chromium.",
  );

  test("all required routes render without console or page errors", async ({
    page,
  }) => {
    await startWithCleanDemo(page);
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(`console: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      errors.push(`page: ${error.message}`);
    });

    for (const route of requiredRoutes) {
      const response = await page.goto(route);
      expect(response?.ok(), `${route} should return a successful response`).toBe(
        true,
      );
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
    }

    expect(errors, "Required routes should not emit runtime errors").toEqual(
      [],
    );
  });
});
