# SignalRx implementation checklist

This checklist distils `Customer_Search.txt`, `SignalRx_Investment_Grade_PRD (1).docx`,
and the hackathon build brief into the bounded implementation target.

## Product and users

- [x] Optimise the patient journey for an older adult after discharge: low cognitive
      load, plain English, mobile-first controls, visible uncertainty, and no silent
      inference.
- [x] Support a caregiver who needs attribution, actual-use status, notes, change
      history, and patient-controlled sharing.
- [x] Give the pharmacist a source-preserving regimen comparison, a short concern
      queue, missing context, review controls, ownership, follow-up, and audit history.
- [x] Keep the proposition narrow: establish one accurate medication story and prepare
      it for professional review.

## Seeded demo episode

- [x] Use visibly synthetic data for Evelyn Carter, age 72, recently discharged, with
      atrial fibrillation, stage 3 chronic kidney disease, and hypertension.
- [x] Seed discharge items: apixaban, diltiazem, lisinopril, and spironolactone.
- [x] Seed home additions: intermittent ibuprofen and daily ginkgo.
- [x] Seed new bruising and dizziness without asserting diagnosis or causality.
- [x] Include a missing dose, uncertain strength, brand/generic ambiguity, possibly
      stopped medicine, missing laboratory value, and uncertain dates.

## Patient workflow

- [x] Landing page explains the job, professional-review path, and product boundary.
- [x] Demo role selection changes navigation and orientation copy without authentication.
- [x] Intake supports deterministic document, medicine-box, voice/transcript, seeded,
      and manual entry paths.
- [x] Every extracted field preserves original source, normalised value, confidence,
      confirmation state, editor, and timestamp.
- [x] No extracted item becomes trusted without explicit user confirmation or correction.
- [x] Confirmation permits every medication field to be edited and shows original source
      beside interpretation.
- [x] Reconciliation distinguishes discharge, current, home-added, possibly stopped,
      duplicate/formulation ambiguity, and missing information.
- [x] Completeness is shown as list/context completeness, never as a safety score.
- [x] Concerns show no more than three primary issues with independent severity,
      evidence, context-match, and data-completeness dimensions.
- [x] Every concern opens a synthetic/paraphrased evidence record with exact provenance,
      applicability, and limitations.
- [x] Timeline uses neutral chronology such as “occurred after” and “timing requires
      review”, never causal language.
- [x] Approved patient plan shows verified list, unresolved items, contact owner,
      follow-up date, questions, emergency boundary, and print/download action.

## Professional and caregiver workflows

- [x] Professional workbench includes patient summary, source comparison, concern queue,
      missing data, timeline, evidence, review controls, resolution history, and plan
      preview.
- [x] Dispositions support accepted/action required, accepted/already managed, monitor,
      not relevant, duplicate/data error, more information required, escalated, and
      patient declined.
- [x] Contextual dispositions require a reason; all actions support owner, due date,
      follow-up action, and patient-facing message.
- [x] Publishing professional decisions updates the shared patient plan and audit log.
- [x] Caregiver mode supports administrator attribution, taken/not taken/unknown,
      notes, change history, sharing, source attribution, and permission mock-up.
- [x] Research content is isolated and cannot enter patient or clinical concern state.

## Deterministic safety architecture

- [x] Zod schemas reject unknown fields and prevent generated text from creating concern
      records, rule identifiers, severity, evidence tiers, or treatment instructions.
- [x] Deterministic logic owns identity after confirmation, duplicate detection, exposure
      overlap, rule lookup, concern ordering, completeness, workflow transitions, and
      audit events.
- [x] Concern records require rule and evidence identifiers.
- [x] Unsupported combinations resolve to insufficient evidence or bounded source
      coverage, never “safe”.
- [x] Workflow transitions are explicit: Draft → Awaiting confirmation → Ready for
      review → In review → Resolved/Escalated → Archived.
- [x] Prohibited-phrase validation blocks autonomous treatment changes, binary safety
      claims, diagnoses, and causal assertions.
- [x] Seed exactly three patient-facing concern categories: established evidence,
      context-dependent monitoring, and insufficient evidence.
- [x] Emergency information is a static, configurable boundary—not autonomous triage.

## Technical and data requirements

- [x] Next.js App Router, React, TypeScript, Zod, accessible primitives, and typed local
      demo state that runs without credentials.
- [x] PostgreSQL/Supabase-compatible migration covers core entities, provenance,
      relationships, consent, review, audit, and row-level access intent.
- [x] Optional provider interface permits future Claude extraction/explanation, while
      deterministic fixtures remain the default and production clinical fields are
      never model-authored.
- [x] All required routes and reusable components are implemented.
- [x] Mobile patient/caregiver flow and tablet-usable professional view meet WCAG 2.2 AA
      intent, including keyboard use, focus, contrast, large text, touch targets, and
      reduced motion.

## Verification and deliverables

- [x] Unit tests cover normalisation, duplicate/formulation handling, overlap, ordering,
      completeness, evidence tiers, workflow transitions, prohibited phrases, generated
      schema validation, and unknown products.
- [x] Integration tests cover confirmation, provenance-preserving correction,
      insufficient evidence, overlap relevance, evidence requirement, generated-text
      containment, plan publication, research isolation, caregiver attribution, and audit.
- [x] Playwright covers patient intake-to-review, pharmacist resolution, approved plan,
      prohibited instructions, and mobile rendering.
- [x] Lint, typecheck, unit/integration tests, production build, and end-to-end tests pass.
- [x] Every required route receives browser-based visual and console QA.
- [x] README, implementation notes, demo script, migration, fixtures, and visual QA
      report are complete.

## Intentionally out of the hackathon core

- Live patient data, production authentication, live EHR/FHIR exchange, authoritative
  commercial interaction coverage, autonomous diagnosis/triage/treatment, direct
  regulatory submission, live pharmacovigilance signal claims, Neo4j, and live
  molecular modelling.


