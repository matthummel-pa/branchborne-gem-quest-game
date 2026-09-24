-- Quest status for Branchborne Gem Quest.
-- One row per Supabase Auth user. user_id is both the primary key and the
-- foreign key to auth.users, so the RLS predicate is an index lookup.
-- A separate bigint identity would add a second index this table does not need.

alter table public.branchborne_saves
  add column if not exists level integer not null default 1,
  add column if not exists quest_title text,
  add column if not exists score integer not null default 0,
  add column if not exists moves integer not null default 0,
  add column if not exists phase text not null default 'path',
  add column if not exists status text not null default 'class-select',
  add column if not exists challenge_index integer not null default 0,
  add column if not exists level_score integer not null default 0,
  add column if not exists graduated boolean not null default false,
  add column if not exists class_expert boolean not null default false,
  add column if not exists challenges_cleared integer not null default 0,
  add column if not exists skills jsonb not null default '[]'::jsonb;

alter table public.branchborne_saves
  alter column trophies set default '[]'::jsonb,
  alter column items set default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_level_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_level_check check (level >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_score_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_score_check check (score >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_moves_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_moves_check check (moves >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_phase_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_phase_check check (phase in ('path', 'endgame'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_status_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_status_check
      check (status in ('class-select', 'ready', 'playing', 'paused', 'over'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_challenge_index_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_challenge_index_check check (challenge_index >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_level_score_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_level_score_check check (level_score >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_challenges_cleared_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_challenges_cleared_check check (challenges_cleared >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_skills_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_skills_check check (jsonb_typeof(skills) = 'array');
  end if;
end $$;

comment on table public.branchborne_saves is
  'Branchborne Gem Quest progress for one Supabase Auth user. Row Level Security allows that user to read and write only their own row.';

drop policy if exists branchborne_saves_select_own on public.branchborne_saves;
drop policy if exists branchborne_saves_insert_own on public.branchborne_saves;
drop policy if exists branchborne_saves_update_own on public.branchborne_saves;
drop policy if exists branchborne_saves_delete_own on public.branchborne_saves;

create policy branchborne_saves_select_own
  on public.branchborne_saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy branchborne_saves_insert_own
  on public.branchborne_saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy branchborne_saves_update_own
  on public.branchborne_saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy branchborne_saves_delete_own
  on public.branchborne_saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

alter table public.branchborne_saves enable row level security;
alter table public.branchborne_saves force row level security;

revoke all on table public.branchborne_saves from anon;
revoke truncate, references, trigger on table public.branchborne_saves from authenticated;
grant select, insert, update, delete on table public.branchborne_saves to authenticated;

create or replace function public.branchborne_saves_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Preserve the client timestamp used for last-write-wins across browsers.
  if new.updated_at is null then
    new.updated_at = pg_catalog.now();
  end if;
  return new;
end;
$$;

drop trigger if exists branchborne_saves_set_updated_at on public.branchborne_saves;
create trigger branchborne_saves_set_updated_at
  before insert or update on public.branchborne_saves
  for each row
  execute function public.branchborne_saves_touch_updated_at();

revoke all on function public.branchborne_saves_touch_updated_at() from public;
revoke all on function public.branchborne_saves_touch_updated_at() from anon;
grant execute on function public.branchborne_saves_touch_updated_at() to authenticated;
