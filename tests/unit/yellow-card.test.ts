import { describe, expect, it } from "vitest";
import { chronologyLanguage, prohibitedCausality, yellowCardRequestSchema } from "@/lib/health/yellow-card";

describe("Yellow Card drafting", () => {
  it("requires the user to explicitly suspect a medicine", () => {
    expect(yellowCardRequestSchema.safeParse({
      symptomItemId: "00000000-0000-4000-8000-000000000001",
      suspectedMedicineIds: ["00000000-0000-4000-8000-000000000002"],
      userSuspectsMedicine: false,
    }).success).toBe(false);
  });

  it("uses chronology language and an explicit non-causality statement", () => {
    const line = chronologyLanguage({
      symptom: "Headache",
      medicine: "Amlodipine",
      symptomStarted: "2026-07-20",
      medicineStarted: "2026-07-01",
    });
    expect(line).toContain("occurred after");
    expect(line).toContain("Timing does not prove cause");
    expect(prohibitedCausality.test(line)).toBe(false);
  });
});
