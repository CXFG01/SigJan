-- Deterministic interaction knowledge plus immutable, patient-owned
-- investigation runs. Reference data is readable by signed-in adults but only
-- the service role imports or changes it.

create type public.interaction_run_kind as enum (
  'deterministic_check', 'pair_investigation', 'lifestyle_investigation'
);
create type public.interaction_run_status as enum (
  'queued', 'running', 'completed', 'failed', 'interrupted'
);
create type public.interaction_finding_type as enum (
  'documented_concern', 'research_lead', 'could_not_assess'
);

create table public.interaction_source_releases (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  version text not null,
  source_url text not null,
  licence text not null,
  record_count integer,
  imported_at timestamptz not null default now(),
  active boolean not null default true,
  unique (source_key, version)
);

create table public.medicine_identity_cache (
  id uuid primary key default gen_random_uuid(),
  namespace text not null check (namespace in ('dmd', 'rxnorm', 'curated')),
  code text not null,
  canonical_name text not null,
  normalized_name text not null,
  ingredient_name text not null,
  ingredient_normalized text not null,
  therapeutic_class text,
  jurisdiction text not null,
  aliases text[] not null default '{}',
  source_release_id uuid references public.interaction_source_releases(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (namespace, code)
);
create index medicine_identity_aliases_idx
  on public.medicine_identity_cache using gin (aliases);
create index medicine_identity_normalized_idx
  on public.medicine_identity_cache (normalized_name);

create table public.ddi_interactions (
  id uuid primary key default gen_random_uuid(),
  source_release_id uuid not null references public.interaction_source_releases(id) on delete restrict,
  external_record_id text not null,
  factor_a text not null,
  factor_a_normalized text not null,
  factor_b text not null,
  factor_b_normalized text not null,
  severity text not null check (severity in ('Major', 'Moderate', 'Minor', 'Unknown')),
  created_at timestamptz not null default now(),
  unique (source_release_id, external_record_id, factor_a_normalized, factor_b_normalized),
  check (factor_a_normalized < factor_b_normalized)
);
create index ddi_factor_pair_idx
  on public.ddi_interactions (factor_a_normalized, factor_b_normalized);

create table public.lifestyle_interaction_rules (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  factor_a_normalized text not null,
  factor_b_normalized text not null,
  title text not null,
  severity text not null check (severity in ('major', 'moderate', 'low', 'unknown')),
  concern text not null,
  source_url text not null,
  source_organization text not null,
  jurisdiction text not null,
  reviewed_on date not null,
  active boolean not null default true,
  unique (version, factor_a_normalized, factor_b_normalized),
  check (factor_a_normalized < factor_b_normalized)
);

create table public.interaction_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.interaction_run_kind not null,
  status public.interaction_run_status not null default 'queued',
  assessment_time timestamptz not null default now(),
  graph_snapshot jsonb not null default '{}'::jsonb,
  graph_snapshot_hash text not null,
  model text,
  prompt_version text not null,
  source_policy_version text not null,
  validation_failures jsonb not null default '[]'::jsonb,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  failure_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index interaction_runs_user_created_idx
  on public.interaction_runs (user_id, created_at desc);

create table public.interaction_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.interaction_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  finding_type public.interaction_finding_type not null,
  trigger_type text not null check (
    trigger_type in ('ddinter', 'curated_rule', 'duplicate_ingredient',
      'duplicate_class', 'agent_research_lead', 'unresolved_identity')
  ),
  factor_refs text[] not null,
  factor_names text[] not null,
  canonical_names text[] not null default '{}',
  source_severity text,
  evidence_state text check (
    evidence_state is null or evidence_state in (
      'established', 'context_dependent', 'conflicting', 'insufficient'
    )
  ),
  evidence_strength text check (
    evidence_strength is null or evidence_strength in (
      'high', 'moderate', 'low', 'insufficient'
    )
  ),
  deterministic_source jsonb,
  structured_brief jsonb,
  publication_status text not null default 'pending'
    check (publication_status in ('pending', 'validated', 'rejected')),
  created_at timestamptz not null default now()
);
create index interaction_findings_run_idx on public.interaction_findings (run_id);

create table public.interaction_sources (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.interaction_runs(id) on delete cascade,
  finding_id uuid references public.interaction_findings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_ref text not null,
  url text not null,
  title text not null,
  organization text not null,
  domain text not null,
  source_type text not null check (
    source_type in ('primary_label', 'regulator', 'guideline',
      'peer_reviewed', 'other_authoritative')
  ),
  jurisdiction text not null,
  publication_or_update_date date,
  retrieved_at timestamptz not null default now(),
  unique (run_id, source_ref)
);

create table public.interaction_trace_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.interaction_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  event_type text not null check (
    event_type in (
      'run_started', 'graph_prepared', 'factor_pair_selected',
      'search_started', 'source_discovered', 'source_reviewed',
      'reasoning_summary_delta', 'evidence_conflict_found',
      'validation_started', 'finding_validated', 'run_completed', 'run_failed'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, sequence)
);

create table public.interaction_pair_reports (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null,
  factor_a_normalized text not null,
  factor_b_normalized text not null,
  jurisdiction text not null,
  model text not null,
  prompt_version text not null,
  source_policy_version text not null,
  report jsonb not null,
  source_urls text[] not null,
  validation_status text not null check (validation_status in ('validated', 'rejected')),
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  unique (pair_key, jurisdiction, prompt_version, source_policy_version)
);

alter table public.interaction_source_releases enable row level security;
alter table public.medicine_identity_cache enable row level security;
alter table public.ddi_interactions enable row level security;
alter table public.lifestyle_interaction_rules enable row level security;
alter table public.interaction_runs enable row level security;
alter table public.interaction_findings enable row level security;
alter table public.interaction_sources enable row level security;
alter table public.interaction_trace_events enable row level security;
alter table public.interaction_pair_reports enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'interaction_source_releases', 'medicine_identity_cache',
    'ddi_interactions', 'lifestyle_interaction_rules', 'interaction_pair_reports'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (coalesce(((select auth.jwt())->>''is_anonymous'')::boolean, false) = false)',
      t || '_read', t
    );
    execute format('revoke insert, update, delete on public.%I from authenticated, anon', t);
  end loop;

  foreach t in array array[
    'interaction_runs', 'interaction_findings',
    'interaction_sources', 'interaction_trace_events'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id and coalesce(((select auth.jwt())->>''is_anonymous'')::boolean, false) = false)',
      t || '_select_own', t
    );
    execute format('revoke insert, update, delete on public.%I from authenticated, anon', t);
  end loop;
end $$;

revoke all on table public.interaction_source_releases from anon;
revoke all on table public.medicine_identity_cache from anon;
revoke all on table public.ddi_interactions from anon;
revoke all on table public.lifestyle_interaction_rules from anon;
revoke all on table public.interaction_pair_reports from anon;
revoke all on table public.interaction_runs from anon;
revoke all on table public.interaction_findings from anon;
revoke all on table public.interaction_sources from anon;
revoke all on table public.interaction_trace_events from anon;

-- Small, attributed hackathon seed. The importer can replace this with a full
-- versioned DDInter snapshot without changing screening code.
insert into public.interaction_source_releases
  (source_key, version, source_url, licence, record_count)
values
  ('ddinter', '2.0-hackathon-seed',
   'https://ddinter2.scbdd.com/download/', 'CC BY-NC-SA 4.0', 1),
  ('signalrx-curated-lifestyle', '2026-07-26',
   'https://www.nhs.uk/medicines/', 'Source-specific attribution', 2);

insert into public.ddi_interactions (
  source_release_id, external_record_id, factor_a, factor_a_normalized,
  factor_b, factor_b_normalized, severity
)
select id, 'DDInter108-DDInter900', 'Apixaban', 'apixaban',
  'Ibuprofen', 'ibuprofen', 'Major'
from public.interaction_source_releases
where source_key = 'ddinter' and version = '2.0-hackathon-seed';

insert into public.medicine_identity_cache (
  namespace, code, canonical_name, normalized_name, ingredient_name,
  ingredient_normalized, therapeutic_class, jurisdiction, aliases,
  source_release_id
)
select 'curated', seed.code, seed.canonical_name, seed.normalized_name,
  seed.ingredient_name, seed.ingredient_normalized, seed.therapeutic_class,
  'GB', seed.aliases, release.id
from public.interaction_source_releases release
cross join (values
  ('apixaban', 'Apixaban', 'apixaban', 'Apixaban', 'apixaban',
    'anticoagulant', array['Eliquis']),
  ('ibuprofen', 'Ibuprofen', 'ibuprofen', 'Ibuprofen', 'ibuprofen',
    'nsaid', array['Nurofen', 'Advil']),
  ('simvastatin', 'Simvastatin', 'simvastatin', 'Simvastatin', 'simvastatin',
    'statin', array['Zocor']),
  ('metronidazole', 'Metronidazole', 'metronidazole', 'Metronidazole',
    'metronidazole', 'nitroimidazole antimicrobial', array['Flagyl'])
) as seed(
  code, canonical_name, normalized_name, ingredient_name,
  ingredient_normalized, therapeutic_class, aliases
)
where release.source_key = 'signalrx-curated-lifestyle'
  and release.version = '2026-07-26';

insert into public.lifestyle_interaction_rules (
  version, factor_a_normalized, factor_b_normalized, title, severity, concern,
  source_url, source_organization, jurisdiction, reviewed_on
) values
  ('2026-07-26', 'grapefruit juice', 'simvastatin',
   'Grapefruit juice can affect simvastatin', 'moderate',
   'Grapefruit juice can increase the amount of simvastatin in the blood and make side effects more likely.',
   'https://www.nhs.uk/medicines/simvastatin/common-questions-about-simvastatin/',
   'NHS', 'GB', '2026-07-26'),
  ('2026-07-26', 'alcohol', 'metronidazole',
   'Alcohol should be avoided with metronidazole', 'moderate',
   'Alcohol can cause an unpleasant reaction during metronidazole treatment and for two days afterwards.',
   'https://www.nhs.uk/medicines/metronidazole/about-metronidazole/',
   'NHS', 'GB', '2026-07-26');
