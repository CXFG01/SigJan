# SignalRx visual QA

This document records the completed local quality pass for the hackathon build.
It distinguishes automated route health from manual visual and interaction
inspection; a successful route smoke check is not treated as a full visual
approval.

## Required-route matrix

| Route | Purpose | Automated route health | Manual desktop inspection | Manual mobile inspection |
| --- | --- | --- | --- | --- |
| `/` | Public landing page | Pass | Pass | Pass |
| `/demo` | Role and workflow entry point | Pass | Pass | Not separately inspected |
| `/about/safety` | Safety boundary | Pass | Pass | Not separately inspected |
| `/research` | Evidence and research approach | Pass | Pass | Not separately inspected |
| `/patient/intake` | Multi-source intake | Pass | Pass | Pass |
| `/patient/confirm` | Medication confirmation and correction | Pass | Pass | Not separately inspected |
| `/patient/reconcile` | Reconciled source comparison | Pass | Pass | Not separately inspected |
| `/patient/concerns` | Prioritised concern review | Pass | Pass | Pass |
| `/patient/timeline` | Causal-neutral episode timeline | Pass | Pass | Not separately inspected |
| `/patient/plan` | Reviewed patient plan | Pass | Pass | Not separately inspected |
| `/caregiver` | Permissioned caregiver workflow | Pass | Pass | Pass |
| `/professional` | Professional review queue | Pass | Pass | Not separately inspected |
| `/professional/review/episode-evelyn-post-discharge-2026-07` | Pharmacist review workspace | Pass | Pass | Not separately inspected |

“Pass” in the route-health column means the local application navigated to and
rendered the route without a route-level failure. Manual columns mean the
rendered composition was inspected at that layout class; they do not imply
cross-browser certification.

## Viewports inspected

- Desktop: the standard in-app Chromium desktop viewport, covering the complete
  route matrix and wide review layouts.
- Mobile: `390 × 844`, covering the landing page, patient intake, patient
  concerns/evidence, and caregiver dashboard, including navigation, stacked
  content, forms, and action areas. The Playwright mobile project separately
  covers the critical patient/caregiver assertions defined in the E2E suite.

The viewport override was reset after mobile inspection.

## Interaction and accessibility checks

The manual pass included:

- primary navigation and role/workflow links;
- the seeded-source intake import, including its `3/3` completion state and
  enabled continuation action;
- medication confirmation and editable form controls;
- concern/evidence disclosure controls;
- caregiver and professional action areas;
- keyboard-visible focus treatment on links, buttons, inputs, and disclosure
  controls;
- readable text and status contrast against paper, panel, and evidence
  backgrounds;
- logical mobile stacking without clipped controls or horizontal page overflow;
- clear control labels and heading hierarchy;
- console review during the inspected local flows.

This was a pragmatic hackathon accessibility pass, not a formal WCAG audit.

## Fixes made during QA

- Corrected narrow-screen stacking so source rows, status labels, review
  controls, and action groups remain readable and tappable.
- Adjusted the muted-text contrast token for clearer secondary copy.
- Strengthened the shared `:focus-visible` ring so keyboard focus is not
  communicated by colour alone.
- Increased the evidence-panel border contrast to preserve its boundary on the
  warm paper palette.
- Removed decorative gradients so the interface retains the intended calm,
  document-led visual language and consistent contrast.

The landing-page hero dimensions and spacing and the intake source-ledger status
layout were also tightened during browser inspection.

## Automated route-health coverage

The automated smoke pass covered every URL in the matrix, including the dynamic
professional episode route. It was used to catch missing pages, route-level
render failures, and obvious regressions across both public and role-based
surfaces. This complements, rather than replaces, the manual responsive pass.

## Limitations

- QA used the deterministic synthetic demo episode in the local development
  environment; it did not exercise live Supabase, storage, OCR, camera,
  microphone, notification, or external clinical-data integrations.
- Inspection used the in-app Chromium browser. Safari, Firefox, physical-device,
  slow-network, and device-lab testing remain outside this pass.
- Keyboard-visible focus and semantic structure were inspected, but no full
  screen-reader session or automated WCAG conformance suite was completed.
- Visual QA verifies presentation and interaction behaviour, not independent
  clinical validation of evidence, rules, or professional decisions.
