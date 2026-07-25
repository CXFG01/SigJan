# SignalRx implementation notes

This note records the hackathon scope represented in the repository on
25 July 2026. The integrated local build and its automated verification are
recorded below. “Implemented” and “verified” do not imply clinical validation,
regulatory approval, or production-readiness for real patient data.

## Requirements implemented

### Product workflow

- All requested route files are present: landing, demo role selection, patient
  intake, confirmation, reconciliation, concerns, timeline, plan, caregiver,
  professional queue, episode review, research, and safety/about.
- The Evelyn Carter synthetic post-discharge episode is represented in typed
  fixtures, including prescriptions, intermittent ibuprofen, daily ginkgo,
  bruising, dizziness, uncertain dates, missing renal context, an uncertain
  diltiazem strength, and an older Cardizem SR home supply.
- Medication records preserve source excerpts and field-level provenance.
  Extracted candidates use explicit confirmation states rather than becoming
  trusted automatically.
- Deterministic reconciliation represents generic/brand mapping, formulation
  distinction, duplicate ingredients, actual-use status, temporal overlap, and
  completeness without producing a safety score.
- The fixture produces three bounded concerns: established evidence requiring
  review, context-dependent monitoring with missing laboratory information,
  and insufficient information about the exact ginkgo product.
- Each concern is linked to a versioned, visibly synthetic evidence record and
  separates potential severity, evidence strength, patient-context match, and
  data completeness.
- Professional dispositions, reasons, owner, due date, follow-up action, and
  patient-facing message are typed. Review actions update the plan, and a plan
  cannot be published until all expected concern records have a review item.
- Caregiver attribution, medication-administration state, notes/history, and a
  patient-controlled permission presentation are included at prototype depth.
- Research content has a dedicated route and is described as hypothesis-only.

### Deterministic safety architecture

- Zod schemas validate medication, provenance, evidence, concern, review,
  patient-plan, extraction, and explanation records.
- The local provider returns deterministic candidates and explanations. The
  external-provider wrapper validates output, rejects concern/evidence drift,
  and falls back on validation or provider failure.
- Generated explanations receive an approved concern and approved evidence
  identifiers; they cannot create clinical rules or add concerns through the
  explanation schema.
- Clinical rules, severity, evidence tier, completeness, concern ordering,
  workflow transitions, prohibited language, audit events, and publication
  gates are deterministic.
- Explicit episode transitions are allow-listed:
  `draft -> awaiting_confirmation -> ready_for_review -> in_review ->
  resolved/escalated -> archived`.
- Patient corrections supersede provenance instead of deleting the original
  captured value.
- Seeded evidence is labelled synthetic paraphrase rather than presented as an
  official quotation.
- Required uncertainty, treatment-boundary, non-causality, and emergency copy
  is centralised for reuse.

### Test surface present

The repository contains 65 passing unit/integration/component tests across ten
files. Coverage includes normalisation, temporal/completeness logic,
concern/evidence behaviour, workflow and language restrictions,
confirmation/provenance, collision-safe audit history, rapid queued mutations,
caregiver attribution, deterministic safety, and explanation isolation.
Playwright covers route health, source-specific extraction, edited transcript
behaviour, the patient journey, professional review and publication, stale-plan
invalidation, caregiver attribution, patient-output language, plan
print/download wiring, and mobile overflow.

## Requirements intentionally deferred

- Production identity, Supabase Auth wiring, durable database persistence, and
  live RLS enforcement. The migration is a production data-model target, not
  the storage layer used by the no-key demo.
- Real OCR, document parsing, medicine-box recognition, speech-to-text, camera
  capture, and file storage. The current inputs use deterministic simulations.
- A live Anthropic client. The provider boundary and strict validation exist;
  no external model is required or called by the default demo.
- Authoritative or licensed drug, supplement, renal-monitoring, and interaction
  datasets. Demo evidence is intentionally narrow and synthetic.
- EHR, FHIR, pharmacy, laboratory, terminology-service, identity-matching, and
  messaging integrations.
- Production-grade consent withdrawal, retention/deletion, data residency,
  encryption/key management, immutable audit export, and incident response.
- Clinical validation, regulatory classification, formal clinical-risk
  management, human-factors studies, and deployment approval.
- Live molecular modelling, docking, or patient-specific research inference.
  Research remains isolated demonstration content.
- A complete medication reminder, adherence-monitoring, or autonomous triage
  platform; these are outside the hackathon MVP.

## Key assumptions

- The application is evaluated with fictional demo data only.
- A pharmacist or clinician remains accountable for relevance, escalation, and
  any treatment decision.
- “No documented concern found in the sources searched” means only that the
  bounded local evidence set returned no record; it never means safe.
- Unknown or insufficiently identified products remain uncertain and visible.
- Exact product identity, composition, strength, formulation, route, and actual
  use can materially alter review and must be confirmed rather than inferred.
- The hackathon path prioritises a reliable static workflow over external API
  breadth.
- Browser state is suitable for a demonstration, not a clinical source of
  truth.

## Safety controls

- No generated output can select severity, create a rule, create a concern, or
  introduce an unapproved evidence identifier.
- Extraction candidates are untrusted until confirmed or corrected.
- Rules require structured evidence links; symptom chronology is never treated
  as adverse-event causality.
- Severity, evidence strength, context match, and completeness remain separate;
  there is no composite “safety” score.
- Prohibited-language checks guard against binary safety claims, diagnoses,
  causal assertions, and unsupervised medication-change instructions.
- Missing data is represented as missing context, not as reassurance.
- Professional dispositions and patient-plan publication are typed and audited.
- The patient plan carries the instruction not to start, stop, or change
  prescribed treatment based only on SignalRx.
- Emergency wording is static and conservative; the product does not perform
  autonomous triage.
- Synthetic data and synthetic/paraphrased evidence are labelled as such.
- Research hypotheses cannot become patient-plan content or clinical evidence
  through the generated explanation path.

## Placeholders used

- **Evidence provenance:** “SignalRx synthetic evidence set,” “UK demo,” null
  source URLs, and version `demo-evidence-1.0` stand in for governed, licensed
  clinical sources. They must not be described as official quotations.
- **Care team:** St Anne’s Hospital, Amina Shah (pharmacist), Daniel Carter
  (caregiver), owners, and follow-up dates are fictional demonstration details.
- **Capture channels:** discharge document, editable voice transcript, and
  medicine-box photographs are seeded text representations; no real media is
  processed.
- **Authentication and sharing:** role sessions and consent controls are UI/demo
  state, not verified identity or secure sharing.
- **Database:** the Supabase migration expresses target entities, provenance,
  workflow guards, consent, audit, and RLS intent. Runtime pages currently use
  typed local state.
- **External AI:** `ANTHROPIC_API_KEY` is documented for a future adapter; the
  repository does not claim a live Claude request path.
- **Export:** print and text-download controls are browser-verified convenience
  actions; they are not a clinically signed document workflow.

## Remaining risks

- Users may interpret a concern, absence of a concern, completeness indicator,
  or approved plan as a clinical safety determination despite disclaimers.
- Narrow synthetic evidence can omit important real-world interactions,
  contraindications, dose considerations, and jurisdiction-specific guidance.
- Supplement labels and compositions are variable; ambiguous identity may
  persist even after a photograph is supplied.
- A confident extraction could still be wrong. Confidence is not verification.
- Shared-browser demo state does not protect health data and must not be used
  with real patient information.
- Visual accessibility and plain-language safety under stress require testing
  with older adults, caregivers, and clinicians, not only automated checks.
- Workflow controls in TypeScript and PostgreSQL must remain aligned as the
  product moves from local fixtures to persistence.
- Generated-language safeguards need adversarial clinical testing before any
  external provider is enabled.

## Verification completed

- `pnpm check` passed: ESLint, TypeScript, all 65 Vitest tests, and the
  production Next.js build. The build generated all 16 application routes.
- `pnpm test:e2e` passed with 9 executed scenarios and 9 intentional
  cross-project skips across desktop Chromium and mobile WebKit.
- The route-health scenario loaded every required URL and found no console or
  page errors.
- The browser QA described in `VISUAL_QA.md` covered every route on desktop and
  the primary patient/caregiver surfaces at `390 × 844`.
- Medication corrections preserve provenance, rerun deterministic concerns,
  invalidate stale approval, and retain immutable review history.
- Patient-output tests found no prohibited autonomous medication-change,
  diagnosis, binary-safety, or causality wording.
- Print and text-download actions are exercised in the approved-plan E2E flow.

One infrastructure check remains intentionally unclaimed: the Supabase
migration received static structural review, but it was not applied to a live
PostgreSQL/Supabase instance because neither `psql` nor the Supabase CLI is
installed in this environment. Its RLS policies therefore still require
disposable-project integration testing before production use.
