import { expect, test } from "@playwright/test";

test("mobile landing has no horizontal overflow and retains primary action", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".signal-hero").getByRole("link", { name: "Create your record" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("keyboard users can reach the skip link and primary action", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "patient-mobile", "Keyboard navigation is covered by the desktop browser project.");
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeVisible();
});
