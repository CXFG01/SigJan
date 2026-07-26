import { describe, expect, it } from "vitest";
import {
  DEFAULT_INTERACTION_MODEL,
  INTERACTION_REASONING_EFFORT,
} from "@/lib/interactions/config";

describe("interaction investigator configuration", () => {
  it("uses the balanced Terra model with medium reasoning", () => {
    expect(DEFAULT_INTERACTION_MODEL).toBe("gpt-5.6-terra");
    expect(INTERACTION_REASONING_EFFORT).toBe("medium");
  });
});
