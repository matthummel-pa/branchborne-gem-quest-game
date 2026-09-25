-- Extra ownership enforcement for the cabinet.
-- branchborne_saves already has owner-only policies. This trigger overwrites
-- user_id from the JWT so a client cannot choose another player's row.
-- `private` must stay out of the Data API exposed schemas.

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

-- The cabinet does not use branchborne_players. Older policies let anon
-- update every row. Remove anonymous writes when that table is present.
do $$
declare
  pol record;
begin
  if to_regclass('public.branchborne_players') is null then
    return;
  end if;

  revoke insert, update, delete, truncate on table public.branchborne_players from anon, public;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'branchborne_players'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and roles && array['anon', 'public']::name[]
  loop
    execute format('drop policy if exists %I on public.branchborne_players', pol.policyname);
  end loop;
end $$;
