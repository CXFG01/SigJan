create extension if not exists pgcrypto;
create extension if not exists pgmq;

create type public.health_item_type as enum (
  'prescribed_medication', 'otc_medication', 'supplement', 'herb',
  'condition', 'symptom', 'laboratory_marker', 'lifestyle_factor',
  'appointment', 'healthcare_contact'
);
create type public.confirmation_state as enum ('candidate', 'confirmed', 'rejected');
create type public.intake_status as enum ('queued', 'processing', 'needs_review', 'completed', 'failed');
create type public.dose_event_status as enum ('taken', 'skipped', 'taken_late');

create table public.health_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_name text not null check (char_length(preferred_name) between 1 and 80),
  family_name text,
  date_of_birth date not null,
  uk_resident boolean not null check (uk_resident),
  adult_confirmed boolean not null check (adult_confirmed),
  timezone text not null,
  privacy_accepted_at timestamptz not null,
  health_data_consent_at timestamptz not null,
  sex text,
  weight_kg numeric(6,2),
  accessibility_needs text,
  emergency_contact jsonb,
  freeform_about text,
  onboarding_completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_of_birth <= (current_date - interval '18 years')::date)
);

create table public.source_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('text','document','photo','voice_note','realtime_voice')),
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 1 and 26214400),
  storage_path text,
  sha256 text,
  transcript text,
  original_text text,
  processing_metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, sha256)
);

create table public.intake_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  status public.intake_status not null default 'queued',
  idempotency_key text not null,
  attempt_count integer not null default 0,
  failure_code text,
  failure_detail text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create table public.intake_job_artifacts (
  user_id uuid not null references auth.users(id) on delete cascade,
  intake_job_id uuid not null references public.intake_jobs(id) on delete cascade,
  artifact_id uuid not null references public.source_artifacts(id) on delete cascade,
  primary key (intake_job_id, artifact_id)
);

create table public.extraction_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intake_job_id uuid not null references public.intake_jobs(id) on delete cascade,
  method text not null,
  model text not null,
  model_version text,
  prompt_version text not null,
  schema_version text not null,
  status text not null check (status in ('started','succeeded','failed','refused')),
  token_input integer,
  token_output integer,
  latency_ms integer,
  failure_code text,
  created_at timestamptz not null default now()
);

create table public.candidate_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intake_job_id uuid not null references public.intake_jobs(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete set null,
  item_type public.health_item_type not null,
  original_wording text not null,
  normalized_wording text not null,
  details jsonb not null default '{}'::jsonb,
  source_excerpt text,
  source_locator text,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  uncertainty text,
  confirmation_state public.confirmation_state not null default 'candidate',
  correction_history jsonb not null default '[]'::jsonb,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.health_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type public.health_item_type not null,
  display_name text not null,
  normalized_name text not null,
  status text not null default 'active' check (status in ('active','inactive','resolved','archived')),
  details jsonb not null default '{}'::jsonb,
  dmd_code text,
  dmd_match_state text not null default 'unmatched'
    check (dmd_match_state in ('matched','unmatched','uncertain','not_applicable')),
  starts_on date,
  ends_on date,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index health_items_user_type_idx on public.health_items(user_id, item_type, status);

create table public.health_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_item_id uuid not null references public.health_items(id) on delete cascade,
  to_item_id uuid not null references public.health_items(id) on delete cascade,
  relationship_type text not null check (
    relationship_type in ('user_reported_purpose','documented_relationship','source_membership','measurement','temporal_overlap')
  ),
  certainty text not null check (certainty in ('user_reported','documented','deterministic')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (from_item_id <> to_item_id)
);

create table public.fact_provenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_item_id uuid not null references public.health_items(id) on delete cascade,
  candidate_fact_id uuid references public.candidate_facts(id) on delete set null,
  source_artifact_id uuid references public.source_artifacts(id) on delete set null,
  original_wording text not null,
  normalized_wording text not null,
  source_excerpt text,
  source_locator text,
  extraction_method text,
  model text,
  prompt_version text,
  schema_version text,
  confidence numeric(4,3),
  correction jsonb,
  confirmed_at timestamptz not null default now()
);

create table public.medication_regimens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_item_id uuid not null references public.health_items(id) on delete cascade,
  strength text,
  route text,
  instructions text,
  quantity numeric(10,3),
  quantity_unit text,
  starts_on date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.schedule_segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  regimen_id uuid not null references public.medication_regimens(id) on delete cascade,
  kind text not null check (kind in ('fixed_time','day_of_week','interval','short_course','taper','prn')),
  starts_on date not null,
  ends_on date,
  local_times time[] not null default '{}',
  weekdays smallint[] not null default '{}',
  interval_hours numeric(8,2),
  dose_amount numeric(10,3),
  max_daily_dose numeric(10,3),
  sequence integer not null default 0,
  details jsonb not null default '{}'::jsonb
);

create table public.dose_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  regimen_id uuid not null references public.medication_regimens(id) on delete cascade,
  schedule_segment_id uuid references public.schedule_segments(id) on delete set null,
  scheduled_for timestamptz not null,
  status public.dose_event_status not null,
  occurred_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, regimen_id, scheduled_for)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_item_id uuid references public.health_items(id) on delete set null,
  title text not null,
  event_type text not null check (event_type in ('appointment','follow_up','reminder','other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.prescription_reconciliations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intake_job_id uuid not null references public.intake_jobs(id) on delete cascade,
  proposal jsonb not null,
  status text not null default 'proposed' check (status in ('proposed','confirmed','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  regimen_id uuid not null references public.medication_regimens(id) on delete cascade,
  received_on date not null,
  quantity numeric(10,3) not null check (quantity > 0),
  unit text not null,
  source_artifact_id uuid references public.source_artifacts(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inventory_lot_id uuid not null references public.inventory_lots(id) on delete cascade,
  amount numeric(10,3) not null,
  reason text not null,
  occurred_at timestamptz not null default now()
);

create table public.reminder_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  regimen_id uuid references public.medication_regimens(id) on delete cascade,
  calendar_event_id uuid references public.calendar_events(id) on delete cascade,
  kind text not null check (kind in ('dose','run_out','repeat_prescription','appointment','follow_up')),
  channels text[] not null default array['in_app'],
  lead_working_days integer,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_rule_id uuid not null references public.reminder_rules(id) on delete cascade,
  channel text not null check (channel in ('in_app','email')),
  scheduled_for timestamptz not null,
  delivered_at timestamptz,
  status text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  idempotency_key text not null unique,
  failure_code text
);

create table public.content_snapshots (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  code text not null,
  organisation text not null,
  source_url text not null,
  source_updated_at timestamptz,
  retrieved_at timestamptz not null default now(),
  version text,
  title text not null,
  content jsonb not null,
  expires_at timestamptz not null,
  unique(content_type, code, version)
);

create table public.yellow_card_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symptom_item_id uuid not null references public.health_items(id) on delete cascade,
  suspected_medicine_ids uuid[] not null,
  draft jsonb not null,
  user_suspects_medicine boolean not null check (user_suspects_medicine),
  status text not null default 'draft' check (status in ('draft','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.health_audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

select pgmq.create('intake_processing');

create or replace function public.enqueue_intake_job(job_id uuid, owner_id uuid)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select pgmq.send(
    'intake_processing',
    jsonb_build_object('job_id', job_id, 'user_id', owner_id)
  );
$$;
revoke all on function public.enqueue_intake_job(uuid, uuid) from public, anon, authenticated;
grant execute on function public.enqueue_intake_job(uuid, uuid) to service_role;

create or replace function public.read_intake_queue(batch_size integer default 5)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(message)), '[]'::jsonb)
  from pgmq.read('intake_processing', 60, least(greatest(batch_size, 1), 20)) as message;
$$;
revoke all on function public.read_intake_queue(integer) from public, anon, authenticated;
grant execute on function public.read_intake_queue(integer) to service_role;

create or replace function public.archive_intake_message(message_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.archive('intake_processing', message_id);
$$;
revoke all on function public.archive_intake_message(bigint) from public, anon, authenticated;
grant execute on function public.archive_intake_message(bigint) to service_role;

create or replace function public.confirm_intake_candidates(
  owner_id uuid,
  target_job_id uuid,
  decisions jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  decision jsonb;
  candidate public.candidate_facts%rowtype;
  new_item_id uuid;
  new_regimen_id uuid;
  confirmed_count integer := 0;
begin
  if not exists (
    select 1 from public.intake_jobs
    where id = target_job_id and user_id = owner_id
  ) then
    raise exception 'intake not found';
  end if;

  for decision in select * from jsonb_array_elements(decisions)
  loop
    select * into candidate
    from public.candidate_facts
    where id = (decision->>'candidateId')::uuid
      and intake_job_id = target_job_id
      and user_id = owner_id
      and confirmation_state = 'candidate'
    for update;

    if not found then continue; end if;

    if decision->>'action' = 'reject' then
      update public.candidate_facts
      set confirmation_state = 'rejected', reviewed_at = now()
      where id = candidate.id;
      continue;
    end if;

    insert into public.health_items (
      user_id, item_type, display_name, normalized_name, details,
      dmd_match_state, starts_on, ends_on
    ) values (
      owner_id,
      candidate.item_type,
      coalesce(decision->'corrected'->>'originalWording', candidate.original_wording),
      coalesce(decision->'corrected'->>'normalizedWording', candidate.normalized_wording),
      coalesce(decision->'corrected'->'details', candidate.details),
      case when candidate.item_type in ('prescribed_medication','otc_medication')
        then 'unmatched' else 'not_applicable' end,
      nullif(coalesce(decision->'corrected'->'details'->>'startsOn', candidate.details->>'startsOn'), '')::date,
      nullif(coalesce(decision->'corrected'->'details'->>'endsOn', candidate.details->>'endsOn'), '')::date
    )
    returning id into new_item_id;

    if candidate.item_type in ('prescribed_medication','otc_medication') then
      insert into public.medication_regimens (
        user_id, health_item_id, strength, route, instructions, quantity,
        quantity_unit, starts_on, ends_on
      ) values (
        owner_id,
        new_item_id,
        candidate.details->>'strength',
        candidate.details->>'route',
        coalesce(candidate.details->>'instructions', candidate.details->>'schedule'),
        case when coalesce(candidate.details->>'quantity', '') ~ '^[0-9]+(\.[0-9]+)?$'
          then (candidate.details->>'quantity')::numeric else null end,
        candidate.details->>'quantity_unit',
        nullif(coalesce(candidate.details->>'starts_on', candidate.details->>'startsOn'), '')::date,
        nullif(coalesce(candidate.details->>'ends_on', candidate.details->>'endsOn'), '')::date
      )
      returning id into new_regimen_id;

      if candidate.details ? 'daily_dose'
        and coalesce(candidate.details->>'daily_dose', '') ~ '^[0-9]+(\.[0-9]+)?$'
      then
        insert into public.schedule_segments (
          user_id, regimen_id, kind, starts_on, dose_amount, details
        ) values (
          owner_id, new_regimen_id, 'fixed_time',
          coalesce(
            nullif(coalesce(candidate.details->>'starts_on', candidate.details->>'startsOn'), '')::date,
            current_date
          ),
          (candidate.details->>'daily_dose')::numeric,
          jsonb_build_object('daily_dose', candidate.details->>'daily_dose')
        );
      end if;

      if candidate.details ? 'quantity' then
        insert into public.reminder_rules (
          user_id, regimen_id, kind, channels, lead_working_days
        ) values (
          owner_id, new_regimen_id, 'repeat_prescription', array['in_app','email'], 5
        );
      end if;
    end if;

    insert into public.fact_provenance (
      user_id, health_item_id, candidate_fact_id, source_artifact_id,
      original_wording, normalized_wording, source_excerpt, source_locator,
      extraction_method, model, prompt_version, schema_version, confidence, correction
    )
    select
      owner_id, new_item_id, candidate.id, ija.artifact_id,
      candidate.original_wording, candidate.normalized_wording,
      candidate.source_excerpt, candidate.source_locator,
      er.method, er.model, er.prompt_version, er.schema_version,
      candidate.confidence, decision->'corrected'
    from public.extraction_runs er
    left join public.intake_job_artifacts ija on ija.intake_job_id = target_job_id
    where er.id = candidate.extraction_run_id
    limit 1;

    update public.candidate_facts
    set
      confirmation_state = 'confirmed',
      reviewed_at = now(),
      correction_history = case
        when decision ? 'corrected' then correction_history || jsonb_build_array(
          jsonb_build_object('at', now(), 'changes', decision->'corrected')
        )
        else correction_history
      end
    where id = candidate.id;
    confirmed_count := confirmed_count + 1;
  end loop;

  update public.intake_jobs
  set status = 'completed', completed_at = now()
  where id = target_job_id and user_id = owner_id
    and not exists (
      select 1 from public.candidate_facts
      where intake_job_id = target_job_id and confirmation_state = 'candidate'
    );

  insert into public.health_audit_events(user_id, event_type, entity_type, entity_id, metadata)
  values (owner_id, 'intake_candidates_reviewed', 'intake_job', target_job_id,
    jsonb_build_object('confirmed_count', confirmed_count));
  return confirmed_count;
end;
$$;
revoke all on function public.confirm_intake_candidates(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_intake_candidates(uuid, uuid, jsonb) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'health-sources', 'health-sources', false, 26214400,
  array[
    'application/pdf','image/jpeg','image/png','image/webp','image/heic',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain','text/csv','application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/webm','audio/mpeg','audio/mp4','audio/wav'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare t text;
begin
  foreach t in array array[
    'health_profiles','source_artifacts','intake_jobs','intake_job_artifacts',
    'extraction_runs','candidate_facts','health_items','health_relationships',
    'fact_provenance','medication_regimens','schedule_segments','dose_events',
    'calendar_events','prescription_reconciliations','inventory_lots',
    'inventory_adjustments','reminder_rules','reminder_deliveries',
    'yellow_card_drafts'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id and coalesce(((select auth.jwt())->>''is_anonymous'')::boolean, false) = false)',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id and coalesce(((select auth.jwt())->>''is_anonymous'')::boolean, false) = false)',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id and coalesce(((select auth.jwt())->>''is_anonymous'')::boolean, false) = false) with check ((select auth.uid()) = user_id and coalesce(((select auth.jwt())->>''is_anonymous'')::boolean, false) = false)',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id and coalesce(((select auth.jwt())->>''is_anonymous'')::boolean, false) = false)',
      t || '_delete_own', t
    );
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end $$;

alter table public.content_snapshots enable row level security;
create policy content_snapshots_read on public.content_snapshots
  for select to authenticated using (
    coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  );
revoke all on table public.content_snapshots from anon;
grant select on table public.content_snapshots to authenticated;

alter table public.health_audit_events enable row level security;
create policy health_audit_events_select_own on public.health_audit_events
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  );
revoke all on table public.health_audit_events from anon, authenticated;
grant select on table public.health_audit_events to authenticated;

create policy health_sources_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'health-sources'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  );
create policy health_sources_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'health-sources'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  );
create policy health_sources_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'health-sources'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  )
  with check (
    bucket_id = 'health-sources'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  );
create policy health_sources_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'health-sources'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  );

revoke execute on all functions in schema public from public, anon, authenticated;
