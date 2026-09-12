-- Separate, server-only infrastructure. Existing personal records are untouched.
create table public.checker_runs (
  token_hash text primary key,
  request_hash text not null,
  result jsonb not null,
  cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 hour'
);
create table public.checker_jobs (
  id uuid primary key default gen_random_uuid(),
  run_hash text not null references public.checker_runs(token_hash) on delete cascade,
  pair_id text not null,
  priority integer not null,
  status text not null default 'queued',
  session_id text,
  started_at timestamptz,
  lease_until timestamptz,
  report jsonb,
  message text,
  unique(run_hash, pair_id)
);
create table public.checker_counters (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);
alter table public.checker_runs enable row level security;
alter table public.checker_jobs enable row level security;
alter table public.checker_counters enable row level security;
revoke all on public.checker_runs, public.checker_jobs, public.checker_counters from public, anon, authenticated;
grant all on public.checker_runs, public.checker_jobs, public.checker_counters to service_role;
create index checker_jobs_queue on public.checker_jobs(status, priority);

create function public.checker_take_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  if p_limit <= 0 then return false; end if;
  insert into public.checker_counters as c(key,count,expires_at)
  values (p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set
    count=case when c.expires_at<=now() then 1 else c.count+1 end,
    expires_at=case when c.expires_at<=now() then now()+make_interval(secs=>p_seconds) else c.expires_at end
  where c.expires_at<=now() or c.count<p_limit
  returning count into n;
  return n is not null;
end $$;

create function public.checker_create_run(p_hash text, p_request text, p_result jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare inserted integer;
begin
  insert into public.checker_runs(token_hash,request_hash,result) values(p_hash,p_request,p_result)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted=0 then return false; end if;
  insert into public.checker_jobs(run_hash,pair_id,priority)
  select p_hash,p->>'id',case p->>'reason' when 'conflicting' then 0 when 'incomplete' then 1 else 2 end
  from jsonb_array_elements(p_result->'pairs') p where p->>'research'='queued';
  return true;
end $$;

create function public.checker_claim_job(p_daily_limit integer)
returns setof public.checker_jobs language plpgsql security invoker set search_path = '' as $$
declare job public.checker_jobs;
begin
  perform pg_advisory_xact_lock(772901);
  if (select count(*) from public.checker_jobs where status='running' or session_id is not null)>=2 then return; end if;
  select j.* into job from public.checker_jobs j join public.checker_runs r on r.token_hash=j.run_hash
  where j.status='queued' and not r.cancelled and r.expires_at>now()
  order by j.priority,r.created_at for update of j skip locked limit 1;
  if job.id is null then return; end if;
  if not public.checker_take_limit('daily:'||to_char(now() at time zone 'UTC','YYYY-MM-DD'),p_daily_limit,86400) then
    update public.checker_jobs set status='unavailable',message='Daily investigation quota reached.' where status='queued';
    return;
  end if;
  return query update public.checker_jobs set status='running',started_at=now(),lease_until=now()+interval '105 seconds'
    where id=job.id returning *;
end $$;

revoke execute on function public.checker_take_limit(text,integer,integer), public.checker_create_run(text,text,jsonb), public.checker_claim_job(integer) from public,anon,authenticated;
grant execute on function public.checker_take_limit(text,integer,integer), public.checker_create_run(text,text,jsonb), public.checker_claim_job(integer) to service_role;
