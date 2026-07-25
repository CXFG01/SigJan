import { describe, expect, it } from "vitest";
import { dueState, estimateRunOut, subtractWorkingDays } from "@/lib/health/schedules";

describe("derived due states and supply", () => {
  it("derives dose state instead of persisting a due flag", () => {
    expect(dueState("2026-03-29T08:00:00+01:00", "2026-03-29T07:30:00Z")).toBe("due");
    expect(dueState("2026-10-25T08:00:00+00:00", "2026-10-25T09:30:00Z")).toBe("overdue");
    expect(dueState("2026-10-25T08:00:00Z", "2026-10-25T10:00:00Z", "taken_late")).toBe("taken_late");
  });

  it("shows deterministic run-out assumptions", () => {
    expect(estimateRunOut({ quantity: 28, dailyDose: 1, startsOn: "2026-07-01" })).toEqual({
      kind: "exact",
      date: "2026-07-28",
      explanation: "28 units at 1 per day.",
    });
  });

  it("does not claim an exact run-out for PRN or missing supply", () => {
    expect(estimateRunOut({ quantity: 20, dailyDose: 1, startsOn: "2026-07-01", prn: true }).kind).toBe("insufficient");
    expect(estimateRunOut({ quantity: null, dailyDose: 1, startsOn: "2026-07-01" }).date).toBeNull();
  });

  it("uses working days for the default repeat-prescription lead time", () => {
    expect(subtractWorkingDays("2026-07-27", 5)).toBe("2026-07-20");
  });
});
