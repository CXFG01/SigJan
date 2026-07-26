import { describe, expect, it } from "vitest";
import { normalizeFactorName } from "@/lib/interactions/normalization";

describe("medicine name normalization", () => {
  it("removes a leading dispensing quantity after dosage normalization", () => {
    expect(normalizeFactorName("84 BETAHISTINE 16MG TABLETS")).toBe("betahistine");
  });

  it("maps UK medicine names to DDInter ingredient names", () => {
    expect(normalizeFactorName("Paracetamol 500 mg")).toBe("acetaminophen");
    expect(normalizeFactorName("Quinine sulfate 200 mg")).toBe("quinine");
  });
});
