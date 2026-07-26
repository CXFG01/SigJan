import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => null,
}));

import { AddFlow } from "@/components/add-flow";

afterEach(cleanup);

const completedJob = {
  id: "3afbf5a5-a077-4d9e-a003-92e61c117f01",
  status: "needs_review",
  candidates: [
    {
      id: "f04bdd8f-ecf5-4c11-8466-ec2ac4723359",
      itemType: "condition",
      originalWording: "Type 2 diabetes requiring insulin",
      normalizedWording: "",
      confidence: 0.92,
    },
    {
      id: "11a92970-caba-45b0-8b69-55bc919d533a",
      itemType: "condition",
      originalWording: "Diabetic retinopathy",
      normalizedWording: "Diabetic retinopathy",
      confidence: 0.96,
    },
  ],
};

describe("completed intake review", () => {
  it("presents suggestions as a populated list and reveals editing on demand", () => {
    render(<AddFlow userId="patient-1" initialJob={completedJob} />);

    expect(screen.getByRole("heading", { name: "2 suggested facts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Type 2 diabetes requiring insulin" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 2 facts to my record" })).toBeEnabled();

    fireEvent.click(screen.getAllByRole("button", { name: "Modify" })[0]);
    expect(screen.getByRole("textbox", { name: "How should this appear in your record?" })).toHaveValue(
      "Type 2 diabetes requiring insulin",
    );
  });

  it("lets a patient remove and restore a suggestion without editing it", () => {
    render(<AddFlow userId="patient-1" initialJob={completedJob} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(screen.getByRole("button", { name: "Add 1 fact to my record" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getAllByRole("button", { name: "Add 2 facts to my record" })).toHaveLength(1);
  });

  it("uses a reassuring success treatment after confirmation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(<AddFlow userId="patient-1" initialJob={completedJob} />);

    fireEvent.click(screen.getByRole("button", { name: "Add 2 facts to my record" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveClass("form-message-success");
    });
    vi.unstubAllGlobals();
  });
});
