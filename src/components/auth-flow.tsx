"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import {
  getAuthEmailRedirectUrl,
  getSafeAuthDestination,
} from "@/lib/auth/redirect";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthFlow() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const search = useSearchParams();

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Sign-in is not configured in this environment.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: getAuthEmailRedirectUrl(
          window.location.origin,
          search.get("next"),
        ),
      },
    });
    if (error) setMessage(error.message);
    else setStep("code");
    setBusy(false);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setMessage("That code is invalid or has expired. Request a new code and try again.");
      setBusy(false);
      return;
    }
    router.replace(getSafeAuthDestination(search.get("next")));
    router.refresh();
  }

  return (
    <div className="auth-panel">
      <div className="auth-icon"><Mail size={24} aria-hidden="true" /></div>
      <p className="eyebrow">{step === "email" ? "Create or sign in" : "Check your email"}</p>
      <h1>{step === "email" ? "One email. No password." : "Use your secure link or code."}</h1>
      <p>
        {step === "email"
          ? "We’ll email you short-lived sign-in instructions. No password to remember."
          : `We sent secure sign-in instructions to ${email}. They can only be used once.`}
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="form-stack">
          <label>
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Sending your email…" : "Email me a sign-in link"}
            {!busy ? <ArrowRight size={18} aria-hidden="true" /> : null}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="form-stack">
          <label>
            Six-digit code (if shown)
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="otp-input"
              aria-describedby="code-help"
            />
          </label>
          <p id="code-help" className="field-help">
            Open the secure link in the email. If the email also shows a code, you
            can enter it here instead.
          </p>
          <button className="button button-primary" disabled={busy || code.length !== 6}>
            {busy ? "Checking your code…" : "Open SignalRx"}
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              setStep("email");
              setCode("");
              setMessage(null);
            }}
          >
            Use a different email
          </button>
        </form>
      )}
      {message ? <p className="form-message" role="alert">{message}</p> : null}
      <p className="auth-legal">
        SignalRx is for UK residents aged 18+. You’ll confirm privacy and health-data
        processing before creating a record.
      </p>
    </div>
  );
}
