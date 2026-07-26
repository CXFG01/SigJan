import { expect, test } from "@playwright/test";

test("public landing and safety boundary render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "SignalRx" })).toBeVisible();
  await expect(page.getByText("Your health, organised around you.")).toBeVisible();
  await expect(page.getByText("SignalRx organises information. It does not diagnose, change doses, or replace professional care.")).toBeVisible();
  await page.goto("/about/safety");
  await expect(page.getByRole("heading", { name: "Clear limits are part of the product." })).toBeVisible();
});

test("legacy role and workflow routes return the real 404", async ({ page }) => {
  for (const route of ["/demo", "/caregiver", "/professional", "/research", "/patient/intake"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByText("404 · Page not found")).toBeVisible();
  }
});

test("protected product routes redirect to OTP sign-in", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByRole("heading", { name: "One email. No password." })).toBeVisible();
});
