-- public.rls_auto_enable is a Supabase helper and a security definer function
-- in an exposed schema. Revoke API execute from browser roles. Do not drop
-- the function. Do not touch auth allowlist triggers.

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
