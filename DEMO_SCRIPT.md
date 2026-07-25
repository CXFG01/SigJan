# SignalRx: 90-second demo

## Before presenting

- Run `pnpm dev` and open `/demo`.
- Use the bundled Evelyn Carter synthetic episode.
- Keep `/professional/review/episode-evelyn-post-discharge-2026-07` and
  `/patient/plan` ready in separate tabs as a reliable handoff.
- Confirm the final button labels and review interaction after the last build.
- Do not improvise a diagnosis, causal claim, or medication-change
  recommendation.

## Script

### 0:00-0:12 — The problem

**On screen:** Landing page, then patient demo.

“Existing interaction checkers assess only the list they receive. SignalRx
first builds an accurate, source-preserving list, then closes the loop through
professional review. This is synthetic data, not medical advice.”

### 0:12-0:28 — Capture and confirm

**On screen:** Intake, then confirmation.

“Evelyn Carter is 72 and recently discharged. Her record has four
prescriptions, but she also reports intermittent ibuprofen and daily ginkgo.
Document, package, voice, and manual inputs produce candidates only. Evelyn
sees the original words, uncertainty, and missing fields before confirming or
correcting each value.”

### 0:28-0:42 — Reconcile the real regimen

**On screen:** Reconciliation.

“Reconciliation exposes an uncertain diltiazem strength, an older Cardizem SR
box that may have stopped, a brand-versus-generic and formulation question,
and missing dates. This is medication-list completeness, never a safety
score.”

### 0:42-0:59 — Explain only what the evidence supports

**On screen:** Concerns; expand one evidence panel.

“Three deterministic concerns appear. Apixaban with reported ibuprofen has
established evidence and needs review. Kidney monitoring is context-dependent
because the current eGFR is missing. Ginkgo remains insufficient evidence
because the exact product and dose are unknown. Each card separates severity,
evidence, context match, and data completeness, with its source.”

### 0:59-1:16 — Accountable professional review

**On screen:** Professional episode review.

“Pharmacist Amina Shah inspects sources and timeline, records a disposition
and reason, then assigns ownership and follow-up. Ibuprofen is accepted for
action, renal context is monitored, and Daniel is asked for the complete
ginkgo package. Every decision is audited; generated prose cannot create
concerns.”

### 1:16-1:30 — Close the loop

**On screen:** Approved patient plan.

“Evelyn receives a plain-language plan with the verified list, unresolved
items, owner, follow-up date, and questions. The boundary stays explicit: do
not start, stop, or change prescribed treatment based only on SignalRx.”

## If a judge asks

**Where is the AI?**  
“AI is optional and bounded to candidate extraction and plain-language
rewriting. Strict schemas and deterministic fallback prevent it from selecting
severity, inventing evidence, or creating concerns.”

**Does a missing interaction mean the regimen is safe?**  
“No. It means only that no documented concern was found in the sources
searched, and we show the limits of that coverage.”

**Why include symptoms?**  
“To organise timing and prepare questions. The timeline says events occurred
during overlapping exposure; it never claims a medicine caused a symptom.”

**What becomes production next?**  
“Governed clinical sources, pharmacist validation, production identity and
consent, verified row-level access, durable audit, and integration with
pharmacy or care records.”
