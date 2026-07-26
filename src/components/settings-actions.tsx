"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

export function SettingsActions() {
  const [message, setMessage] = useState<string | null>(null);

  async function exportRecord() {
    const response = await fetch("/api/account/export");
    if (!response.ok) {
      setMessage("We couldn’t prepare your export. Please try again.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "signalrx-record.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    const phrase = window.prompt('Type "DELETE MY SIGNALRX ACCOUNT" to permanently delete your account and health data.');
    if (phrase !== "DELETE MY SIGNALRX ACCOUNT") return;
    const response = await fetch("/api/account", { method: "DELETE" });
    if (!response.ok) {
      setMessage("Your account was not deleted. Please try again or contact support.");
      return;
    }
    window.location.assign("/");
  }

  return (
    <div className="settings-actions">
      <button className="button button-secondary" onClick={exportRecord}><Download size={18} /> Download my record</button>
      <button className="button danger-button" onClick={deleteAccount}><Trash2 size={18} /> Delete my account</button>
      {message ? <p role="alert" className="form-message">{message}</p> : null}
    </div>
  );
}
