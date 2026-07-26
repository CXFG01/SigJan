alter table public.intake_jobs
  add column progress_stage text not null default 'queued'
    check (progress_stage in (
      'queued',
      'reading_sources',
      'extracting_facts',
      'organising_suggestions',
      'retrying',
      'ready',
      'failed'
    )),
  add column progress_detail text,
  add column progress_updated_at timestamptz not null default now();

comment on column public.intake_jobs.progress_stage is
  'Patient-visible operational stage. Never store model reasoning or source contents here.';
