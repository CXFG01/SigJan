import { describe, expect, it } from "vitest";
import { compactProgressEvents } from "@/components/interaction-investigator-panel";

function progressEvent(sequence: number, type: string) {
  return {
    runId: "run-1",
    sequence,
    type,
    at: "2026-07-26T12:00:00.000Z",
    payload: {},
  };
}

describe("interaction investigator progress", () => {
  it("hides technical deltas and consolidates source activity", () => {
    const events = compactProgressEvents([
      progressEvent(1, "run_started"),
      progressEvent(2, "reasoning_summary_delta"),
      progressEvent(3, "source_discovered"),
      progressEvent(4, "source_discovered"),
      progressEvent(5, "source_reviewed"),
      progressEvent(6, "validation_started"),
    ]);

    expect(events.map((event) => event.type)).toEqual([
      "run_started",
      "source_discovered",
      "validation_started",
    ]);
  });
});
