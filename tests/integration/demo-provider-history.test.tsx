import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DemoProvider,
  useDemo,
  type ReviewDispositionInput,
} from "@/context/demo-provider";

let currentDemo: ReturnType<typeof useDemo> | null = null;

function DemoHarness() {
  const value = useDemo();
  useEffect(() => {
    currentDemo = value;
  }, [value]);
  return (
    <output data-testid="workflow-state">
      {value.episode.workflowState}
    </output>
  );
}

function demo(): ReturnType<typeof useDemo> {
  if (!currentDemo) {
    throw new Error("The demo provider has not rendered");
  }
  return currentDemo;
}

describe("demo provider history integrity", () => {
  beforeEach(() => {
    window.localStorage.clear();
    currentDemo = null;
  });

  it("retains rapid same-millisecond corrections, statuses, and dispositions", async () => {
    render(
      <DemoProvider>
        <DemoHarness />
      </DemoProvider>,
    );
    await waitFor(() => expect(demo().hydrated).toBe(true));

    await act(async () => {
      await demo().importAllDemoSources();
    });
    await waitFor(() =>
      expect(demo().episode.medicationEntries.length).toBeGreaterThan(0),
    );

    act(() => {
      demo().confirmAllMedications();
    });
    await waitFor(() =>
      expect(demo().episode.workflowState).toBe("ready_for_review"),
    );

    const concern = demo().episode.concerns[0];
    const medication = demo().episode.medicationEntries[0];
    const baseDisposition: ReviewDispositionInput = {
      concernId: concern.id,
      disposition: "accepted_action_required",
      reason: "The documented context supports a bounded follow-up review.",
      owner: "Amina Shah, pharmacist",
      dueDate: "2026-07-29",
      followUpAction:
        "Contact the care team to review the documented context.",
      patientFacingMessage:
        "Your pharmacist has recorded this item for care-team review.",
    };
    const timestamp = "2026-07-25T13:00:00.123Z";
    const isoSpy = vi
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue(timestamp);

    try {
      act(() => {
        expect(
          demo().recordReviewDisposition({
            ...baseDisposition,
            reason: "First complete professional review snapshot.",
          }),
        ).toEqual({ ok: true });
        expect(
          demo().recordReviewDisposition({
            ...baseDisposition,
            reason: "Second complete professional review snapshot.",
          }),
        ).toEqual({ ok: true });
      });
      await waitFor(() =>
        expect(
          demo().episode.reviewActions.filter(
            (action) => action.concernId === concern.id,
          ),
        ).toHaveLength(2),
      );

      act(() => {
        expect(
          demo().correctMedication(medication.id, { dose: "one tablet" }),
        ).toEqual({ ok: true });
        expect(
          demo().correctMedication(medication.id, { dose: "two tablets" }),
        ).toEqual({ ok: true });
        demo().recordCaregiverStatus(
          medication.id,
          "taken",
          "Evelyn Carter",
          "First actual-use status.",
        );
        demo().recordCaregiverStatus(
          medication.id,
          "unknown",
          "Daniel Carter",
          "Second actual-use status.",
        );
      });
    } finally {
      isoSpy.mockRestore();
    }

    await waitFor(() => {
      const actions = demo().episode.reviewActions.filter(
        (action) => action.concernId === concern.id,
      );
      expect(actions.map((action) => action.revision)).toEqual([1, 2]);
      expect(actions.map((action) => action.reason)).toEqual([
        "First complete professional review snapshot.",
        "Second complete professional review snapshot.",
      ]);
      expect(actions[1].supersedesReviewActionId).toBe(actions[0].id);

      const correctionAudits = demo().episode.auditEvents.filter(
        (event) =>
          event.action === "medication_corrected" &&
          event.entityId === medication.id &&
          event.occurredAt === timestamp,
      );
      const caregiverAudits = demo().episode.auditEvents.filter(
        (event) =>
          event.action === "caregiver_status_recorded" &&
          event.entityId === medication.id &&
          event.occurredAt === timestamp,
      );
      const reviewAudits = demo().episode.auditEvents.filter(
        (event) =>
          event.action === "review_disposition_recorded" &&
          event.occurredAt === timestamp,
      );

      expect(correctionAudits).toHaveLength(2);
      expect(caregiverAudits).toHaveLength(2);
      expect(reviewAudits).toHaveLength(2);
      expect(new Set(correctionAudits.map((event) => event.id)).size).toBe(2);
      expect(new Set(caregiverAudits.map((event) => event.id)).size).toBe(2);
      expect(new Set(reviewAudits.map((event) => event.id)).size).toBe(2);
    });
  });
});
