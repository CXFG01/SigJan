# SignalRx

SignalRx is a private, UK-focused personal health organiser for adults aged 18+.
It brings medicines, supplements, conditions, symptoms, tests, appointments, and
daily routines into one user-confirmed longitudinal record.

SignalRx organises information. It does not diagnose, assign causality, recommend
dose changes, automatically alter medicines, or replace professional care.

## Product

- Six-digit email OTP with cookie-based Supabase SSR sessions
- Consent-led, minimal onboarding
- Text, photo, document, recorded voice, and guided Realtime voice intake
- Durable intake jobs with private Supabase Storage and Queues
- Strict structured extraction with `gpt-5.6`; candidates require confirmation
- Today, Lifestyle Network with accessible list parity, calendar, and library
- Prescription comparison without automatic replacement
- Sourced NHS information snapshots with attribution and weekly refresh
- Deterministic supply estimates and user-led Yellow Card drafting
- Account export and deletion

## Local setup

Requirements: Node.js 20.9+, pnpm 11, and the Supabase CLI.

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

There is no anonymous or fictional fallback. Connected Supabase configuration is
required for registration and the personal record.

## Environment

Browser variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only variables:

- `SUPABASE_SECRET_KEY` (or the legacy service-role key name)
- `OPENAI_API_KEY`
- `OPENAI_REALTIME_MODEL=gpt-realtime-2.1`
- `OPENAI_HARMONIZATION_MODEL=gpt-5.6`
- `OPENAI_INTERACTION_MODEL=gpt-5.6-sol`

The Lifestyle Network includes a deterministic interaction screen and a
server-side OpenAI Agents SDK investigator. Apply the latest Supabase migration
before using it. Patient-visible AI explanations are published only after
allowlisted-source, citation, schema, and treatment-language validation.

After applying the interaction migration, import the official DDInter category
CSVs into the versioned local snapshot:

```powershell
$env:DDINTER_VERSION = "2.0"
pnpm import:ddinter C:\path\to\ddinter_A.csv C:\path\to\ddinter_B.csv
```

The importer accepts all downloaded category files, orders factor pairs
deterministically, batches writes, and is idempotent for a source version.
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NHS_CONTENT_API_KEY`
- NHS Terminology Server system-to-system credentials

Never place a secret or service-role key in a `NEXT_PUBLIC_` variable.

Supabase Auth must have anonymous sign-ins disabled. In Authentication > URL
Configuration, set the Site URL to the canonical production origin and allow
`https://<production-origin>/auth/callback`. Keep
`http://localhost:3000/auth/callback` as an additional redirect URL for local
development.

The default Supabase email contains a secure sign-in link. To also present a
six-digit code, configure custom SMTP through Resend and include `{{ .Token }}` in
the email template. A secure link may use `{{ .ConfirmationURL }}`; the
application callback supports both PKCE codes and token hashes.

## Database and worker

The additive patient-first migration creates the longitudinal schema, explicit Data
API grants, owner-based RLS, private `health-sources` storage policies, and the
`intake_processing` queue.

```powershell
pnpm dlx supabase db push
pnpm dlx supabase functions deploy process-intakes
```

Set `OPENAI_API_KEY` and `OPENAI_HARMONIZATION_MODEL` as Edge Function secrets.
Schedule `process-intakes` using Supabase Cron so queued work retries independently
of the browser. The application also invokes the worker after enqueueing.

The legacy cleanup is intentionally a separate migration and should run only after
the new application and additive schema pass preview verification.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The automated surface checks age and consent boundaries, file limits, confirmation
before record mutation, owner RLS, private Storage paths, schedule/run-out derivation,
non-causal Yellow Card language, protected-route redirects, mobile overflow, keyboard
access, and legacy 404s.

## Public launch gates

Do not accept real public health data until the DPIA, lawful bases under UK GDPR
Articles 6 and 9, privacy notice, retention schedule, vendor/subprocessor review,
incident response, clinical hazard log, intended-purpose assessment, DCB0129 review,
and MHRA software classification review are complete.

NHS Website Content and Terminology production credentials require onboarding.
Until credentials are present, SignalRx exposes the coverage gap and leaves products
unmatched; it never presents model output as authoritative normalisation.
