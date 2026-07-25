begin;

create table public.demo_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_sessions_state_is_object check (jsonb_typeof(state) = 'object'),
  constraint demo_sessions_schema_version_positive check (schema_version > 0)
);

create trigger demo_sessions_set_updated_at
before update on public.demo_sessions
for each row execute function public.set_updated_at();

alter table public.demo_sessions enable row level security;

create policy demo_sessions_select_self on public.demo_sessions
for select to authenticated
using (user_id = auth.uid());

create policy demo_sessions_insert_self on public.demo_sessions
for insert to authenticated
with check (user_id = auth.uid());

create policy demo_sessions_update_self on public.demo_sessions
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy demo_sessions_delete_self on public.demo_sessions
for delete to authenticated
using (user_id = auth.uid());

comment on table public.demo_sessions is
  'Versioned SignalRx hackathon UI snapshots. Each authenticated visitor can access only their own state.';

commit;
