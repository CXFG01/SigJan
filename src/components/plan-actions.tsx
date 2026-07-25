"use client";

import { Download, Printer } from "lucide-react";

type PlanActionsProps = {
  content: string;
  fileName?: string;
};

export function PlanActions({
  content,
  fileName = "signalrx-medication-plan.txt",
}: PlanActionsProps) {
  function downloadPlan() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        className="button button-secondary no-print"
        onClick={() => window.print()}
        type="button"
      >
        <Printer aria-hidden="true" size={17} />
        Print plan
      </button>
      <button
        className="button button-primary no-print"
        onClick={downloadPlan}
        type="button"
      >
        <Download aria-hidden="true" size={17} />
        Download summary
      </button>
    </>
  );
}
