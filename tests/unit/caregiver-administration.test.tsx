import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaregiverPage from "@/app/caregiver/page";
import { DEMO_EPISODE } from "@/domain";

const caregiverMocks = vi.hoisted(() => ({
  recordCaregiverStatus: vi.fn(),
  resetDemo: vi.fn(),
  setRole: vi.fn(),
  useDemo: vi.fn(),
}));

vi.mock("@/context/demo-provider", () => ({
  useDemo: caregiverMocks.useDemo,
}));

describe("caregiver administrator control", () => {
  beforeEach(() => {
    caregiverMocks.recordCaregiverStatus.mockReset();
    caregiverMocks.resetDemo.mockReset();
    caregiverMocks.setRole.mockReset();
    caregiverMocks.useDemo.mockReturnValue({
      episode: structuredClone(DEMO_EPISODE),
      recordCaregiverStatus: caregiverMocks.recordCaregiverStatus,
      resetDemo: caregiverMocks.resetDemo,
      setRole: caregiverMocks.setRole,
    });
  });

  it("labels the administrator choice and submits it with the status and note", async () => {
    const user = userEvent.setup();
    render(<CaregiverPage />);

    const heading = screen.getByRole("heading", { name: "Lisinopril" });
    const medication = heading.closest("article");
    expect(medication).not.toBeNull();
    const controls = within(medication!);
    const administrator = controls.getByRole("combobox", {
      name: "Who administered this medicine?",
    });

    expect(administrator).toHaveValue("Evelyn Carter");
    expect(administrator).toHaveAccessibleDescription(
      "Saved with the next actual-use status.",
    );

    await user.selectOptions(administrator, "Daniel Carter");
    await user.type(
      controls.getByLabelText("Optional observation for the review record"),
      "Daniel checked the morning medicines with Evelyn.",
    );
    await user.click(controls.getByRole("button", { name: "Taken" }));

    expect(caregiverMocks.recordCaregiverStatus).toHaveBeenCalledWith(
      "med-lisinopril",
      "taken",
      "Daniel Carter",
      "Daniel checked the morning medicines with Evelyn.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Administered by Daniel Carter; update recorded by Daniel Carter.",
    );
  });
});
