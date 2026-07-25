-- SignalRx initial schema
-- PostgreSQL 15 / Supabase compatible.
--
-- Security model:
--   * auth.users is the identity source; public.profiles contains app-facing identity data.
--   * patients and authorised caregivers can access their own episodes.
--   * clinicians access episodes through active organisation membership.
--   * review decisions and generated patient plans are restricted to clinical reviewers.
--   * service-role processes bypass RLS for deterministic extraction, rule evaluation,
--     evidence ingestion, and audit recording.

begin;

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum (
  'patient',
  'caregiver',
  'pharmacist',
  'prescriber',
  'admin',
  'researcher',
  'system'
);

create type public.organisation_role as enum (
  'owner',
  'admin',
  'pharmacist',
  'prescriber',
  'reviewer',
  'researcher',
  'support'
);

create type public.membership_status as enum (
  'invited',
  'active',
  'suspended',
  'revoked'
);

create type public.caregiver_relationship_status as enum (
  'invited',
  'active',
  'paused',
  'revoked'
);

create type public.episode_workflow_state as enum (
  'draft',
  'awaiting_confirmation',
  'ready_for_review',
  'in_review',
  'resolved',
  'escalated',
  'archived'
);

create type public.source_type as enum (
  'discharge_letter',
  'prescription_list',
  'medication_box_photo',
  'voice_note',
  'manual_entry',
  'caregiver_report',
  'professional_record',
  'external_import',
  'other'
);

create type public.source_processing_status as enum (
  'received',
  'processing',
  'extracted',
  'needs_attention',
  'failed'
);

create type public.normalisation_status as enum (
  'unmatched',
  'candidate',
  'matched',
  'manually_matched',
  'not_applicable'
);

create type public.confirmation_status as enum (
  'unconfirmed',
  'needs_confirmation',
  'confirmed',
  'corrected',
  'missing_information',
  'rejected'
);

create type public.medication_current_status as enum (
  'current',
  'possibly_current',
  'possibly_stopped',
  'stopped',
  'unknown'
);

create type public.administration_status as enum (
  'taken',
  'not_taken',
  'unknown',
  'not_applicable'
);

create type public.date_precision as enum (
  'exact',
  'month',
  'year',
  'approximate',
  'unknown'
);

create type public.provenance_method as enum (
  'manual',
  'ocr',
  'speech_to_text',
  'document_extraction',
  'rules_engine',
  'professional_edit',
  'external_import'
);

create type public.observation_type as enum (
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
  'egfr',
  'serum_creatinine',
  'serum_potassium',
  'weight',
  'inr',
  'other'
);

create type public.evidence_kind as enum (
  'guideline',
  'regulatory',
  'systematic_review',
  'clinical_study',
  'drug_monograph',
  'reference',
  'local_policy',
  'synthetic_demo'
);

create type public.evidence_strength as enum (
  'high',
  'moderate',
  'low',
  'insufficient',
  'not_assessed'
);

create type public.rule_status as enum (
  'draft',
  'active',
  'retired'
);

create type public.concern_severity as enum (
  'critical',
  'major',
  'moderate',
  'minor',
  'informational'
);

create type public.concern_status as enum (
  'open',
  'under_review',
  'resolved',
  'dismissed'
);

create type public.review_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'superseded'
);

create type public.review_disposition as enum (
  'accepted_action_required',
  'monitor',
  'more_information_required',
  'dismissed_not_relevant'
);

create type public.timeline_event_type as enum (
  'medication_started',
  'medication_stopped',
  'medication_reported',
  'medication_administered',
  'symptom_reported',
  'observation_recorded',
  'care_transition',
  'review_action',
  'other'
);

create type public.consent_status as enum (
  'active',
  'revoked',
  'expired'
);

create type public.artifact_kind as enum (
  'patient_plan',
  'professional_review',
  'medication_summary',
  'audit_export',
  'fhir_bundle',
  'pdf'
);

create type public.artifact_status as enum (
  'draft',
  'approved',
  'published',
  'superseded'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  display_name text not null,
  email text,
  locale text not null default 'en-GB',
  timezone text not null default 'Europe/London',
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (btrim(display_name) <> ''),
  constraint profiles_email_shape check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organisation_type text not null default 'care_provider',
  created_by uuid references auth.users(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisations_name_not_blank check (btrim(name) <> ''),
  constraint organisations_slug_shape check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organisation_role not null,
  status public.membership_status not null default 'invited',
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, user_id),
  constraint memberships_joined_when_active check (
    status <> 'active' or joined_at is not null
  )
);

create table public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  primary_organisation_id uuid references public.organisations(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  given_name text not null,
  family_name text not null,
  date_of_birth date,
  pseudonymous_identifier text unique,
  phone text,
  preferred_contact_method text,
  emergency_contact jsonb,
  clinical_identifiers jsonb not null default '{}'::jsonb,
  accessibility_preferences jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_given_name_not_blank check (btrim(given_name) <> ''),
  constraint patient_family_name_not_blank check (btrim(family_name) <> ''),
  constraint patient_date_of_birth_not_future check (
    date_of_birth is null or date_of_birth <= current_date
  )
);

create table public.caregivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  relationship_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caregivers_display_name_not_blank check (btrim(display_name) <> '')
);

create table public.patient_caregivers (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  caregiver_id uuid not null references public.caregivers(id) on delete cascade,
  status public.caregiver_relationship_status not null default 'invited',
  can_view_medications boolean not null default true,
  can_edit_medications boolean not null default false,
  can_report_administration boolean not null default true,
  can_view_patient_plan boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_profile_id, caregiver_id),
  constraint patient_caregiver_active_has_grant_time check (
    status <> 'active' or granted_at is not null
  )
);

create table public.medication_concepts (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  ingredient_name text not null,
  terminology_system text not null default 'dm+d',
  terminology_code text,
  synonyms text[] not null default '{}',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (terminology_system, terminology_code),
  constraint medication_concept_name_not_blank check (btrim(canonical_name) <> ''),
  constraint medication_ingredient_not_blank check (btrim(ingredient_name) <> '')
);

create table public.medication_products (
  id uuid primary key default gen_random_uuid(),
  medication_concept_id uuid not null references public.medication_concepts(id) on delete restrict,
  product_name text not null,
  terminology_system text not null default 'dm+d',
  terminology_code text,
  strength numeric,
  strength_unit text,
  dose_form text,
  route text,
  formulation text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (terminology_system, terminology_code),
  constraint medication_product_name_not_blank check (btrim(product_name) <> ''),
  constraint medication_product_strength_nonnegative check (strength is null or strength >= 0),
  constraint medication_product_strength_complete check (
    (strength is null and strength_unit is null)
    or (strength is not null and strength_unit is not null)
  )
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  assigned_reviewer_user_id uuid references auth.users(id) on delete set null,
  workflow_state public.episode_workflow_state not null default 'draft',
  title text not null default 'Medication safety review',
  as_of timestamptz not null default now(),
  intake_completed_at timestamptz,
  review_started_at timestamptz,
  resolved_at timestamptz,
  escalated_at timestamptz,
  workflow_state_changed_at timestamptz not null default now(),
  synthetic boolean not null default false,
  demo_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint episode_title_not_blank check (btrim(title) <> ''),
  constraint episode_demo_label check (
    (synthetic and demo_label is not null)
    or (not synthetic)
  )
);

create table public.medication_sources (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  source_type public.source_type not null,
  label text not null,
  processing_status public.source_processing_status not null default 'received',
  original_filename text,
  storage_bucket text,
  storage_path text,
  media_type text,
  sha256 text,
  source_occurred_at timestamptz,
  received_at timestamptz not null default now(),
  extracted_text text,
  extraction_metadata jsonb not null default '{}'::jsonb,
  reported_by_user_id uuid references auth.users(id) on delete set null,
  reported_by_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_source_label_not_blank check (btrim(label) <> ''),
  constraint medication_source_hash_shape check (
    sha256 is null or sha256 ~ '^[0-9a-fA-F]{64}$'
  ),
  constraint medication_source_storage_pair check (
    (storage_bucket is null and storage_path is null)
    or (storage_bucket is not null and storage_path is not null)
  )
);

create table public.medication_entries (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  primary_source_id uuid references public.medication_sources(id) on delete set null,
  medication_concept_id uuid references public.medication_concepts(id) on delete set null,
  medication_product_id uuid references public.medication_products(id) on delete set null,
  entered_name text not null,
  original_name text,
  normalised_name text,
  ingredient_name text,
  normalisation_status public.normalisation_status not null default 'unmatched',
  strength numeric,
  strength_unit text,
  dose_text text,
  frequency_text text,
  route text,
  formulation text,
  indication text,
  start_date date,
  start_date_precision public.date_precision not null default 'unknown',
  stop_date date,
  stop_date_precision public.date_precision not null default 'unknown',
  current_status public.medication_current_status not null default 'unknown',
  confirmation_status public.confirmation_status not null default 'unconfirmed',
  confirmation_confidence numeric(4,3),
  administration_status public.administration_status not null default 'unknown',
  administered_by_user_id uuid references auth.users(id) on delete set null,
  administered_at timestamptz,
  reported_by_user_id uuid references auth.users(id) on delete set null,
  reported_by_role public.user_role,
  notes text,
  confirmed_by_user_id uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_entry_name_not_blank check (btrim(entered_name) <> ''),
  constraint medication_entry_strength_nonnegative check (strength is null or strength >= 0),
  constraint medication_entry_strength_complete check (
    (strength is null and strength_unit is null)
    or (strength is not null and strength_unit is not null)
  ),
  constraint medication_entry_confidence_range check (
    confirmation_confidence is null
    or confirmation_confidence between 0 and 1
  ),
  constraint medication_entry_date_order check (
    start_date is null or stop_date is null or stop_date >= start_date
  ),
  constraint medication_entry_confirmed_metadata check (
    confirmation_status not in ('confirmed', 'corrected')
    or (confirmed_by_user_id is not null and confirmed_at is not null)
  ),
  constraint medication_entry_administration_metadata check (
    administration_status not in ('taken', 'not_taken')
    or administered_at is not null
  )
);

create table public.medication_entry_sources (
  medication_entry_id uuid not null references public.medication_entries(id) on delete cascade,
  medication_source_id uuid not null references public.medication_sources(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (medication_entry_id, medication_source_id)
);

create table public.field_provenance (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  medication_entry_id uuid not null references public.medication_entries(id) on delete cascade,
  medication_source_id uuid references public.medication_sources(id) on delete set null,
  field_name text not null,
  raw_value text,
  normalised_value jsonb,
  source_excerpt text,
  method public.provenance_method not null,
  confidence numeric(4,3),
  recorded_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint field_provenance_name_shape check (field_name ~ '^[a-z][a-z0-9_]*$'),
  constraint field_provenance_confidence_range check (
    confidence is null or confidence between 0 and 1
  )
);

create table public.conditions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  source_id uuid references public.medication_sources(id) on delete set null,
  name text not null,
  terminology_system text,
  terminology_code text,
  clinical_status text not null default 'active',
  onset_date date,
  recorded_at timestamptz not null default now(),
  recorded_by_user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint condition_name_not_blank check (btrim(name) <> '')
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  source_id uuid references public.medication_sources(id) on delete set null,
  observation_type public.observation_type not null,
  display_name text not null,
  numeric_value numeric,
  text_value text,
  unit text,
  reference_range_low numeric,
  reference_range_high numeric,
  observed_at timestamptz,
  status text not null default 'final',
  recorded_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint observation_has_value check (
    num_nonnulls(numeric_value, text_value) = 1
  ),
  constraint observation_numeric_unit check (
    numeric_value is null or unit is not null
  ),
  constraint observation_reference_range_order check (
    reference_range_low is null
    or reference_range_high is null
    or reference_range_high >= reference_range_low
  )
);

create table public.medication_exposures (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  medication_entry_id uuid not null references public.medication_entries(id) on delete cascade,
  exposure_start timestamptz not null,
  exposure_end timestamptz,
  certainty numeric(4,3) not null default 1,
  basis text not null default 'reported',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_exposure_time_order check (
    exposure_end is null or exposure_end >= exposure_start
  ),
  constraint medication_exposure_certainty_range check (
    certainty between 0 and 1
  )
);

create table public.symptoms (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  source_id uuid references public.medication_sources(id) on delete set null,
  name text not null,
  description text,
  severity smallint,
  started_at timestamptz,
  ended_at timestamptz,
  date_precision public.date_precision not null default 'unknown',
  reported_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint symptom_name_not_blank check (btrim(name) <> ''),
  constraint symptom_severity_range check (severity is null or severity between 0 and 10),
  constraint symptom_time_order check (
    started_at is null or ended_at is null or ended_at >= started_at
  )
);

create table public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade,
  evidence_kind public.evidence_kind not null,
  title text not null,
  publisher text,
  citation text,
  source_url text,
  external_identifier text,
  publication_date date,
  retrieved_at timestamptz,
  summary text not null,
  verbatim_excerpt text,
  evidence_strength public.evidence_strength not null default 'not_assessed',
  is_public boolean not null default false,
  synthetic boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_title_not_blank check (btrim(title) <> ''),
  constraint evidence_summary_not_blank check (btrim(summary) <> ''),
  constraint evidence_source_url_shape check (
    source_url is null or source_url ~* '^https?://'
  ),
  constraint evidence_retrieval_metadata check (
    source_url is null or retrieved_at is not null
  )
);

create table public.clinical_rules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade,
  code text not null,
  name text not null,
  description text not null,
  status public.rule_status not null default 'draft',
  version integer not null default 1,
  logic jsonb not null,
  output_template jsonb not null,
  valid_from timestamptz,
  valid_to timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organisation_id, code, version),
  constraint clinical_rule_code_shape check (code ~ '^[A-Z0-9][A-Z0-9._-]*$'),
  constraint clinical_rule_version_positive check (version > 0),
  constraint clinical_rule_validity_order check (
    valid_from is null or valid_to is null or valid_to > valid_from
  ),
  constraint clinical_rule_active_approved check (
    status <> 'active' or (approved_by is not null and approved_at is not null)
  )
);

create table public.clinical_rule_evidence (
  clinical_rule_id uuid not null references public.clinical_rules(id) on delete cascade,
  evidence_record_id uuid not null references public.evidence_records(id) on delete restrict,
  relationship text not null default 'supports',
  created_at timestamptz not null default now(),
  primary key (clinical_rule_id, evidence_record_id),
  constraint clinical_rule_evidence_relationship check (
    relationship in ('supports', 'qualifies', 'contradicts', 'background')
  )
);

create table public.concerns (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  clinical_rule_id uuid references public.clinical_rules(id) on delete set null,
  ordinal smallint not null,
  title text not null,
  summary text not null,
  rationale text not null,
  severity public.concern_severity not null,
  status public.concern_status not null default 'open',
  evidence_strength public.evidence_strength not null default 'not_assessed',
  confidence numeric(4,3),
  action_required boolean not null default false,
  missing_information text[] not null default '{}',
  patient_facing_summary text not null,
  professional_facing_detail text not null,
  generated_by_rule_version integer,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, ordinal),
  constraint concern_ordinal_top_three check (ordinal between 1 and 3),
  constraint concern_title_not_blank check (btrim(title) <> ''),
  constraint concern_confidence_range check (
    confidence is null or confidence between 0 and 1
  ),
  constraint concern_resolution_time check (
    status not in ('resolved', 'dismissed') or resolved_at is not null
  )
);

create table public.concern_evidence (
  concern_id uuid not null references public.concerns(id) on delete cascade,
  evidence_record_id uuid not null references public.evidence_records(id) on delete restrict,
  relevance_note text,
  created_at timestamptz not null default now(),
  primary key (concern_id, evidence_record_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  status public.review_status not null default 'not_started',
  professional_summary text,
  started_at timestamptz,
  completed_at timestamptz,
  supersedes_review_id uuid references public.reviews(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_started_metadata check (
    status = 'not_started' or started_at is not null
  ),
  constraint review_completed_metadata check (
    status not in ('completed', 'superseded') or completed_at is not null
  )
);

create table public.review_actions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  concern_id uuid references public.concerns(id) on delete set null,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  disposition public.review_disposition not null,
  reason text not null,
  patient_plan_text text,
  professional_note text,
  follow_up_by date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_action_reason_not_blank check (btrim(reason) <> ''),
  constraint review_action_more_info_has_detail check (
    disposition <> 'more_information_required'
    or professional_note is not null
  )
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  event_type public.timeline_event_type not null,
  occurred_at timestamptz,
  date_precision public.date_precision not null default 'unknown',
  title text not null,
  description text not null,
  medication_entry_id uuid references public.medication_entries(id) on delete set null,
  symptom_id uuid references public.symptoms(id) on delete set null,
  observation_id uuid references public.observations(id) on delete set null,
  source_id uuid references public.medication_sources(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  causality_asserted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timeline_title_not_blank check (btrim(title) <> ''),
  constraint timeline_description_not_blank check (btrim(description) <> '')
);

create table public.consent_grants (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.patient_profiles(id) on delete cascade,
  granted_by_user_id uuid not null references auth.users(id) on delete cascade,
  granted_to_user_id uuid references auth.users(id) on delete cascade,
  granted_to_organisation_id uuid references public.organisations(id) on delete cascade,
  scopes text[] not null,
  status public.consent_status not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  purpose text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consent_single_grantee check (
    num_nonnulls(granted_to_user_id, granted_to_organisation_id) = 1
  ),
  constraint consent_scopes_not_empty check (cardinality(scopes) > 0),
  constraint consent_time_order check (expires_at is null or expires_at > starts_at),
  constraint consent_revocation_metadata check (
    status <> 'revoked' or revoked_at is not null
  ),
  constraint consent_purpose_not_blank check (btrim(purpose) <> '')
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid references public.episodes(id) on delete set null,
  patient_profile_id uuid references public.patient_profiles(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role public.user_role,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  request_id uuid,
  previous_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_event_type_shape check (event_type ~ '^[a-z][a-z0-9_.-]*$'),
  constraint audit_entity_type_shape check (entity_type ~ '^[a-z][a-z0-9_.-]*$')
);

create table public.generated_artifacts (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete set null,
  kind public.artifact_kind not null,
  status public.artifact_status not null default 'draft',
  version integer not null default 1,
  title text not null,
  content jsonb,
  rendered_text text,
  storage_bucket text,
  storage_path text,
  media_type text,
  sha256 text,
  generated_by_user_id uuid references auth.users(id) on delete set null,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  supersedes_artifact_id uuid references public.generated_artifacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, kind, version),
  constraint generated_artifact_version_positive check (version > 0),
  constraint generated_artifact_title_not_blank check (btrim(title) <> ''),
  constraint generated_artifact_has_content check (
    content is not null
    or rendered_text is not null
    or (storage_bucket is not null and storage_path is not null)
  ),
  constraint generated_artifact_storage_pair check (
    (storage_bucket is null and storage_path is null)
    or (storage_bucket is not null and storage_path is not null)
  ),
  constraint generated_artifact_hash_shape check (
    sha256 is null or sha256 ~ '^[0-9a-fA-F]{64}$'
  ),
  constraint generated_artifact_approval_metadata check (
    status = 'draft'
    or (approved_by_user_id is not null and approved_at is not null)
  ),
  constraint generated_artifact_publication_metadata check (
    status <> 'published' or published_at is not null
  )
);

-- Generic modification timestamp.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
create trigger organisations_set_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();
create trigger organisation_memberships_set_updated_at
before update on public.organisation_memberships
for each row execute function public.set_updated_at();
create trigger patient_profiles_set_updated_at
before update on public.patient_profiles
for each row execute function public.set_updated_at();
create trigger caregivers_set_updated_at
before update on public.caregivers
for each row execute function public.set_updated_at();
create trigger patient_caregivers_set_updated_at
before update on public.patient_caregivers
for each row execute function public.set_updated_at();
create trigger medication_concepts_set_updated_at
before update on public.medication_concepts
for each row execute function public.set_updated_at();
create trigger medication_products_set_updated_at
before update on public.medication_products
for each row execute function public.set_updated_at();
create trigger episodes_set_updated_at
before update on public.episodes
for each row execute function public.set_updated_at();
create trigger medication_sources_set_updated_at
before update on public.medication_sources
for each row execute function public.set_updated_at();
create trigger medication_entries_set_updated_at
before update on public.medication_entries
for each row execute function public.set_updated_at();
create trigger conditions_set_updated_at
before update on public.conditions
for each row execute function public.set_updated_at();
create trigger observations_set_updated_at
before update on public.observations
for each row execute function public.set_updated_at();
create trigger medication_exposures_set_updated_at
before update on public.medication_exposures
for each row execute function public.set_updated_at();
create trigger symptoms_set_updated_at
before update on public.symptoms
for each row execute function public.set_updated_at();
create trigger evidence_records_set_updated_at
before update on public.evidence_records
for each row execute function public.set_updated_at();
create trigger clinical_rules_set_updated_at
before update on public.clinical_rules
for each row execute function public.set_updated_at();
create trigger concerns_set_updated_at
before update on public.concerns
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();
create trigger review_actions_set_updated_at
before update on public.review_actions
for each row execute function public.set_updated_at();
create trigger timeline_events_set_updated_at
before update on public.timeline_events
for each row execute function public.set_updated_at();
create trigger consent_grants_set_updated_at
before update on public.consent_grants
for each row execute function public.set_updated_at();
create trigger generated_artifacts_set_updated_at
before update on public.generated_artifacts
for each row execute function public.set_updated_at();

-- The episode state machine mirrors the runtime contract exactly. Medication
-- mutation may reopen ready/reviewed/escalated episodes to
-- awaiting_confirmation; the application records that governed mutation in the
-- append-only audit log. Approval/publication are artifact states, not episode
-- workflow states.
create or replace function public.guard_episode_workflow_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed boolean := false;
begin
  if new.workflow_state = old.workflow_state then
    return new;
  end if;

  allowed := case old.workflow_state
    when 'draft' then new.workflow_state in ('awaiting_confirmation', 'archived')
    when 'awaiting_confirmation' then new.workflow_state in ('draft', 'ready_for_review', 'archived')
    when 'ready_for_review' then new.workflow_state in ('awaiting_confirmation', 'in_review', 'archived')
    when 'in_review' then new.workflow_state in (
      'awaiting_confirmation',
      'ready_for_review',
      'resolved',
      'escalated',
      'archived'
    )
    when 'resolved' then new.workflow_state in ('awaiting_confirmation', 'in_review', 'archived')
    when 'escalated' then new.workflow_state in (
      'awaiting_confirmation',
      'in_review',
      'resolved',
      'archived'
    )
    when 'archived' then false
    else false
  end;

  if not allowed then
    raise exception 'Illegal SignalRx episode workflow transition: % -> %',
      old.workflow_state, new.workflow_state
      using errcode = 'check_violation';
  end if;

  new.workflow_state_changed_at := now();
  if new.workflow_state = 'in_review' and new.review_started_at is null then
    new.review_started_at := now();
  elsif new.workflow_state = 'resolved' and new.resolved_at is null then
    new.resolved_at := now();
  elsif new.workflow_state = 'escalated' and new.escalated_at is null then
    new.escalated_at := now();
  end if;

  return new;
end;
$$;

create trigger episodes_guard_workflow_transition
before update of workflow_state on public.episodes
for each row execute function public.guard_episode_workflow_transition();

-- Audit rows are append-only. Corrections are represented by a new event.
create or replace function public.prevent_audit_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'SignalRx audit events are append-only'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger audit_events_immutable
before update or delete on public.audit_events
for each row execute function public.prevent_audit_event_mutation();

-- Security-definer predicates centralise access checks and avoid recursive RLS
-- evaluation. They expose booleans only and set an empty search_path.
create or replace function public.is_organisation_member(
  target_organisation_id uuid,
  allowed_roles public.organisation_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = target_organisation_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and (
        allowed_roles is null
        or membership.role = any(allowed_roles)
      )
  );
$$;

create or replace function public.can_access_patient(target_patient_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.patient_profiles patient
      where patient.id = target_patient_profile_id
        and patient.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.patient_caregivers link
      join public.caregivers caregiver on caregiver.id = link.caregiver_id
      where link.patient_profile_id = target_patient_profile_id
        and caregiver.user_id = auth.uid()
        and link.status = 'active'
    )
    or exists (
      select 1
      from public.patient_profiles patient
      join public.organisation_memberships membership
        on membership.organisation_id = patient.primary_organisation_id
      where patient.id = target_patient_profile_id
        and membership.user_id = auth.uid()
        and membership.status = 'active'
        and membership.role in ('owner', 'admin', 'pharmacist', 'prescriber', 'reviewer')
    );
$$;

create or replace function public.can_access_episode(target_episode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.episodes episode
    where episode.id = target_episode_id
      and (
        public.can_access_patient(episode.patient_profile_id)
        or episode.assigned_reviewer_user_id = auth.uid()
        or public.is_organisation_member(episode.organisation_id)
      )
  );
$$;

create or replace function public.can_edit_episode(target_episode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.episodes episode
    where episode.id = target_episode_id
      and episode.workflow_state <> 'archived'
      and (
        exists (
          select 1
          from public.patient_profiles patient
          where patient.id = episode.patient_profile_id
            and patient.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.patient_caregivers link
          join public.caregivers caregiver on caregiver.id = link.caregiver_id
          where link.patient_profile_id = episode.patient_profile_id
            and caregiver.user_id = auth.uid()
            and link.status = 'active'
            and link.can_edit_medications
        )
        or public.is_organisation_member(
          episode.organisation_id,
          array['owner', 'admin', 'pharmacist', 'prescriber']::public.organisation_role[]
        )
      )
  );
$$;

create or replace function public.can_review_episode(target_episode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.episodes episode
    where episode.id = target_episode_id
      and (
        episode.assigned_reviewer_user_id = auth.uid()
        or public.is_organisation_member(
          episode.organisation_id,
          array['owner', 'admin', 'pharmacist', 'prescriber', 'reviewer']::public.organisation_role[]
        )
      )
  );
$$;

revoke all on function public.is_organisation_member(uuid, public.organisation_role[]) from public;
revoke all on function public.can_access_patient(uuid) from public;
revoke all on function public.can_access_episode(uuid) from public;
revoke all on function public.can_edit_episode(uuid) from public;
revoke all on function public.can_review_episode(uuid) from public;
grant execute on function public.is_organisation_member(uuid, public.organisation_role[]) to authenticated;
grant execute on function public.can_access_patient(uuid) to authenticated;
grant execute on function public.can_access_episode(uuid) to authenticated;
grant execute on function public.can_edit_episode(uuid) to authenticated;
grant execute on function public.can_review_episode(uuid) to authenticated;

-- Query indexes. Foreign-key columns are indexed explicitly because PostgreSQL
-- does not create those indexes automatically.
create index organisation_memberships_user_idx
  on public.organisation_memberships (user_id, status);
create index patient_profiles_primary_org_idx
  on public.patient_profiles (primary_organisation_id);
create index patient_caregivers_caregiver_idx
  on public.patient_caregivers (caregiver_id, status);
create index medication_concepts_ingredient_idx
  on public.medication_concepts (lower(ingredient_name));
create index medication_concepts_synonyms_gin_idx
  on public.medication_concepts using gin (synonyms);
create index medication_products_concept_idx
  on public.medication_products (medication_concept_id);
create index episodes_patient_state_idx
  on public.episodes (patient_profile_id, workflow_state, updated_at desc);
create index episodes_org_state_idx
  on public.episodes (organisation_id, workflow_state, updated_at desc);
create index episodes_reviewer_idx
  on public.episodes (assigned_reviewer_user_id, workflow_state);
create index medication_sources_episode_idx
  on public.medication_sources (episode_id, source_type);
create index medication_entries_episode_status_idx
  on public.medication_entries (episode_id, confirmation_status, current_status);
create index medication_entries_concept_idx
  on public.medication_entries (medication_concept_id);
create index medication_entries_product_idx
  on public.medication_entries (medication_product_id);
create index medication_entries_name_idx
  on public.medication_entries (lower(entered_name));
create index medication_entry_sources_source_idx
  on public.medication_entry_sources (medication_source_id);
create unique index medication_entry_single_primary_source_idx
  on public.medication_entry_sources (medication_entry_id)
  where is_primary;
create index field_provenance_entry_field_idx
  on public.field_provenance (medication_entry_id, field_name);
create index field_provenance_source_idx
  on public.field_provenance (medication_source_id);
create index conditions_episode_idx on public.conditions (episode_id);
create index observations_episode_type_time_idx
  on public.observations (episode_id, observation_type, observed_at desc);
create index medication_exposures_episode_time_idx
  on public.medication_exposures (episode_id, exposure_start, exposure_end);
create index medication_exposures_entry_idx
  on public.medication_exposures (medication_entry_id);
create index symptoms_episode_time_idx
  on public.symptoms (episode_id, started_at);
create index evidence_records_org_kind_idx
  on public.evidence_records (organisation_id, evidence_kind);
create index evidence_records_public_idx
  on public.evidence_records (is_public, evidence_kind)
  where is_public;
create index clinical_rules_org_status_idx
  on public.clinical_rules (organisation_id, status, code);
create index clinical_rule_evidence_evidence_idx
  on public.clinical_rule_evidence (evidence_record_id);
create index concerns_episode_status_idx
  on public.concerns (episode_id, status, ordinal);
create index concern_evidence_evidence_idx
  on public.concern_evidence (evidence_record_id);
create index reviews_episode_status_idx
  on public.reviews (episode_id, status, created_at desc);
create index reviews_reviewer_idx
  on public.reviews (reviewer_user_id, status);
create index review_actions_review_idx
  on public.review_actions (review_id, created_at);
create index review_actions_concern_idx
  on public.review_actions (concern_id);
create index timeline_events_episode_time_idx
  on public.timeline_events (episode_id, occurred_at, created_at);
create index consent_grants_patient_status_idx
  on public.consent_grants (patient_profile_id, status);
create index consent_grants_user_idx
  on public.consent_grants (granted_to_user_id, status);
create index consent_grants_org_idx
  on public.consent_grants (granted_to_organisation_id, status);
create index audit_events_episode_time_idx
  on public.audit_events (episode_id, occurred_at desc);
create index audit_events_patient_time_idx
  on public.audit_events (patient_profile_id, occurred_at desc);
create index audit_events_entity_idx
  on public.audit_events (entity_type, entity_id, occurred_at desc);
create index generated_artifacts_episode_kind_idx
  on public.generated_artifacts (episode_id, kind, status, version desc);

-- Enable RLS everywhere containing either identity, patient, clinical,
-- operational, or curated evidence data.
alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.caregivers enable row level security;
alter table public.patient_caregivers enable row level security;
alter table public.medication_concepts enable row level security;
alter table public.medication_products enable row level security;
alter table public.episodes enable row level security;
alter table public.medication_sources enable row level security;
alter table public.medication_entries enable row level security;
alter table public.medication_entry_sources enable row level security;
alter table public.field_provenance enable row level security;
alter table public.conditions enable row level security;
alter table public.observations enable row level security;
alter table public.medication_exposures enable row level security;
alter table public.symptoms enable row level security;
alter table public.evidence_records enable row level security;
alter table public.clinical_rules enable row level security;
alter table public.clinical_rule_evidence enable row level security;
alter table public.concerns enable row level security;
alter table public.concern_evidence enable row level security;
alter table public.reviews enable row level security;
alter table public.review_actions enable row level security;
alter table public.timeline_events enable row level security;
alter table public.consent_grants enable row level security;
alter table public.audit_events enable row level security;
alter table public.generated_artifacts enable row level security;

-- Identity: users own their app profile. Other display names should be copied
-- into patient-safe artifacts rather than widening profile visibility.
create policy profiles_select_self on public.profiles
for select to authenticated using (id = auth.uid());
create policy profiles_insert_self on public.profiles
for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Organisation tenants: active members can read their tenant; owner/admin
-- members manage it. The creator may bootstrap the first owner membership.
create policy organisations_select_member on public.organisations
for select to authenticated using (public.is_organisation_member(id) or created_by = auth.uid());
create policy organisations_insert_creator on public.organisations
for insert to authenticated with check (created_by = auth.uid());
create policy organisations_update_admin on public.organisations
for update to authenticated
using (
  public.is_organisation_member(
    id,
    array['owner', 'admin']::public.organisation_role[]
  )
)
with check (
  public.is_organisation_member(
    id,
    array['owner', 'admin']::public.organisation_role[]
  )
);
create policy organisation_memberships_select_scoped on public.organisation_memberships
for select to authenticated
using (user_id = auth.uid() or public.is_organisation_member(organisation_id));
create policy organisation_memberships_insert_admin on public.organisation_memberships
for insert to authenticated
with check (
  public.is_organisation_member(
    organisation_id,
    array['owner', 'admin']::public.organisation_role[]
  )
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1 from public.organisations organisation
      where organisation.id = organisation_id
        and organisation.created_by = auth.uid()
    )
  )
);
create policy organisation_memberships_update_admin on public.organisation_memberships
for update to authenticated
using (
  public.is_organisation_member(
    organisation_id,
    array['owner', 'admin']::public.organisation_role[]
  )
)
with check (
  public.is_organisation_member(
    organisation_id,
    array['owner', 'admin']::public.organisation_role[]
  )
);
create policy organisation_memberships_delete_admin on public.organisation_memberships
for delete to authenticated
using (
  public.is_organisation_member(
    organisation_id,
    array['owner', 'admin']::public.organisation_role[]
  )
);

-- Patient/caregiver scope: owner, active delegated caregiver, or treating
-- clinical organisation. Patient creation is allowed for self or clinical staff.
create policy patient_profiles_select_access on public.patient_profiles
for select to authenticated using (public.can_access_patient(id));
create policy patient_profiles_insert_scoped on public.patient_profiles
for insert to authenticated
with check (
  user_id = auth.uid()
  or public.is_organisation_member(
    primary_organisation_id,
    array['owner', 'admin', 'pharmacist', 'prescriber']::public.organisation_role[]
  )
);
create policy patient_profiles_update_access on public.patient_profiles
for update to authenticated
using (public.can_access_patient(id))
with check (public.can_access_patient(id));
create policy caregivers_select_self_or_patient on public.caregivers
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.patient_caregivers link
    where link.caregiver_id = id
      and public.can_access_patient(link.patient_profile_id)
  )
);
create policy caregivers_insert_self on public.caregivers
for insert to authenticated with check (user_id = auth.uid());
create policy caregivers_update_self on public.caregivers
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy patient_caregivers_select_access on public.patient_caregivers
for select to authenticated
using (public.can_access_patient(patient_profile_id));
create policy patient_caregivers_manage_patient on public.patient_caregivers
for all to authenticated
using (
  exists (
    select 1 from public.patient_profiles patient
    where patient.id = patient_profile_id and patient.user_id = auth.uid()
  )
  or exists (
    select 1 from public.patient_profiles patient
    where patient.id = patient_profile_id
      and public.is_organisation_member(
        patient.primary_organisation_id,
        array['owner', 'admin']::public.organisation_role[]
      )
  )
)
with check (
  exists (
    select 1 from public.patient_profiles patient
    where patient.id = patient_profile_id and patient.user_id = auth.uid()
  )
  or exists (
    select 1 from public.patient_profiles patient
    where patient.id = patient_profile_id
      and public.is_organisation_member(
        patient.primary_organisation_id,
        array['owner', 'admin']::public.organisation_role[]
      )
  )
);

-- Medication terminology is readable by every signed-in user. Client writes
-- are intentionally absent; catalog curation is service-role only.
create policy medication_concepts_read_authenticated on public.medication_concepts
for select to authenticated using (active);
create policy medication_products_read_authenticated on public.medication_products
for select to authenticated using (active);

-- Episode roots.
create policy episodes_select_access on public.episodes
for select to authenticated using (public.can_access_episode(id));
create policy episodes_insert_access on public.episodes
for insert to authenticated
with check (
  exists (
    select 1 from public.patient_profiles patient
    where patient.id = patient_profile_id and patient.user_id = auth.uid()
  )
  or public.is_organisation_member(
    organisation_id,
    array['owner', 'admin', 'pharmacist', 'prescriber']::public.organisation_role[]
  )
);
create policy episodes_update_access on public.episodes
for update to authenticated
using (public.can_edit_episode(id) or public.can_review_episode(id))
with check (public.can_edit_episode(id) or public.can_review_episode(id));

-- Patient-entered clinical records share a single episode access predicate.
create policy medication_sources_select_access on public.medication_sources
for select to authenticated using (public.can_access_episode(episode_id));
create policy medication_sources_insert_edit on public.medication_sources
for insert to authenticated with check (public.can_edit_episode(episode_id));
create policy medication_sources_update_edit on public.medication_sources
for update to authenticated
using (public.can_edit_episode(episode_id))
with check (public.can_edit_episode(episode_id));
create policy medication_sources_delete_edit on public.medication_sources
for delete to authenticated using (public.can_edit_episode(episode_id));

create policy medication_entries_select_access on public.medication_entries
for select to authenticated using (public.can_access_episode(episode_id));
create policy medication_entries_insert_edit on public.medication_entries
for insert to authenticated with check (public.can_edit_episode(episode_id));
create policy medication_entries_update_edit on public.medication_entries
for update to authenticated
using (public.can_edit_episode(episode_id))
with check (public.can_edit_episode(episode_id));
create policy medication_entries_delete_edit on public.medication_entries
for delete to authenticated using (public.can_edit_episode(episode_id));

create policy medication_entry_sources_select_access on public.medication_entry_sources
for select to authenticated
using (
  exists (
    select 1 from public.medication_entries entry
    where entry.id = medication_entry_id
      and public.can_access_episode(entry.episode_id)
  )
);
create policy medication_entry_sources_manage_edit on public.medication_entry_sources
for all to authenticated
using (
  exists (
    select 1 from public.medication_entries entry
    where entry.id = medication_entry_id
      and public.can_edit_episode(entry.episode_id)
  )
)
with check (
  exists (
    select 1 from public.medication_entries entry
    where entry.id = medication_entry_id
      and public.can_edit_episode(entry.episode_id)
  )
);

create policy field_provenance_select_access on public.field_provenance
for select to authenticated using (public.can_access_episode(episode_id));
create policy field_provenance_insert_edit on public.field_provenance
for insert to authenticated with check (public.can_edit_episode(episode_id));
-- Provenance is append-only to preserve how each field was obtained.

create policy conditions_select_access on public.conditions
for select to authenticated using (public.can_access_episode(episode_id));
create policy conditions_manage_edit on public.conditions
for all to authenticated
using (public.can_edit_episode(episode_id))
with check (public.can_edit_episode(episode_id));

create policy observations_select_access on public.observations
for select to authenticated using (public.can_access_episode(episode_id));
create policy observations_manage_edit on public.observations
for all to authenticated
using (public.can_edit_episode(episode_id))
with check (public.can_edit_episode(episode_id));

create policy medication_exposures_select_access on public.medication_exposures
for select to authenticated using (public.can_access_episode(episode_id));
create policy medication_exposures_manage_edit on public.medication_exposures
for all to authenticated
using (public.can_edit_episode(episode_id))
with check (public.can_edit_episode(episode_id));

create policy symptoms_select_access on public.symptoms
for select to authenticated using (public.can_access_episode(episode_id));
create policy symptoms_manage_edit on public.symptoms
for all to authenticated
using (public.can_edit_episode(episode_id))
with check (public.can_edit_episode(episode_id));

-- Evidence and clinical rules: public/global records and organisation-scoped
-- records are readable; organisation owner/admin/reviewer roles curate local data.
create policy evidence_records_select_scoped on public.evidence_records
for select to authenticated
using (
  is_public
  or organisation_id is null
  or public.is_organisation_member(organisation_id)
);
create policy evidence_records_manage_curator on public.evidence_records
for all to authenticated
using (
  organisation_id is not null
  and public.is_organisation_member(
    organisation_id,
    array['owner', 'admin', 'pharmacist', 'prescriber', 'reviewer']::public.organisation_role[]
  )
)
with check (
  organisation_id is not null
  and public.is_organisation_member(
    organisation_id,
    array['owner', 'admin', 'pharmacist', 'prescriber', 'reviewer']::public.organisation_role[]
  )
);

create policy clinical_rules_select_scoped on public.clinical_rules
for select to authenticated
using (
  (organisation_id is null and status = 'active')
  or public.is_organisation_member(organisation_id)
);
create policy clinical_rules_manage_curator on public.clinical_rules
for all to authenticated
using (
  organisation_id is not null
  and public.is_organisation_member(
    organisation_id,
    array['owner', 'admin', 'pharmacist', 'prescriber']::public.organisation_role[]
  )
)
with check (
  organisation_id is not null
  and public.is_organisation_member(
    organisation_id,
    array['owner', 'admin', 'pharmacist', 'prescriber']::public.organisation_role[]
  )
);

create policy clinical_rule_evidence_select_scoped on public.clinical_rule_evidence
for select to authenticated
using (
  exists (
    select 1 from public.clinical_rules rule
    where rule.id = clinical_rule_id
      and (
        (rule.organisation_id is null and rule.status = 'active')
        or public.is_organisation_member(rule.organisation_id)
      )
  )
);
create policy clinical_rule_evidence_manage_curator on public.clinical_rule_evidence
for all to authenticated
using (
  exists (
    select 1 from public.clinical_rules rule
    where rule.id = clinical_rule_id
      and rule.organisation_id is not null
      and public.is_organisation_member(
        rule.organisation_id,
        array['owner', 'admin', 'pharmacist', 'prescriber']::public.organisation_role[]
      )
  )
)
with check (
  exists (
    select 1 from public.clinical_rules rule
    where rule.id = clinical_rule_id
      and rule.organisation_id is not null
      and public.is_organisation_member(
        rule.organisation_id,
        array['owner', 'admin', 'pharmacist', 'prescriber']::public.organisation_role[]
      )
  )
);

-- Concerns are visible to episode participants, but only the review team or
-- service role can create and adjudicate them.
create policy concerns_select_access on public.concerns
for select to authenticated using (public.can_access_episode(episode_id));
create policy concerns_manage_reviewer on public.concerns
for all to authenticated
using (public.can_review_episode(episode_id))
with check (public.can_review_episode(episode_id));

create policy concern_evidence_select_access on public.concern_evidence
for select to authenticated
using (
  exists (
    select 1 from public.concerns concern
    where concern.id = concern_id
      and public.can_access_episode(concern.episode_id)
  )
);
create policy concern_evidence_manage_reviewer on public.concern_evidence
for all to authenticated
using (
  exists (
    select 1 from public.concerns concern
    where concern.id = concern_id
      and public.can_review_episode(concern.episode_id)
  )
)
with check (
  exists (
    select 1 from public.concerns concern
    where concern.id = concern_id
      and public.can_review_episode(concern.episode_id)
  )
);

create policy reviews_select_access on public.reviews
for select to authenticated using (public.can_access_episode(episode_id));
create policy reviews_manage_reviewer on public.reviews
for all to authenticated
using (public.can_review_episode(episode_id))
with check (
  public.can_review_episode(episode_id)
  and reviewer_user_id = auth.uid()
);

create policy review_actions_select_access on public.review_actions
for select to authenticated using (public.can_access_episode(episode_id));
create policy review_actions_manage_reviewer on public.review_actions
for all to authenticated
using (public.can_review_episode(episode_id))
with check (
  public.can_review_episode(episode_id)
  and reviewer_user_id = auth.uid()
);

-- Timeline text is shared with the patient; edits require episode edit access.
-- causality_asserted is explicit so rendering code can avoid implying causation.
create policy timeline_events_select_access on public.timeline_events
for select to authenticated using (public.can_access_episode(episode_id));
create policy timeline_events_manage_edit on public.timeline_events
for all to authenticated
using (public.can_edit_episode(episode_id) or public.can_review_episode(episode_id))
with check (public.can_edit_episode(episode_id) or public.can_review_episode(episode_id));

-- Consent can be inspected by the patient/grantor, grantee, or organisation
-- admins. Only the patient/grantor may create, change, or revoke a grant.
create policy consent_grants_select_scoped on public.consent_grants
for select to authenticated
using (
  granted_by_user_id = auth.uid()
  or granted_to_user_id = auth.uid()
  or public.can_access_patient(patient_profile_id)
  or public.is_organisation_member(
    granted_to_organisation_id,
    array['owner', 'admin']::public.organisation_role[]
  )
);
create policy consent_grants_insert_patient on public.consent_grants
for insert to authenticated
with check (
  granted_by_user_id = auth.uid()
  and exists (
    select 1 from public.patient_profiles patient
    where patient.id = patient_profile_id and patient.user_id = auth.uid()
  )
);
create policy consent_grants_update_patient on public.consent_grants
for update to authenticated
using (granted_by_user_id = auth.uid())
with check (granted_by_user_id = auth.uid());

-- Audit is readable within the episode/tenant scope, insertable only as the
-- current actor, and immutable after insert. System/service-role writes use a
-- null actor or the dedicated system profile while bypassing RLS.
create policy audit_events_select_access on public.audit_events
for select to authenticated
using (
  (episode_id is not null and public.can_access_episode(episode_id))
  or (patient_profile_id is not null and public.can_access_patient(patient_profile_id))
  or (organisation_id is not null and public.is_organisation_member(organisation_id))
);
create policy audit_events_insert_actor on public.audit_events
for insert to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    (episode_id is not null and public.can_access_episode(episode_id))
    or (patient_profile_id is not null and public.can_access_patient(patient_profile_id))
    or (organisation_id is not null and public.is_organisation_member(organisation_id))
  )
);

-- Generated plans/exports are visible to episode participants. Only reviewers
-- can approve/publish them; draft creation is also kept within the review team.
create policy generated_artifacts_select_access on public.generated_artifacts
for select to authenticated using (public.can_access_episode(episode_id));
create policy generated_artifacts_manage_reviewer on public.generated_artifacts
for all to authenticated
using (public.can_review_episode(episode_id))
with check (
  public.can_review_episode(episode_id)
  and (
    generated_by_user_id = auth.uid()
    or approved_by_user_id = auth.uid()
  )
);

comment on table public.patient_profiles is
  'Patient identity and accessibility profile. RLS: patient, delegated caregiver, or treating clinical organisation.';
comment on table public.episodes is
  'Medication-reconciliation episode governed by guard_episode_workflow_transition and episode-scoped RLS.';
comment on table public.medication_sources is
  'Immutable source identity plus processing output; storage objects remain protected by matching Storage policies.';
comment on table public.field_provenance is
  'Append-only field-level lineage linking extracted or edited values to their source and method.';
comment on table public.concerns is
  'Maximum three ranked concerns per episode, enforced by ordinal 1..3 and uniqueness.';
comment on table public.audit_events is
  'Append-only audit log. No UPDATE or DELETE RLS policy is granted.';
comment on table public.generated_artifacts is
  'Versioned patient plans and exports. Approval and publication require a clinical reviewer.';

commit;
