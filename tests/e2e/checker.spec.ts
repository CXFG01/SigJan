import { expect, test } from "@playwright/test";
const medicines = ["Warfarin", "Ibuprofen"].map(name => ({ name, original: `${name} 3 mg`, dose: "3 mg", route: "oral", frequency: "daily", ingredients: [name.toLowerCase()], identitySource: "Exact match", issue: null }));
const baseRun = { status: "running", expiresAt: new Date(Date.now()+3600000).toISOString(), coverage: [{ source: "DDInter", version: "fixture", records: 1, status: "available", message: "Synthetic test data" }], pairs: [{ id: "0-1", medicines, findings: [{ id: "f1", ingredients: ["warfarin","ibuprofen"], severity: "major", source: "DDInter", version: "fixture", url: "https://ddinter2.scbdd.com/" }], duplicateIngredients: [], reason: "incomplete", research: "queued" }] };
test("anonymous extraction, editing, checking and cancellation preserve findings", async ({ page }) => {
  await page.route("**/api/checker/extract", route => route.fulfill({ json: { candidates: medicines } }));
  await page.route("**/api/checker/check", async route => {
    expect(route.request().postDataJSON().medicines[0].dose).toBe("5 mg");
    await route.fulfill({ json: { token: "a".repeat(64), run: baseRun } });
  });
  await page.route("**/api/checker/run", route => route.fulfill({ json: { run: route.request().method() === "DELETE" ? { ...baseRun, status: "cancelled", pairs: [{ ...baseRun.pairs[0], research: "cancelled" }] } : baseRun } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page.getByRole("button", { name: "Review medicines" }).click();
  await page.getByLabel("Dose or strength").first().fill("5 mg");
  await expect(page.getByRole("button", { name: "Check interactions" })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Check interactions" }).click();
  await expect(page.getByRole("heading", { name: "1 medicine pairs checked" })).toBeVisible();
  await expect(page.getByText("major", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel research" }).click();
  await expect(page.getByText("Investigation cancelled", { exact: true })).toBeVisible();
  await expect(page.getByText("major", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
test("mobile layout, manual entry and retired routes", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByLabel("Paste a synthetic prescription")).toBeVisible();
  await page.getByRole("button", { name: "Try an example" }).click();
  await expect(page.getByLabel("Paste a synthetic prescription")).toHaveValue(/Warfarin/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `.qa/checker-${info.project.name}.png`, fullPage: true, caret: "initial" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole("button", { name: "Enter individually" }).click();
  await expect(page.getByLabel("Medicine / ingredients").first()).toBeVisible();
  for (const route of ["/auth","/today","/network","/calendar"]) expect((await page.goto(route))?.status()).toBe(404);
});
test("keyboard skip link and safety page", async ({ page }, info) => {
  await page.goto("/");
  if (info.project.name === "desktop-chromium") {
    await page.keyboard.press("Tab"); await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  }
  await page.goto("/about/safety"); await expect(page.getByRole("heading", { name: "Evidence, uncertainty & your data" })).toBeVisible();
});
