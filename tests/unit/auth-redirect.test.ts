import { describe, expect, it } from "vitest";
import {
  getAuthEmailRedirectUrl,
  getSafeAuthDestination,
} from "@/lib/auth/redirect";

describe("authentication redirects", () => {
  it("builds a callback on the current deployment origin", () => {
    expect(
      getAuthEmailRedirectUrl(
        "https://jan-hackathon-omega.vercel.app",
        "/calendar?view=week",
      ),
    ).toBe(
      "https://jan-hackathon-omega.vercel.app/auth/callback?next=%2Fcalendar%3Fview%3Dweek",
    );
  });

  it("preserves safe in-app destinations", () => {
    expect(getSafeAuthDestination("/items/123?tab=notes")).toBe(
      "/items/123?tab=notes",
    );
  });

  it.each([
    "https://attacker.example/path",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "today",
    "",
  ])("rejects an unsafe destination: %s", (destination) => {
    expect(getSafeAuthDestination(destination)).toBe("/today");
  });
});
