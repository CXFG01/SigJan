"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type SharePlanButtonProps = {
  text: string;
  disabled?: boolean;
};

export function SharePlanButton({
  text,
  disabled = false,
}: SharePlanButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "copied" | "shared" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function share() {
    setStatus("idle");
    setMessage("");
    try {
      if (navigator.share) {
        await navigator.share({
          title: "SignalRx reviewed medication plan",
          text,
        });
        setStatus("shared");
        setMessage("The reviewed plan was shared.");
        return;
      }
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setMessage("The reviewed plan was copied to the clipboard.");
      window.setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 2200);
    } catch (error) {
      const cancelled =
        error instanceof DOMException && error.name === "AbortError";
      setStatus("error");
      setMessage(
        cancelled
          ? "Sharing was cancelled. The plan was not sent."
          : "The plan could not be shared. Please try again.",
      );
    }
  }

  return (
    <div>
      <button
        className="button button-secondary"
        disabled={disabled}
        onClick={share}
        type="button"
      >
        {status === "copied" || status === "shared" ? (
          <Check aria-hidden="true" size={17} />
        ) : (
          <Share2 aria-hidden="true" size={17} />
        )}
        {disabled
          ? "Awaiting reviewed plan"
          : status === "copied"
            ? "Plan copied"
            : status === "shared"
              ? "Plan shared"
              : "Share reviewed plan"}
      </button>
      <span
        aria-live="polite"
        className={status === "error" ? "form-error" : "sr-only"}
      >
        {message}
      </span>
    </div>
  );
}
