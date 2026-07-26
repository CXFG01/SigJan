"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

export function SettingsActions() {
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportRecord() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/account/export");
    if (!response.ok) {
      setMessage("We couldn’t prepare your export. Please try again.");
      setBusy(false);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "signalrx-record.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    setMessage("Your export has been downloaded.");
  }

  async function deleteAccount() {
    if (confirmation !== "DELETE MY SIGNALRX ACCOUNT") return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/account", { method: "DELETE" });
    if (!response.ok) {
      setMessage("Your account was not deleted. Please try again or contact support.");
      setBusy(false);
      return;
    }
    window.location.assign("/");
  }

  return (
    <div className="settings-actions">
      <button className="button button-secondary" disabled={busy} onClick={() => void exportRecord()}><Download size={18} /> {busy ? "Preparing…" : "Download my record"}</button>
      <button className="button danger-button" disabled={busy} onClick={() => setConfirmingDelete(true)}><Trash2 size={18} /> Delete my account</button>
      {confirmingDelete ? (
        <div className="delete-confirmation">
          <h3>Permanently delete your account?</h3>
          <p>This removes your health record, uploaded files, reminders, and account. This cannot be undone.</p>
          <label>
            Type <strong>DELETE MY SIGNALRX ACCOUNT</strong> to confirm
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          </label>
          <div className="form-actions">
            <button className="button danger-button" disabled={busy || confirmation !== "DELETE MY SIGNALRX ACCOUNT"} onClick={() => void deleteAccount()}>
              <Trash2 size={18} /> {busy ? "Deleting…" : "Delete permanently"}
            </button>
            <button className="button button-ghost" disabled={busy} onClick={() => { setConfirmingDelete(false); setConfirmation(""); }}>Cancel</button>
          </div>
        </div>
      ) : null}
      {message ? <p role="status" className={message.includes("downloaded") ? "success-message" : "form-message"}>{message}</p> : null}
    </div>
  );
}
