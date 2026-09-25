-- Owner-only cloud saves for project ybmseuuumwiyudwqvzuh.
-- Safe to run after the earlier save migrations, and safe on an empty public
-- schema. Does not drop or replace triggers on auth.users.

create table if not exists public.branchborne_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.branchborne_saves
  add column if not exists pathway_id text,
  add column if not exists level integer not null default 1,
  add column if not exists quest_title text,
  add column if not exists score integer not null default 0,
  add column if not exists moves integer not null default 0,
  add column if not exists phase text not null default 'path',
  add column if not exists status text not null default 'class-select',
  add column if not exists high_score integer not null default 0,
  add column if not exists trophies jsonb not null default '[]'::jsonb,
  add column if not exists items jsonb not null default '[]'::jsonb,
  add column if not exists skills jsonb not null default '[]'::jsonb,
  add column if not exists challenge_index integer not null default 0,
  add column if not exists level_score integer not null default 0,
  add column if not exists graduated boolean not null default false,
  add column if not exists class_expert boolean not null default false,
  add column if not exists challenges_cleared integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_high_score_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_high_score_check check (high_score >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_trophies_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_trophies_check check (jsonb_typeof(trophies) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'branchborne_saves_items_check'
      and conrelid = 'public.branchborne_saves'::regclass
  ) then
    alter table public.branchborne_saves
      add constraint branchborne_saves_items_check check (jsonb_typeof(items) = 'array');
  end if;

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

alter table public.branchborne_saves enable row level security;
alter table public.branchborne_saves force row level security;

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

revoke all on table public.branchborne_saves from public, anon;
revoke truncate, references, trigger on table public.branchborne_saves from authenticated;
grant select, insert, update, delete on table public.branchborne_saves to authenticated;

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.force_row_owner()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  new.user_id := auth.uid();
  return new;
end;
$$;

revoke all on function private.force_row_owner() from public, anon;
grant execute on function private.force_row_owner() to authenticated;

drop trigger if exists branchborne_saves_force_owner on public.branchborne_saves;
create trigger branchborne_saves_force_owner
  before insert or update on public.branchborne_saves
  for each row
  execute function private.force_row_owner();

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
