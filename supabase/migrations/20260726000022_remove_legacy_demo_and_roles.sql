-- Clean break after the patient-first application and longitudinal schema are live.
-- All objects below belonged exclusively to the fictional demo, review episodes,
-- organisations, caregivers, professional workspaces, or research workflows.

drop table if exists public.demo_sessions cascade;
drop table if exists public.generated_artifacts cascade;
drop table if exists public.audit_events cascade;
drop table if exists public.consent_grants cascade;
drop table if exists public.timeline_events cascade;
drop table if exists public.review_actions cascade;
drop table if exists public.reviews cascade;
drop table if exists public.concern_evidence cascade;
drop table if exists public.concerns cascade;
drop table if exists public.clinical_rule_evidence cascade;
drop table if exists public.clinical_rules cascade;
drop table if exists public.evidence_records cascade;
drop table if exists public.symptoms cascade;
drop table if exists public.medication_exposures cascade;
drop table if exists public.observations cascade;
drop table if exists public.conditions cascade;
drop table if exists public.field_provenance cascade;
drop table if exists public.medication_entry_sources cascade;
drop table if exists public.medication_entries cascade;
drop table if exists public.medication_sources cascade;
drop table if exists public.episodes cascade;
drop table if exists public.medication_products cascade;
drop table if exists public.medication_concepts cascade;
drop table if exists public.patient_caregivers cascade;
drop table if exists public.caregivers cascade;
drop table if exists public.patient_profiles cascade;
drop table if exists public.organisation_memberships cascade;
drop table if exists public.organisations cascade;
drop table if exists public.profiles cascade;

drop function if exists public.is_organisation_member(uuid, public.organisation_role[]) cascade;
drop function if exists public.can_access_patient(uuid) cascade;
drop function if exists public.can_access_episode(uuid) cascade;
drop function if exists public.can_edit_episode(uuid) cascade;
drop function if exists public.can_review_episode(uuid) cascade;
drop function if exists public.guard_episode_workflow_transition() cascade;
drop function if exists public.prevent_audit_event_mutation() cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.artifact_status cascade;
drop type if exists public.artifact_kind cascade;
drop type if exists public.consent_status cascade;
drop type if exists public.timeline_event_type cascade;
drop type if exists public.review_disposition cascade;
drop type if exists public.review_status cascade;
drop type if exists public.concern_status cascade;
drop type if exists public.concern_severity cascade;
drop type if exists public.rule_status cascade;
drop type if exists public.evidence_strength cascade;
drop type if exists public.evidence_kind cascade;
drop type if exists public.observation_type cascade;
drop type if exists public.provenance_method cascade;
drop type if exists public.date_precision cascade;
drop type if exists public.administration_status cascade;
drop type if exists public.medication_current_status cascade;
drop type if exists public.confirmation_status cascade;
drop type if exists public.normalisation_status cascade;
drop type if exists public.source_processing_status cascade;
drop type if exists public.source_type cascade;
drop type if exists public.episode_workflow_state cascade;
drop type if exists public.caregiver_relationship_status cascade;
drop type if exists public.membership_status cascade;
drop type if exists public.organisation_role cascade;
drop type if exists public.user_role cascade;
