-- Rebuild patient-owned RLS policies so Auth calls are evaluated once per
-- statement, and ensure anonymous Auth users cannot mutate private objects.

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
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
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
  end loop;
end $$;

drop policy if exists content_snapshots_read on public.content_snapshots;
create policy content_snapshots_read on public.content_snapshots
  for select to authenticated
  using (coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false);

drop policy if exists health_audit_events_select_own on public.health_audit_events;
create policy health_audit_events_select_own on public.health_audit_events
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  );

drop policy if exists health_sources_select_own on storage.objects;
drop policy if exists health_sources_insert_own on storage.objects;
drop policy if exists health_sources_update_own on storage.objects;
drop policy if exists health_sources_delete_own on storage.objects;

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

-- Add a covering index for every currently unindexed foreign key. Index names
-- derive from the constraint, keeping this deterministic across environments.
do $$
declare
  fk record;
  indexed_columns text;
begin
  for fk in
    select c.oid, c.conname, c.conrelid, c.conkey, n.nspname, rel.relname
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where c.contype = 'f'
      and n.nspname = 'public'
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and i.indpred is null
          and (i.indkey::smallint[])[0:array_length(c.conkey, 1) - 1] = c.conkey
      )
  loop
    select string_agg(format('%I', a.attname), ', ' order by key_column.ordinality)
      into indexed_columns
    from unnest(fk.conkey) with ordinality as key_column(attnum, ordinality)
    join pg_attribute a
      on a.attrelid = fk.conrelid
     and a.attnum = key_column.attnum;

    execute format(
      'create index if not exists %I on %I.%I (%s)',
      left(fk.conname || '_idx', 63),
      fk.nspname,
      fk.relname,
      indexed_columns
    );
  end loop;
end $$;
