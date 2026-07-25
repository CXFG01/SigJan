import { describe, expect, it } from "vitest";
import { intakeCreateSchema, onboardingSchema } from "@/lib/health/schemas";

describe("patient-first input boundaries", () => {
  it("rejects an under-18 profile", () => {
    const recent = new Date();
    recent.setUTCFullYear(recent.getUTCFullYear() - 17);
    expect(onboardingSchema.safeParse({
      preferredName: "Alex",
      dateOfBirth: recent.toISOString().slice(0, 10),
      ukResident: true,
      adultConfirmed: true,
      timezone: "Europe/London",
      privacyAccepted: true,
      healthDataConsent: true,
    }).success).toBe(false);
  });

  it("requires explicit residence, privacy and health-data choices", () => {
    expect(onboardingSchema.safeParse({
      preferredName: "Alex",
      dateOfBirth: "1980-01-01",
      ukResident: false,
      adultConfirmed: true,
      timezone: "Europe/London",
      privacyAccepted: false,
      healthDataConsent: true,
    }).success).toBe(false);
  });

  it("limits each file to 25 MB and a batch to 50 MB", () => {
    const artifact = (id: string, sizeBytes: number) => ({
      id,
      storagePath: `user/${id}/source.pdf`,
      fileName: "source.pdf",
      mimeType: "application/pdf",
      sizeBytes,
    });
    const tooLarge = intakeCreateSchema.safeParse({
      mode: "document",
      artifacts: [artifact("00000000-0000-4000-8000-000000000001", 25 * 1024 * 1024 + 1)],
    });
    const batch = intakeCreateSchema.safeParse({
      mode: "document",
      artifacts: [
        artifact("00000000-0000-4000-8000-000000000001", 25 * 1024 * 1024),
        artifact("00000000-0000-4000-8000-000000000002", 25 * 1024 * 1024),
        artifact("00000000-0000-4000-8000-000000000003", 1),
      ],
    });
    expect(tooLarge.success).toBe(false);
    expect(batch.success).toBe(false);
  });

  it("accepts a freeform text intake without fabricating artifacts", () => {
    expect(intakeCreateSchema.parse({ mode: "text", text: "I take one tablet each morning." }).artifacts).toEqual([]);
  });
});
