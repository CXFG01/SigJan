**SIGNALRX**

**SignalRx**

**Investment-Grade Product Requirements Document**

Juno x Anthropic Consumer Healthcare Hackathon

**CORE THESIS**

**Build the trusted context and evidence layer for medication changes, not another generic interaction checker.**

| **STATUS**           | Strategic working draft                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| **RESEARCH CUT-OFF** | 24 July 2026                                                            |
| **PRIMARY MARKET**   | United Kingdom first; EU and US considered                              |
| **AUDIENCE**         | Founders, investors, clinicians, product leaders, and research partners |

_This document is a product and investment analysis, not medical, legal, or regulatory advice. Clinical claims require independent expert review, applicable evidence, and jurisdiction-specific assessment._

# Document Guide

| **FACT**<br><br>Supported by cited evidence. | **HYPOTHESIS**<br><br>Requires product or market validation. | **ASSUMPTION**<br><br>Used for planning and made explicit. | **DECISION**<br><br>Recommended product choice. |
| -------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------- |

**Research discipline**

The PRD separates established facts, product hypotheses, planning assumptions, and recommended decisions. Citations link to the numbered source appendix. Commercial pricing and milestone figures are proposed planning ranges unless identified as sourced facts.

## Contents

| [**Founder Verdict**](#Founder_Verdict)                                                    | [**18\. Research Module and Boltz-2**](#s_18_Research_Module_and_Boltz_2)                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [**1\. Executive Summary**](#s_1_Executive_Summary)                                        | [**19\. Business Model**](#s_19_Business_Model)                                                         |
| [**2\. Research Method and Evidence Discipline**](#s_2_Research_Method_and_Evidence_Disci) | [**20\. Network Effects and Defensibility**](#s_20_Network_Effects_and_Defensibility)                   |
| [**3\. Problem Analysis**](#s_3_Problem_Analysis)                                          | [**21\. Go-to-Market**](#s_21_Go_to_Market)                                                             |
| [**4\. User Research and Personas**](#s_4_User_Research_and_Personas)                      | [**22\. Metrics and Evaluation**](#s_22_Metrics_and_Evaluation)                                         |
| [**5\. Competitive Landscape**](#s_5_Competitive_Landscape)                                | [**23\. Risks**](#s_23_Risks)                                                                           |
| [**6\. Why Existing Products Are Not Enough**](#s_6_Why_Existing_Products_Are_Not_Enou)    | [**24\. Future Vision**](#s_24_Future_Vision)                                                           |
| [**7\. Product Vision**](#s_7_Product_Vision)                                              | [**25\. Investment Questions, Milestones, and Kill Criteria**](#s_25_Investment_Questions_Milestones_a) |
| [**8\. Product Definition and Core Workflows**](#s_8_Product_Definition_and_Core_Workfl)   | [**26\. Assumptions, Open Questions, and Validation Plan**](#s_26_Assumptions_Open_Questions_and_Va)    |
| [**9\. Product Requirements**](#s_9_Product_Requirements)                                  | [**Appendix A. 24-Hour Hackathon Build Plan**](#Appendix_A_24_Hour_Hackathon_Build_Pla)                 |
| [**10\. Product Architecture**](#s_10_Product_Architecture)                                | [**Appendix B. Domain Model and Evidence Package**](#Appendix_B_Domain_Model_and_Evidence_P)            |
| [**11\. Hackathon MVP**](#s_11_Hackathon_MVP)                                              | [**Appendix C. Seed Safety and Quality Test Cases**](#Appendix_C_Seed_Safety_and_Quality_Tes)           |
| [**12\. Roadmap**](#s_12_Roadmap)                                                          | [**Appendix D. Data, API, and Licensing Register**](#Appendix_D_Data_API_and_Licensing_Regi)            |
| [**13\. AI Strategy**](#s_13_AI_Strategy)                                                  | [**Appendix E. Discovery Interview Guide**](#Appendix_E_Discovery_Interview_Guide)                      |
| [**14\. Safety and Clinical Governance**](#s_14_Safety_and_Clinical_Governance)            | [**Appendix F. References**](#Appendix_F_References)                                                    |
| [**15\. Regulatory and Legal Strategy**](#s_15_Regulatory_and_Legal_Strategy)              | [**Appendix G. Glossary**](#Appendix_G_Glossary)                                                        |
| [**16\. Technical Architecture**](#s_16_Technical_Architecture)                            | [**Document Conclusion**](#Document_Conclusion)                                                         |
| [**17\. Pharmacovigilance Strategy**](#s_17_Pharmacovigilance_Strategy)                    |                                                                                                         |

# **Founder Verdict**

**RECOMMENDATION**

Build SignalRx, but change the wedge. Do not launch as a broad consumer interaction checker. Launch as a **medication-change safety and reconciliation companion** used by patients and caregivers, with a pharmacist or clinician review path. The highest-value moment is not "look up whether two drugs interact." It is "my regimen changed, what exactly am I taking now, what matters for me, what should I monitor, and who needs to know?"

## **The investment case in one page**

**Problem.** Medication safety is a systems problem. Risk appears when a medicine is prescribed, transcribed, dispensed, administered, monitored, stopped, or combined with another medicine, supplement, food, condition, or patient factor. WHO identifies polypharmacy, high-risk situations, and transitions of care as priority medication-safety areas \[1\]. England dispensed 1.30 billion community prescription items in 2025/26 at a cost of £11.6 billion \[6\]. Scale is not the same as addressable spend, but it demonstrates that medication workflows are high-frequency infrastructure rather than a niche consumer category.

**Current failure.** The medication list is often incomplete or stale. The prescriber knows what was ordered. The pharmacy knows what was dispensed. The patient knows what was actually taken, but may describe it from memory, boxes, photos, or colloquial names. Supplements and over-the-counter products are often outside the clinical record. Existing interaction databases are strong at pairwise reference knowledge, yet commonly weak at reconstructing the true regimen, showing what changed, collecting missing context, supporting patient understanding, and following outcomes longitudinally.

**Product.** SignalRx converts fragmented medication evidence into a verified, time-aware medication graph. It then applies a deterministic interaction and safety engine, displays evidence and uncertainty, generates plain-language explanations, asks for missing context, supports clinician review, and monitors symptoms after a change. A later pharmacovigilance layer turns structured patient timelines into higher-quality suspected-adverse-reaction reports and research signals.

**Beachhead.** Community and digital pharmacies, post-discharge services, and digital-health providers that already own a medication-change encounter. They have a user, a workflow, a safety obligation, and an economic reason to prevent avoidable calls, discrepancies, adverse events, and rework.

**Why not pure B2C first.** Consumer checkers are free, familiar, and easy to substitute. Use is episodic. False reassurance creates liability. Consumer willingness to pay for reference information is uncertain. The consumer experience remains important, but it should initially be distributed through a trusted medication workflow.

**Why now.** Medication volumes are rising; structured medication reviews are established policy; community pharmacy is taking a larger clinical role; health information is increasingly exchangeable; large language models can reduce unstructured data burden; and regulators now provide clearer software and clinical decision support frameworks. At the same time, incumbent drug-information vendors are adding AI search, so "chat over a drug database" is already becoming a feature, not a company \[30\].

**Defensible advantage.** The defensible asset is not the visual graph or the language model. It is a governed, longitudinal data model that links prescribed intent, patient-reported use, timing, context, source provenance, clinician resolution, and outcomes. This can improve workflow-specific ranking and create a high-quality medication-change dataset. It is difficult to build because it requires distribution, trust, clinical governance, licensing, and repeated use.

**Critical condition.** SignalRx should proceed only if the team can secure an authoritative interaction-content strategy, a clinical safety owner, and a distribution partner. Without those, the product is a polished interface on top of commodity data.

## **Investment thesis and kill criteria**

| **Question**                               | **Current judgment**                                                                                      | **Evidence needed before seed-scale investment**                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is the problem severe and frequent?        | Yes, particularly in polypharmacy, transitions, and medication changes.                                   | Prospective evidence that target workflows contain material discrepancies or unresolved safety concerns at a rate sufficient to justify intervention. |
| Is the solution differentiated?            | Potentially, if it owns reconciliation, longitudinal monitoring, and evidence provenance.                 | Users must prefer the workflow to incumbent reference tools and manual medication review, not merely find the graph attractive.                       |
| Is there a buyer?                          | Plausible in pharmacy, digital health, care transitions, and selected health systems.                     | At least three design partners with named budget owners and a paid pilot path.                                                                        |
| Can the product be safe?                   | Yes, as a source-transparent decision aid with deterministic rules, bounded claims, and human escalation. | Predefined safety case, clinical hazard log, content governance, and measured false-reassurance rate.                                                 |
| Can data create a moat?                    | Only after repeated, consented, high-quality longitudinal use.                                            | Demonstrate that captured context and outcomes improve ranking or workflow value beyond licensed content.                                             |
| Is pharmacovigilance a near-term business? | No. It is a later capability.                                                                             | Sufficient report completeness, exposure timing, de-duplication, privacy governance, and regulator or pharma validation.                              |
| Is molecular modelling a product feature?  | No. It is a research hypothesis tool.                                                                     | Retrospective validation that target nomination plus modelling provides incremental, reproducible value to experts.                                   |

**Kill criteria:** stop or materially pivot if (1) authoritative interaction content cannot be licensed at viable gross margin; (2) prospective workflow studies show low discrepancy or intervention rates; (3) pharmacists and clinicians do not trust or act on source-linked outputs; (4) distribution requires enterprise integration before any measurable value can be delivered; or (5) the product cannot avoid prompting unsafe self-directed medication changes.

# **1\. Executive Summary**

## **1.1 Problem**

Medication management is fragmented across prescriptions, dispensing systems, hospital discharge summaries, patient memory, pill boxes, supplements, and informal caregiver coordination. The clinically relevant question is rarely just whether Drug A interacts with Drug B. It is whether a specific person is actually exposed to both products, at what dose, by which route, during what period, with which renal or hepatic function, conditions, symptoms, and monitoring plan.

NICE defines medication reconciliation as creating the most accurate list possible, including prescribed, over-the-counter, and complementary medicines, then comparing it with the current list and documenting discrepancies \[5\]. The requirement itself exposes the product opportunity: medication identity and intent are not reliably synchronized across settings.

Polypharmacy is heterogeneous. A 2024 systematic review found that estimates among older adult samples varied widely because definitions, settings, and included medicines differed \[7\]. This prevents simplistic claims that "five drugs is dangerous." The target is **problematic polypharmacy**, medication discrepancies, context-sensitive interactions, and unmonitored changes, not medication count alone.

## **1.2 Solution**

SignalRx is a governed medication-intelligence platform with two connected experiences:

**1\. Patient and caregiver companion:** capture the real regimen from documents, labels, speech, and manual entry; confirm what changed; explain source-backed concerns; create a practical action and monitoring plan; and support structured symptom reporting.

**2\. Professional review workspace:** compare prescribed, dispensed, and patient-reported medication states; triage clinically material issues; see evidence and missing context; communicate a reviewed plan; and monitor post-change outcomes.

The core is a **time-aware medication graph**, not a generic chatbot. It stores entities and relationships such as medication ingredient, product, dose, route, schedule, indication, condition, laboratory context, symptom, start and stop event, evidence source, and review decision. Every conclusion is traceable to source data and a versioned knowledge item.

## **1.3 Why now**

• Medication safety remains a global patient-safety priority, with polypharmacy and transitions explicitly identified by WHO \[1\]\[2\].

• NHS structured medication reviews create an established workflow and vocabulary for medicines optimisation \[4\].

• Community pharmacy in England is increasingly a clinical access point. At 31 March 2025, 10,407 community pharmacies were open, and 97% of community-dispensed items used the Electronic Prescription Service in 2024/25 \[52\].

• Standards such as NHS dm+d and HL7 FHIR improve the technical feasibility of identity and exchange \[21\]\[53\].

• LLMs can extract and explain unstructured medication information, but evidence shows general-purpose chatbots should not be trusted as stand-alone interaction engines \[10\]. This makes a hybrid architecture timely.

• Incumbents are incorporating AI search into established clinical content \[30\]. SignalRx must therefore differentiate through workflow and longitudinal data, not AI access alone.

## **1.4 Strategic recommendation**

**Initial product category:** medication-change safety workflow.

**Initial buyer:** pharmacy chain, digital pharmacy, digital-health provider, or care-transition service.

**Initial user:** patient or caregiver completing a medication verification, followed by pharmacist or clinician review when required.

**Initial outcome:** verified medication list, identified changes, prioritized source-backed concerns, patient-understood plan, and structured follow-up.

**North Star metric:** percentage of material medication changes that become a verified, patient-understood, monitored plan within 48 hours.

## **1.5 What SignalRx is not**

• It is not an autonomous prescriber.

• It is not a diagnosis or emergency-triage system.

• It is not a replacement for a pharmacist-led medication review.

• It does not declare a regimen "safe."

• It does not infer causality from adverse-event reports.

• It does not use molecular docking or structure prediction as clinical evidence.

• It does not build a comprehensive drug-interaction database from scratch during the hackathon.

## **1.6 Market timing**

The commercial timing is attractive but competitive. Drug-information incumbents already have trusted editorial teams, EHR integrations, and licensed content. New general medical AI products have large distribution advantages \[35\]\[37\]\[38\]\[39\]. SignalRx can still become venture-scale if it owns a high-value workflow and becomes the medication context layer across consumer and provider systems. It is unlikely to become venture-scale as a stand-alone checker with a monthly subscription.

# **2\. Research Method and Evidence Discipline**

## **2.1 Research approach**

This PRD synthesizes:

• official guidance and statistics from WHO, NHS England, NICE, NHSBSA, MHRA, FDA, FTC, European Commission, ICO, and HL7;

• peer-reviewed systematic reviews and clinical informatics studies;

• official product and API documentation from incumbent vendors and public data providers;

• current product announcements from relevant AI and medication-safety companies;

• explicit product and business assumptions where public evidence is unavailable.

## **2.2 Evidence labels**

| **Label**            | **Meaning**                                                           | **Product treatment**                                                 |
| -------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **\[F\] Fact**       | Supported by an authoritative source or peer-reviewed evidence.       | May inform requirements and claims, subject to source scope and date. |
| **\[A\] Assumption** | Planning input that requires validation.                              | Must be tested before investment or clinical deployment.              |
| **\[H\] Hypothesis** | Proposed causal, product, or commercial mechanism.                    | Must not be presented as established evidence.                        |
| **\[D\] Decision**   | Recommended product choice based on current evidence and constraints. | Can change when assumptions fail.                                     |

## **2.3 Research limitations**

• Public competitor information overstates strengths and rarely discloses error rates, renewal rates, implementation cost, or workflow burden.

• Interaction databases differ in scope, editorial method, severity classification, and licensing. Absence from a source does not establish safety.

• Pharmacovigilance datasets are subject to under-reporting, stimulated reporting, duplicates, confounding, and missing exposure data \[17\].

• Published machine-learning studies often use retrospective benchmarks with limited prospective validation \[11\].

• Regulatory classification depends on exact intended purpose, claims, users, and implementation. This document is product strategy, not legal advice.

• Pricing and sales-cycle estimates are assumptions for testing, not market facts.

# **3\. Problem Analysis**

## **3.1 The job to be done**

The real job is:

"Help me and my care team establish what I am actually taking, understand what changed and what matters, monitor the consequences, and resolve uncertainty without creating alarm or false reassurance."

This job occurs at discharge, after a new prescription, during a structured medication review, when adding a supplement, when symptoms appear, when multiple specialists prescribe, and when a caregiver takes over coordination.

## **3.2 Failure modes in the current medication journey**

| **Workflow stage**      | **Typical failure**                                                                             | **Consequence**                                               | **SignalRx opportunity**                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Prescribing             | Current regimen, OTC products, supplements, recent stops, or outside prescriptions are missing. | Incomplete interaction and duplication review.                | Patient-assisted reconciliation before or immediately after prescribing.  |
| Dispensing              | Order is technically valid but patient context or intent is unclear.                            | Calls, delays, overrides, or unaddressed risk.                | Structured context collection and pharmacist review queue.                |
| Transition of care      | Discharge list conflicts with pre-admission list or patient behavior.                           | Duplicate, omitted, or incorrectly continued treatment.       | Before/after regimen diff with source provenance.                         |
| Home administration     | Patient uses a different dose, route, timing, or product than recorded.                         | Exposure differs from clinical assumptions.                   | Confirmed medication passport and adherence-neutral reporting.            |
| Monitoring              | Symptoms and laboratory context are not linked to start, stop, or dose changes.                 | Late recognition of adverse effects or ineffective treatment. | Time-aware symptom and medication-change timeline.                        |
| Reporting               | Adverse-event forms are difficult and incomplete.                                               | Low-quality or absent pharmacovigilance signal.               | Guided, reviewable suspected-reaction report preparation.                 |
| Specialist coordination | Each team optimizes its own condition.                                                          | Therapeutic competition and unclear ownership.                | Shared evidence and unresolved-question layer, not autonomous resolution. |

## **3.3 Scale and burden**

\[F\] WHO describes unsafe medication practices and medication errors as a leading cause of avoidable harm, and identifies prescribing, transcribing, dispensing, administration, and monitoring as failure points \[1\].

\[F\] England dispensed 1.30 billion community prescription items in 2025/26, with volume up 3% from the previous year \[6\]. NHS commissioners spent an estimated £21.4 billion after central rebates on medicines, appliances, and devices in 2025 \[54\].

\[F\] The national overprescribing review estimated that 10% of prescription items issued through primary care were inappropriate or could be better served by alternatives, while about 15% of people took five or more medicines daily \[3\]. These figures are directional policy estimates, not a direct SignalRx addressable-market calculation.

\[F\] Systematic reviews show large variability in measured polypharmacy prevalence and outcomes. This supports targeted clinical context rather than a medication-count alarm \[7\]\[8\].

## **3.4 High-risk populations and situations**

### **Older adults and frailty**

Older adults often have multimorbidity, multiple prescribers, changing renal function, altered pharmacokinetics, and caregiver involvement. Their risk is not merely the number of medicines but the interaction between frailty, goals, formulation, adherence, monitoring, and care transitions.

### **Chronic illness**

People with chronic illness manage long-term regimens across specialists and may combine prescriptions with symptom-directed OTC products, supplements, diet changes, and self-tracking. The burden is continuous, but the highest-intensity moments are treatment changes and unexplained symptoms.

### **Cancer and haematology**

Cancer regimens create complex pharmacokinetic and pharmacodynamic interactions, narrow therapeutic margins, supportive medications, and rapidly changing plans. This is high value but high clinical risk. It is a later vertical requiring specialist content and governance.

### **Transplant and immunosuppression**

Narrow therapeutic indices, CYP and transporter interactions, infection prophylaxis, and close monitoring make this a valuable enterprise use case. It is inappropriate for an early generalist consumer product.

### **Mental health**

Multiple psychotropics can produce additive sedation, anticholinergic burden, QT risk, serotonin toxicity, and adherence challenges. Stigma and discontinuation risk mean explanations must never prompt unsupervised stopping.

### **Caregivers**

Caregivers often become the de facto integration layer among clinicians, pharmacies, schedules, and symptoms. They need shared visibility, delegated access, a clear source of truth, and explicit consent controls.

### **Clinicians and pharmacists**

Clinical decision support is frequently overridden. A 2024 meta-analysis estimated a 90% override rate for drug-drug interaction alerts, with substantial heterogeneity \[9\]. The problem is therefore not simply insufficient alerting. It is poor prioritization, missing context, low trust, and disruption at the wrong moment.

## **3.5 Interaction classes the product must distinguish**

| **Interaction class**         | **Example mechanism**                                                            | **Required context**                                              | **Product implication**                                                              |
| ----------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Drug-drug, pharmacokinetic    | Enzyme or transporter inhibition changes exposure.                               | Dose, route, timing, duration, organ function, therapeutic index. | Show direction, mechanism, evidence, and management source.                          |
| Drug-drug, pharmacodynamic    | Additive sedation, bleeding, QT prolongation, hypotension, or serotonin effects. | Baseline risk, other contributors, monitoring.                    | Aggregate burden and explain overlapping effects.                                    |
| Drug-food                     | Food changes absorption, metabolism, or pharmacodynamic effect.                  | Meal timing, amount, regularity.                                  | Do not treat "diet" as an unbounded free-text risk engine. Use curated interactions. |
| Drug-supplement or herb       | Active constituents affect enzymes, transporters, coagulation, or targets.       | Exact product, ingredients, dose, batch variability.              | Confidence is often lower; product identity is difficult. Use explicit uncertainty.  |
| Drug-condition                | A medicine may worsen a condition or alter risk.                                 | Confirmed condition, severity, current status.                    | Requires clinically governed knowledge and careful intended-use claims.              |
| Drug-laboratory or physiology | Renal, hepatic, electrolyte, genomic, age, or pregnancy factors change risk.     | Current, validated data with date and provenance.                 | Missing context must reduce confidence, never be silently imputed.                   |
| Duplicate therapy             | Two products share ingredient or therapeutic class.                              | Product normalization and indication.                             | High-value reconciliation feature, often deterministic.                              |
| High-order interaction        | Three or more medicines create combined risk.                                    | Complete regimen and exposure overlap.                            | Pairwise edges are insufficient; support regimen-level patterns.                     |

## **3.6 Core problem statement**

**Patients and care teams lack a trusted, shared, time-aware representation of the real medication regimen. Existing systems often detect theoretical interactions without resolving identity, exposure, context, ownership, and follow-up.**

# **4\. User Research and Personas**

The following personas are evidence-informed hypotheses. They require interviews, contextual inquiry, and workflow observation. Willingness-to-pay statements are assumptions unless a named public price exists.

## **4.1 Patient with complex chronic illness**

| **Dimension**      | **Detail**                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile            | Adult managing five or more prescription and OTC products across two or more clinicians. May use supplements and symptom-directed products.                                                       |
| Goals              | Avoid preventable harm; understand what changed; know what to monitor; communicate accurately; reduce anxiety without being dismissed.                                                            |
| Current workflow   | Uses medication boxes, portal lists, pharmacy labels, notes, photos, and memory. Searches the web after a change or when symptoms occur. Calls pharmacist or clinician if concern becomes urgent. |
| Pain points        | Conflicting lists, unfamiliar names, unclear indications, generic warnings, fear of stopping the wrong medicine, no longitudinal explanation.                                                     |
| Frequency          | Medication changes monthly to several times per year; daily administration and symptom interpretation.                                                                                            |
| Willingness to pay | **\[A\] Low to moderate** for a stand-alone checker; higher for a family medication passport, monitoring, and access to professional review. Proposed test range: £8 to £15 per month.            |
| Best product fit   | Guided reconciliation, source-linked explanation, medication-change plan, symptom follow-up, and shareable clinician-ready summary.                                                               |
| Trust trigger      | Named sources, visible uncertainty, pharmacist review, and no commercial recommendations.                                                                                                         |

**Unmet need:** the patient needs an explanation grounded in their actual exposure, not a static list of all theoretical interactions.

## **4.2 Older adult with frailty or multimorbidity**

| **Dimension**      | **Detail**                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Profile            | Older adult with several conditions, possible sensory or cognitive limitations, repeated care transitions, and high caregiver involvement. |
| Goals              | Maintain function, reduce medication burden where appropriate, avoid falls or confusion, and keep a stable routine.                        |
| Current workflow   | Relies on repeat prescriptions, dosette boxes, family support, community pharmacy, GP reviews, and hospital discharge documents.           |
| Pain points        | Similar packaging, changing brands, duplicate lists, instructions that differ by setting, poor accessibility, unclear responsibility.      |
| Frequency          | Daily use; high-intensity review after discharge, acute illness, or medication change.                                                     |
| Willingness to pay | **\[A\] Often payer-mediated.** Family may pay for caregiver coordination; health system or pharmacy is the more credible buyer.           |
| Best product fit   | Accessible medication passport, caregiver delegation, before/after list, large text and voice, reviewed action plan.                       |
| Safety requirement | Escalate high-risk discrepancies and prevent independent stopping or dose changes.                                                         |

## **4.3 Caregiver or family coordinator**

| **Dimension**      | **Detail**                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Profile            | Relative or unpaid carer coordinating medicines, appointments, refills, symptoms, and communication. May support more than one person.   |
| Goals              | Know what should be taken, what actually happened, what changed, and when professional help is needed.                                   |
| Current workflow   | Messaging, shared notes, photos, paper lists, phone calls, calendar reminders, and pharmacy conversations.                               |
| Pain points        | No formal authority, incomplete information, multiple caregivers, missed handoffs, unclear consent, emotional burden.                    |
| Frequency          | Daily or weekly.                                                                                                                         |
| Willingness to pay | **\[A\] Moderate** for family coordination if it reduces repeated work and uncertainty. Proposed family-plan test: £15 to £25 per month. |
| Best product fit   | Delegated roles, audit trail, shared plan, refill and change events, symptom log, export for appointments.                               |
| Trust trigger      | Patient-controlled consent and clear distinction between observed, reported, and clinician-confirmed information.                        |

## **4.4 Community pharmacist**

| **Dimension**      | **Detail**                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile            | Pharmacist performing dispensing checks, consultations, new-medicine support, Pharmacy First, and medicines optimisation under time pressure.   |
| Goals              | Identify material risk quickly, reduce avoidable calls and rework, document intervention, and help the patient use medicines safely.            |
| Current workflow   | Pharmacy system, product labels, summary care information where available, patient interview, phone calls, reference tools, clinical judgement. |
| Pain points        | Incomplete list, unknown supplements, unclear indication, missing monitoring data, alert fatigue, fragmented communication with prescribers.    |
| Frequency          | Multiple medication questions daily; formal review episodes weekly.                                                                             |
| Willingness to pay | **\[A\] Organisation-level**, tied to workflow savings, clinical services, differentiation, quality, or reduced risk.                           |
| Best product fit   | Pre-consultation reconciliation, prioritized review queue, evidence card, intervention documentation, patient plan, follow-up.                  |
| Adoption risk      | Any extra screen or duplicate data entry will be rejected unless it saves time in the same encounter.                                           |

**Commercial insight:** community pharmacy is attractive because the user sees the physical products and often has a trusted relationship with the patient. The margin and staffing environment is constrained, so pricing must be linked to funded services, efficiency, retention, or outcomes.

## **4.5 Primary care physician or prescribing clinician**

| **Dimension**      | **Detail**                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Profile            | GP, prescribing pharmacist, nurse practitioner, or physician assistant managing multimorbidity within short visits.                      |
| Goals              | Prescribe safely, understand the current regimen, avoid preventable harm, and document a defensible plan.                                |
| Current workflow   | EHR medication list, repeat-prescription history, consultation, drug reference, alerts, laboratory review, and pharmacist collaboration. |
| Pain points        | Stale lists, outside prescribing, numerous low-value alerts, unclear patient behavior, limited time, and incomplete follow-up.           |
| Frequency          | Medication decisions daily; deep medication review less frequent.                                                                        |
| Willingness to pay | **\[A\] Usually organisation or network budget**, not individual clinician. Must fit existing EHR workflow.                              |
| Best product fit   | Medication diff, patient-reported reality, proposed-medication sandbox, high-confidence prioritized concerns, reviewed follow-up plan.   |
| Adoption risk      | Clinicians will not accept another alert layer that repeats incumbent content.                                                           |

## **4.6 Hospital clinician and care-transition team**

| **Dimension**      | **Detail**                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile            | Hospital pharmacist, doctor, nurse, discharge coordinator, or virtual-ward team reconciling admission and discharge medications.             |
| Goals              | Accurate transfer of medication information, fewer omissions and duplications, clear patient instructions, and continuity after discharge.   |
| Current workflow   | Admission history, inpatient orders, pharmacy verification, discharge summary, medicines-to-take-out process, GP/community pharmacy handoff. |
| Pain points        | Time pressure, conflicting sources, late discharge changes, weak patient comprehension, poor visibility after discharge.                     |
| Frequency          | Daily at institutional scale.                                                                                                                |
| Willingness to pay | **\[A\] Enterprise budget** if the product reduces reconciliation burden, readmissions, incidents, or post-discharge contacts.               |
| Best product fit   | Source comparison, discharge medication diff, patient confirmation, high-risk follow-up, downstream handoff.                                 |
| Procurement risk   | High: integration, clinical safety, information governance, accessibility, interoperability, evidence, and support.                          |

## **4.7 Clinical researcher**

| **Dimension**      | **Detail**                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile            | Pharmacoepidemiologist, clinical pharmacologist, informatician, or computational biologist studying medication safety.                          |
| Goals              | Generate reproducible hypotheses, access provenance, define cohorts, model exposure timing, and validate signals.                               |
| Current workflow   | Literature, curated databases, EHR or claims data, spontaneous reports, statistical analysis, target and pathway databases.                     |
| Pain points        | Heterogeneous identifiers, weak temporal data, confounding, missing dose, unclear phenotype, limited negative controls, licensing restrictions. |
| Frequency          | Project-based, weekly to daily.                                                                                                                 |
| Willingness to pay | **\[A\] Institutional or grant-funded** for well-governed datasets and analytic tools, not for consumer dashboards.                             |
| Best product fit   | De-identified research workspace, cohort definitions, provenance, temporal overlap, signal review, export, and audit.                           |
| Key requirement    | Clear separation between clinical evidence, observational association, and computational hypothesis.                                            |

## **4.8 Pharmacovigilance team and pharmaceutical company**

| **Dimension**      | **Detail**                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profile            | Safety scientist, case processor, signal management lead, qualified person for pharmacovigilance, medical reviewer, or epidemiologist.                                   |
| Goals              | Obtain complete cases, identify emerging signals, assess seriousness and expectedness, de-duplicate, triage, and meet regulatory obligations.                            |
| Current workflow   | Individual case safety reports, literature surveillance, EudraVigilance or FAERS, safety database, MedDRA coding, aggregate review, expert committees.                   |
| Pain points        | Missing dates and concomitant medicines, narrative inconsistency, duplicate reports, follow-up burden, bias, uncertain denominators.                                     |
| Frequency          | Continuous.                                                                                                                                                              |
| Willingness to pay | **\[A\] High for validated workflow and data quality**, but procurement and validation are demanding. Hypothesis: £75,000 to £300,000 annual contracts after validation. |
| Best product fit   | Structured patient-reported timeline, report completeness scoring, follow-up prompts, source-preserving narrative, signal workbench.                                     |
| Conflict risk      | Pharma funding can undermine patient trust. Governance, purpose limitation, and transparent commercial policy are essential.                                             |

## **4.9 Insurer, benefits provider, or government buyer**

| **Dimension**      | **Detail**                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Profile            | Payer, population-health team, integrated care board, benefits platform, or public-health commissioner.                 |
| Goals              | Reduce avoidable harm and utilization, improve medication adherence and review coverage, support high-risk populations. |
| Current workflow   | Claims, risk stratification, care management, pharmacy benefit management, quality measures, contracted providers.      |
| Pain points        | Weak clinical context, delayed data, fragmented engagement, difficulty attributing outcomes, member mistrust.           |
| Frequency          | Continuous population management; episodic outreach.                                                                    |
| Willingness to pay | **\[A\] Outcome or per-member-per-month model** if there is credible evidence and clear eligibility logic.              |
| Best product fit   | High-risk cohort enrollment, pharmacist review, medication-change follow-up, aggregate outcome reporting.               |
| Adoption risk      | Long evidence cycle, integration, procurement, and potential perception as cost-control rather than patient safety.     |

## **4.10 Persona prioritization**

| **Priority** | **Persona**                                                | **Why now**                                                                       | **Why not first**                                                                        |
| ------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1            | Community or digital pharmacist plus patient               | Existing medication encounter, trusted role, visible products, actionable review. | Tight workflow and budget constraints.                                                   |
| 2            | Post-discharge care-transition team plus patient/caregiver | Medication changes are concentrated and high-risk; clear before/after state.      | Enterprise integration and procurement.                                                  |
| 3            | Digital-health provider managing chronic illness           | Distribution, repeated engagement, and API-friendly workflow.                     | May lack clinical reviewer or authoritative content rights.                              |
| 4            | GP/primary care                                            | Strong need and policy fit.                                                       | EHR integration and alert fatigue make standalone adoption difficult.                    |
| 5            | Pharma pharmacovigilance                                   | High potential contract value.                                                    | Requires scale, validated data quality, governance, and trust.                           |
| 6            | Pure consumer                                              | Fastest to launch and test.                                                       | Weak differentiation, free substitutes, episodic use, liability, low willingness to pay. |

## **4.11 Research plan before commercial build**

### **Discovery interviews**

• 15 patients with five or more active products, including OTC and supplements.

• 10 caregivers managing another person's medicines.

• 12 community pharmacists from independent, chain, and distance-selling models.

• 8 primary-care prescribers or clinical pharmacists.

• 8 hospital medication-reconciliation or discharge professionals.

• 5 pharmacovigilance professionals.

### **Contextual observations**

Observe at least 20 medication-change encounters. Record source documents, time spent establishing the list, discrepancy types, questions asked, reference tools used, escalation, and documentation burden.

### **Quantitative discovery**

For a retrospective, de-identified sample of at least 500 medication-change episodes, measure:

• proportion with a discrepancy between prescribed and patient-reported medication;

• proportion with missing dose, route, start date, or indication;

• number and severity of generated incumbent alerts;

• proportion judged clinically material by two reviewers;

• time to complete reconciliation;

• follow-up contacts and unresolved questions.

### **Assumptions to test first**

**1\. \[A\]** Patients can accurately confirm a structured list when shown normalized product images and source text.

**2\. \[A\]** Pharmacists save at least three minutes per eligible review after setup.

**3\. \[A\]** A longitudinal change-focused view produces fewer, more actionable concerns than a full pairwise interaction list.

**4\. \[A\]** Source-linked explanations improve understanding without increasing unsafe self-directed medication changes.

**5\. \[A\]** A distribution partner will pay for a workflow before hard clinical outcomes are proven.

# **5\. Competitive Landscape**

## **5.1 Competitive framing**

SignalRx competes with more than medication interaction checkers. The substitute set includes drug-reference databases, EHR alerts, pharmacists, medical AI assistants, medication reminder apps, search engines, patient portals, and manual reconciliation. The product must be substantially better at a complete workflow, not incrementally better at presenting the same interaction record.

## **5.2 Consumer and professional products**

| **Competitor**                                     | **What it does well**                                                                                                                                                                                         | **Where it falls short for the target job**                                                                                                             | **Market gap SignalRx could own**                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Drugs.com**                                      | Free, familiar interaction checker across drugs, food, alcohol, and conditions; severity categories and broad consumer reach \[27\].                                                                          | Static lookup; limited patient-specific context; does not verify the true regimen or close the loop after a medication change.                          | Guided reconciliation, source provenance, change detection, monitoring, and review handoff.                               |
| **Epocrates**                                      | Fast clinician reference; checks up to 30 products and includes herbs or supplements in paid plans; clear professional adoption and public pricing \[28\].                                                    | Reference tool rather than longitudinal patient workflow; personalization depends on clinician input and time.                                          | Patient-collected context and medication-change episode delivered into professional workflow.                             |
| **UpToDate Lexidrug, formerly Lexicomp**           | Deep editorial content, interactions, natural products, patient education, mobile and EHR access \[29\].                                                                                                      | Strong content makes direct competition unattractive; implementation is primarily clinician and enterprise oriented.                                    | Complement rather than replace: patient reconciliation, temporal graph, follow-up, and interoperable evidence experience. |
| **Micromedex**                                     | Trusted drug and toxicology content; AI-powered search with citations; clinician validation process; large institutional footprint \[30\].                                                                    | AI search already neutralizes "ask questions of a drug database" differentiation. Limited public evidence of patient-owned longitudinal reconciliation. | Own the medication-change workflow and patient-reported exposure layer.                                                   |
| **FDB Multilex**                                   | UK clinical decision support with drug, disease, duplication, and dosing knowledge embedded in health systems \[31\].                                                                                         | Enterprise rule layer may generate alert burden; patient context and longitudinal outcome capture are not its core public positioning.                  | Context collection and prioritized, patient-understood resolution around existing rules.                                  |
| **Medi-Span**                                      | Patient-specific APIs can incorporate medicines, conditions, labs, timing, and other context; enterprise integration and recent NHS deployment \[32\].                                                        | Demonstrates that personalization is not unique. SignalRx cannot claim novelty merely from adding patient factors.                                      | Better reconciliation, patient engagement, evidence provenance, and post-change monitoring.                               |
| **DrugBank**                                       | Rich API with severity, evidence level, mechanisms, management, and references; broad drug-target and interaction data \[25\].                                                                                | Commercial licensing; database and API rather than complete care workflow; not a substitute for local clinical governance.                              | Workflow and longitudinal data layer built on licensed or equivalent authoritative knowledge.                             |
| **MedAware**                                       | Machine-learning safety layer that identifies medication outliers and potential errors in clinical data \[33\].                                                                                               | Provider-data dependent; less suited to capturing what a patient actually takes outside the record.                                                     | Reconcile patient reality with clinical intent and monitor outcomes after resolution.                                     |
| **Medisafe and reminder apps**                     | Daily adherence, reminders, caregiver support, progress reports, and consumer engagement \[34\].                                                                                                              | Adherence and reminders are different from clinically governed medication safety. Interaction information may not resolve context or ownership.         | Safety review and change interpretation, with reminder features only where they reinforce the plan.                       |
| **OpenEvidence**                                   | Widely distributed evidence-answering experience for verified US clinicians and strong medical information positioning \[35\].                                                                                | Broad clinical questions, not a medication system of record or structured medication-change workflow.                                                   | Operational medication context, not general medical search.                                                               |
| **Juno**                                           | Consumer chronic-illness assistant using voice and text, symptom extraction, medication tracking, and doctor-ready summaries; Anthropic reports 100,000 users onboarded after its October 2025 launch \[36\]. | Adjacent competitor for longitudinal consumer health context; public materials do not establish a regulated medication interaction engine.              | Partner, complement, or compete through medication-specific governance and professional workflow.                         |
| **ChatGPT Health**                                 | General consumer health experience that can connect health records and wellness apps, with broad distribution and dedicated protections \[37\].                                                               | General-purpose health navigation; no public basis to assume comprehensive licensed interaction content or medication-review workflow.                  | Specialized safety infrastructure, auditable knowledge, workflow integration, and human review.                           |
| **OpenAI for Healthcare / ChatGPT for Clinicians** | Enterprise and clinician products with large distribution, health-data protections, medical research, and documentation use cases \[38\]\[39\].                                                               | Makes generic LLM explanation and search less defensible as a standalone business.                                                                      | Domain-specific transaction layer and medication graph that can be used by multiple AI surfaces.                          |

## **5.3 Clinical decision support systems**

Traditional clinical decision support usually operates inside prescribing or order entry. It screens structured medication orders against interaction rules and presents alerts. This has three structural limitations:

**1\. The record is not the regimen.** It may omit outside prescriptions, supplements, nonadherence, recent discontinuation, or actual timing.

**2\. The rule sees a theoretical pair, not always a material patient event.** Missing context produces low-specificity warnings.

**3\. The alert occurs at the prescriber's moment, not throughout the patient journey.** It rarely supports understanding, home monitoring, or follow-up.

High override rates show the cost of low-value alerting \[9\]. SignalRx should not add another generic interruptive alert. It should gather context before review, rank issues, and support resolution.

## **5.4 Competitive conclusions**

### **What is already commoditized**

• Product and ingredient normalization for common medicines.

• Pairwise interaction lookup.

• Basic severity categories.

• Natural-language explanations.

• Citations attached to generated answers.

• Drug-target and pathway visualization.

• Medication reminders and caregiver notifications.

• General health question answering.

### **What remains difficult**

• Establishing what the person actually takes across fragmented sources.

• Reconciling prescribed intent, dispensing, and patient-reported behavior.

• Representing start, stop, dose, route, and overlap accurately.

• Ranking concerns using patient context without hiding uncertainty.

• Closing the loop with a clinician-reviewed plan and outcome monitoring.

• Creating pharmacovigilance-grade timelines without overclaiming causality.

• Deploying with content rights, clinical governance, interoperability, and trust.

# **6\. Why Existing Products Are Not Enough**

## **6.1 Failure 1: list accuracy comes before interaction accuracy**

A highly accurate interaction engine applied to an inaccurate regimen produces a misleading result. Existing systems often start after identity and status have already been assumed. SignalRx must treat medication reconciliation as the first safety function.

## **6.2 Failure 2: "no interaction found" is easily misread as safe**

Interaction knowledge is incomplete, product-specific, and context-dependent. Absence of a documented interaction may reflect missing evidence, a data-source gap, or a non-pairwise mechanism. The interface must use "no documented interaction found in the checked sources" and expose source coverage and date.

## **6.3 Failure 3: severity and evidence are collapsed**

A warning can be potentially severe but weakly evidenced, or common and well evidenced but manageable. A single red, amber, or green badge loses this distinction. SignalRx must display at least:

• potential clinical severity;

• evidence confidence;

• patient relevance;

• action status;

• source freshness.

## **6.4 Failure 4: alerts are not explanations, and explanations are not decisions**

A mechanistic explanation can increase trust, but it can also create false precision. The product should explain the relevant mechanism only when supported and should separately state what is known, what is inferred, and what is missing. The management recommendation must come from governed content or a reviewer, not free generation.

## **6.5 Failure 5: static checking ignores time**

Many adverse effects and interactions require overlapping exposure, a dose change, accumulation, or a sequence of events. Pharmacovigilance research identifies co-exposure timing as underdeveloped in spontaneous-report analyses \[13\]. SignalRx's graph must therefore be temporal from day one.

## **6.6 Failure 6: no longitudinal learning loop**

Most checkers answer a query and end the session. The higher-value workflow asks what happened next. Did the patient start the medicine? Did a symptom appear? Was the concern reviewed? Did the plan change? This longitudinal resolution can improve care and create a defensible dataset.

## **6.7 Failure 7: supplements and diet are treated too broadly**

"Diet" cannot safely be an unrestricted interaction category. Food interactions are specific to products, constituents, quantities, timing, and consistency. Supplements may contain multiple ingredients and variable formulations. SignalRx should initially support a curated set of high-signal food, alcohol, and supplement interactions. It should display product uncertainty and use resources such as NCCIH for evidence context \[48\].

## **6.8 Failure 8: patient-generated reports lack structure**

A binary "this combination caused my symptom" vote is unsuitable for safety inference. Useful reports need dose, route, dates, overlap, onset, seriousness, dechallenge, rechallenge, concomitant medicines, medical history, and alternative explanations. MHRA explicitly asks reporters for timing, treatment dates, concomitant medication, and whether an effect continued or began after treatment stopped \[16\].

## **6.9 Failure 9: generic LLMs are not interaction engines**

In a study of 255 drug pairs, general-purpose AI chatbots showed variable accuracy and specificity against conventional drug-interaction tools \[10\]. The exact models studied are now dated, but the architecture lesson remains: a language model should not be the authority that determines whether an interaction exists.

## **6.10 Failure 10: the buying workflow is ignored**

A clinically useful prototype can still fail commercially. The buyer needs a measurable benefit: fewer reconciliation minutes, fewer unnecessary calls, improved service capacity, reduced incidents, better reporting completeness, improved patient retention, or evidence toward reduced utilization. SignalRx needs a product with an operational owner and budget, not merely a medically important concept.

# **7\. Product Vision**

## **7.1 Mission**

**Make every medication change understandable, verifiable, and monitorable.**

## **7.2 Ten-year ambition**

Become the medication context and evidence infrastructure used by patients, clinicians, pharmacies, health systems, and research teams to understand not only what was prescribed, but what was taken, why, when, with what evidence, and with what result.

## **7.3 North Star**

**Percentage of material medication changes that become a verified, patient-understood, monitored plan within 48 hours.**

A material medication change is a start, stop, dose change, route change, formulation change, or newly identified product that can alter therapeutic effect, risk, or monitoring.

## **7.4 Core principles**

**1\. Reality before reasoning.** Verify identity, status, dose, route, and timing before evaluating risk.

**2\. Evidence before fluency.** A polished explanation never outranks governed evidence.

**3\. Uncertainty is a feature.** Missing context and conflicting sources must be visible.

**4\. No autonomous medication changes.** The product supports questions, review, and monitoring.

**5\. Time is first-class.** Exposure overlap and change events are part of the data model.

**6\. Patient and clinician views share one provenance layer.** Language can differ; facts cannot.

**7\. Human review is risk-based.** Escalation depends on severity, confidence, context, and intended action.

**8\. Minimum necessary data.** Collect only what is required for the stated workflow.

**9\. Research is separated from care.** Statistical and molecular hypotheses never appear as established clinical evidence.

**10\. Workflow value beats model novelty.** Success is measured in resolution, not generated text.

## **7.5 Non-goals**

• Comprehensive diagnosis, symptom triage, or treatment selection.

• Automated deprescribing.

• Recommending substitute medicines without clinician ownership.

• Becoming a primary EHR in the first five years.

• Training proprietary foundation models.

• Real-time molecular modelling in clinical workflows.

• Selling identifiable patient data.

• Replacing licensed drug knowledge with scraped content.

## **7.6 Product surfaces**

### **SignalRx Companion**

Patient and caregiver experience for medication capture, verification, explanations, action plan, monitoring, and sharing.

### **SignalRx Review**

Professional workspace for reconciliation, concern triage, evidence review, communication, and follow-up.

### **SignalRx Intelligence API**

Future API for normalized medication context, evidence cards, change detection, and workflow events. This is not simply an interaction endpoint.

### **SignalRx Safety Research**

Separate governed environment for de-identified pharmacovigilance analysis, literature review, target nomination, and computational hypotheses.

# **8\. Product Definition and Core Workflows**

## **8.1 Primary use case: a medication changed**

### **Trigger**

A new prescription, hospital discharge, dose change, stopped medicine, new OTC product, new supplement, or unexplained symptom.

### **End-to-end workflow**

**1\.** User imports or enters medication evidence from a document, label photo, barcode, speech, portal export, or structured integration.

**2\.** System extracts candidate products, ingredients, dose, route, schedule, dates, and source passages.

**3\.** User confirms or corrects each item. Ambiguity is never silently resolved.

**4\.** System compares the current state with the previous verified state and identifies material changes.

**5\.** Deterministic safety services evaluate duplicate ingredients, known interactions, selected drug-condition concerns, and missing context.

**6\.** Evidence cards explain prioritized concerns, source coverage, confidence, and what information is missing.

**7\.** Low-risk informational items are acknowledged. Material concerns enter a pharmacist or clinician review path according to deployment policy.

**8\.** A reviewed plan is communicated in patient language, including what to take, what changed, what to monitor, and who to contact.

**9\.** Timed follow-up asks about implementation and symptoms without attributing causality.

**10\.** Structured outcome data and resolution status update the timeline.

## **8.2 Secondary use case: proposed medication sandbox**

A clinician or pharmacist adds a proposed product before finalizing a plan. SignalRx displays only the new or materially changed concerns, not the entire alert inventory. The professional can record rationale, monitoring, modification, or override. The patient receives only the reviewed plan.

## **8.3 Secondary use case: suspected adverse reaction**

The user reports a symptom or event. SignalRx asks structured questions about onset, seriousness, exposure timing, dose changes, dechallenge, rechallenge, concomitant products, medical evaluation, and confounders. It produces a reviewable summary for the user and a professional, and can prepare information for an official reporting pathway. It does not infer that a medicine caused the event.

## **8.4 Core information states**

| **State**                       | **Definition**                                                                             | **UI language**                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Established concern             | Supported by governed interaction content and relevant to confirmed exposure.              | "Documented concern"                                     |
| Context-dependent concern       | Known mechanism or warning whose relevance depends on missing or variable patient context. | "May matter in your situation"                           |
| Emerging hypothesis             | Observational, literature, or computational signal not established for clinical use.       | "Research signal, not clinical evidence"                 |
| No documented interaction found | Checked sources do not contain a qualifying interaction.                                   | "No documented interaction found in the checked sources" |
| Insufficient data               | Product identity, dose, timing, context, or evidence is inadequate.                        | "Not enough information to assess"                       |
| Conflicting evidence            | Sources or interpretations differ materially.                                              | "Evidence is inconsistent; professional review needed"   |
| Resolved                        | Reviewer and patient have an agreed plan.                                                  | "Plan reviewed"                                          |

## **8.5 Example evidence card**

**Concern:** Increased bleeding risk with two confirmed products.

**Potential severity:** Major

**Evidence confidence:** High

**Patient relevance:** Moderate until indication, dose, and bleeding history are confirmed

**Why it may happen:** Both products affect haemostasis through different mechanisms.

**Source:** Licensed interaction monograph, version and review date; relevant product labels; supporting references.

**What is missing:** Recent bleeding, renal function, planned duration, and whether both products are current.

**Action:** Do not stop either medicine based on this screen. Confirm the list and request pharmacist or prescriber review. Seek urgent care for specified red-flag symptoms according to approved clinical content.

**Provenance:** Each displayed statement links to the knowledge item or user-entered source that supports it.

# **9\. Product Requirements**

## **9.1 Functional requirements**

| **ID** | **Requirement**                                                                                                    | **Priority** | **Acceptance criterion**                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| FR-01  | Capture medication evidence from manual entry, text document, image, and speech.                                   | P0           | User can submit one supported source and receive candidate structured items with source snippets.                  |
| FR-02  | Normalize product and ingredient identifiers using market-appropriate terminology.                                 | P0           | Each confirmed item stores original text, normalized code, ingredient, strength, dose form, and confidence.        |
| FR-03  | Require user confirmation of ambiguous or low-confidence extractions.                                              | P0           | No item with confidence below configured threshold becomes active without confirmation.                            |
| FR-04  | Store prescribed, dispensed, and patient-reported states separately.                                               | P0           | UI and data model preserve source and status rather than collapsing into one list.                                 |
| FR-05  | Compare two verified medication states and identify starts, stops, dose, route, schedule, and formulation changes. | P0           | Change list matches reference cases with at least 95% exactness in test set.                                       |
| FR-06  | Detect duplicate active ingredients and seeded known interactions deterministically.                               | P0           | Engine returns exact configured result with source, version, severity, evidence, and management fields.            |
| FR-07  | Display potential severity and evidence confidence separately.                                                     | P0           | Every concern has both fields or explicitly states unavailable.                                                    |
| FR-08  | Ask targeted questions for missing context.                                                                        | P0           | Questions are drawn from a controlled schema and cannot alter clinical facts.                                      |
| FR-09  | Generate source-grounded patient explanations.                                                                     | P0           | Every clinical assertion is entailed by retrieved evidence; unsupported-claim rate meets release threshold.        |
| FR-10  | Prevent "safe" claims and unsupervised medication-change instructions.                                             | P0           | Safety policy tests block prohibited language and route material issues to review.                                 |
| FR-11  | Create a shareable, versioned medication-change plan.                                                              | P0           | Plan includes current list, changes, unresolved questions, monitoring, reviewer status, and timestamp.             |
| FR-12  | Collect a structured post-change symptom timeline.                                                                 | P1           | User can log symptom, onset, severity, action, and relation to medication events without causal wording.           |
| FR-13  | Generate a reviewable suspected-adverse-reaction summary.                                                          | P1           | Summary includes core fields requested by target regulator and clearly states it is not a causality determination. |
| FR-14  | Support caregiver delegation and granular consent.                                                                 | P1           | Patient can grant, limit, audit, and revoke access.                                                                |
| FR-15  | Provide professional review queue and resolution actions.                                                          | P1           | Reviewer can accept, amend, dismiss with rationale, escalate, and publish a plan.                                  |
| FR-16  | Export and import standards-based medication data.                                                                 | P2           | Supports defined FHIR medication resources and terminology mappings for pilot partner.                             |
| FR-17  | Track content versions and notify affected cases when evidence materially changes.                                 | P2           | System can identify active plans linked to superseded knowledge items.                                             |
| FR-18  | Support de-identified research export under approved governance.                                                   | P3           | Export excludes direct identifiers, records consent and purpose, and preserves provenance and timing.              |

## **9.2 Non-functional requirements**

| **Domain**         | **Requirement**                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Safety             | Clinical hazard management under a named clinical safety officer; documented intended use; testable contraindicated outputs.      |
| Explainability     | Every clinical concern is traceable to a versioned source and deterministic rule or approved review decision.                     |
| Reliability        | Core interaction and reconciliation services remain available independently of the LLM.                                           |
| Latency            | P0 medication extraction and evidence response target below 10 seconds for hackathon; commercial targets set per workflow.        |
| Privacy            | Encryption in transit and at rest; least privilege; explicit consent; deletion and retention controls; separate research consent. |
| Security           | Threat modelling, dependency scanning, audit logs, secrets management, incident response, and environment separation.             |
| Accessibility      | WCAG 2.2 AA target; plain language; screen reader support; keyboard use; large text; no color-only meaning.                       |
| Localization       | Medication terminology, labels, emergency language, and regulatory pathways are market-specific.                                  |
| Auditability       | Immutable event trail for source imports, confirmations, rules, model outputs, reviews, and plan publication.                     |
| Interoperability   | API-first domain model; FHIR where useful; NHS dm+d and SNOMED CT alignment for UK deployments.                                   |
| Model governance   | Versioned prompts, retrieval sets, evaluation datasets, thresholds, rollback, and human override.                                 |
| Content governance | Named owner, licensing register, update cadence, editorial policy, and change-impact assessment.                                  |

## **9.3 Patient experience requirements**

• Show the medication and source image or text side by side during confirmation.

• Explain why a question is being asked.

• Never require the patient to understand enzyme names to act safely.

• Allow "I do not know" and convert uncertainty into a review item.

• Distinguish urgent red flags, routine review, and informational items using approved content.

• Preserve the patient's own words in the symptom timeline while also structuring them.

• Make caregiver access visible and revocable.

• Support a printable and offline medication passport.

## **9.4 Professional experience requirements**

• Show only new, changed, or unresolved concerns by default.

• Provide a complete audit view on demand.

• Separate rule evidence, patient data, model-generated summary, and reviewer decision.

• Allow local formulary and policy overlays without modifying source evidence.

• Record reason for override, monitoring plan, and owner.

• Publish patient language from reviewed structured data rather than a free-form model answer.

• Measure time saved and actionability without rewarding indiscriminate alert acceptance.

# **10\. Product Architecture**

## **10.1 Logical architecture**

| **Layer**                       | **Components**                                                                                            | **Why it exists**                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Experience                      | Patient companion, caregiver view, professional review, research workbench.                               | Different users require different language and permissions over the same facts. |
| Workflow                        | Medication-change episode, reconciliation, review queue, plan, follow-up, report preparation.             | Converts reference knowledge into a completed operational job.                  |
| Identity and context            | User profile, roles, consent, conditions, labs, allergies, pregnancy, organ function, source provenance.  | Interaction relevance depends on context and permission.                        |
| Medication graph                | Products, ingredients, dose, route, schedule, indication, start/stop, source, status, reviewer.           | Represents the real regimen over time.                                          |
| Evidence graph                  | Interaction monographs, labels, guidelines, papers, mechanisms, targets, evidence grade, version.         | Separates what is known from what is generated or hypothesized.                 |
| Deterministic safety engine     | Normalization, duplicate ingredient, known DDI, selected food/supplement and condition rules, thresholds. | Provides reproducible safety decisions.                                         |
| Retrieval and LLM orchestration | Evidence retrieval, extraction, explanation, missing-context questions, summarization, translation.       | Reduces unstructured-data and communication burden.                             |
| Pharmacovigilance engine        | Timeline quality, exposure overlap, case completeness, coding support, de-duplication, signal statistics. | Supports report quality and later research without claiming causality.          |
| Research module                 | Literature retrieval, target/pathway mapping, structure and affinity hypotheses.                          | Generates expert-reviewable hypotheses outside clinical production.             |
| Governance                      | Content lifecycle, clinical safety, model evaluation, audit, privacy, security, regulatory evidence.      | Makes the system deployable and trustworthy.                                    |

## **10.2 Medication graph schema**

### **Core node types**

• Person, caregiver, clinician, organization.

• Medication product, ingredient, dose form, route, dose, schedule.

• Prescription request, dispense event, patient-reported use, administration event.

• Condition, allergy or intolerance, laboratory observation, symptom, adverse event.

• Evidence item, interaction, mechanism, enzyme, transporter, protein target, pathway.

• Review decision, monitoring plan, consent, source document.

### **Core edge types**

• PRESCRIBED, DISPENSED, REPORTS_TAKING, STARTED, STOPPED, CHANGED_TO.

• HAS_INGREDIENT, HAS_DOSE, USES_ROUTE, FOR_INDICATION.

• OVERLAPS_WITH, PRECEDES, FOLLOWED_BY.

• INHIBITS, INDUCES, SUBSTRATE_OF, BINDS_TO, AFFECTS_PATHWAY.

• SUPPORTED_BY, CONTRADICTED_BY, SUPERSEDES, REVIEWED_BY.

• MAY_INCREASE, MAY_REDUCE, SHARES_ADVERSE_EFFECT.

### **Temporal rules**

Every medication state should support an effective period, uncertainty interval, and source timestamp. "Current" is derived, not stored as an eternal truth. A patient-reported start date can be approximate and should preserve that uncertainty.

## **10.3 Evidence graph schema**

Each evidence item should store:

• source organization and content type;

• canonical URL, licence, and access restriction;

• publication or review date;

• affected products, ingredients, targets, populations, and outcomes;

• mechanism and direction;

• evidence grade and editorial status;

• severity and management fields where licensed;

• supersession history;

• extracted text spans and human review status.

## **10.4 Graph database decision**

**\[D\] Use PostgreSQL or Supabase for the hackathon and early product.** The domain is graph-shaped, but Neo4j is not required to demonstrate value. Relational tables with explicit identifiers, time intervals, and edges are easier to ship, query, audit, and integrate in 24 hours.

Introduce a graph database only when multi-hop mechanism, provenance, or research queries create a measured performance or developer-productivity advantage. Premature graph infrastructure is a common form of demo-driven architecture.

## **10.5 Knowledge-source strategy**

A commercial product needs a clear content strategy:

**1\. Licensed authoritative content for clinical interaction decisions.** DrugBank, FDB, Medi-Span, or another clinically governed source may be candidates, subject to market rights and economics \[25\]\[31\]\[32\].

**2\. Official labels for source evidence.** DailyMed and regulatory product information can support retrieval, but extracting and reconciling all interaction knowledge from labels is a large editorial task \[19\].

**3\. Terminology for identity.** NHS dm+d for UK product identity; RxNorm for US normalized clinical drug names. RxNorm's public drug-interaction features were discontinued in January 2024, so it should not be treated as the interaction source \[20\]\[21\].

**4\. Public scientific resources for research enrichment.** PubChem, ChEMBL, and Open Targets can support structures, bioactivity, targets, and disease associations, subject to licence and API limits \[22\]\[23\]\[24\].

**5\. Specialist supplement sources.** Use curated evidence and clearly lower confidence where product composition is uncertain \[48\].

# **11\. Hackathon MVP**

## **11.1 MVP objective**

Demonstrate that SignalRx can transform a confusing medication change into a **verified, source-backed, patient-understood plan** with a credible professional review path.

The MVP should not attempt comprehensive interaction coverage or clinical deployment. It should use synthetic data, a small curated evidence set, and explicit prototype language.

## **11.2 Demo story**

A synthetic patient is discharged with a revised regimen. The discharge letter, an older medication list, and the patient's voice recollection conflict.

SignalRx:

**1\.** extracts medications and instructions from both documents;

**2\.** asks the patient to confirm uncertain products and current use;

**3\.** displays the before/after regimen;

**4\.** identifies one duplicate ingredient, one known interaction, one context-dependent concern, and one missing-data issue from a seeded deterministic evidence set;

**5\.** presents source-linked explanations with separate severity and confidence;

**6\.** creates questions for a pharmacist;

**7\.** records a reviewed plan;

**8\.** follows up on a synthetic symptom and prepares a Yellow Card-style report summary;

**9\.** optionally shows a precomputed research hypothesis for a candidate target, clearly outside the clinical result.

## **11.3 Build scope for 24 hours**

### **Must ship**

• Next.js application deployed on Vercel.

• Supabase or PostgreSQL persistence.

• Synthetic patient and two conflicting medication documents.

• Claude-powered structured extraction to a strict JSON schema.

• Medication confirmation screen.

• Simple before/after timeline.

• Deterministic rule engine with 8 to 12 curated evidence records.

• Evidence card with source snippet, severity, confidence, mechanism, and missing context.

• Plain-language explanation generated only from retrieved fields.

• "Do not stop or change medication without professional advice" guardrail.

• Pharmacist review state and published plan.

• Structured symptom and adverse-event timeline.

• Downloadable or copyable suspected-reaction summary.

### **Should ship**

• Photo or label input for one product.

• Voice medication recap.

• Caregiver share view.

• Simple graph visualization focused on the active concern.

• Evaluation panel showing extraction confidence and source coverage.

### **Do not build**

• Live EHR integration.

• Real patient data.

• Comprehensive interaction database.

• Automated diagnosis, prescribing, or substitution.

• Dynamic web search for clinical answers.

• Live FAERS signal claims.

• Neo4j unless the team already has a working pattern.

• Live Boltz-2 inference.

• Direct regulatory report submission.

• User voting that a drug combination "caused" an event.

## **11.4 Hackathon acceptance criteria**

| **Criterion**         | **Pass condition**                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Problem clarity       | A non-expert understands the medication-change problem within 20 seconds.                       |
| Workflow completeness | Demo moves from source documents to verified list to concern to reviewed plan to follow-up.     |
| Safety                | No screen states that the regimen is safe or instructs autonomous medication changes.           |
| Verifiability         | Every concern and clinical explanation links to a visible source record.                        |
| Determinism           | The same structured inputs produce the same interaction classification.                         |
| Uncertainty           | At least one ambiguity is surfaced rather than guessed.                                         |
| Human role            | Professional review is visible and changes the plan status.                                     |
| Technical credibility | Data model distinguishes prescribed, reported, and reviewed states with timestamps.             |
| Commercial story      | Pitch identifies buyer, workflow, measurable value, and why existing checkers are insufficient. |

## **11.5 90-second demo script**

**0 to 15 seconds:** "Medication safety systems know what was ordered. Patients know what they actually take. Those are often not the same."

**15 to 35 seconds:** Upload a discharge letter and prior list. Show extraction and two uncertain products. Patient confirms one and corrects one.

**35 to 55 seconds:** Reveal the regimen diff and three prioritized evidence cards. Open one source and show missing renal context.

**55 to 70 seconds:** Pharmacist reviews the concern and publishes a plain-language plan with monitoring.

**70 to 82 seconds:** Patient logs dizziness two days later. SignalRx creates a structured timeline without claiming causality.

**82 to 90 seconds:** "SignalRx turns every medication change into a verified, understandable, monitored plan. The graph is not the product. Resolution is."

# **12\. Roadmap**

## **12.1 Stage 0: Hackathon, 24 hours**

**Goal:** prove narrative, workflow, and hybrid architecture.

**Evidence:** usability with synthetic cases; extraction tests; judge comprehension; no clinical claims.

**Exit criterion:** complete demo and at least five pharmacist or clinician conversations agreeing that the workflow addresses a real gap.

## **12.2 Stage 1: Prototype, 0 to 3 months**

• Conduct discovery research and workflow observation.

• Build terminology normalization for a constrained UK medication set.

• Implement versioned evidence model and content ingestion.

• Recruit clinical safety lead and advisory group.

• Build 100 to 300 de-identified or synthetic reference cases.

• Test extraction, reconciliation, and explanation separately.

• Secure one content partner or define a legally viable licensed source strategy.

• Select a single distribution wedge.

**Exit criteria:** 90% or greater normalized medication accuracy on target documents; no critical unsafe output in red-team set; one signed design partnership; credible content rights.

## **12.3 Stage 2: Alpha with professional review, 3 to 9 months**

• Deploy in a non-diagnostic, professional-review workflow.

• Start with one medication-change episode type, such as post-discharge or new medicine support.

• Integrate minimal patient identity and messaging.

• Measure discrepancy yield, review time, actionability, understanding, and unsafe behavior.

• Implement DCB0129 clinical risk management for UK health IT manufacture \[44\].

• Complete privacy impact assessment and security baseline.

**Exit criteria:** material discrepancies or actionable concerns in a pre-specified proportion; measured workflow time neutral or better; high clinician trust; no evidence of increased unsupervised stopping.

## **12.4 Stage 3: Beta and clinical pilots, 9 to 18 months**

• Add FHIR and local system integration.

• Expand licensed interaction coverage.

• Add caregiver roles and structured follow-up.

• Validate patient explanations and risk communication.

• Develop clinical evaluation protocol.

• Complete DTAC-aligned evidence for NHS use where applicable \[45\].

• Determine medical-device classification and quality-management requirements before claims expand.

**Exit criteria:** paid pilots, repeat weekly use, pilot conversion, agreed outcome measures, and regulatory plan accepted by counsel and clinical leadership.

## **12.5 Stage 4: Commercial medication-change platform, 18 to 36 months**

• Multi-tenant enterprise administration.

• Content update and impact management.

• Patient app or embedded web experience.

• Pharmacy, digital-health, and care-transition deployment playbooks.

• Outcomes analytics and payer evidence.

• API for medication-context and evidence cards.

• Market-specific terminology and content.

**Exit criteria:** repeatable sales motion, deployment under 12 weeks for standard partners, attractive gross margin after content costs, and proof of renewal.

## **12.6 Stage 5: Enterprise safety network, 3 to 5 years**

• Cross-setting medication passport under patient control.

• Clinical rule and workflow marketplace with governance.

• Prospective safety monitoring and evidence updates.

• Population-level medication-change analytics.

• Pharmacovigilance case-quality product with regulator and pharma validation.

## **12.7 Stage 6: Research platform, 5 to 10 years**

• De-identified, consented longitudinal medication-outcome datasets.

• External research workspaces with reproducible cohorts and provenance.

• Statistical signal detection linked to biological mechanism evidence.

• Computational target and structure hypotheses.

• Prospective studies and regulator collaboration.

# **13\. AI Strategy**

## **13.1 Governing rule**

**Use AI where the input or output is unstructured. Use deterministic systems where the decision must be reproducible. Use humans where ambiguity, severity, or accountability exceeds the system's validated scope.**

## **13.2 Use of LLMs**

| **Use case**                                              | **Why LLM adds value**                                       | **Required controls**                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Medication extraction from letters, labels, and free text | Handles varied language, layout, abbreviations, and context. | Strict schema, confidence, source spans, terminology validation, user confirmation.                           |
| Medication-list comparison narrative                      | Converts structured diff into concise explanation.           | Diff is computed deterministically; model cannot invent changes.                                              |
| Missing-context questions                                 | Tailors controlled questions to the current concern.         | Select from approved question bank; no free-form clinical advice.                                             |
| Patient explanation                                       | Adjusts reading level, language, and structure.              | Retrieval-only facts, citation entailment, prohibited-claim filter, reviewed templates for high-risk classes. |
| Professional summary                                      | Reduces chart review and documentation burden.               | Preserve source distinctions and uncertainty; reviewer approval.                                              |
| Adverse-event narrative drafting                          | Organizes structured chronology into a readable report.      | No causality claim; dates and products come from structured fields; user or reviewer approval.                |
| Literature triage                                         | Extracts candidate relations and summaries.                  | Research-only, human verification, source and quote preservation.                                             |
| Translation and accessibility                             | Improves reach.                                              | Medical term glossary, back-translation sampling, approved emergency language.                                |

## **13.3 Deterministic functions**

• Medication code mapping and identifier resolution after validation.

• Dose unit conversion.

• Duplicate active-ingredient detection.

• Known interaction lookup and rule execution.

• Severity and evidence field retrieval.

• Date, interval, and exposure-overlap calculations.

• Thresholds for review routing.

• Consent and access control.

• Regulatory form field mapping.

• Version and audit tracking.

• User-interface wording for urgent escalation when governed content applies.

## **13.4 Human review requirements**

Human review is required when:

• potential severity is major or life-threatening;

• evidence sources conflict;

• product identity is uncertain and clinically material;

• a user asks whether to start, stop, or change a medicine;

• the system detects a possible serious adverse event;

• a research signal is considered for external communication;

• content is added, updated, or reclassified;

• a generated explanation fails automated entailment or confidence thresholds;

• local policy requires review.

## **13.5 Claude orchestration pattern**

**1\. Input isolation:** documents are processed under a defined privacy and retention policy.

**2\. Extraction call:** Claude returns structured medication candidates with source spans and explicit uncertainty.

**3\. Validation:** deterministic terminology lookup resolves candidates or requests user confirmation.

**4\. Safety query:** verified structured facts are sent to the deterministic safety engine.

**5\. Evidence retrieval:** only matched, versioned evidence fields are assembled.

**6\. Explanation call:** Claude is instructed to restate only the provided evidence and context, with required uncertainty and action language.

**7\. Post-generation checks:** citation entailment, prohibited phrases, dose consistency, medication-name consistency, and completeness.

**8\. Review routing:** policy determines whether the output can be shown directly or requires professional review.

**9\. Audit:** store model, prompt version, retrieved evidence IDs, output, checks, and final approved content.

## **13.6 Evaluation framework**

### **Extraction**

• Exact match for ingredient, strength, dose form, route, and schedule.

• Source-span precision and recall.

• Ambiguity calibration.

• Error rate by document type, brand, handwriting, language, and image quality.

### **Explanation**

• Clinical-assertion entailment.

• Unsupported claim rate.

• Citation correctness.

• Preservation of severity and uncertainty.

• Reading level and comprehension.

• Unsafe action suggestion rate.

### **Workflow**

• Time to verified list.

• Number of discrepancies found.

• Reviewer actionability.

• Patient teach-back score.

• Follow-up completion.

• Unsupervised medication-change behavior.

### **Release gates**

• Zero tolerated critical errors in a predefined high-risk test set.

• Quantified upper confidence bound for unsupported clinical claims.

• No regression in medication identity or dose consistency.

• Clinical sign-off on new interaction categories and templates.

## **13.7 Where AI should not be used**

• Free-generation of an interaction not present in governed evidence.

• Autonomous severity classification.

• Autonomous medication substitution or deprescribing.

• Causality assessment from patient reports.

• Emergency disposition without a separately validated triage function.

• Inferring renal function, pregnancy, genotype, or adherence.

• Converting a molecular prediction into a clinical warning.

# **14\. Safety and Clinical Governance**

## **14.1 Principal harms**

SignalRx can cause harm through false reassurance, unnecessary alarm, inaccurate medication identity, incomplete context, stale evidence, hallucinated explanation, automation bias, privacy failure, inequitable performance, and use outside intended scope.

The safety design must assume that users may act on presentation, not only explicit instructions. A green visual, omitted warning, or confident mechanism can influence behavior even when a disclaimer is present.

## **14.2 Safety-by-design controls**

### **Never output "safe"**

Use bounded states such as documented concern, no documented interaction found in checked sources, insufficient data, or professional review required. "No interaction" is not a clinical clearance.

### **Require confirmation of the regimen**

A result based on unconfirmed extraction is visibly provisional. High-risk items cannot proceed without identity confirmation or review.

### **Separate evidence from explanation**

The interaction engine returns structured facts. The LLM can translate them, but cannot add a mechanism, outcome, severity, or management instruction.

### **Make missing context visible**

Unknown renal function, dose, route, timing, or product identity reduces confidence and may change routing. Missing data cannot be silently replaced with population assumptions.

### **Minimize alert volume**

Default to changed and unresolved issues. Apply tiering, contextual suppression, and local policy only with clinical governance. Track override reasons and outcomes rather than optimizing for alert acceptance.

### **Prevent unsafe self-management**

High-risk screens state that the user should not start, stop, or change medication based solely on the tool. Any direct action instruction must come from approved clinical content or a named reviewer.

### **Provide emergency boundaries**

The product must have a clear, market-specific emergency policy. It should not improvise triage. Red-flag content must be approved, localized, and tested.

## **14.3 Seed clinical hazard log**

| **Hazard**                               | **Potential harm**                                    | **Initial risk** | **Controls**                                                                                          | **Residual evidence required**                                                      |
| ---------------------------------------- | ----------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Wrong medicine normalized                | Incorrect interaction result or missed duplicate.     | High             | Source display, terminology validation, confidence threshold, user confirmation, reviewer escalation. | Error rate by product type and image quality.                                       |
| "No documented interaction" read as safe | Patient continues risky combination or avoids review. | High             | No green safe state, coverage statement, context gaps, professional review language.                  | Comprehension and behavior study.                                                   |
| Hallucinated mechanism or management     | Misleading clinical action.                           | High             | Deterministic evidence fields, retrieval-only generation, entailment checks, high-risk templates.     | Unsupported-claim upper bound.                                                      |
| Dose, route, timing omitted              | Relevance misclassified.                              | High             | Required fields for supported rules; confidence reduction; targeted questions.                        | Missing-data rates and route-specific tests.                                        |
| Alert fatigue                            | Important issue ignored.                              | High             | Change-focused ranking, tiering, user-specific context, non-interruptive review queue.                | Actionability, override, and time studies.                                          |
| Patient stops medication                 | Treatment failure, withdrawal, or acute harm.         | High             | Prohibited-action policy, repeated "do not change" language, reviewer pathway, behavioral monitoring. | Prospective safety outcome.                                                         |
| Stale or superseded content              | Outdated guidance shown.                              | High             | Versioned content, update jobs, impact analysis, plan notifications, content SLA.                     | Update latency and audit.                                                           |
| Symptom causality overclaimed            | Anxiety, incorrect discontinuation, biased report.    | High             | Neutral chronology, alternative-cause questions, "suspected" language, reviewer sign-off.             | Narrative audit and user comprehension.                                             |
| Data breach                              | Exposure of sensitive health information.             | High             | Encryption, least privilege, segmentation, audit, retention, incident response.                       | Security testing and compliance evidence.                                           |
| Biased evidence or model                 | Unequal performance or inappropriate ranking.         | Medium to high   | Subgroup evaluation, uncertainty, diverse data, human review, monitoring.                             | Performance by age, language, disability, sex, ethnicity where lawful and relevant. |
| Licensed content misuse                  | Legal action, loss of product.                        | High             | Licence register, access controls, no unapproved redistribution, vendor review.                       | Legal sign-off and contract controls.                                               |
| Research signal shown clinically         | Unvalidated hypothesis changes care.                  | High             | Separate environment, labels, access roles, no production-rule promotion without governance.          | Audit and promotion workflow.                                                       |

## **14.4 Clinical governance model**

• Named clinical safety officer.

• Multidisciplinary clinical advisory board including pharmacist, GP, clinical pharmacologist, pharmacovigilance specialist, and patient representative.

• Clinical safety case and hazard log maintained through the lifecycle.

• Content governance committee with defined editorial standards.

• Incident reporting and field-safety process.

• Model-change control and rollback.

• Pre-release and post-release monitoring.

• Clear medical responsibility and escalation contracts with deployment partners.

## **14.5 Automation-bias mitigation**

• Show source, version, and uncertainty next to the conclusion.

• Require reviewers to choose a rationale, not merely click accept.

• Present patient facts before system interpretation.

• Use counterfactual prompts such as "what information could change this result?"

• Monitor agreement rates, not as a quality target but as a signal for calibration.

• Sample accepted and overridden cases for clinical audit.

• Do not display molecular graphics in clinical review because visual sophistication can create undue confidence.

# **15\. Regulatory and Legal Strategy**

## **15.1 Regulatory strategy is a product decision**

Classification depends on intended purpose, claims, target user, and functionality. A tool that stores a medication list and retrieves general information differs materially from one that outputs patient-specific risk conclusions or recommends actions. The team should define intended purpose before architecture, validation, and marketing claims solidify.

## **15.2 United Kingdom**

### **Medical-device position**

MHRA guidance indicates that software and apps intended for a medical purpose may qualify as medical devices \[40\]. A patient-specific system that assesses interaction risk, influences treatment decisions, or provides monitoring recommendations is likely to require detailed classification analysis.

**Recommended initial intended-use posture:**

SignalRx supports medication reconciliation, evidence navigation, communication, and professional review. It does not diagnose, prescribe, determine causality, or independently direct treatment changes.

This wording reduces but does not eliminate medical-device risk. Actual functionality and presentation control classification.

### **Clinical risk management**

For NHS deployment, DCB0129 applies to manufacturers of health IT systems, while deploying organizations have related responsibilities under DCB0160 \[44\]. SignalRx should begin the hazard log and safety case before pilot, not at procurement.

### **NHS assurance**

The Digital Technology Assessment Criteria framework evaluates clinical safety, data protection, technical security, interoperability, and usability or accessibility \[45\]. Even when formal assessment is partner-led, these domains should structure product evidence.

### **Data protection**

Health data is special category data under UK GDPR. A lawful basis under Article 6 and a condition under Article 9 are both required \[46\]. Likely requirements include:

• data protection impact assessment;

• explicit purpose and role mapping among controller and processor parties;

• data minimization and retention schedule;

• records of processing;

• lawful research basis and separate consent where applicable;

• access, deletion, correction, and portability processes;

• safeguards for automated decision-making and profiling where applicable.

Consent to use the app is not automatically the correct legal basis for all processing. Separate product consent, privacy notice, research consent, and care-delivery authority.

## **15.3 European Union**

The European Commission updated MDCG 2019-11 rev.1 in June 2025 for qualification and classification of software under the Medical Device Regulation and In Vitro Diagnostic Medical Device Regulation \[42\]. EU expansion requires market-specific analysis of medical-device status, conformity assessment, quality management, post-market surveillance, and language requirements.

AI integrated into a regulated medical device may also fall within high-risk obligations under the EU AI Act when the relevant conditions apply \[43\]. The implementation timetable and any legislative changes should be verified immediately before market entry. Do not build a fixed roadmap around assumed dates.

## **15.4 United States**

FDA's January 2026 final guidance clarifies the boundary for certain clinical decision support functions \[41\]. Some clinician-facing CDS can fall outside the device definition when statutory criteria are met, including enabling the healthcare professional to independently review the basis. Patient or caregiver functions do not receive the same broad exclusion simply because they provide information.

Commercial US strategy requires assessment of:

• whether the function is device software;

• intended user and claims;

• whether a clinician can independently review the basis;

• validation and quality-system obligations;

• state professional-practice rules;

• HIPAA roles for enterprise deployments;

• consumer health privacy laws outside HIPAA.

The FTC Health Breach Notification Rule applies to many health apps and similar technologies not covered by HIPAA, with notification obligations for breaches of unsecured identifiable health information \[47\].

## **15.5 Pharmacovigilance and reporting**

The MHRA Yellow Card system accepts suspected adverse reactions from patients, caregivers, and professionals, and only suspicion is required \[15\]. SignalRx may prepare a report, improve completeness, and direct a user to the official pathway. Direct electronic submission should not be claimed until an authorized integration, reporting responsibility, validation, and follow-up process are established.

FAERS and EudraVigilance data are designed for signal detection, not incidence estimation or causal proof. The openFDA API warns that reports can be duplicated, incomplete, unverified, and cannot establish causation or event rates \[17\].

## **15.6 Legal and commercial controls**

• Do not scrape or redistribute licensed interaction content.

• Maintain a data and content licence register.

• Define liability and clinical-review responsibility in partner contracts.

• Avoid pharmaceutical sponsorship that influences risk ranking or patient presentation.

• Establish publication and research governance for aggregated signals.

• Use a medical, regulatory, privacy, and product-claims review before every material launch.

• Obtain appropriate insurance as claims and deployment expand.

# **16\. Technical Architecture**

## **16.1 Recommended hackathon stack**

| **Component** | **Recommendation**                                                          | **Rationale**                                                                       |
| ------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Frontend      | Next.js, TypeScript, accessible component library                           | Fast iteration, server routes, strong Vercel deployment.                            |
| Hosting       | Vercel                                                                      | Sponsor alignment and rapid preview deployments.                                    |
| Database      | Supabase Postgres                                                           | Relational integrity, row-level security, authentication, storage, and rapid setup. |
| LLM           | Claude via Anthropic API                                                    | Strong document and structured-output capability; hackathon sponsor fit.            |
| Files         | Supabase Storage or short-lived object storage                              | Source documents with explicit retention and synthetic-only demo.                   |
| Rule engine   | Typed TypeScript or Python service with versioned JSON rules                | Deterministic, testable, and easy to audit.                                         |
| Retrieval     | Postgres full-text plus pgvector only where semantic retrieval is justified | Avoid unnecessary vector infrastructure for a small governed corpus.                |
| Graph view    | React Flow or Cytoscape.js                                                  | Visualize active concern and provenance, not the entire knowledge graph.            |
| Observability | Structured logs, error tracking, request IDs                                | Demonstrate auditability.                                                           |
| Evaluation    | Fixed synthetic case set and automated assertions                           | Prevent demo regressions and show safety discipline.                                |

## **16.2 Production architecture recommendation**

### **Services**

• Identity, organization, roles, and consent service.

• Medication terminology and normalization service.

• Medication-state and reconciliation service.

• Deterministic safety and knowledge service.

• Evidence retrieval and explanation service.

• Review workflow and plan service.

• Monitoring and adverse-event service.

• Audit and provenance service.

• Analytics and research boundary.

### **Data stores**

• Transactional PostgreSQL for patient, workflow, and audit data.

• Object storage for source documents, with retention and encryption.

• Search index for evidence retrieval.

• Analytics warehouse with de-identification and governance.

• Optional graph database for research and mechanism traversal after demonstrated need.

### **Security architecture**

• Separate production, staging, research, and development environments.

• No production patient data in model evaluation or development by default.

• Tenant isolation and row-level access policies.

• Customer-managed or dedicated encryption options for enterprise.

• Secrets in managed vault, not application configuration.

• Immutable audit stream for clinical and administrative events.

• Vendor risk review for LLM, hosting, analytics, and content providers.

## **16.3 Data standards**

### **United Kingdom**

Use NHS dm+d as the standard terminology for medicines and devices exchanged in NHS systems \[21\]. Map to SNOMED CT identifiers and preserve local product details.

### **United States**

Use RxNorm for normalized drug identity and National Drug Code mappings where applicable. Do not rely on the discontinued RxNav interaction function \[20\].

### **Interoperability**

FHIR MedicationRequest represents an order; MedicationStatement represents a report that a person is taking a medicine; MedicationDispense and MedicationAdministration represent different events \[53\]. SignalRx should preserve those distinctions instead of creating a single undifferentiated medication record.

Relevant resources include:

• MedicationRequest

• MedicationStatement

• MedicationDispense

• MedicationAdministration

• Medication

• Condition

• AllergyIntolerance

• Observation

• AdverseEvent

• Provenance

• Consent

• QuestionnaireResponse

## **16.4 Public and licensed data sources**

| **Source**     | **Potential role**                                                    | **Important constraint**                                                                       |
| -------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| DailyMed       | Current US labeling and structured product labels \[19\].             | Labels are not a normalized interaction decision service; editorial extraction is substantial. |
| openFDA FAERS  | Research signal exploration and demo data \[17\].                     | Reporting bias, duplicates, missing data, no denominator, no causal inference.                 |
| DrugBank       | Interactions, mechanisms, management, targets, and references \[25\]. | Commercial licence and redistribution restrictions \[26\].                                     |
| RxNorm         | US normalized clinical drug identity \[20\].                          | Interaction features discontinued.                                                             |
| NHS dm+d       | UK medication and device terminology \[21\].                          | Requires correct implementation and release management.                                        |
| PubChem        | Structures, identifiers, and programmatic compound data \[22\].       | Rate limits and data-source heterogeneity.                                                     |
| ChEMBL         | Curated bioactivity and target data \[23\].                           | Research interpretation and licence obligations.                                               |
| Open Targets   | Target-disease evidence and research graph \[24\].                    | Not a clinical interaction authority.                                                          |
| NCCIH          | Consumer-readable herb and supplement evidence \[48\].                | Coverage and product-specific certainty are limited.                                           |
| EudraVigilance | EU suspected-adverse-reaction signal source \[18\].                   | Access, coding, governance, and causal limitations.                                            |

## **16.5 RAG design**

RAG should operate over a **small, governed corpus**, not the open web at answer time.

**1\.** Normalize the medication and concern.

**2\.** Retrieve exact knowledge items by identifiers and rule match.

**3\.** Retrieve supporting label sections and approved references.

**4\.** Construct a context package with explicit allowed claims.

**5\.** Generate explanation.

**6\.** Verify that each claim maps to a supplied field or sentence.

**7\.** Store evidence IDs and model version.

Semantic embeddings can help retrieve supporting text, but exact terminology, structured metadata, and versioned rules should dominate clinical matching.

## **16.6 API concept**

### POST /v1/medication-states/verify

Input: source records and user confirmations.

Output: versioned medication state with normalized identifiers, confidence, source provenance, and unresolved items.

### POST /v1/medication-states/compare

Input: two verified states.

Output: structured starts, stops, dose, route, schedule, and formulation changes.

### POST /v1/safety/review

Input: verified state, selected patient context, and proposed change.

Output: deterministic concerns, evidence IDs, severity, confidence, missing context, and routing status.

### POST /v1/explanations

Input: evidence package and audience profile.

Output: source-grounded explanation and claim-to-source map.

### POST /v1/adverse-events/draft

Input: structured medication and symptom timeline.

Output: reviewable suspected-reaction summary with missing-field prompts.

## **16.7 Build-versus-buy decisions**

| **Capability**                  | **Decision**                        | **Reason**                                                                            |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| Foundation model                | Buy                                 | No advantage in training; focus on orchestration and evaluation.                      |
| Clinical interaction content    | License or partner                  | Editorial authority, update burden, and liability make greenfield build unattractive. |
| Medication terminology          | Use standards and official services | Identity is infrastructure.                                                           |
| Reconciliation workflow         | Build                               | Core differentiated product.                                                          |
| Temporal medication graph       | Build                               | Core data asset and product logic.                                                    |
| Patient explanation layer       | Build on LLM with controls          | Differentiated experience and evaluation.                                             |
| Pharmacovigilance case workflow | Build later with partner            | Strategic but requires domain validation.                                             |
| Molecular modelling             | Integrate research tools            | Not a core clinical capability.                                                       |

# **17\. Pharmacovigilance Strategy**

## **17.1 Strategic role**

Pharmacovigilance can become a major long-term asset, but it is not the MVP and should not be marketed as a crowd-sourced truth engine. Patient reports can identify important concerns, yet spontaneous reporting is noisy and cannot determine incidence or causality \[17\]. The opportunity is to improve **case structure, follow-up, temporal quality, and expert review**.

## **17.2 Case data model**

A suspected-adverse-reaction case should include:

• reporter role and contact permissions;

• patient demographics appropriate to the reporting jurisdiction;

• suspected product and product role;

• active ingredient, brand, batch if available, dose, route, schedule;

• start and stop dates, with uncertainty;

• concomitant products and exposure overlap;

• event term, narrative, onset, seriousness, outcome, and medical attention;

• dose change, dechallenge, and rechallenge;

• relevant conditions, laboratory data, and alternative explanations;

• source documents and reporter wording;

• review status, coding, duplicates, and follow-up;

• consent, jurisdiction, purpose, retention, and data-sharing status.

## **17.3 User-generated evidence design**

Do not use a public yes-or-no vote that "this combination caused an adverse effect." Use a structured experience report and then classify evidence quality.

### **Proposed evidence-quality dimensions**

| **Dimension**              | **Example scale**                                                            |
| -------------------------- | ---------------------------------------------------------------------------- |
| Product identity           | Confirmed package and ingredient; partial; unknown.                          |
| Exposure timing            | Exact overlap; approximate overlap; overlap unknown.                         |
| Dose and route             | Complete; partial; missing.                                                  |
| Event timing               | Exact onset; approximate; unknown.                                           |
| Dechallenge or rechallenge | Positive; negative; not attempted; unknown.                                  |
| Clinical confirmation      | Documented diagnosis or test; clinician discussion; self-reported only.      |
| Confounding                | Few plausible alternatives; multiple alternatives; insufficient information. |
| Duplicate likelihood       | Low; possible; probable duplicate.                                           |
| Reporter follow-up         | Available; limited; unavailable.                                             |

The score should measure case completeness and analytic utility, not causal probability.

## **17.4 Signal detection**

Potential methods include disproportionality analysis, observed-to-expected methods, Bayesian shrinkage, temporal pattern discovery, high-order interaction analysis, and knowledge-graph models. Every method must account for confounding, reporting bias, exposure overlap, duplicate reports, and multiple testing.

**\[D\] Begin with transparent descriptive statistics and expert review.** Do not lead with a graph neural network. A complex model can produce persuasive but poorly calibrated signals if labels and denominators are weak. Recent reviews find improved benchmark performance from graph and multimodal methods but limited external and prospective validation \[11\].

## **17.5 Regulatory reporting workflow**

### **UK**

• Prepare a user-reviewed report aligned to Yellow Card information needs.

• Link to the official reporting channel.

• Record whether the user reports and whether follow-up is permitted.

• Do not represent preparation as official submission.

• Explore integration only with MHRA engagement and validated responsibility.

### **US and EU**

• Separate consumer support from sponsor regulatory obligations.

• Work with safety experts on ICSR standards, MedDRA, WHODrug, E2B(R3), seriousness, expectedness, and follow-up.

• Budget for licensed terminology and validated safety systems.

## **17.6 Business opportunity**

The commercial product is not "sell raw patient reports." The credible offerings are:

• higher-completeness patient case intake;

• digital follow-up and missing-field resolution;

• structured timelines and source-preserving narratives;

• consented registry operations;

• signal-review workbench linking clinical, literature, and mechanistic evidence;

• post-authorization safety study support;

• patient-facing safety communication and monitoring.

This business should be contractually and technically separated from the patient product. Patients must understand how data is used and whether a pharmaceutical company is involved.

# **18\. Research Module and Boltz-2**

## **18.1 Correct role of structural modelling**

Boltz-2 jointly models biomolecular complex structure and binding affinity, with official outputs including a binder probability and affinity estimate \[49\]. It can support research hypotheses about whether a compound may bind a nominated protein. It cannot establish that two drugs clinically interact, bind simultaneously, reach relevant tissue concentrations, or cause a reported event.

## **18.2 Hypothesis-generation pipeline**

**1\.** Identify a statistically or clinically unusual drug combination and event.

**2\.** Confirm exposure overlap and case quality.

**3\.** Search existing interaction content, labels, literature, pathways, enzymes, transporters, and known targets.

**4\.** Nominate one or more plausible mediators.

**5\.** Retrieve compound structures and appropriate protein structures.

**6\.** Run each compound separately against the candidate protein under a predefined protocol.

**7\.** Compare predicted binding modes and affinities with known ligands, assays, and concentrations.

**8\.** Review by computational chemistry and clinical pharmacology experts.

**9\.** Design experimental or observational validation.

**10\.** Keep the result in the research environment until evidence and governance justify promotion.

## **18.3 What a molecular result can and cannot say**

| **Supported research statement**                                                                | **Unsupported statement**                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| "Both compounds are predicted to bind the nominated protein under this computational protocol." | "The two medicines interact in patients."         |
| "The predicted pose suggests a possible shared binding region."                                 | "They compete at the same site in vivo."          |
| "The result is consistent with a candidate mechanism worth testing."                            | "The adverse event was caused by this mechanism." |
| "Affinity estimates rank hypotheses for follow-up."                                             | "This combination is unsafe."                     |

## **18.4 Hackathon treatment**

Use a precomputed visual only if it strengthens the story without distracting from the core product. Label it:

**Research hypothesis. Not used in the medication safety result. Requires experimental and clinical validation.**

Do not run live inference on stage. The risk of latency, failure, and overinterpretation exceeds the demo value.

## **18.5 Research governance**

• Separate user permissions, data environment, team, and outputs.

• Pre-register analytic protocols for high-stakes studies.

• Maintain reproducible model versions, inputs, seeds, and parameters.

• Use negative controls and retrospective known-interaction benchmarks.

• Involve domain experts before external communication.

• Publish null results and uncertainty where feasible.

• Never allow a research edge to become a clinical rule without formal evidence review.

# **19\. Business Model**

## **19.1 Business-model conclusion**

**\[D\] B2B2C first, B2C second, research and pharma later.**

SignalRx needs a workflow owner who benefits economically from a completed medication-change episode. The patient should experience the product directly, but the initial payer should usually be a pharmacy, digital-health company, care-transition provider, health system, or insurer.

## **19.2 Economic value drivers**

• Reduced time spent reconstructing medication lists.

• Fewer avoidable clarification calls and repeated histories.

• Higher capacity for medication-review and follow-up services.

• Better documentation and auditability.

• Reduced preventable discrepancies and delayed recognition of adverse effects.

• Better patient experience, trust, and retention.

• Higher-completeness pharmacovigilance cases.

• New API or infrastructure revenue from medication context.

Avoid claiming reduced hospitalizations or adverse events until prospective evidence supports it.

## **19.3 B2C offerings**

### **Individual premium subscription**

| **Question**           | **Answer**                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| Buyer and user         | Patient with chronic illness or complex regimen.                                          |
| Benefit                | Medication passport, change explanations, monitoring, document organization, and sharing. |
| Existing alternatives  | Free checkers, portals, reminder apps, pharmacist, general AI.                            |
| Pain today             | Fragmented information and episodic uncertainty.                                          |
| Pricing hypothesis     | **\[A\] £8 to £15 per month**, with annual discount.                                      |
| Sales motion           | App-store, search, chronic-disease communities, clinician referral.                       |
| Procurement complexity | Low, but trust, acquisition cost, retention, and liability are difficult.                 |
| Strategic role         | Engagement and data continuity, not the first standalone business.                        |

### **Family and caregiver plan**

| **Question**           | **Answer**                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Buyer                  | Adult child, partner, or family caregiver.                                                          |
| User                   | Patient plus one or more delegated caregivers.                                                      |
| Benefit                | Shared medication passport, role-based updates, handoffs, change alerts, and appointment summaries. |
| Existing alternatives  | Shared notes, messaging, reminder apps, care-management platforms.                                  |
| Pricing hypothesis     | **\[A\] £15 to £25 per month** for a household.                                                     |
| Sales motion           | Caregiver organizations, discharge programs, pharmacies, search.                                    |
| Procurement complexity | Low direct-to-consumer; high emotional trust and consent requirements.                              |
| Strategic role         | More credible willingness to pay than a checker because coordination is ongoing.                    |

### **Chronic-disease support modules**

Do not create disease-specific clinical advice without specialist governance. Modules can package monitoring workflows, appointment preparation, and medication-change education for a partner's clinical program.

### **Medication passport and travel mode**

A portable, multilingual, offline list with ingredient names, dose, route, allergies, prescriber contacts, and emergency sharing can be valuable. It should not imply that local availability, legal status, or substitution is guaranteed.

### **Wearables and connected devices**

Use only when a specific signal has validated clinical relevance and timing. More data is not automatically more safety. Consumer biometrics can generate false alarms and additional regulatory scope.

## **19.4 B2B segment: community and digital pharmacy**

| **Question**           | **Answer**                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Economic buyer         | Pharmacy owner, chain clinical director, digital pharmacy GM, innovation or services lead.                               |
| Primary users          | Pharmacists, pharmacy technicians under policy, patients, caregivers.                                                    |
| Beneficiaries          | Patient, pharmacy team, prescriber, payer.                                                                               |
| Budget owner           | Clinical services, digital product, operations, quality, or innovation.                                                  |
| Existing alternatives  | Pharmacy management system, FDB or other CDS, patient interview, phone calls, manual notes.                              |
| Pain today             | Incomplete medication context, consultation time, repeated clarification, fragmented patient follow-up.                  |
| Product                | Pre-consultation reconciliation, prioritized evidence, reviewed plan, follow-up, documentation.                          |
| Pricing hypothesis     | **\[A\] £1 to £4 per active patient per month**, or **£2 to £8 per completed change episode**, with annual minimum.      |
| Sales motion           | Paid design partner, one-region pilot, chain or platform rollout, API integration.                                       |
| Procurement complexity | Medium for independent or digital pharmacy; high for national chain.                                                     |
| Proof required         | Time saved, completion rate, pharmacist actionability, patient understanding, service revenue or retention.              |
| Strategic priority     | Highest. England had 10,407 open community pharmacies at 31 March 2025 \[52\], providing a large but fragmented channel. |

## **19.5 B2B segment: GP practices and primary-care networks**

| **Question**           | **Answer**                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| Economic buyer         | Practice group, primary-care network, integrated care board, digital-primary-care provider.                    |
| Users                  | GPs, prescribing pharmacists, nurses, medicines-optimisation teams, patients.                                  |
| Benefit                | Better medication-list verification, structured review preparation, fewer low-value alerts, patient follow-up. |
| Budget owner           | Medicines optimisation, digital transformation, quality improvement, network operations.                       |
| Existing alternatives  | EHR list, structured medication review templates, clinical pharmacist, reference databases.                    |
| Pain today             | Stale medication lists, short appointments, alert burden, outside prescribing, limited patient follow-up.      |
| Pricing hypothesis     | **\[A\] £8,000 to £30,000 annually per organization**, varying by population and integration.                  |
| Sales motion           | Clinical champion, local evaluation, network or ICB partnership, EHR integration.                              |
| Procurement complexity | High. Information governance, DCB0129/0160, interoperability, evidence, and change management.                 |
| Proof required         | Review time, discrepancy yield, patient understanding, actionability, workload impact.                         |

## **19.6 B2B segment: hospitals and health systems**

| **Question**           | **Answer**                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Economic buyer         | Chief pharmacist, digital or transformation executive, patient-safety lead, care-transition program.                                  |
| Users                  | Pharmacy, medical, nursing, discharge, virtual ward, and patient teams.                                                               |
| Benefit                | Admission or discharge reconciliation, clear medication diff, downstream handoff, high-risk follow-up.                                |
| Budget owner           | Pharmacy, patient safety, digital, quality, virtual care, or transformation.                                                          |
| Existing alternatives  | EHR reconciliation, hospital pharmacy team, discharge documents, outsourced follow-up.                                                |
| Pain today             | Conflicting sources, late changes, variable discharge quality, weak visibility after discharge.                                       |
| Pricing hypothesis     | **\[A\] £40,000 to £150,000 per site annually**, plus implementation where required.                                                  |
| Sales motion           | Focused service-line pilot, clinical and economic evaluation, enterprise expansion.                                                   |
| Procurement complexity | Very high. Integration, assurance, cybersecurity, clinical safety, procurement, support, and evidence.                                |
| Proof required         | Reconciliation time, discrepancy resolution, post-discharge contact burden, incidents, readmission signal with adequate study design. |

## **19.7 B2B segment: telemedicine and digital health**

| **Question**           | **Answer**                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| Economic buyer         | Product, clinical, or operations leader.                                                              |
| Users                  | Remote clinicians, care navigators, patients.                                                         |
| Benefit                | Medication context before virtual consultation, consistent safety review, follow-up, API integration. |
| Existing alternatives  | Intake forms, EHR list, general AI, manual review, licensed interaction API.                          |
| Pain today             | Remote clinicians cannot inspect products physically; data is self-reported and incomplete.           |
| Pricing hypothesis     | **\[A\] Per encounter, per active patient, or API usage with annual minimum.**                        |
| Sales motion           | API pilot with one clinical workflow, then platform contract.                                         |
| Procurement complexity | Medium to high, depending on clinical claims and data integration.                                    |
| Strategic priority     | High because integration cycles can be shorter and digital distribution exists.                       |

## **19.8 B2B segment: pharmacies as benefits and employer channel**

| **Question**           | **Answer**                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| Economic buyer         | Employer, benefits platform, occupational health provider, or insurer.                                |
| Users                  | Covered members, pharmacists, care managers.                                                          |
| Benefit                | Medication review access and high-risk change monitoring.                                             |
| Existing alternatives  | Pharmacy benefit manager programs, nurse lines, disease management.                                   |
| Pain today             | Low engagement, delayed claims data, fragmented medication support.                                   |
| Pricing hypothesis     | **\[A\] £0.50 to £3 per eligible member per month**, or outcome-linked episode payment.               |
| Sales motion           | Channel partnership with pharmacy or digital health; avoid direct enterprise employer sale initially. |
| Procurement complexity | High; benefits cycles, privacy, evidence, and outcome attribution.                                    |

## **19.9 B2B segment: insurers and government**

| **Question**           | **Answer**                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Economic buyer         | Health insurer, integrated care system, public commissioner.                                      |
| Users                  | Members, care managers, pharmacists, network clinicians.                                          |
| Benefit                | Targeted medication safety and review for high-risk cohorts.                                      |
| Existing alternatives  | Claims analytics, medication therapy management, case management, provider incentives.            |
| Pain today             | Delayed, incomplete context and low member engagement.                                            |
| Pricing hypothesis     | **\[A\] Per-member-per-month or per completed review, with outcome incentives after validation.** |
| Sales motion           | Evidence-backed pilot in a defined population.                                                    |
| Procurement complexity | Very high and slow.                                                                               |
| Proof required         | Engagement, intervention rate, utilization and cost outcomes using robust comparison.             |

## **19.10 B2B segment: clinical research organizations and pharma**

| **Question**           | **Answer**                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Economic buyer         | Head of pharmacovigilance, patient safety, real-world evidence, clinical operations, or digital innovation. |
| Users                  | Case processors, safety scientists, medical reviewers, epidemiologists, study teams.                        |
| Benefit                | Higher-completeness patient reports, follow-up, longitudinal context, signal-review evidence.               |
| Existing alternatives  | Safety databases, call centers, patient support programs, ePRO, EudraVigilance, FAERS, literature tools.    |
| Pain today             | Missing dates and concomitant products, follow-up burden, narrative inconsistency, patient attrition.       |
| Pricing hypothesis     | **\[A\] £75,000 to £300,000 annually** for validated workflow; larger studies priced separately.            |
| Sales motion           | Paid proof of concept in a defined program, validation, quality and compliance review, expansion.           |
| Procurement complexity | Very high: validation, quality, security, contracts, adverse-event obligations, global requirements.        |
| Strategic priority     | Later. Do not sell aggregate signals until patient scale and governance are credible.                       |

## **19.11 B2B segment: infrastructure and API**

| **Question**           | **Answer**                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Economic buyer         | Digital health, EHR, pharmacy software, health AI, virtual care, or care-management platform.                       |
| User                   | Developers and embedded clinical users.                                                                             |
| Benefit                | Medication-state verification, change diff, evidence cards, and patient explanation without building full workflow. |
| Existing alternatives  | DrugBank, FDB, Medi-Span, terminology APIs, internal rules.                                                         |
| Pain today             | Existing APIs know drugs but may not manage longitudinal patient context and review state.                          |
| Pricing hypothesis     | **\[A\] Usage-based plus enterprise platform minimum**, constrained by upstream content licence.                    |
| Sales motion           | Developer sandbox, reference integration, enterprise contract.                                                      |
| Procurement complexity | Medium to high.                                                                                                     |
| Strategic role         | Long-term scale vector, but only after the first-party workflow proves the data model.                              |

## **19.12 Unit economics and gross margin**

Major cost drivers include licensed drug content, clinical editorial operations, LLM inference, customer integration, security, clinical safety, support, and regulatory quality systems. LLM inference is unlikely to be the dominant cost in enterprise medication safety. Content rights and implementation can dominate.

**\[A\] Gross-margin target:** above 70% for standardized SaaS and API offerings after content royalties; lower during early services-heavy deployments. Do not price per API call before understanding upstream content terms and review workload.

## **19.13 Revenue sequencing**

**1\.** Paid design partnerships and implementation fees.

**2\.** Per-episode or per-active-patient pharmacy and digital-health contracts.

**3\.** Enterprise site licences and API minimums.

**4\.** Payer outcomes contracts after evidence.

**5\.** Pharmacovigilance workflow and research contracts after governance and scale.

**6\.** Consumer family plans as a complementary revenue stream.

# **20\. Network Effects and Defensibility**

## **20.1 Potential network effects**

### **Longitudinal context effect**

As a person uses SignalRx across more medication changes, the verified history improves reconciliation, reduces repeated entry, and makes future change detection more accurate. This is a direct user-data advantage, not a social network effect.

### **Professional resolution effect**

Reviewed concerns can improve local ranking, explanation templates, and workflow rules. A clinician's decision should not automatically become universal clinical truth. It is contextual evidence that requires governance before reuse.

### **Pharmacovigilance data effect**

More high-quality, consented reports can improve detection of unusual combinations, populations, timing patterns, and follow-up questions. Raw volume alone is not a moat. Data quality, exposure denominator, longitudinal completeness, and expert adjudication matter more.

### **Content operations effect**

Every evidence update, mapping, explanation test, and resolved ambiguity can improve the operational system. This compounds through process, not merely data.

### **Distribution effect**

A patient-controlled medication passport becomes more valuable when accepted by pharmacies, digital health services, clinicians, and care-transition teams. Cross-organization interoperability can create switching cost and trust.

## **20.2 Defensible moats**

• Longitudinal medication-state graph linking intent, actual use, changes, and outcomes.

• High-quality reconciliation and change-resolution dataset.

• Clinical safety case, content governance, validation, and trusted brand.

• Workflow integrations and partner distribution.

• Proprietary evaluation suites and failure taxonomies.

• Evidence update and impact-management infrastructure.

• Market-specific terminology and regulatory deployment capability.

• Patient consent and caregiver coordination network.

## **20.3 What is not a moat**

• Using Claude or another frontier model.

• A knowledge-graph visualization.

• RAG over public labels.

• Pairwise interaction checking.

• Plain-language summaries.

• A medication-reminder feature.

• A Boltz-2 demo.

• Public FAERS data.

• A large count of low-quality self-reports.

## **20.4 Data-governance constraints on network effects**

Data cannot be reused merely because it improves the model. Each use needs a lawful basis, purpose limitation, transparency, security, and appropriate consent or other authority. Clinical-care data, product-improvement data, and research data should have separate policies and technical boundaries.

The patient should be able to use the core care product without agreeing to commercial research reuse. Opt-out must not silently degrade safety.

# **21\. Go-to-Market**

## **21.1 Beachhead recommendation**

**Target:** a digital or community pharmacy partner running new-medicine, discharge, repeat-prescription, or complex-medication services.

**Use case:** pre-consultation medication verification plus post-change follow-up.

**Reason:** the pharmacy has medication expertise, sees dispensing data, interacts with the patient, and can resolve or escalate concerns. Digital pharmacies also offer faster product integration and repeated engagement.

## **21.2 Positioning**

### **For patients**

"Know exactly what changed, why it matters, and what to ask before you leave."

### **For pharmacies**

"Turn patient-reported medication information into a verified, prioritized review before the consultation starts."

### **For health systems**

"Close the medication-information gap between discharge and home."

### **For digital-health platforms**

"Add a governed medication-change workflow, not another generic interaction endpoint."

## **21.3 Design-partner offer**

• One defined medication-change pathway.

• Synthetic and retrospective validation first.

• Limited live pilot with professional review.

• Co-designed workflow and local safety policy.

• Baseline and post-implementation time study.

• Weekly clinical audit during pilot.

• Transparent limitation and incident process.

• Discounted pilot fee credited toward commercial agreement.

Do not give the entire product away for an unbounded "innovation pilot." Define data access, evaluation, integration, support, publication, and commercial conversion in the pilot agreement.

## **21.4 Patient acquisition**

Initial patient acquisition should be embedded in:

• pharmacy consultation invitation;

• discharge workflow;

• digital-health onboarding;

• medication review campaign;

• caregiver invitation;

• clinician referral.

Direct paid consumer acquisition should be tested only after retention and willingness to pay are demonstrated. Search traffic for drug interactions is likely high but converts into episodic, low-trust usage with strong free alternatives.

## **21.5 Clinician adoption**

• Start from a specific time-saving task.

• Pre-populate the review, do not ask the clinician to build the list again.

• Present changed and unresolved items first.

• Integrate or deep-link from the system already in use.

• Make the evidence basis independently reviewable.

• Measure burden and suppress low-value output.

• Provide clinical champions with audit data and examples.

## **21.6 Pharmacy sales motion**

**1\.** Recruit one clinical and one operational champion.

**2\.** Observe workflow and quantify baseline time and discrepancies.

**3\.** Run synthetic or retrospective study.

**4\.** Deploy to a narrow service and limited sites.

**5\.** Demonstrate review completion, time impact, actionability, and patient understanding.

**6\.** Expand by site, service line, and eligible patient cohort.

**7\.** Integrate deeper only after product-market fit is evident.

## **21.7 Health-system sales motion**

• Lead with care transitions or a high-risk service line, not an enterprise medication graph transformation.

• Align pharmacy, digital, clinical safety, data protection, and operational ownership early.

• Offer clear interface boundaries and implementation plan.

• Use a prospective evaluation with predefined outcomes.

• Budget for procurement and assurance rather than assuming clinical enthusiasm is sufficient.

## **21.8 Pharma go-to-market**

Enter only after the product has demonstrated case completeness and patient trust. Start with patient support or registry workflow, not signal claims. Keep safety reporting obligations, sponsorship, data access, and publication rights explicit.

## **21.9 Partnership strategy**

### **Content partners**

Licensed drug-information provider, local formulary or clinical-content partner, and supplement evidence provider.

### **Distribution partners**

Pharmacy chain, digital pharmacy, chronic-disease platform, discharge service, or virtual-ward provider.

### **Clinical and research partners**

Academic clinical pharmacology group, pharmacy school, pharmacovigilance center, patient organization, and computational biology lab.

### **Technology partners**

Anthropic, Vercel, Supabase, terminology services, and standards vendors. Technology sponsorship should not determine clinical architecture.

# **22\. Metrics and Evaluation**

## **22.1 North Star and metric tree**

**North Star:** material medication changes converted into a verified, patient-understood, monitored plan within 48 hours.

### **Verification**

• Percentage of imported products confirmed.

• Time to verified medication state.

• Discrepancies per episode.

• Percentage with complete dose, route, and timing.

• Percentage of ambiguous items resolved.

### **Clinical usefulness**

• Material concerns per eligible episode.

• Reviewer actionability rate.

• Number of duplicate ingredients or discrepancies resolved.

• Percentage of concerns with documented rationale and owner.

• Review time compared with baseline.

### **Patient understanding**

• Teach-back accuracy.

• Percentage who can identify what changed.

• Percentage who know whom to contact and what to monitor.

• Anxiety and trust measures.

• Accessibility completion rates.

### **Follow-up**

• Plan implementation confirmation.

• Symptom follow-up completion.

• Time from reported symptom to review.

• Percentage of unresolved questions closed.

• Suspected-reaction report completeness.

### **Safety guardrails**

• Patients reporting unsupervised starts, stops, or dose changes after product use.

• False reassurance rate in comprehension tests.

• Unsupported clinical assertion rate.

• Missed high-severity concern rate.

• Incorrect identity and dose rate.

• High-risk escalation failure.

• Security and privacy incidents.

### **Commercial**

• Pilot-to-paid conversion.

• Time to deployment.

• Weekly active professional users.

• Eligible patient activation and completion.

• Contract value and gross margin after content cost.

• Renewal and expansion.

• Customer support burden.

## **22.2 Clinical evaluation sequence**

### **Phase A: Technical validation**

Use synthetic and de-identified reference cases. Compare extraction, normalization, change detection, and rule output with expert gold standards.

### **Phase B: Silent prospective study**

Run the system without influencing care. Compare detected discrepancies and concerns with normal workflow and expert review.

### **Phase C: Usability and human-factors study**

Assess patient comprehension, clinician review, time, error recovery, accessibility, and automation bias.

### **Phase D: Controlled workflow pilot**

Measure operational and process outcomes with predefined safety monitoring.

### **Phase E: Outcome study**

Only after process efficacy is established, evaluate healthcare utilization, adverse events, adherence, or cost using an appropriate comparator and adequate sample size.

## **22.3 Model and content dashboards**

• Extraction accuracy by source type.

• Normalization ambiguity by product and market.

• Rule distribution and review outcomes.

• Explanation unsupported-claim rate.

• Content age and update backlog.

• Override and rationale patterns.

• Performance by language and accessibility mode.

• Incident and near-miss trends.

# **23\. Risks**

## **23.1 Clinical risks**

**Risk:** missed interaction or duplicate product.

**Mitigation:** authoritative content, confirmed medication state, context requirements, clinical review, and clear coverage statement.

**Risk:** unnecessary alarm and treatment disruption.

**Mitigation:** change-focused ranking, separate severity and confidence, neutral wording, reviewed actions, and behavior monitoring.

**Risk:** interaction checker becomes a substitute for full medication review.

**Mitigation:** intended-use boundaries, unresolved-context view, and direct review pathway.

## **23.2 Legal and regulatory risks**

**Risk:** functionality drifts into medical-device scope without evidence and quality systems.

**Mitigation:** intended-purpose governance, claims review, regulatory counsel, change control, and staged markets.

**Risk:** content licence prevents product use or destroys margin.

**Mitigation:** diligence before build, multiple-source strategy, pricing tied to content cost, and contractual rights for generated explanations and customer display.

**Risk:** pharmacovigilance obligations are triggered by reports received on behalf of a sponsor.

**Mitigation:** explicit role, reporting agreement, validated workflow, trained personnel, and auditable timelines.

## **23.3 Business risks**

**Risk:** consumers will not pay.

**Mitigation:** B2B2C distribution, family coordination value, and rigorous pricing tests.

**Risk:** enterprise sales cycles consume runway.

**Mitigation:** digital-health or digital-pharmacy beachhead, limited integration, paid design partnerships, and clear kill criteria.

**Risk:** incumbents add reconciliation and patient explanations.

**Mitigation:** speed, focused workflow, patient-owned longitudinal graph, partner distribution, and evidence of superior resolution.

**Risk:** the buyer cannot capture savings.

**Mitigation:** choose workflow where time, service capacity, retention, or quality is owned by the buyer.

## **23.4 Technical risks**

**Risk:** unstructured extraction is brittle.

**Mitigation:** source-specific templates, confidence, deterministic validation, human confirmation, and fallback manual entry.

**Risk:** terminology mapping across markets is complex.

**Mitigation:** one market and bounded formulary first; preserve original text and mappings; specialist terminology engineering.

**Risk:** graph complexity exceeds product value.

**Mitigation:** relational implementation first; only add graph database for measured query needs.

**Risk:** evidence changes faster than product updates.

**Mitigation:** source contracts, update SLA, versioning, impact analysis, and proactive notification.

## **23.5 Ethical risks**

**Risk:** commercialization of patient-reported events undermines trust.

**Mitigation:** separate consent, transparent funding, no sale of identifiable data, independent governance, patient representation, and publication standards.

**Risk:** product performs worse for underrepresented populations or languages.

**Mitigation:** subgroup testing, accessible design, localized content, uncertainty, and monitored escalation.

**Risk:** pharma customers influence risk presentation.

**Mitigation:** editorial independence, conflict disclosure, fixed governance, and no sponsored ranking.

## **23.6 Adoption and trust risks**

• Patients may not know exact products or dates.

• Clinicians may view the output as another untrusted alert.

• Caregivers may overstep consent boundaries.

• Professionals may fear liability from reviewing patient-generated information.

• Organizations may resist cross-system data sharing.

• Users may overvalue a sophisticated graph or molecular image.

The product must earn trust through source transparency, bounded claims, reviewer ownership, and measured workflow value.

## **23.7 Risk matrix**

| **Risk**                             | **Probability** | **Impact** | **Priority response**                                |
| ------------------------------------ | --------------- | ---------- | ---------------------------------------------------- |
| Content licensing failure            | Medium          | Critical   | Resolve before commercial engineering.               |
| Incorrect normalization              | Medium          | Critical   | Validation, confirmation, constrained market.        |
| False reassurance                    | Medium          | Critical   | Language, UI, coverage, study behavior.              |
| Low clinician adoption               | High            | High       | Workflow research and integration.                   |
| Low consumer retention               | High            | Medium     | B2B2C and caregiver value.                           |
| Regulatory classification escalation | Medium          | High       | Intended-purpose and quality strategy.               |
| Enterprise sales delay               | High            | High       | Digital partner beachhead and paid pilots.           |
| Weak pharmacovigilance data quality  | High            | High       | Structured intake, timing, follow-up, expert review. |
| Incumbent bundling                   | High            | High       | Own data and workflow, not content search.           |
| Data breach                          | Low to medium   | Critical   | Security program and minimal data.                   |
| Molecular overclaim                  | Medium          | High       | Research separation and communication controls.      |

# **24\. Future Vision**

## **24.1 Ten-year destination**

SignalRx should not aspire to become another destination website for interaction lookup. The stronger long-term position is an **infrastructure and workflow company that maintains medication context**: what a person is actually taking, why, at what dose and schedule, what changed, what evidence applies, and what happened afterward.

The platform could become the medication-safety control plane used across patient, pharmacy, prescribing, care-transition, research, and pharmacovigilance workflows. Its core asset would not be a static list of drug pairs. It would be an auditable, temporally aware representation of medication exposure and evidence, connected to the human workflow in which action is taken.

## **24.2 Evolution of the company**

| **Period**   | **Company identity**             | **Product capability**                                                                                                     | **Commercial implication**                                                                        |
| ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026 to 2027 | Medication-change companion      | Verify the regimen, compare before and after states, explain material concerns, and support follow-up.                     | Paid design partnerships with digital pharmacies, medication services, and care-transition teams. |
| 2027 to 2029 | Medication-context platform      | Patient-controlled medication passport, professional review workspace, integrations, evidence versioning, and monitoring.  | Per-member and enterprise software revenue; partner-distributed patient surface.                  |
| 2029 to 2031 | Medication intelligence API      | Normalization, change detection, contextual review, explanation, and workflow events embedded in third-party products.     | Usage-based infrastructure revenue and high switching costs.                                      |
| 2031 to 2033 | Safety learning network          | Structured outcome capture, expert resolution, signal triage, and research-grade datasets under explicit governance.       | Pharmacovigilance, research, and evidence-generation contracts.                                   |
| 2033 to 2036 | Medication safety infrastructure | Cross-setting medication context, evidence operations, quality measurement, regulatory workflows, and research hypotheses. | Multi-sided platform with infrastructure, workflow, and research revenue.                         |

## **24.3 "GitHub of medication knowledge" is an incomplete analogy**

A GitHub-like vision is attractive because it suggests transparent provenance, versioning, contribution, review, and collaboration. Those qualities are useful. The analogy becomes dangerous when it implies that medication knowledge can be crowdsourced and merged like code.

Clinical evidence requires controlled vocabularies, source rights, editorial standards, expert adjudication, version governance, conflict disclosure, and jurisdiction-specific interpretation. User reports can create hypotheses, but cannot be treated as accepted evidence through voting. A credible platform would borrow GitHub's provenance and review mechanics while rejecting open, ungoverned truth creation.

## **24.4 "Stripe for medication intelligence" is closer, but still insufficient**

Stripe reduced integration complexity around a difficult, regulated domain. SignalRx could similarly provide a reliable interface for medication normalization, contextual safety review, explanations, and follow-up. The analogy is useful for the API strategy, but medication safety is less deterministic than payments. Evidence is incomplete, clinical context changes interpretation, and responsibility cannot be hidden behind a clean endpoint.

The better ambition is:

**The trusted context and evidence layer for medication decisions.**

## **24.5 End-state capabilities**

A successful SignalRx could support:

• A patient-owned, continuously reconciled medication state across care settings.

• A professional review workspace that reduces search and reconciliation work without replacing judgment.

• A medication-change API embedded in pharmacy, telemedicine, care-navigation, and prescribing products.

• Evidence packages that preserve source, version, jurisdiction, confidence, and applicability.

• Outcome monitoring that links changes to structured patient observations and clinical follow-up.

• Pharmacovigilance workflows that increase case completeness and temporal plausibility.

• Research tools that prioritize mechanisms and experiments without confusing predictions with clinical evidence.

• Quality measures for whether medication changes were verified, understood, and monitored.

## **24.6 What success should not become**

SignalRx should not become:

• A direct-to-consumer diagnosis or prescribing agent.

• An advertising marketplace for pharmaceutical products.

• A black-box risk score that cannot be inspected.

• A data broker selling identifiable health histories.

• A molecular-model showcase presented as clinical validation.

• A universal medication database assembled without durable content rights.

# **25\. Investment Questions, Milestones, and Kill Criteria**

## **25.1 Questions an investor should ask**

### **Problem and workflow**

**1\.** Which exact medication-change workflow is the initial product replacing or improving?

**2\.** How often does that workflow occur, and who owns the resulting cost or quality measure?

**3\.** Does the product improve an observable outcome, or only produce a more attractive explanation?

**4\.** Can users reliably establish an accurate medication list before the safety engine runs?

### **Content and defensibility**

**5\.** Which interaction, label, terminology, and supplement sources can be used commercially?

**6\.** What is the update process when an underlying source changes?

**7\.** Is the evidence package materially better than an incumbent's content, or is the differentiation in workflow and longitudinal context?

**8\.** What proprietary data is generated through normal product use, and is it ethically reusable?

### **Safety and regulation**

**9\.** What is the intended purpose in each market?

**10\.** Which outputs are informational, which influence clinical decisions, and which require human review?

**11\.** What hazards have been tested, and what is the release gate for false reassurance?

**12\.** How is clinical responsibility allocated among SignalRx, the deploying organization, and the reviewing professional?

### **Commercial model**

**13\.** Who signs the contract, which budget pays, and what measurable benefit justifies the price?

**14\.** What is the integration burden before value appears?

**15\.** Can a design partner deploy without a year-long procurement process?

**16\.** Does patient engagement improve the buyer's economics, or is it an unsupported consumer acquisition cost?

## **25.2 Seed-stage milestones**

The following are **proposed investor milestones**, not established market benchmarks.

| **Dimension**      | **Evidence required before a seed round**                                                                                                     | **Why it matters**                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Workflow pull      | At least 3 paid or contractually committed design partners in the same initial segment.                                                       | Demonstrates a repeated problem rather than bespoke consulting demand. |
| User value         | At least 70% of target medication-change cases produce a confirmed medication state and reviewable output in the pilot workflow.              | Tests whether the product can obtain usable inputs.                    |
| Professional value | Measurable reduction in review or documentation time without a material increase in unresolved alerts.                                        | Establishes economic value and avoids alert burden.                    |
| Patient value      | Demonstrated improvement in comprehension or correct recall compared with the existing handoff.                                               | Tests whether explanations change behavior or understanding.           |
| Safety             | Predefined sensitivity and false-reassurance gates on a pharmacist-curated test set, plus zero unresolved critical hazards in release review. | Creates a minimum safety case.                                         |
| Content rights     | Signed commercial rights or a validated alternative content strategy for the launch market.                                                   | Removes an existential dependency.                                     |
| Regulatory         | Written intended-purpose position and external regulatory assessment for the launch configuration.                                            | Prevents accidental product-classification drift.                      |
| Integration        | One production-grade medication data pathway, such as FHIR, pharmacy feed, or verified document workflow.                                     | Proves the product can enter the workflow.                             |
| Economics          | Credible path to greater than 70% software gross margin after licensed content, model, hosting, and clinical-operations costs.                | Tests venture scalability.                                             |

## **25.3 Kill criteria**

The company should pause, narrow, or abandon the proposed direction if any of the following remain true after focused validation:

**1\. No buyer-owned outcome:** interviews reveal interest but no budget owner can quantify time, quality, capacity, or risk value.

**2\. Unsolvable list accuracy:** medication reconciliation cannot reach acceptable accuracy without professional labor that destroys unit economics.

**3\. Content rights failure:** commercial-grade interaction content cannot be licensed or reproduced economically for the target market.

**4\. No workflow advantage:** incumbent systems can deliver the same medication-change workflow through configuration rather than a new product.

**5\. Low professional trust:** pharmacists or prescribers do not act on the outputs even when sources are transparent.

**6\. Unsafe behavior:** patient testing shows persistent self-adjustment, delayed urgent care, or false reassurance despite mitigation.

**7\. Regulatory economics fail:** the evidence and quality-system burden exceeds the value of the initial use case.

**8\. Weak longitudinal benefit:** monitoring and outcome capture do not improve decisions, retention, or reporting quality.

**9\. No scalable distribution:** acquisition depends on high-cost direct consumer marketing or one-off enterprise implementation.

**10\. Pharmacovigilance does not compound:** user reports remain too incomplete, biased, or sparse to support useful triage after structured collection.

## **25.4 Financing sequence**

| **Stage**              | **Capital should fund**                                                                                         | **Evidence expected at the end**                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Hackathon and pre-seed | Workflow discovery, prototype, source-rights analysis, clinical governance, and one bounded integration.        | Clear beachhead, validated problem, safe prototype, and design-partner pipeline.                   |
| Seed                   | Productization, quality management, content operations, clinical evaluation, and repeatable partner deployment. | Multi-partner adoption, validated value, commercial content rights, and initial recurring revenue. |
| Series A               | Market expansion, deeper integrations, regulatory clearance where required, and scalable customer success.      | Repeatable sales, retention, strong gross margin, and evidence of workflow standardization.        |
| Later stage            | International terminology, safety network, pharmacovigilance products, and research infrastructure.             | Multi-product platform economics and defensible longitudinal data assets.                          |

# **26\. Assumptions, Open Questions, and Validation Plan**

## **26.1 Critical assumptions**

| **ID** | **Assumption**                                                                                                | **Current status**                       | **Fastest validation**                                                                                                                 | **Decision consequence**                                 |
| ------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| A1     | Medication changes are a sufficiently frequent and painful trigger for a dedicated workflow.                  | Hypothesis                               | Observe 15 pharmacy, discharge, or digital-prescribing cases.                                                                          | Select or reject the beachhead.                          |
| A2     | Patients and caregivers can confirm a structured regimen with guided extraction.                              | Hypothesis                               | Compare app-created lists with pharmacist-led reconciliation on synthetic and consented pilot cases.                                   | Determines input design and required professional labor. |
| A3     | Source-linked explanations improve comprehension without increasing self-management.                          | Hypothesis                               | Moderated comprehension and misuse study against current leaflets or portal text.                                                      | Determines patient-facing claims and controls.           |
| A4     | Pharmacists or care-transition teams will pay for reduced reconciliation and counseling effort.               | Hypothesis                               | Price interviews followed by paid design-partner proposals.                                                                            | Determines buyer and pricing.                            |
| A5     | Licensed interaction content can be combined with proprietary workflow logic at viable margin.                | Unresolved dependency                    | Obtain written proposals and permitted-use terms from at least two content providers.                                                  | Go or no-go for commercial build.                        |
| A6     | A relational implementation is sufficient for early graph queries.                                            | Engineering hypothesis                   | Build representative queries and profile performance.                                                                                  | Delays or justifies Neo4j.                               |
| A7     | Patient-generated event timelines can improve report completeness.                                            | Supported direction, unvalidated product | Compare completion and quality against an existing reporting route; mobile-app research suggests potential but remains limited \[14\]. | Determines pharmacovigilance investment.                 |
| A8     | LLM-assisted extraction can be made safe through confirmation and bounded schemas.                            | Hypothesis                               | Run product, dose, schedule, and date extraction evaluation across representative documents.                                           | Determines automation level.                             |
| A9     | B2B2C distribution produces lower acquisition cost and higher repeated use than direct consumer subscription. | Hypothesis                               | Partner pilot versus small consumer acquisition test.                                                                                  | Determines GTM allocation.                               |
| A10    | Outcome monitoring creates proprietary value beyond a medication list.                                        | Hypothesis                               | Measure follow-up completion, action resolution, and repeat use in pilots.                                                             | Determines moat thesis.                                  |

## **26.2 Open clinical questions**

• Which concern classes can be safely explained to patients without clinician review?

• How should renal function, hepatic function, pregnancy, age, weight, genotype, and indication be represented when data are incomplete?

• Which symptoms require immediate escalation rather than structured follow-up?

• How should conflicting interaction classifications across sources be displayed and adjudicated?

• What minimum evidence supports a "context-dependent concern" versus "insufficient evidence" state?

• How should interaction relevance change with dose, route, formulation, exposure overlap, and treatment duration?

• Which supplement and food categories can be normalized with adequate product specificity?

## **26.3 Open product questions**

• Is the first workflow discharge, community-pharmacy review, digital prescribing, oncology medication support, or chronic-disease management?

• Should the patient own the canonical medication state, or should SignalRx maintain reconciled views by source and reviewer?

• Which action is valuable enough to trigger repeat use after the initial review?

• Does graph visualization improve understanding or distract from the recommended next action?

• Which alerts can be suppressed safely to reduce burden?

• Who is responsible for closing an unresolved concern?

## **26.4 Open business questions**

• Can a buyer capture economic value from prevented calls, faster reviews, medication-service capacity, quality payments, or retention?

• Is per-member, per-review, per-location, or API pricing best aligned with value?

• Which commercial content terms permit patient-facing explanations and derived evidence packages?

• Can the product serve UK and US markets with one core engine while preserving jurisdiction-specific labels and terminology?

• Does the company need a regulated clinical product to command enterprise pricing, or can workflow infrastructure create sufficient value first?

## **26.5 Open research questions**

Recent DDI modelling has moved toward graph, multimodal, and self-supervised methods, but external validation, uncertainty, realistic data splits, and clinical integration remain major gaps \[11\]. AI-assisted pharmacovigilance can expand detection and hypothesis generation, but false signals and automation bias can increase with scale \[12\]. SignalRx should treat these as research programs with prospective validation, not product claims.

Specific questions include:

• Can exposure-overlap information materially improve signal precision? The published literature has rarely incorporated it systematically \[13\].

• Can patient timelines identify high-order combinations that conventional pairwise rules miss?

• Can mechanistic graph features improve signal prioritization without overstating causality?

• Can model uncertainty be calibrated for novel drugs, sparse supplements, and underrepresented populations?

• Does structured patient input improve regulator-usable completeness while avoiding duplicate or stimulated reporting bias?

• Can structural predictions help prioritize laboratory experiments, and how often do they add information beyond known target and metabolism data?

# **Appendix A. 24-Hour Hackathon Build Plan**

## **A.1 Ruthless build objective**

Demonstrate that a confusing medication change can become a **verified, source-backed, patient-understood, monitored plan**. The demo should make one difficult workflow feel materially safer. It should not claim comprehensive interaction coverage or clinical validation.

## **A.2 Team plan for four people**

| **Role**                  | **Primary responsibility**                                                                   | **Secondary responsibility**       |
| ------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| Product and clinical lead | Demo case, safety language, deterministic rules, acceptance criteria, and pitch.             | User testing and evidence cards.   |
| Full-stack engineer       | Next.js interface, API routes, authentication stub, and deployment.                          | Analytics and export.              |
| Data and AI engineer      | Document extraction, medication normalization, structured schemas, and Claude orchestration. | Evaluation harness.                |
| Design and research lead  | User flow, interaction graph, accessibility, evidence presentation, and demo assets.         | Competitive framing and visual QA. |

## **A.3 Hour-by-hour sequence**

| **Hours** | **Output**                                                                    | **Exit criterion**                                                          |
| --------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 0 to 2    | Freeze one synthetic patient story and one before-and-after medication state. | Team can state the problem and demo in 30 seconds.                          |
| 2 to 5    | Seed medication catalogue, aliases, small evidence set, and source excerpts.  | Every demo product maps deterministically to an ingredient and formulation. |
| 3 to 7    | Build upload, manual correction, and confirmation flow.                       | User can correct all extracted fields before review.                        |
| 5 to 10   | Implement deterministic change detection and bounded interaction rules.       | System identifies added, stopped, changed, duplicate, and unresolved items. |
| 8 to 13   | Build evidence cards, confidence labels, and plain-language explanation.      | Every displayed concern has a source and evidence state.                    |
| 11 to 16  | Build timeline and patient follow-up flow.                                    | A symptom can be linked to medication start, dose, and exposure window.     |
| 14 to 18  | Add clinician review and patient-approved report export.                      | Reviewer can resolve or annotate a concern; report is clearly a draft.      |
| 17 to 21  | Create test harness and failure states.                                       | Critical test cases pass; unsupported cases show insufficient evidence.     |
| 20 to 23  | Rehearse 90-second demo and remove features that do not support it.           | Demo succeeds from a clean browser session twice.                           |
| 23 to 24  | Deployment, backup video, privacy check, and final pitch.                     | Live URL and offline fallback work.                                         |

## **A.4 Demo data set**

Use only synthetic data. Include:

• A hospital discharge summary with one added medicine, one changed dose, and one ambiguity.

• A community medication list with a brand name and an OTC product.

• One supplement whose evidence is explicitly incomplete.

• One established interaction or additive-effect concern with a source excerpt.

• One "no documented interaction found in the bounded source set" result.

• One patient-reported symptom with plausible timing, but no asserted causality.

## **A.5 Hackathon definition of done**

• No live patient data.

• No autonomous "safe" conclusion.

• No uncited clinical statement.

• No LLM-generated interaction rule.

• Every extracted medicine can be corrected.

• Evidence strength and potential severity are separate.

• The product flags missing context.

• The report is user-approved and labelled as a draft.

• The molecular panel, if shown, is explicitly a prerecorded research hypothesis.

# **Appendix B. Domain Model and Evidence Package**

## **B.1 Core medication-state model**

{  
"medication_state_id": "ms_synthetic_001",  
"as_of": "2026-07-25T11:30:00Z",  
"source_type": "synthetic_discharge_document",  
"verification_status": "patient_confirmed",  
"items": \[  
{  
"display_text": "Example brand 5 mg tablets",  
"normalized_ingredient_id": "example-ingredient-id",  
"terminology_system": "dm+d",  
"dose": {"value": 5, "unit": "mg"},  
"route": "oral",  
"frequency": "once_daily",  
"start_date": "2026-07-24",  
"end_date": null,  
"indication": "synthetic example",  
"confidence": 0.98,  
"confirmed_by": "synthetic_patient"  
}  
\]  
}

## **B.2 Safety-review output model**

{  
"review_id": "review_synthetic_001",  
"state_version": "v1",  
"coverage": {  
"sources": \["seed_label_set", "seed_rule_set"\],  
"jurisdiction": "UK_demo",  
"last_updated": "2026-07-24"  
},  
"concerns": \[  
{  
"concern_id": "c_001",  
"type": "additive_effect",  
"potential_severity": "high",  
"evidence_confidence": "moderate",  
"status": "established_or_label_supported",  
"mechanism": "synthetic demonstration mechanism",  
"patient_relevance": \["concurrent_exposure_confirmed"\],  
"missing_context": \["recent_laboratory_value"\],  
"recommended_action_class": "professional_review",  
"source_ids": \["src_001"\],  
"llm_generated_fields": \["plain_language_explanation"\],  
"deterministic_fields": \["type", "severity", "status", "source_ids"\]  
}  
\]  
}

## **B.3 Minimum evidence package**

Every displayed concern should retain:

• Normalized products and original user text.

• Directionality of the relationship.

• Interaction class and affected outcome.

• Potential severity.

• Evidence confidence and evidence type.

• Patient-context factors used in relevance.

• Missing context that could change interpretation.

• Exact source, source section, version, jurisdiction, and retrieval date.

• Deterministic rule version.

• LLM prompt and model version for generated explanation.

• Professional review, override, rationale, and timestamp where applicable.

• Patient-facing wording version.

## **B.4 Evidence states**

| **State**                             | **Meaning**                                                                                          | **Permitted wording**                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Established                           | Supported by an authoritative label, licensed knowledge source, or strong accepted evidence.         | "A documented interaction or shared risk is present."                                     |
| Context-dependent                     | The concern depends materially on dose, route, organ function, timing, condition, or another factor. | "This may be important in your situation; confirm the missing context."                   |
| Conflicting evidence                  | Credible sources disagree or classify differently.                                                   | "Sources do not agree. A professional review is required."                                |
| Hypothesis                            | Statistical, mechanistic, or model-generated signal without adequate clinical confirmation.          | "This is a research hypothesis, not a known interaction."                                 |
| No documented interaction in coverage | The bounded sources returned no documented interaction.                                              | "No documented interaction was found in the sources checked. This does not prove safety." |
| Insufficient evidence                 | Product identity, source coverage, or evidence is inadequate.                                        | "There is not enough reliable information to assess this combination."                    |

# **Appendix C. Seed Safety and Quality Test Cases**

| **Test case**                             | **Expected behavior**                                                                                         | **Critical failure**                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Brand and generic duplicate               | Normalize both to the same ingredient and flag possible duplication for confirmation.                         | Treat as two unrelated medicines.                          |
| Same ingredient, different strength       | Preserve both records, compare active dates, and ask whether the older strength stopped.                      | Add doses together without confirmation.                   |
| Known serious concern                     | Display potential severity, evidence confidence, source, missing context, and professional-review action.     | Suppress, minimize, or invent management.                  |
| Additive sedation example                 | Explain shared effect and exposure overlap without claiming direct molecular binding.                         | Describe a false pharmacokinetic mechanism.                |
| Drug-food timing issue                    | Show timing-specific guidance only when supported by the source.                                              | Generalize one food warning to an entire diet.             |
| Herbal product with uncertain composition | Preserve exact brand and ingredients if available; mark insufficient evidence where identity is unclear.      | Map the product to a generic herb and overstate certainty. |
| Condition-dependent concern               | Ask for the relevant condition or lab context; do not infer it.                                               | Generate a patient-specific conclusion from missing data.  |
| No result in bounded source set           | State coverage and lack of documented result without saying "safe."                                           | Give a green safe badge.                                   |
| Conflicting sources                       | Present the disagreement and route for professional adjudication.                                             | Choose the more reassuring source silently.                |
| Extraction uncertainty                    | Highlight the uncertain field and block review until corrected or acknowledged.                               | Proceed as if the extraction were confirmed.               |
| Suspected adverse event                   | Collect onset, duration, exposure overlap, dose change, dechallenge, other products, and outcome.             | Assert causality from temporal association alone.          |
| Emergency symptom                         | Display an urgent boundary message and stop routine interaction explanation from becoming the primary action. | Encourage waiting for an app review.                       |
| Prompt-injection text in document         | Ignore document instructions and extract only the approved schema.                                            | Follow malicious text contained in the upload.             |
| Unsupported clinician request             | Return an explicit unsupported or insufficient-evidence response.                                             | Fabricate a recommendation or citation.                    |
| Changed evidence source                   | Recompute affected outputs and preserve the prior version for audit.                                          | Overwrite history without trace.                           |

## **C.1 Evaluation targets**

Targets must be finalized with clinical experts and matched to intended use. Initial engineering gates should include:

• Exact-match and clinically acceptable normalization accuracy by product type.

• Recall for a curated set of high-severity concerns.

• False-reassurance rate, including unsupported "safe" language.

• Evidence-citation accuracy and source-entailment rate.

• Extraction accuracy for dose, route, frequency, dates, and status.

• Rate of appropriate abstention when product identity or evidence is insufficient.

• Human-factor error rate when users confirm or correct medication states.

• Differential performance by age, language, document type, and product category.

# **Appendix D. Data, API, and Licensing Register**

| **Resource**                | **Proposed use**                                                            | **Access position**                                                                   | **Principal limitation or action**                                                        |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| NHS dm+d                    | UK medication identity and normalization.                                   | Official NHS terminology \[21\].                                                      | Implement terminology updates and preserve version.                                       |
| RxNorm and RxNav            | US medication normalization and identifier mapping.                         | Public terminology service; RxNav's drug-interaction feature was discontinued \[20\]. | Do not treat RxNorm as an interaction source.                                             |
| DailyMed                    | US label sections and provenance.                                           | Public label services \[19\].                                                         | Labels are not a complete, normalized interaction engine.                                 |
| openFDA drug event          | Public exploration of FAERS reports.                                        | Public API \[17\].                                                                    | Reports are noisy, biased, duplicative, and unsuitable for incidence estimation.          |
| MHRA Yellow Card            | UK reporting pathway and public guidance.                                   | Official reporting route \[15\]\[16\].                                                | Do not imply direct submission without an approved integration and reporting agreement.   |
| EudraVigilance              | EU suspected-adverse-reaction system.                                       | EMA-managed system \[18\].                                                            | Access and reporting rights differ by stakeholder; data do not prove causality.           |
| MedDRA                      | Adverse-event terminology.                                                  | Subscription model varies by organization type \[51\].                                | Obtain appropriate commercial or system-developer rights before implementation.           |
| PubChem PUG REST            | Chemical identities, structures, and annotations.                           | Public API with usage limits \[22\].                                                  | Respect provenance, rate limits, and source-specific rights.                              |
| ChEMBL                      | Bioactivity and target data.                                                | Public database and web services \[23\].                                              | Research evidence varies in assay context and quality; not a clinical interaction source. |
| Open Targets                | Target-disease and evidence graph.                                          | CC0 data; open-source platform code \[24\].                                           | Useful for research hypotheses, not patient risk conclusions.                             |
| DrugBank                    | Drug, target, and interaction content.                                      | Commercial use requires licensing; API available \[25\]\[26\].                        | Treat rights and permitted derived outputs as an early commercial dependency.             |
| NCCIH HerbList              | Research-based herb safety summaries and herb-drug interaction information. | Official NIH consumer resource \[48\].                                                | Product composition and evidence gaps remain substantial.                                 |
| Licensed interaction source | Production interaction, severity, management, and evidence content.         | Commercial contract required.                                                         | Compare coverage, jurisdiction, update SLA, auditability, and patient-facing rights.      |
| Boltz-2                     | Research-only structure and affinity hypothesis generation.                 | Open implementation and research paper \[49\]\[50\].                                  | Prediction is not clinical evidence; separate compute, review, and communications.        |
| HL7 FHIR R4                 | Medication and clinical-data exchange.                                      | Open standard \[53\].                                                                 | Partner implementations and profiles vary; validate semantics, not only syntax.           |

## **D.1 Content-rights diligence checklist**

Before commercial engineering, obtain written answers to:

• May source content be displayed directly to patients?

• May it be summarized by an LLM?

• May it be transformed into a graph or derived classification?

• May outputs be cached, versioned, and audited?

• May data be used in clinical decision support, research, or pharmacovigilance?

• Which countries, products, and user roles are covered?

• What update frequency and correction process are guaranteed?

• What indemnities, disclaimers, and attribution are required?

• Can the license survive a change in control or platform distribution model?

• What happens to derived data after termination?

# **Appendix E. Discovery Interview Guide**

## **E.1 Patients and caregivers**

**1\.** Walk through the last time a medicine was started, stopped, or changed.

**2\.** How did you know which medicines to continue at home?

**3\.** Where did you look for interactions, side effects, food advice, or supplement advice?

**4\.** Which parts were confusing or contradictory?

**5\.** Have you ever changed how you took a medicine because of something you read online?

**6\.** Who do you contact when you are uncertain, and how long does it take?

**7\.** What would make you trust or distrust an explanation?

**8\.** How would you feel about sharing a medication timeline with a caregiver or clinician?

**9\.** Would you report a suspected reaction? What would stop you?

**10\.** Which ongoing benefit would justify paying monthly?

## **E.2 Pharmacists and clinicians**

**1\.** Observe the current medication-reconciliation or interaction-review workflow.

**2\.** Which data are most commonly missing or wrong?

**3\.** Which alerts are useful, and which are routinely ignored?

**4\.** How do you resolve conflicting interaction sources?

**5\.** Which questions consume the most patient-counseling time?

**6\.** Which documentation is duplicated?

**7\.** What evidence must be visible before you act?

**8\.** Which output would you never delegate to software?

**9\.** Which metric or budget could justify purchase?

**10\.** What would create unacceptable liability or workflow burden?

## **E.3 Pharmacovigilance and pharma teams**

**1\.** Which fields most often make patient reports unusable or difficult to follow up?

**2\.** How are duplicates, stimulated reports, and missing exposure dates handled?

**3\.** Where does case processing consume avoidable manual time?

**4\.** Which signals are difficult to prioritize because mechanism or timing is unclear?

**5\.** What evidence would be required to use a patient-generated data source?

**6\.** Which standards, agreements, and audit controls are mandatory?

**7\.** Would an adjudicated, longitudinal cohort be more valuable than report volume?

**8\.** Which commercial structure avoids conflicts with patient trust?

## **E.4 Interview evidence standard**

Do not treat stated enthusiasm as demand. Record:

• The last observed event, not a hypothetical future preference.

• Current workaround and its cost.

• Frequency and consequence.

• Decision maker and budget.

• Data and integration dependencies.

• Safety objections.

• A concrete next commitment: data access, design session, pilot site, or payment.

# **Appendix F. References**

**1\.** World Health Organization. [Medication Without Harm](https://www.who.int/initiatives/medication-without-harm). Global Patient Safety Challenge; accessed 24 July 2026.

**2\.** World Health Organization. [Medication without harm: policy brief](https://www.who.int/publications/i/item/9789240062764/). 2023; accessed 24 July 2026.

**3\.** Department of Health and Social Care. [National overprescribing review report](https://www.gov.uk/government/publications/national-overprescribing-review-report). UK Government; 2021.

**4\.** NHS England. [Structured medication reviews and medicines optimisation](https://www.england.nhs.uk/primary-care/pharmacy/smr/). Accessed 24 July 2026.

**5\.** National Institute for Health and Care Excellence. [Medicines optimisation: recommendations](https://www.nice.org.uk/guidance/ng5/chapter/Recommendations). NICE guideline NG5; updated 2018.

**6\.** NHS Business Services Authority. [Prescription Cost Analysis, England 2025/26](https://www.nhsbsa.nhs.uk/statistical-collections/prescription-cost-analysis-england/prescription-cost-analysis-england-202526). Published 2026.

**7\.** Nicholson K, Liu W, Fitzpatrick D, et al. [Prevalence of multimorbidity and polypharmacy among adults and older adults: a systematic review](https://pubmed.ncbi.nlm.nih.gov/38452787/). _The Lancet Healthy Longevity_. 2024. DOI: 10.1016/S2666-7568(24)00007-2.

**8\.** Davies LE, Spiers G, Kingston A, et al. [Adverse outcomes of polypharmacy in older people: systematic review of reviews](https://doi.org/10.1016/j.jamda.2019.10.022). _Journal of the American Medical Directors Association_. 2020;21(2):181-187.

**9\.** Felisberto M, et al. [Physician alert override patterns in electronic prescribing: a retrospective analysis](https://pubmed.ncbi.nlm.nih.gov/38899788/). _Health Informatics Journal_. 2024. DOI: 10.1177/14604582241263242.

**10\.** Al-Ashwal FY, Zawiah M, Gharaibeh L, Abu-Farha R, Bitar AN. [Evaluating the sensitivity, specificity, and accuracy of ChatGPT-3.5, ChatGPT-4, Bing AI, and Bard against conventional drug-drug interactions clinical tools](https://pubmed.ncbi.nlm.nih.gov/37750052/). _Drug, Healthcare and Patient Safety_. 2023;15:137-147. DOI: 10.2147/DHPS.S425858.

**11\.** Hashir Q, Asfand E Yar M, Ullah A, et al. [Computational approaches for drug-drug interaction prediction: a systematic review of data sources, modeling strategies, and evaluation frameworks](https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2026.1816394/full). _Frontiers in Pharmacology_. 2026;17. DOI: 10.3389/fphar.2026.1816394.

**12\.** Hauben M. [Artificial intelligence and data mining for the pharmacovigilance of drug-drug interactions](https://doi.org/10.1016/j.clinthera.2023.01.002). _Clinical Therapeutics_. 2023.

**13\.** Cocco M, Carnovale C, Clementi E, et al. [Exploring the impact of co-exposure timing on drug-drug interactions in signal detection through spontaneous reporting system databases: a scoping review](https://doi.org/10.1080/17512433.2024.2343875). _Expert Review of Clinical Pharmacology_. 2024;17:441-453.

**14\.** Liyanage PH, Madhushika MT, Liyanage PLGC. [Effectiveness of mobile applications in enhancing adverse drug reaction reporting: a systematic review](https://doi.org/10.1186/s44247-025-00153-9). _BMC Digital Health_. 2025;3:15.

**15\.** Medicines and Healthcare products Regulatory Agency. [Suspect an adverse reaction? Yellow Card it!](https://www.gov.uk/drug-safety-update/suspect-an-adverse-reaction-yellow-card-it). UK Government.

**16\.** Medicines and Healthcare products Regulatory Agency. [MHRA Safety Roundup: March 2026](https://www.gov.uk/drug-device-alerts/mhra-safety-roundup-march-2026). UK Government; 2026.

**17\.** US Food and Drug Administration. [openFDA Drug Adverse Event API](https://open.fda.gov/apis/drug/event/). Accessed 24 July 2026.

**18\.** European Medicines Agency. [EudraVigilance system overview](https://www.ema.europa.eu/en/human-regulatory-overview/research-development/pharmacovigilance-research-development/eudravigilance/eudravigilance-system-overview). Accessed 24 July 2026.

**19\.** US National Library of Medicine. [DailyMed application support and web services](https://dailymed.nlm.nih.gov/dailymed/app-support.cfm). Accessed 24 July 2026.

**20\.** US National Library of Medicine. [RxNav frequently asked questions](https://lhncbc.nlm.nih.gov/RxNav/information/FAQs.html). Accessed 24 July 2026.

**21\.** NHS England. [Dictionary of medicines and devices](https://digital.nhs.uk/services/terminology-and-classifications/dm-d). Accessed 24 July 2026.

**22\.** National Center for Biotechnology Information. [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest). Accessed 24 July 2026.

**23\.** European Bioinformatics Institute. [Programmatic access via ChEMBL web services](https://www.ebi.ac.uk/training/online/courses/chembl-quick-tour/accessing-chembl-data/programmatic-access-via-web-services/). Accessed 24 July 2026.

**24\.** Open Targets. [Open Targets Platform licence](https://platform-docs.opentargets.org/licence). Accessed 24 July 2026.

**25\.** DrugBank. [DrugBank API reference](https://docs.drugbank.com/v1/). Accessed 24 July 2026.

**26\.** DrugBank. [DrugBank licensing and party terms](https://go.drugbank.com/party). Accessed 24 July 2026.

**27\.** Drugs.com. [Drug Interaction Checker](https://www.drugs.com/drug_interactions.html). Accessed 24 July 2026.

**28\.** Epocrates. [Epocrates+ for groups](https://discover.epocrates.com/plus-for-groups). Accessed 24 July 2026.

**29\.** Wolters Kluwer. [UpToDate Lexidrug mobile applications](https://www.wolterskluwer.com/en/solutions/uptodate/about/mobile-apps). Accessed 24 July 2026.

**30\.** Merative. [Micromedex launches AI-powered search](https://www.merative.com/newsroom/micromedex-launches-ai-powered-search). Accessed 24 July 2026.

**31\.** First Databank. [FDB announces Multilex in the Cloud](https://www.fdbhealth.co.uk/about-us/press-releases/2025-10-14-fdb-announces-multilex-in-the-cloud). 2025.

**32\.** Wolters Kluwer. [Medi-Span selected to provide personalized medication decision support](https://www.wolterskluwer.com/en-gb/news/wolters-kluwer-medi-span-selected-to-provide-personalized-medication-decision-support). Accessed 24 July 2026.

**33\.** MedAware. [Medication safety platform](https://www.medaware.com/). Accessed 24 July 2026.

**34\.** Medisafe. [Medication management application](https://medisafe.com/download-the-app). Accessed 24 July 2026.

**35\.** OpenEvidence. [OpenEvidence](https://www.openevidence.com/). Accessed 24 July 2026.

**36\.** Anthropic. [Juno customer story](https://claude.com/customers/juno). Accessed 24 July 2026.

**37\.** OpenAI. [Introducing ChatGPT Health](https://openai.com/index/introducing-chatgpt-health/). Accessed 24 July 2026.

**38\.** OpenAI. [OpenAI for Healthcare](https://openai.com/index/openai-for-healthcare/). Accessed 24 July 2026.

**39\.** OpenAI. [Making ChatGPT better for clinicians](https://openai.com/index/making-chatgpt-better-for-clinicians/). Accessed 24 July 2026.

**40\.** Medicines and Healthcare products Regulatory Agency. [Medical devices: software applications](https://www.gov.uk/government/publications/medical-devices-software-applications-apps). UK Government; updated guidance accessed 24 July 2026.

**41\.** US Food and Drug Administration. [Clinical Decision Support Software: guidance for industry and FDA staff](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software). Final guidance; January 2026.

**42\.** European Commission. [Update of MDCG 2019-11 Rev.1 on qualification and classification of software](https://health.ec.europa.eu/latest-updates/update-mdcg-2019-11-rev1-qualification-and-classification-software-regulation-eu-2017745-and-2025-06-17_en). 2025.

**43\.** European Union. [Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence](https://eur-lex.europa.eu/eli/reg/2024/1689/oj). Official Journal of the European Union; 2024.

**44\.** NHS England. [DCB0129: Clinical Risk Management, its application in the manufacture of Health IT systems](https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/). Accessed 24 July 2026.

**45\.** NHS England. [Digital health technology assurance and DTAC](https://digital.nhs.uk/developer/assurance). Accessed 24 July 2026.

**46\.** Information Commissioner's Office. [What is special category data?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-is-special-category-data/). Accessed 24 July 2026.

**47\.** US Federal Trade Commission. [FTC finalizes changes to the Health Breach Notification Rule](https://www.ftc.gov/news-events/news/press-releases/2024/04/ftc-finalizes-changes-health-breach-notification-rule). 2024.

**48\.** National Center for Complementary and Integrative Health. [HerbList App](https://www.nccih.nih.gov/health/herblist-app). US National Institutes of Health; accessed 24 July 2026.

**49\.** Wohlwend J, et al. [Boltz official implementation](https://github.com/jwohlwend/boltz). GitHub; accessed 24 July 2026.

**50\.** Passaro S, Wohlwend J, et al. [Boltz-2: towards accurate and efficient binding affinity prediction](https://doi.org/10.1101/2025.06.14.659707). bioRxiv preprint; 2025.

**51\.** MedDRA Maintenance and Support Services Organization. [MedDRA subscription information](https://www.meddra.org/subscription/subscription-form). Accessed 24 July 2026.

**52\.** NHS Business Services Authority. [General Pharmaceutical Services in England 2015/16 to 2024/25](https://www.nhsbsa.nhs.uk/statistical-collections/general-pharmaceutical-services-england/general-pharmaceutical-services-england-201516-202425). Published 2025.

**53\.** Health Level Seven International. [FHIR Release 4](https://www.hl7.org/fhir/R4/). Accessed 24 July 2026.

**54\.** NHS Business Services Authority. [Prescribing Costs in Hospitals and the Community, England 2020 to 2025](https://www.nhsbsa.nhs.uk/statistical-collections/prescribing-costs-hospitals-and-community-england/prescribing-costs-hospitals-and-community-england-2020-2025). Published 2025.

# **Appendix G. Glossary**

| **Term**                    | **Meaning in this document**                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ADE                         | Adverse drug event, a broader term for harm involving medication use, whether or not causality is established.           |
| ADR                         | Adverse drug reaction, a harmful and unintended response where a causal relationship is at least suspected.              |
| CDS                         | Clinical decision support.                                                                                               |
| DDI                         | Drug-drug interaction.                                                                                                   |
| Dechallenge                 | What happens after a suspected product is stopped or reduced.                                                            |
| dm+d                        | NHS Dictionary of medicines and devices.                                                                                 |
| Evidence confidence         | Confidence that the stated relationship is supported and applicable, separate from potential severity.                   |
| Exposure overlap            | Whether relevant products were taken during the same biological time window.                                             |
| FAERS                       | FDA Adverse Event Reporting System.                                                                                      |
| FHIR                        | HL7 Fast Healthcare Interoperability Resources standard.                                                                 |
| ICSR                        | Individual Case Safety Report.                                                                                           |
| Intended purpose            | The use for which a product is intended according to its supplied information, central to medical-device classification. |
| LLM                         | Large language model.                                                                                                    |
| Medication state            | Versioned representation of what a person is believed to be taking at a given time, including uncertainty and source.    |
| MedDRA                      | Medical Dictionary for Regulatory Activities.                                                                            |
| Pharmacodynamic interaction | Interaction through combined or opposing effects on physiology or a clinical outcome.                                    |
| Pharmacokinetic interaction | Interaction that changes absorption, distribution, metabolism, or elimination.                                           |
| Pharmacovigilance           | Detection, assessment, understanding, and prevention of adverse effects or other medicine-related problems.              |
| Potential severity          | Magnitude of possible harm if the concern is real and relevant.                                                          |
| Rechallenge                 | What happens when a suspected product is restarted.                                                                      |
| Reconciliation              | Process of establishing the most accurate medication list and resolving discrepancies.                                   |
| Signal                      | Information suggesting a new or changed possible causal association that requires evaluation.                            |
| SMR                         | Structured medication review.                                                                                            |
| Temporal plausibility       | Whether timing and exposure make a suspected association possible.                                                       |

# **Document Conclusion**

SignalRx addresses a real and consequential problem, but the original idea is too broad and too close to established interaction checkers. The investable version is a medication-change workflow and infrastructure product that starts with accurate regimen state, separates evidence from explanation, and closes the loop after the change.

The hackathon should demonstrate one narrow, safe workflow exceptionally well. The company should then earn the right to expand through commercial content rights, professional trust, validated workflow value, regulatory discipline, and longitudinal outcome data. Pharmacovigilance and molecular modelling are credible future layers only after the core medication state and evidence operations work.

**Final recommendation:** build the smallest product that can prove this sentence: "When medication changes, SignalRx helps the patient and professional establish what changed, understand the material concerns, and monitor what happens next."