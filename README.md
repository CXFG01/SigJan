# SignalRx

**One accurate medication story, ready for review.**

SignalRx is a production-minded hackathon prototype for patients, caregivers,
and medication-review professionals. It brings prescriptions,
over-the-counter medicines, vitamins, supplements, herbal products, and
relevant dietary exposures into one source-preserving record. Deterministic
rules identify a small number of items that may need attention, explain the
evidence and missing context, and prepare the episode for pharmacist or
clinician review.

SignalRx is not a general-purpose interaction checker, diagnostic system, or
autonomous treatment adviser. It does not determine that a regimen is safe and
does not tell a patient to start, stop, substitute, or change the dose of a
medicine.

> **Synthetic demonstration data:** the bundled Evelyn Carter case is fictional
> and must not be used for real care.

## What the demo covers

The local demo follows Evelyn Carter, age 72, after hospital discharge. Her
discharge list contains apixaban, diltiazem, lisinopril, and spironolactone. She
also reports intermittent ibuprofen, daily ginkgo, bruising, and dizziness.
The fixtures deliberately include a missing dose, uncertain strength,
brand-versus-generic ambiguity, a possibly stopped item, missing laboratory
context, and uncertain dates.

The application is designed to demonstrate:

- patient or caregiver capture followed by explicit field confirmation;
- original-source visibility alongside each interpreted value;
- reconciliation of discharge and reported-current-use information;
- deterministic, evidence-linked concerns with uncertainty kept visible;
- professional disposition, ownership, follow-up, and resolution history;
- an approved, plain-language patient plan; and
- a separate research area that cannot alter clinical concerns or the plan.

The core patient proposition is: **create one accurate list, identify what
needs professional attention, and make the pharmacist conversation easier.**

## Architecture

SignalRx uses Next.js App Router, React, TypeScript, Tailwind CSS, Zod, React
Hook Form, Vitest, Testing Library, and Playwright.

The hackathon runtime is deliberately local-first:

1. Typed deterministic fixtures provide the synthetic episode, extraction
   candidates, normalisation results, evidence records, clinical rules,
   timeline, and review outcomes.
2. Domain code owns medication identity after confirmation, duplicate and
   overlap checks, completeness, evidence tiers, concern ordering, workflow
   transitions, and copy restrictions.
3. Presentation code renders patient, caregiver, and professional views from
   that structured state.
4. A Supabase/PostgreSQL migration documents the production relational model,
   provenance, consent, audit, guarded workflow transitions, and row-level
   access intent. The no-key demo does not require this database.

The target production data flow is:

```text
source capture
  -> candidate extraction
  -> patient/caregiver confirmation
  -> deterministic reconciliation and rules
  -> evidence-linked concern records
  -> professional review and disposition
  -> approved patient plan and audit history
```

Generated prose is an explanation layer only. It is not a path for creating a
rule, concern, severity, evidence tier, diagnosis, causal claim, or treatment
instruction.

## Run locally

### Prerequisites

- Node.js 20.9 or later
- pnpm 11 (the repository pins `pnpm@11.9.0`)

From the repository root:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The seeded demo still works without credentials: local storage and the
deterministic extractor remain resilient fallbacks. When the integration
variables below are present, SignalRx creates an isolated anonymous Supabase
session, synchronises the validated demo snapshot through RLS, and sends
extraction requests through a server-only OpenAI route.

For a production-style local build:

```bash
pnpm build
pnpm start
```

## Environment variables

Copy `.env.example` to `.env.local` to enable the connected path:

```bash
Copy-Item .env.example .env.local
```

| Variable | Required for connected mode | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used for authentication and persistence. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase publishable key used with RLS. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternative | Backward-compatible alternative to the publishable key variable. Never place a service-role key in a public variable. |
| `OPENAI_API_KEY` | Yes for live extraction | Server-only OpenAI credential. It is never included in the browser bundle. |
| `OPENAI_MODEL` | No | Optional model override. The default is the current `gpt-5.6` alias. |

Connected extraction sends the user-supplied source text to OpenAI. The
response is schema-validated, normalised through the deterministic catalogue,
kept provisional, and falls back to the seeded extractor on any provider or
validation failure. Do not use real patient information until the required
clinical governance, retention policy, security assessment, and
data-processing agreements are in place.

## Demo walkthrough

1. Open `/demo` and enter as the patient, caregiver, or pharmacist demo.
2. In the patient journey, review simulated discharge, package-photo, voice,
   and manual inputs. Confirm or correct candidate fields rather than trusting
   extraction automatically.
3. Open reconciliation to compare the discharge record with what Evelyn
   reports taking at home. Note missing and uncertain fields and the possibly
   stopped item.
4. Open concerns. Review the evidence-backed apixaban/ibuprofen concern, the
   context-dependent monitoring item with missing renal laboratory context,
   and the insufficient-information state for the exact ginkgo product.
5. Open the timeline. It shows chronology and overlap without claiming that a
   medicine caused bruising or dizziness.
6. Enter the professional view, inspect source provenance and evidence, then
   record dispositions, reasons, ownership, and follow-up.
7. Return to the patient plan to show the approved summary, unresolved items,
   contact owner, and questions for the care team.
8. Optionally open caregiver and research views. Research content is labelled
   as hypothesis-only and remains isolated from the patient result.

Route availability and exact interaction labels should be confirmed against
the final integrated build. The intended route set is:

- `/`, `/demo`
- `/patient/intake`, `/patient/confirm`, `/patient/reconcile`
- `/patient/concerns`, `/patient/timeline`, `/patient/plan`
- `/caregiver`
- `/professional`, `/professional/review/[episodeId]`
- `/research`
- `/about/safety`

## Decision boundaries

### AI may assist with

- candidate field extraction from user-provided text;
- clarification questions;
- terminology mapping that remains untrusted until confirmation;
- plain-language rewriting of approved structured evidence;
- patient-summary and clinician-handoff drafts; and
- structuring a symptom narrative without diagnosis or causality.

Any provider response must use a strict schema, reject unexpected fields,
record model and prompt versions, minimise health data, and fail back to the
deterministic path.

### Deterministic code owns

- identity after explicit confirmation;
- ingredient duplicate and exposure-overlap detection;
- known-rule lookup and evidence linkage;
- severity already supplied by an approved evidence record;
- evidence tiers, completeness, ordering, and state transitions;
- audit events and provenance history; and
- prohibited-phrase and clinical-output restrictions.

### Human review owns

- medication or dose changes;
- final clinical relevance and disposition;
- adverse-event causality;
- escalation and treatment recommendations;
- pharmacovigilance decisions; and
- promotion of research hypotheses into clinical evidence.

## Clinical-safety boundaries

SignalRx uses the states **Needs professional review**, **Potential concern**,
**Established evidence**, **Context incomplete**, and **Insufficient evidence**.
It does not use a reassuring green “safe” result. When a search has no matching
record, the bounded wording is:

> No documented concern found in the sources searched.

That statement describes source coverage, not personal safety. For unknown
products or combinations:

> SignalRx does not have enough verified information to classify this
> combination as safe or unsafe.

Timeline proximity is not causality. Patient-facing output must include:

> Do not start, stop, or change prescribed treatment based only on SignalRx.
> Contact a pharmacist, prescriber, or appropriate care service.

Emergency information is static and configurable, not autonomous triage:

> Seek urgent medical help for severe or rapidly worsening symptoms, major
> bleeding, difficulty breathing, collapse, severe confusion, or other
> symptoms that feel immediately dangerous.

This list is not exhaustive.

## Data model

The Supabase-compatible schema models:

- users, organisations, memberships, patient profiles, caregivers, and
  professional episode assignments;
- medication concepts, products, ingredients, episodes, entries, sources, and
  per-field provenance/history;
- conditions, observations, symptoms, exposures, discrepancies, and timeline
  events;
- versioned evidence records, deterministic clinical rules, rule/evidence
  joins, concerns, concern inputs, and concern/evidence joins;
- reviews, dispositions, follow-up actions, and approved generated artifacts;
  and
- consent grants and append-oriented audit events.

For the connected hackathon journey, `demo_sessions` stores a versioned
validated UI snapshot for each anonymous authenticated visitor. Its RLS
policies permit only that visitor to select, insert, update, or delete the
snapshot; local storage remains the offline fallback.

Each medication field can preserve its original and normalised value, source,
confidence, confirmation state, last editor, and timestamp. A concern retains
its rule and evidence identifiers, input snapshot, content and explanation
versions, reviewer disposition, resolution reason, and audit history.

Episode states are explicit:

```text
Draft -> Awaiting confirmation -> Ready for review -> In review
  -> Resolved or Escalated -> Archived
```

Only allow-listed transitions are valid. Production RLS is intended to limit
patients to their own episodes, caregivers to explicit active grants, and
professionals to assigned episodes or organisations. Service-role access must
remain server-only.

## Testing and verification

Run the focused checks independently:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Run the repository’s combined non-E2E gate:

```bash
pnpm check
```

Use headed Playwright when visually reviewing the critical flows:

```bash
pnpm test:e2e:headed
```

The safety test surface should cover normalisation, formulation distinction,
duplicate ingredients, exposure overlap, completeness, concern ordering,
evidence tiers, state transitions, prohibited phrases, generated-output schema
validation, unknown products, confirmation and provenance, evidence-required
concerns, caregiver attribution, professional resolution, plan publication,
research isolation, and mobile rendering.

Do not treat this README as a test report. Check the final command output and
the repository’s visual-QA artifact for the current verified status.

## Known limitations

- The bundled scenario is synthetic and its evidence text is demo
  paraphrase/synthesis, not a comprehensive interaction database.
- Upload, scan, and voice capture surfaces are still text-backed simulations;
  configured OpenAI extraction processes their supplied synthetic text.
- Anonymous authentication isolates demo visitors but is not verified patient,
  caregiver, or clinician identity.
- Supabase snapshot persistence is durable demo state, not an electronic health
  record or a substitute for the normalised clinical tables.
- No live pharmacy, EHR/FHIR, laboratory, terminology, or product-catalogue
  integration is included.
- Source search coverage is intentionally narrow; absence of a documented
  concern is not evidence of safety.
- Supplement identity and composition often remain uncertain without an exact
  label and independent data source.
- The prototype has not completed clinical validation, human-factors testing,
  penetration testing, regulatory classification, or deployment governance.
- Supabase migrations are applied through the CLI and must still be reviewed
  and reverified for each deployment environment.

## Production next steps

1. Conduct pharmacist-led clinical-content validation and formal safety-risk
   management, including hazard logs and controlled rule/evidence releases.
2. Replace anonymous demo identity with verified patient, caregiver, and
   professional authentication; complete least-privilege RLS verification,
   server-only privileged operations, encryption, retention/deletion controls,
   consent withdrawal, and immutable audit export.
3. Integrate authoritative medication terminology, product, interaction, renal
   monitoring, and supplement sources with licensing and version governance.
4. Build provenance-preserving OCR/document ingestion, confidence calibration,
   and accessible human confirmation at field level.
5. Add EHR/pharmacy interoperability only after identity matching, consent,
   reconciliation ownership, and failure modes are specified.
6. Complete WCAG 2.2 AA audit, older-adult usability studies, clinician
   workflow testing, security review, privacy impact assessment, incident
   response, observability, backup/recovery, and disaster testing.
7. Validate generated-language schemas and red-team clinical copy before any
   external AI processing of health information.

## Product references

The implementation target is grounded in `Customer_Search.txt`,
`SignalRx_Investment_Grade_PRD (1).docx`, and
`IMPLEMENTATION_CHECKLIST.md`. For delivery scope, assumptions, safety
controls, and remaining risks, see `IMPLEMENTATION_NOTES.md`. For the concise
judge walkthrough, see `DEMO_SCRIPT.md`.
