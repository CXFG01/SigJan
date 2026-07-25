import { expect, type Page } from "@playwright/test";

export const DEMO_STORAGE_KEY = "signalrx-demo-v3";

export async function startWithCleanDemo(page: Page): Promise<void> {
  await page.addInitScript((storageKey) => {
    const resetMarker = `${storageKey}:e2e-reset-applied`;
    if (!window.sessionStorage.getItem(resetMarker)) {
      window.localStorage.removeItem(storageKey);
      window.sessionStorage.setItem(resetMarker, "true");
    }
  }, DEMO_STORAGE_KEY);
}

export async function waitForStoredPlanStatus(
  page: Page,
  expectedStatus: "draft" | "approved",
): Promise<void> {
  await expect
    .poll(async () =>
      page.evaluate((storageKey) => {
        const value = window.localStorage.getItem(storageKey);
        if (!value) {
          return null;
        }

        try {
          const parsed = JSON.parse(value) as {
            episode?: { patientPlan?: { status?: string } };
          };
          return parsed.episode?.patientPlan?.status ?? null;
        } catch {
          return null;
        }
      }, DEMO_STORAGE_KEY),
    )
    .toBe(expectedStatus);
}
