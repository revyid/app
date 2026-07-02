-- API Keys migration for existing databases
-- Run this in Supabase SQL Editor

-- 1. API Keys table
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  key_hash text unique not null,
  key_prefix text not null,
  rate_limit int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.api_keys enable row level security;
drop policy if exists "api_keys_deny_all" on public.api_keys;
create policy "api_keys_deny_all" on public.api_keys for all to anon, authenticated using (false) with check (false);

-- 2. API Key Usage table
create table if not exists public.api_key_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  used_at timestamptz not null default now()
);
create index if not exists api_key_usage_user_time on public.api_key_usage(user_id, used_at desc);
alter table public.api_key_usage enable row level security;
drop policy if exists "api_key_usage_deny_all" on public.api_key_usage;
create policy "api_key_usage_deny_all" on public.api_key_usage for all to anon, authenticated using (false) with check (false);

-- 3. RPC Functions
create or replace function public.create_api_key(p_token text, p_name text)
returns json language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_raw_key text;
  v_key_hash text;
  v_key_prefix text;
  v_key_id uuid;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  v_raw_key := 'rv_' || encode(gen_random_bytes(24), 'hex');
  v_key_prefix := substring(v_raw_key from 1 for 10);
  v_key_hash := encode(digest(v_raw_key, 'sha256'), 'hex');
  insert into public.api_keys (user_id, name, key_hash, key_prefix)
  values (v_session.user_id, p_name, v_key_hash, v_key_prefix) returning id into v_key_id;
  return json_build_object('key', v_raw_key, 'id', v_key_id, 'key_prefix', v_key_prefix);
end; $$;

create or replace function public.list_api_keys(p_token text)
returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_result json; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  select json_agg(row_to_json(k)) into v_result from (
    select id, name, key_prefix, rate_limit, is_active, created_at, last_used_at
    from public.api_keys where user_id = v_session.user_id order by created_at desc
  ) k;
  return json_build_object('keys', coalesce(v_result, '[]'::json));
end; $$;

create or replace function public.delete_api_key(p_token text, p_key_id uuid)
returns boolean language plpgsql security definer as $$
declare v_session app_sessions%rowtype; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return false; end if;
  delete from public.api_keys where id = p_key_id and user_id = v_session.user_id;
  return found;
end; $$;

create or replace function public.get_api_usage_today(p_user_id uuid) returns int
language sql security definer as $$
  select count(*)::int from public.api_key_usage where user_id = p_user_id and used_at > now() - interval '1 hour';
$$;

create or replace function public.record_api_usage(p_user_id uuid)
returns void language sql security definer as $$
  insert into public.api_key_usage (user_id) values (p_user_id);
$$;

create or replace function public.cleanup_old_api_usage() returns void language sql security definer as $$
  delete from public.api_key_usage where used_at < now() - interval '24 hours';
$$;

-- 4. Validate API key (bypasses RLS via SECURITY DEFINER)
create or replace function public.validate_api_key(p_key_hash text)
returns json language plpgsql security definer as $$
declare v_key api_keys%rowtype; begin
  select * into v_key from public.api_keys where key_hash = p_key_hash and is_active = true;
  if not found then return json_build_object('valid', false); end if;
  return json_build_object('valid', true, 'user_id', v_key.user_id, 'rate_limit', v_key.rate_limit);
end; $$;