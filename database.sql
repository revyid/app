-- ============================================================
-- CONSOLIDATED DATABASE SCHEMA (Latest)
-- Run once in Supabase SQL Editor to set up everything.
-- This file includes ALL migrations merged into one.
--
-- This is the SINGLE SOURCE OF TRUTH for the current schema. Do not run
-- loose files from sql/ against a fresh database — historical patches live
-- in sql/archive/ for audit trail only and may reference obsolete signatures.
-- New schema changes should be written directly into this file PLUS a dated
-- file under sql/migrations/ (create that folder if it doesn't exist yet).
-- Dev-only seed data lives in sql/seed/ — clearly separate from migrations.
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

-- Chat messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id varchar not null,
  user_name varchar not null,
  user_image varchar,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
drop policy if exists "chat_read" on public.chat_messages;
create policy "chat_read" on public.chat_messages for select to public using (true);
drop policy if exists "chat_insert" on public.chat_messages;
create policy "chat_insert" on public.chat_messages for insert to public with check (true);
drop policy if exists "chat_delete" on public.chat_messages;
drop policy if exists "chat_delete_owner" on public.chat_messages;
-- Phase 7b security fix: previously `chat_delete` was `to public using (true)`
-- which let ANY client (not just admins) delete ANY message via direct Supabase
-- client calls. Now direct deletes are denied at the RLS level; all deletes
-- must go through the `delete_message_admin` RPC (admin-verified) or a future
-- `delete_own_message` RPC. The `deleteMessageAdmin` function in supabase.ts
-- has been updated to call the RPC instead of direct delete.
create policy "chat_delete" on public.chat_messages for delete to public using (false);
do $$ begin alter publication supabase_realtime add table chat_messages; exception when others then null; end $$;

-- App users
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  display_name text,
  avatar_url text,
  provider text not null default 'email',
  provider_id text,
  linked_providers jsonb not null default '[]'::jsonb,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.app_users enable row level security;
drop policy if exists "app_users_deny_all" on public.app_users;
create policy "app_users_deny_all" on public.app_users for all to anon, authenticated using (false) with check (false);

-- App sessions
create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  device_id text,
  device_name text,
  browser_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
alter table public.app_sessions enable row level security;
drop policy if exists "app_sessions_deny_all" on public.app_sessions;
create policy "app_sessions_deny_all" on public.app_sessions for all to anon, authenticated using (false) with check (false);
do $$ begin alter publication supabase_realtime add table app_sessions; exception when others then null; end $$;

-- Rate limits
create table if not exists public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  action text not null,
  attempt_count int not null default 1,
  window_start timestamptz not null default now(),
  blocked_until timestamptz
);
create unique index if not exists auth_rate_limits_identifier_action on public.auth_rate_limits(identifier, action);
alter table public.auth_rate_limits enable row level security;
drop policy if exists "rate_limits_deny_all" on public.auth_rate_limits;
create policy "rate_limits_deny_all" on public.auth_rate_limits for all to anon, authenticated using (false) with check (false);

-- Passkeys
create table if not exists public.user_passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  device_name text not null,
  browser_name text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.user_passkeys enable row level security;
drop policy if exists "passkeys_deny_all" on public.user_passkeys;
create policy "passkeys_deny_all" on public.user_passkeys for all to anon, authenticated using (false) with check (false);

-- Portfolio data
create table if not exists public.portfolio_data (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.app_users(id)
);
create unique index if not exists portfolio_data_section on public.portfolio_data(section);
alter table public.portfolio_data enable row level security;
drop policy if exists "portfolio_public_read" on public.portfolio_data;
create policy "portfolio_public_read" on public.portfolio_data for select to anon, authenticated using (true);
drop policy if exists "portfolio_deny_write" on public.portfolio_data;
create policy "portfolio_deny_write" on public.portfolio_data for insert to anon, authenticated with check (false);
drop policy if exists "portfolio_deny_update" on public.portfolio_data;
create policy "portfolio_deny_update" on public.portfolio_data for update to anon, authenticated using (false);
drop policy if exists "portfolio_deny_delete" on public.portfolio_data;
create policy "portfolio_deny_delete" on public.portfolio_data for delete to anon, authenticated using (false);

-- Site settings
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "site_settings_deny_write" on public.site_settings;
create policy "site_settings_deny_write" on public.site_settings for all to anon, authenticated using (false) with check (false);

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_data jsonb,
  user_agent text,
  ip_address text,
  referrer text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_type_date on public.analytics_events(event_type, created_at desc);
create index if not exists analytics_events_date on public.analytics_events(created_at desc);
alter table public.analytics_events enable row level security;
drop policy if exists "analytics_public_insert" on public.analytics_events;
create policy "analytics_public_insert" on public.analytics_events for insert to anon, authenticated with check (true);
drop policy if exists "analytics_deny_read" on public.analytics_events;
create policy "analytics_deny_read" on public.analytics_events for select to anon, authenticated using (false);
do $$ begin alter publication supabase_realtime add table analytics_events; exception when others then null; end $$;

-- Themes
create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  seed_color text not null,
  light_scheme jsonb not null,
  dark_scheme jsonb not null,
  created_by uuid references public.app_users(id) on delete set null,
  is_public boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.themes enable row level security;
drop policy if exists "themes_public_read" on public.themes;
create policy "themes_public_read" on public.themes for select to anon, authenticated using (is_public = true);
drop policy if exists "themes_deny_write" on public.themes;
create policy "themes_deny_write" on public.themes for all to anon, authenticated using (false) with check (false);
do $$ begin alter publication supabase_realtime add table themes; exception when others then null; end $$;

-- API keys
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  key_hash text unique not null,
  key_prefix text not null,
  rate_limit int not null default 100,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.api_keys enable row level security;
drop policy if exists "api_keys_deny_all" on public.api_keys;
create policy "api_keys_deny_all" on public.api_keys for all to anon, authenticated using (false) with check (false);

-- API key usage tracking
create table if not exists public.api_key_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  used_at timestamptz not null default now()
);
create index if not exists api_key_usage_user_time on public.api_key_usage(user_id, used_at desc);
alter table public.api_key_usage enable row level security;
drop policy if exists "api_key_usage_deny_all" on public.api_key_usage;
create policy "api_key_usage_deny_all" on public.api_key_usage for all to anon, authenticated using (false) with check (false);

-- Short URLs
create table if not exists public.short_urls (
  id uuid primary key default gen_random_uuid(),
  slug varchar(16) unique not null,
  original_url text not null,
  api_key_id uuid references public.api_keys(id) on delete set null,
  user_id uuid not null references public.app_users(id) on delete cascade,
  clicks int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists short_urls_slug on public.short_urls(slug);
create index if not exists short_urls_user_id on public.short_urls(user_id);
alter table public.short_urls enable row level security;
drop policy if exists "short_urls_deny_all" on public.short_urls;
create policy "short_urls_deny_all" on public.short_urls for all to anon, authenticated using (false) with check (false);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.check_rate_limit_internal(
  p_identifier text, p_action text,
  p_max_attempts int default 5, p_window_minutes int default 15, p_block_minutes int default 30
) returns boolean language plpgsql security definer as $$
declare v_record auth_rate_limits%rowtype; begin
  select * into v_record from auth_rate_limits where identifier = p_identifier and action = p_action;
  if not found then
    insert into auth_rate_limits (identifier, action) values (p_identifier, p_action); return true;
  end if;
  if v_record.blocked_until is not null and v_record.blocked_until > now() then return false; end if;
  if v_record.window_start < now() - (p_window_minutes || ' minutes')::interval then
    update auth_rate_limits set attempt_count = 1, window_start = now(), blocked_until = null
    where identifier = p_identifier and action = p_action; return true;
  end if;
  update auth_rate_limits set attempt_count = attempt_count + 1 where identifier = p_identifier and action = p_action;
  if v_record.attempt_count + 1 >= p_max_attempts then
    update auth_rate_limits set blocked_until = now() + (p_block_minutes || ' minutes')::interval
    where identifier = p_identifier and action = p_action; return false;
  end if;
  return true;
end; $$;

create or replace function public.verify_admin_internal(p_token text) returns uuid
language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_user app_users%rowtype; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then raise exception 'Invalid session.'; end if;
  select * into v_user from app_users where id = v_session.user_id;
  if not v_user.is_admin then raise exception 'Unauthorized: admin access required.'; end if;
  return v_user.id;
end; $$;

create or replace function public.verify_api_key_internal(p_api_key text) returns api_keys
language plpgsql security definer as $$
declare v_key api_keys%rowtype; v_hash text; begin
  v_hash := encode(sha256(p_api_key::bytea), 'hex');
  select * into v_key from api_keys where key_hash = v_hash and is_active = true;
  if not found then return null; end if;
  return v_key;
end; $$;

-- ============================================================
-- AUTH RPC FUNCTIONS
-- ============================================================

create or replace function public.register_user(p_email text, p_password text, p_display_name text default null)
returns json language plpgsql security definer as $$
declare v_user app_users%rowtype; v_token text; begin
  if not public.check_rate_limit_internal(lower(trim(p_email)), 'register', 3, 60, 60) then
    return json_build_object('error', 'Too many registration attempts. Please try again later.'); end if;
  if exists (select 1 from app_users where email = lower(trim(p_email))) then
    return json_build_object('error', 'An account with this email already exists.'); end if;
  if length(p_password) < 8 then return json_build_object('error', 'Password must be at least 8 characters.'); end if;
  insert into app_users (email, password_hash, display_name, provider)
  values (lower(trim(p_email)), crypt(p_password, gen_salt('bf', 10)), p_display_name, 'email') returning * into v_user;
  insert into app_sessions (user_id, expires_at) values (v_user.id, now() + interval '30 days') returning token into v_token;
  return json_build_object('token', v_token, 'user', json_build_object('id', v_user.id, 'email', v_user.email,
    'display_name', v_user.display_name, 'avatar_url', v_user.avatar_url, 'provider', v_user.provider,
    'linked_providers', coalesce(v_user.linked_providers, '[]'::jsonb), 'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
end; $$;

create or replace function public.login_user(p_email text, p_password text)
returns json language plpgsql security definer as $$
declare v_user app_users%rowtype; v_token text; begin
  if not public.check_rate_limit_internal(lower(trim(p_email)), 'login', 5, 15, 30) then
    return json_build_object('error', 'Too many login attempts. Please try again in 30 minutes.'); end if;
  select * into v_user from app_users where email = lower(trim(p_email));
  if not found then return json_build_object('error', 'Invalid email or password.'); end if;
  if v_user.password_hash is null then return json_build_object('error', 'This account uses social login.'); end if;
  if v_user.password_hash != crypt(p_password, v_user.password_hash) then return json_build_object('error', 'Invalid email or password.'); end if;
  insert into app_sessions (user_id, expires_at) values (v_user.id, now() + interval '30 days') returning token into v_token;
  return json_build_object('token', v_token, 'user', json_build_object('id', v_user.id, 'email', v_user.email,
    'display_name', v_user.display_name, 'avatar_url', v_user.avatar_url, 'provider', v_user.provider,
    'linked_providers', coalesce(v_user.linked_providers, '[]'::jsonb), 'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
end; $$;

create or replace function public.validate_session(p_token text) returns json
language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_user app_users%rowtype; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid or expired session.'); end if;
  update app_sessions set last_active_at = now() where id = v_session.id;
  select * into v_user from app_users where id = v_session.user_id;
  return json_build_object('user', json_build_object('id', v_user.id, 'email', v_user.email,
    'display_name', v_user.display_name, 'avatar_url', v_user.avatar_url, 'provider', v_user.provider,
    'linked_providers', coalesce(v_user.linked_providers, '[]'::jsonb), 'is_admin', v_user.is_admin, 'created_at', v_user.created_at),
    'session_id', v_session.id, 'device_id', v_session.device_id);
end; $$;

create or replace function public.logout_session(p_token text) returns json language plpgsql security definer as $$
begin update app_sessions set is_active = false where token = p_token; return json_build_object('success', true); end; $$;

create or replace function public.oauth_login(p_email text, p_display_name text, p_avatar_url text, p_provider text, p_provider_id text)
returns json language plpgsql security definer as $$
declare v_user app_users%rowtype; v_token text; v_linked jsonb; v_already_linked boolean; begin
  select * into v_user from app_users where email = lower(trim(p_email));
  if not found then
    insert into app_users (email, display_name, avatar_url, provider, provider_id, linked_providers)
    values (lower(trim(p_email)), p_display_name, p_avatar_url, p_provider, p_provider_id,
      jsonb_build_array(jsonb_build_object('provider', p_provider, 'provider_id', p_provider_id)))
    returning * into v_user;
  else
    v_linked := coalesce(v_user.linked_providers, '[]'::jsonb);
    select exists(select 1 from jsonb_array_elements(v_linked) e where e->>'provider' = p_provider) into v_already_linked;
    if not v_already_linked then
      v_linked := v_linked || jsonb_build_object('provider', p_provider, 'provider_id', p_provider_id);
    end if;
    update app_users set display_name = coalesce(p_display_name, display_name),
      avatar_url = coalesce(p_avatar_url, avatar_url), linked_providers = v_linked
    where id = v_user.id returning * into v_user;
  end if;
  insert into app_sessions (user_id, expires_at) values (v_user.id, now() + interval '30 days') returning token into v_token;
  return json_build_object('token', v_token, 'user', json_build_object('id', v_user.id, 'email', v_user.email,
    'display_name', v_user.display_name, 'avatar_url', v_user.avatar_url, 'provider', v_user.provider,
    'linked_providers', v_user.linked_providers, 'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
end; $$;

create or replace function public.register_passkey(p_token text, p_credential_id text, p_public_key text, p_device_name text, p_browser_name text)
returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_new_id uuid; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  insert into user_passkeys (user_id, credential_id, public_key, device_name, browser_name)
  values (v_session.user_id, p_credential_id, p_public_key, p_device_name, p_browser_name)
  returning id into v_new_id;
  return json_build_object('success', true, 'id', v_new_id);
exception when unique_violation then
  return json_build_object('error', 'A passkey is already registered for this credential.');
end; $$;

create or replace function public.list_passkeys(p_token text)
returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_result json; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  select json_agg(row_to_json(pk)) into v_result from (
    select id, credential_id, device_name, browser_name, created_at, last_used_at
    from user_passkeys where user_id = v_session.user_id order by created_at desc
  ) pk;
  return json_build_object('passkeys', coalesce(v_result, '[]'::json));
end; $$;

create or replace function public.delete_passkey(p_token text, p_id uuid)
returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  delete from user_passkeys where id = p_id and user_id = v_session.user_id;
  if not found then return json_build_object('error', 'Passkey not found.'); end if;
  return json_build_object('success', true);
end; $$;

create or replace function public.passkey_login(p_credential_id text, p_old_token text)
returns json language plpgsql security definer as $$
declare v_passkey user_passkeys%rowtype; v_user app_users%rowtype; v_token text; begin
  select * into v_passkey from user_passkeys where credential_id = p_credential_id;
  if not found then return json_build_object('error', 'Passkey not found or has been revoked.'); end if;
  select * into v_user from app_users where id = v_passkey.user_id;
  if not found then return json_build_object('error', 'User not found.'); end if;
  update user_passkeys set last_used_at = now() where id = v_passkey.id;
  insert into app_sessions (user_id, expires_at) values (v_user.id, now() + interval '30 days') returning token into v_token;
  return json_build_object('token', v_token, 'user', json_build_object('id', v_user.id, 'email', v_user.email,
    'display_name', v_user.display_name, 'avatar_url', v_user.avatar_url, 'provider', v_user.provider,
    'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
end; $$;

create or replace function public.update_user_profile(p_token text, p_display_name text default null, p_avatar_url text default null)
returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_user app_users%rowtype; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  update app_users set display_name = coalesce(p_display_name, display_name), avatar_url = coalesce(p_avatar_url, avatar_url)
  where id = v_session.user_id returning * into v_user;
  return json_build_object('user', json_build_object('id', v_user.id, 'email', v_user.email,
    'display_name', v_user.display_name, 'avatar_url', v_user.avatar_url, 'provider', v_user.provider,
    'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
end; $$;

create or replace function public.update_session_device(p_token text, p_device_id text, p_device_name text, p_browser_name text)
returns void language plpgsql security definer as $$
begin
  update app_sessions set device_id = p_device_id, device_name = p_device_name,
    browser_name = p_browser_name, last_active_at = now()
  where token = p_token and is_active = true and expires_at > now();
end; $$;

create or replace function public.get_user_sessions(p_token text) returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_result json; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  select json_agg(row_to_json(s)) into v_result from (
    select id, device_id, device_name, browser_name, is_active, created_at, last_active_at, expires_at
    from app_sessions where user_id = v_session.user_id and is_active = true and expires_at > now()
    order by last_active_at desc) s;
  return json_build_object('sessions', coalesce(v_result, '[]'::json));
end; $$;

create or replace function public.revoke_session(p_token text, p_session_id uuid) returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  update app_sessions set is_active = false where id = p_session_id and user_id = v_session.user_id;
  return json_build_object('success', true);
end; $$;

create or replace function public.cleanup_expired_sessions() returns void language plpgsql security definer as $$
begin
  update app_sessions set is_active = false where expires_at < now() and is_active = true;
  delete from auth_rate_limits where window_start < now() - interval '24 hours'
    and (blocked_until is null or blocked_until < now());
end; $$;

-- ============================================================
-- PORTFOLIO RPC FUNCTIONS
-- ============================================================

create or replace function public.get_portfolio_section(p_section text) returns json language plpgsql security definer as $$
declare v_data jsonb; begin
  select data into v_data from portfolio_data where section = p_section;
  if not found then return null; end if;
  return v_data;
end; $$;

create or replace function public.get_all_portfolio_data() returns json language plpgsql security definer as $$
declare v_result json; begin
  select json_object_agg(section, data) into v_result from portfolio_data;
  return coalesce(v_result, '{}'::json);
end; $$;

create or replace function public.upsert_portfolio_section(p_token text, p_section text, p_data jsonb)
returns json language plpgsql security definer as $$
declare v_admin_id uuid; begin
  v_admin_id := public.verify_admin_internal(p_token);
  insert into portfolio_data (section, data, updated_at, updated_by) values (p_section, p_data, now(), v_admin_id)
  on conflict (section) do update set data = excluded.data, updated_at = now(), updated_by = v_admin_id;
  return json_build_object('success', true, 'section', p_section);
exception when others then return json_build_object('error', sqlerrm);
end; $$;

create or replace function public.delete_portfolio_item(p_token text, p_section text, p_item_id text)
returns json language plpgsql security definer as $$
declare v_admin_id uuid; v_data jsonb; v_new_data jsonb; begin
  v_admin_id := public.verify_admin_internal(p_token);
  select data into v_data from portfolio_data where section = p_section;
  if not found then return json_build_object('error', 'Section not found.'); end if;
  select jsonb_agg(item) into v_new_data from jsonb_array_elements(v_data) as item where item->>'id' != p_item_id;
  update portfolio_data set data = coalesce(v_new_data, '[]'::jsonb), updated_at = now(), updated_by = v_admin_id
  where section = p_section;
  return json_build_object('success', true);
exception when others then return json_build_object('error', sqlerrm);
end; $$;

-- ============================================================
-- ADMIN OVERSIGHT RPC FUNCTIONS (Phase 7b)
-- All admin-verified via verify_admin_internal(p_token).
-- Pattern: p_token text first param, raises if not admin.
-- ============================================================

-- List all users (admin only). Excludes password_hash.
create or replace function public.admin_list_users(p_token text) returns json
language plpgsql security definer as $$
declare v_admin uuid; begin
  v_admin := public.verify_admin_internal(p_token);
  return json_build_object('users', coalesce((
    select json_agg(json_build_object(
      'id', u.id, 'email', u.email, 'display_name', u.display_name,
      'avatar_url', u.avatar_url, 'provider', u.provider,
      'is_admin', u.is_admin, 'created_at', u.created_at
    ) order by u.created_at desc)
    from app_users u
  ), '[]'::json));
end; $$;

-- List a specific user's API keys (admin only). Used by User Management panel
-- to show per-user key count + rate limits.
create or replace function public.admin_get_user_keys(p_token text, p_user_id uuid) returns json
language plpgsql security definer as $$
declare v_admin uuid; begin
  v_admin := public.verify_admin_internal(p_token);
  return json_build_object('keys', coalesce((
    select json_agg(json_build_object(
      'id', k.id, 'name', k.name, 'key_prefix', k.key_prefix,
      'rate_limit', k.rate_limit, 'is_active', k.is_active,
      'created_at', k.created_at, 'last_used_at', k.last_used_at,
      'expires_at', k.expires_at
    ) order by k.created_at desc)
    from api_keys k where k.user_id = p_user_id
  ), '[]'::json));
end; $$;

-- Toggle a user's admin flag (admin only). Refuses to demote the last admin
-- to prevent lockout.
create or replace function public.admin_toggle_user_admin(p_token text, p_user_id uuid, p_is_admin boolean) returns json
language plpgsql security definer as $$
declare v_admin uuid; v_admin_count int; begin
  v_admin := public.verify_admin_internal(p_token);
  -- Prevent demoting the last admin
  if p_is_admin = false then
    select count(*) into v_admin_count from app_users where is_admin = true;
    if v_admin_count <= 1 then
      return json_build_object('error', 'Cannot demote the last admin.');
    end if;
  end if;
  update app_users set is_admin = p_is_admin where id = p_user_id;
  return json_build_object('success', true);
end; $$;

-- Set rate_limit on ALL of a user's API keys (admin only). The UI assumes
-- per-user rate limit; the schema is per-key, so we update every key the user owns.
create or replace function public.admin_set_user_rate_limit(p_token text, p_user_id uuid, p_rate_limit int) returns json
language plpgsql security definer as $$
declare v_admin uuid; begin
  v_admin := public.verify_admin_internal(p_token);
  update api_keys set rate_limit = p_rate_limit where user_id = p_user_id;
  return json_build_object('success', true);
end; $$;

-- List ALL short URLs across all users (admin only). For the admin Short URLs tab.
create or replace function public.admin_list_short_urls(p_token text, p_limit int default 100, p_offset int default 0) returns json
language plpgsql security definer as $$
declare v_admin uuid; begin
  v_admin := public.verify_admin_internal(p_token);
  return json_build_object('urls', coalesce((
    select json_agg(json_build_object(
      'id', s.id, 'slug', s.slug, 'short_url', 'https://revy.my.id/s/' || s.slug,
      'original_url', s.original_url, 'clicks', s.clicks,
      'created_at', s.created_at, 'expires_at', s.expires_at,
      'user_id', s.user_id, 'owner_email', u.email
    ) order by s.created_at desc)
    from short_urls s
    left join app_users u on u.id = s.user_id
    limit p_limit offset p_offset
  ), '[]'::json));
end; $$;

-- List ALL API keys across all users (admin only). For the admin API Keys tab.
-- Does NOT return the key_hash (security). Returns owner email for oversight.
create or replace function public.admin_list_api_keys(p_token text) returns json
language plpgsql security definer as $$
declare v_admin uuid; begin
  v_admin := public.verify_admin_internal(p_token);
  return json_build_object('keys', coalesce((
    select json_agg(json_build_object(
      'id', k.id, 'name', k.name, 'key_prefix', k.key_prefix,
      'rate_limit', k.rate_limit, 'is_active', k.is_active,
      'created_at', k.created_at, 'last_used_at', k.last_used_at,
      'expires_at', k.expires_at, 'user_id', k.user_id,
      'owner_email', u.email
    ) order by k.created_at desc)
    from api_keys k
    left join app_users u on u.id = k.user_id
  ), '[]'::json));
end; $$;

-- Admin-delete any API key (admin only). Bypasses the caller-ownership check
-- in the regular delete_api_key.
create or replace function public.admin_delete_api_key(p_token text, p_key_id uuid) returns json
language plpgsql security definer as $$
declare v_admin uuid; begin
  v_admin := public.verify_admin_internal(p_token);
  delete from api_keys where id = p_key_id;
  return json_build_object('success', true);
end; $$;

-- Admin-delete any short URL (admin only). Bypasses the caller-ownership check.
create or replace function public.admin_delete_short_url(p_token text, p_slug text) returns json
language plpgsql security definer as $$
declare v_admin uuid; v_deleted short_urls%rowtype; begin
  v_admin := public.verify_admin_internal(p_token);
  delete from short_urls where slug = p_slug returning * into v_deleted;
  if v_deleted.id is null then return json_build_object('error', 'Not found'); end if;
  return json_build_object('success', true);
end; $$;

-- Admin-delete any chat message (admin only). Fixes a security hole: the old
-- RLS policy `chat_delete` was `to public using (true)` which let ANY client
-- (not just admins) delete any message. This RPC uses verify_admin_internal.
-- The RLS policy has been tightened to self-delete only (see policy section).
create or replace function public.delete_message_admin(p_token text, p_message_id uuid) returns json
language plpgsql security definer as $$
declare v_admin uuid; v_deleted chat_messages%rowtype; begin
  v_admin := public.verify_admin_internal(p_token);
  delete from chat_messages where id = p_message_id returning * into v_deleted;
  if v_deleted.id is null then return json_build_object('error', 'Not found'); end if;
  return json_build_object('success', true);
end; $$;

-- Self-delete: a user can delete their own message by session token.
-- Replaces the old direct-client-delete path that the tightened RLS policy
-- now blocks. user_id in chat_messages is varchar, app_users.id is uuid.
create or replace function public.delete_own_message(p_token text, p_message_id uuid) returns json
language plpgsql security definer as $$
declare v_user_id uuid; v_msg_user_id varchar; begin
  select user_id into v_user_id from app_sessions where token = p_token and is_active = true and expires_at > now();
  if v_user_id is null then return json_build_object('error', 'Invalid session.'); end if;
  select user_id into v_msg_user_id from chat_messages where id = p_message_id;
  if v_msg_user_id is null then return json_build_object('error', 'Not found'); end if;
  if v_msg_user_id != v_user_id::text then return json_build_object('error', 'Forbidden.'); end if;
  delete from chat_messages where id = p_message_id;
  return json_build_object('success', true);
end; $$;

-- List recent chat messages for the admin moderation view (admin only).
-- Note: chat_messages.user_id is varchar (not a uuid FK), so we cast for the join.
create or replace function public.admin_list_chat_messages(p_token text, p_limit int default 100, p_offset int default 0) returns json
language plpgsql security definer as $$
declare v_admin uuid; begin
  v_admin := public.verify_admin_internal(p_token);
  return json_build_object('messages', coalesce((
    select json_agg(json_build_object(
      'id', m.id, 'user_id', m.user_id, 'user_name', m.user_name,
      'user_image', m.user_image, 'message', m.message,
      'created_at', m.created_at, 'avatar_url', u.avatar_url
    ) order by m.created_at desc)
    from chat_messages m
    left join app_users u on u.id::text = m.user_id
    limit p_limit offset p_offset
  ), '[]'::json));
end; $$;

-- ============================================================
-- SITE SETTINGS RPC FUNCTIONS
-- ============================================================

create or replace function public.get_site_setting(p_key text) returns text language plpgsql security definer as $$
declare v_value text; begin
  select value into v_value from site_settings where key = p_key; return v_value;
end; $$;

create or replace function public.update_site_setting(p_token text, p_key text, p_value text)
returns json language plpgsql security definer as $$
declare v_admin_id uuid; begin
  v_admin_id := public.verify_admin_internal(p_token);
  insert into site_settings (key, value, updated_at) values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return json_build_object('success', true);
exception when others then return json_build_object('error', sqlerrm);
end; $$;

-- ============================================================
-- ANALYTICS RPC FUNCTIONS
-- ============================================================

create or replace function public.track_event(
  p_event_type text, p_event_data jsonb default null,
  p_user_agent text default null, p_ip_address text default null, p_referrer text default null
) returns void language plpgsql security definer as $$
begin
  insert into analytics_events (event_type, event_data, user_agent, ip_address, referrer)
  values (p_event_type, p_event_data, p_user_agent, p_ip_address, p_referrer);
end; $$;

create or replace function public.get_public_analytics()
returns json language plpgsql security definer as $$
begin
  return json_build_object(
    'total_views',     (select count(*) from analytics_events where event_type = 'page_view'),
    'today_views',     (select count(*) from analytics_events where event_type = 'page_view' and created_at::date = current_date),
    'unique_visitors', (select count(distinct ip_address) from analytics_events where event_type = 'page_view' and ip_address is not null and ip_address != 'unknown'),
    'user_agents',     (select coalesce(json_agg(user_agent), '[]'::json) from analytics_events where event_type = 'page_view' and user_agent is not null),
    'daily_views',     (select coalesce(json_agg(row_to_json(t) order by t.date), '[]'::json) from (
                          select created_at::date as date, count(*) as views
                          from analytics_events
                          where event_type = 'page_view' and created_at > now() - interval '7 days'
                          group by created_at::date order by created_at::date
                        ) t),
    'hourly_views',    (select coalesce(json_agg(row_to_json(t) order by t.hour), '[]'::json) from (
                          select date_trunc('hour', created_at) as hour, count(*) as views
                          from analytics_events
                          where event_type = 'page_view' and created_at > now() - interval '24 hours'
                          group by date_trunc('hour', created_at) order by date_trunc('hour', created_at)
                        ) t)
  );
end; $$;

create or replace function public.get_analytics_summary(p_token text, p_days int default 30)
returns json language plpgsql security definer as $$
declare v_admin_id uuid; v_result json; begin
  v_admin_id := public.verify_admin_internal(p_token);
  select json_build_object(
    'total_views',     (select count(*) from analytics_events where event_type = 'page_view' and created_at > now() - (p_days || ' days')::interval),
    'unique_visitors', (select count(distinct ip_address) from analytics_events where created_at > now() - (p_days || ' days')::interval),
    'top_pages', (select json_agg(row_to_json(t)) from (
      select event_data->>'page' as page, count(*) as views from analytics_events
      where event_type = 'page_view' and created_at > now() - (p_days || ' days')::interval
      group by event_data->>'page' order by views desc limit 10) t),
    'daily_views', (select json_agg(row_to_json(t)) from (
      select date_trunc('day', created_at) as date, count(*) as views from analytics_events
      where event_type = 'page_view' and created_at > now() - (p_days || ' days')::interval
      group by date_trunc('day', created_at) order by date) t),
    'referrers', (select json_agg(row_to_json(t)) from (
      select referrer, count(*) as count from analytics_events
      where referrer is not null and created_at > now() - (p_days || ' days')::interval
      group by referrer order by count desc limit 10) t)
  ) into v_result;
  return v_result;
end; $$;

-- ============================================================
-- THEMES RPC FUNCTIONS
-- ============================================================

create or replace function public.get_themes(p_user_id uuid default null)
returns table (id uuid, name text, description text, seed_color text, light_scheme jsonb, dark_scheme jsonb,
  created_by uuid, is_public boolean, is_default boolean, created_at timestamptz, updated_at timestamptz)
language sql security definer as $$
  select id, name, description, seed_color, light_scheme, dark_scheme, created_by, is_public, is_default, created_at, updated_at
  from public.themes where is_public = true or created_by = p_user_id
  order by is_default desc, created_at desc;
$$;

create or replace function public.upsert_theme(
  p_name text, p_seed_color text, p_light_scheme jsonb, p_dark_scheme jsonb,
  p_user_id text, p_id uuid default null, p_description text default null,
  p_is_public boolean default true
) returns uuid language plpgsql security definer as $$
declare v_theme_id uuid; v_admin_id uuid; begin
  select user_id into v_admin_id from app_sessions where token = p_user_id and is_active = true and expires_at > now();
  if v_admin_id is null then raise exception 'Invalid session.'; end if;
  if p_id is null then
    insert into public.themes (name, description, seed_color, light_scheme, dark_scheme, created_by, is_public, is_default)
    values (p_name, p_description, p_seed_color, p_light_scheme, p_dark_scheme, v_admin_id, p_is_public, false)
    returning id into v_theme_id;
  else
    update public.themes set name = p_name, description = p_description, seed_color = p_seed_color,
      light_scheme = p_light_scheme, dark_scheme = p_dark_scheme, is_public = p_is_public, updated_at = now()
    where id = p_id and (created_by = v_admin_id or exists (select 1 from app_users where id = v_admin_id and is_admin))
    returning id into v_theme_id;
  end if;
  return v_theme_id;
end; $$;

create or replace function public.delete_theme(p_id uuid, p_user_id text)
returns boolean language plpgsql security definer as $$
declare v_admin_id uuid; begin
  select user_id into v_admin_id from app_sessions where token = p_user_id and is_active = true and expires_at > now();
  if v_admin_id is null then return false; end if;
  if exists (select 1 from public.themes where id = p_id and is_default = true) then return false; end if;
  delete from public.themes where id = p_id
    and (created_by = v_admin_id or exists (select 1 from app_users where id = v_admin_id and is_admin));
  return found;
end; $$;

-- ============================================================
-- API KEY RPC FUNCTIONS
-- ============================================================

create or replace function public.create_api_key(p_token text, p_name text, p_expires_in text default null)
returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_raw_key text; v_key_hash text; v_key_prefix text; v_key_id uuid; v_expires_at timestamptz; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;

  v_raw_key := 'rv_' || encode(gen_random_bytes(24), 'hex');
  v_key_prefix := substring(v_raw_key from 1 for 10);
  v_key_hash := encode(digest(v_raw_key, 'sha256'), 'hex');

  if p_expires_in is not null and p_expires_in != 'never' then
    v_expires_at := now()::timestamptz + p_expires_in::interval;
  else
    v_expires_at := null;
  end if;

  insert into public.api_keys (user_id, name, key_hash, key_prefix, expires_at)
  values (v_session.user_id, p_name, v_key_hash, v_key_prefix, v_expires_at)
  returning id into v_key_id;

  return json_build_object('key', v_raw_key, 'id', v_key_id, 'key_prefix', v_key_prefix);
end; $$;

create or replace function public.list_api_keys(p_token text)
returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; v_keys json; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;

  select coalesce(json_agg(t), '[]'::json) into v_keys from (
    select json_build_object(
      'id', k.id, 'name', k.name, 'key_prefix', k.key_prefix, 'rate_limit', k.rate_limit,
      'is_active', k.is_active, 'created_at', k.created_at, 'last_used_at', k.last_used_at, 'expires_at', k.expires_at
    ) AS t
    FROM public.api_keys k WHERE k.user_id = v_session.user_id ORDER BY k.created_at DESC
  ) sub;

  return json_build_object('keys', v_keys);
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
  select count(*)::int from public.api_key_usage
  where user_id = p_user_id and used_at > now() - interval '1 hour';
$$;

create or replace function public.record_api_usage(p_user_id uuid)
returns void language sql security definer as $$
  insert into public.api_key_usage (user_id) values (p_user_id);
$$;

create or replace function public.cleanup_old_api_usage() returns void language sql security definer as $$
  delete from public.api_key_usage where used_at < now() - interval '24 hours';
$$;

create or replace function public.validate_api_key(p_key_hash text)
returns json language plpgsql security definer as $$
declare v_key api_keys%rowtype; begin
  select * into v_key from public.api_keys where key_hash = p_key_hash and is_active = true;
  if not found then return json_build_object('valid', false); end if;
  return json_build_object('valid', true, 'user_id', v_key.user_id, 'rate_limit', v_key.rate_limit);
end; $$;

-- validate_api_key_for_shorten: like validate_api_key but ALSO updates
-- last_used_at and returns key_id. Used by /api/shorten (POST/GET/DELETE/PATCH)
-- which needs the key_id to associate the short URL with the API key that
-- created it. Merged from sql/short_urls.sql during Phase 5 reconciliation —
-- previously missing from database.sql, which broke /api/shorten on fresh deploys.
create or replace function public.validate_api_key_for_shorten(p_key_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_key api_keys%rowtype; begin
  select * into v_key from public.api_keys where key_hash = p_key_hash and is_active = true;
  if v_key.id is null then return jsonb_build_object('valid', false); end if;
  update public.api_keys set last_used_at = now() where id = v_key.id;
  return jsonb_build_object('valid', true, 'user_id', v_key.user_id, 'key_id', v_key.id);
end; $$;

create or replace function public.check_expired_keys() returns void language plpgsql security definer as $$
begin
  update public.api_keys SET is_active = false WHERE expires_at IS NOT NULL AND expires_at < now() AND is_active = true;
  update public.short_urls SET is_active = false WHERE expires_at IS NOT NULL AND expires_at < now() AND is_active = true;
end; $$;

-- ============================================================
-- SITE API KEY RPC FUNCTIONS
-- ============================================================

create or replace function public.get_site_api_key(p_token text)
returns json language plpgsql security definer as $$
declare v_admin_id uuid; v_key text; begin
  v_admin_id := public.verify_admin_internal(p_token);
  select value into v_key from site_settings where key = 'site_api_key';
  return json_build_object('key', v_key);
end; $$;

create or replace function public.regenerate_site_api_key(p_token text)
returns json language plpgsql security definer as $$
declare v_admin_id uuid; v_key text; begin
  v_admin_id := public.verify_admin_internal(p_token);
  v_key := 'rv_site_' || encode(gen_random_bytes(24), 'hex');
  insert into site_settings (key, value, updated_at)
    values ('site_api_key', v_key, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  return json_build_object('key', v_key);
end; $$;

-- ============================================================
-- SHORT URL RPC FUNCTIONS
-- ============================================================

create or replace function public.increment_short_url_clicks(p_slug text) returns text
language plpgsql security definer set search_path = public as $$
declare v_url short_urls%rowtype; begin
  update short_urls set clicks = clicks + 1 where slug = p_slug returning original_url into v_url;
  return v_url.original_url;
end; $$;

create or replace function public.create_short_url(p_user_id uuid, p_key_id uuid, p_url text, p_slug text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_slug text; v_existing short_urls%rowtype; v_chars text := 'abcdefghijklmnopqrstuvwxyz0123456789'; v_i int; begin
  if p_url is null or p_url = '' or (p_url not like 'http://%') then
    return jsonb_build_object('error', 'Invalid URL (must start with http:// or https://)'); end if;

  if p_slug is not null and p_slug != '' then
    v_slug := lower(regexp_replace(p_slug, '[^a-z0-9-]', '', 'g'));
    if length(v_slug) < 3 or length(v_slug) > 16 then
      return jsonb_build_object('error', 'Slug must be 3-16 alphanumeric characters'); end if;
    select * into v_existing from short_urls where slug = v_slug;
    if v_existing.id is not null then return jsonb_build_object('error', 'Slug already taken'); end if;
  else
    loop
      v_slug := '';
      for v_i in 1..7 loop
        v_slug := v_slug || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
      end loop;
      exit when not exists (select 1 from short_urls where slug = v_slug);
    end loop;
  end if;

  insert into short_urls (slug, original_url, user_id, api_key_id) values (v_slug, p_url, p_user_id, p_key_id) returning * into v_existing;
  return jsonb_build_object('id', v_existing.id, 'slug', v_existing.slug, 'short_url', 'https://revy.my.id/s/' || v_existing.slug, 'original_url', v_existing.original_url, 'created_at', v_existing.created_at);
end; $$;

create or replace function public.list_short_urls(p_token text) returns json language plpgsql security definer as $$
declare v_session app_sessions%rowtype; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return json_build_object('error', 'Invalid session.'); end if;
  return json_build_object('urls', (
    select coalesce(json_agg(json_build_object(
      'id', s.id, 'slug', s.slug, 'short_url', 'https://revy.my.id/s/' || s.slug,
      'original_url', s.original_url, 'clicks', s.clicks, 'created_at', s.created_at, 'expires_at', s.expires_at
    ) order by s.created_at desc), '[]'::json)
    from short_urls s where s.user_id = v_session.user_id
  ));
end; $$;

-- list_short_urls(uuid): overload used by /api/shorten GET (list mode) after
-- API-key validation. Takes user_id directly (the route has already resolved
-- the key to a user). Returns jsonb (not json) to match the other /api/shorten
-- RPCs. Merged from sql/short_urls.sql during Phase 5 reconciliation.
create or replace function public.list_short_urls(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'slug', s.slug, 'short_url', 'https://revy.my.id/s/' || s.slug,
      'original_url', s.original_url, 'clicks', s.clicks, 'created_at', s.created_at
    ) order by s.created_at desc), '[]'::jsonb)
    from short_urls s where s.user_id = p_user_id
  );
end; $$;

create or replace function public.delete_short_url(p_user_id uuid, p_slug text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_deleted short_urls%rowtype; begin
  delete from short_urls where slug = p_slug and user_id = p_user_id returning * into v_deleted;
  if v_deleted.id is null then return jsonb_build_object('error', 'Not found'); end if;
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.get_short_url_stats(p_user_id uuid, p_slug text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_url short_urls%rowtype; begin
  select * into v_url from short_urls where slug = p_slug and user_id = p_user_id;
  if v_url.id is null then return jsonb_build_object('error', 'Not found'); end if;
  return jsonb_build_object('id', v_url.id, 'slug', v_url.slug, 'original_url', v_url.original_url, 'clicks', v_url.clicks, 'created_at', v_url.created_at);
end; $$;

-- ============================================================
-- DELETE USER ACCOUNT
-- ============================================================
create or replace function public.delete_user_account(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session app_sessions%rowtype; v_user_id uuid; begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then return jsonb_build_object('error', 'Invalid session.'); end if;
  v_user_id := v_session.user_id;

  -- Delete all user data
  delete from app_sessions where user_id = v_user_id;
  delete from chat_messages where user_id = v_user_id::text;
  delete from short_urls where user_id = v_user_id;
  delete from api_keys where user_id = v_user_id;
  delete from api_key_usage where user_id = v_user_id;
  delete from user_passkeys where user_id = v_user_id;
  delete from portfolio_data where user_id = v_user_id;
  delete from themes where user_id = v_user_id;

  -- Delete the user
  delete from app_users where id = v_user_id;

  return jsonb_build_object('ok', true);
end; $$;

-- ============================================================
-- GRANT EXECUTE TO anon
-- ============================================================
grant execute on function public.register_user(text, text, text) to anon;
grant execute on function public.login_user(text, text) to anon;
grant execute on function public.validate_session(text) to anon;
grant execute on function public.logout_session(text) to anon;
grant execute on function public.oauth_login(text, text, text, text, text) to anon;
grant execute on function public.passkey_login(text, text) to anon;
grant execute on function public.register_passkey(text, text, text, text, text) to anon;
grant execute on function public.list_passkeys(text) to anon;
grant execute on function public.delete_passkey(text, uuid) to anon;
grant execute on function public.update_user_profile(text, text, text) to anon;
grant execute on function public.update_session_device(text, text, text, text) to anon;
grant execute on function public.get_user_sessions(text) to anon;
grant execute on function public.revoke_session(text, uuid) to anon;
grant execute on function public.get_portfolio_section(text) to anon;
grant execute on function public.get_all_portfolio_data() to anon;
grant execute on function public.upsert_portfolio_section(text, text, jsonb) to anon;
grant execute on function public.delete_portfolio_item(text, text, text) to anon;
grant execute on function public.get_site_setting(text) to anon;
grant execute on function public.update_site_setting(text, text, text) to anon;
grant execute on function public.track_event(text, jsonb, text, text, text) to anon;
grant execute on function public.get_public_analytics() to anon;
grant execute on function public.get_analytics_summary(text, int) to anon;
grant execute on function public.get_themes(uuid) to anon;
grant execute on function public.upsert_theme(text, text, jsonb, jsonb, text, uuid, text, boolean) to anon;
grant execute on function public.delete_theme(uuid, text) to anon;
grant execute on function public.cleanup_expired_sessions() to anon;
grant execute on function public.create_api_key(text, text, text) to anon;
grant execute on function public.list_api_keys(text) to anon;
grant execute on function public.delete_api_key(text, uuid) to anon;
grant execute on function public.get_api_usage_today(uuid) to anon;
grant execute on function public.record_api_usage(uuid) to anon;
grant execute on function public.validate_api_key(text) to anon;
grant execute on function public.get_site_api_key(text) to anon;
grant execute on function public.regenerate_site_api_key(text) to anon;
grant execute on function public.increment_short_url_clicks(text) to anon;
grant execute on function public.create_short_url(uuid, uuid, text, text) to anon;
grant execute on function public.list_short_urls(text) to anon;
grant execute on function public.list_short_urls(uuid) to anon;
grant execute on function public.delete_short_url(uuid, text) to anon;
grant execute on function public.get_short_url_stats(uuid, text) to anon;
grant execute on function public.validate_api_key_for_shorten(text) to anon;

-- Phase 7b admin oversight RPCs
grant execute on function public.admin_list_users(text) to anon;
grant execute on function public.admin_get_user_keys(text, uuid) to anon;
grant execute on function public.admin_toggle_user_admin(text, uuid, boolean) to anon;
grant execute on function public.admin_set_user_rate_limit(text, uuid, int) to anon;
grant execute on function public.admin_list_short_urls(text, int, int) to anon;
grant execute on function public.admin_list_api_keys(text) to anon;
grant execute on function public.admin_delete_api_key(text, uuid) to anon;
grant execute on function public.admin_delete_short_url(text, text) to anon;
grant execute on function public.delete_message_admin(text, uuid) to anon;
grant execute on function public.delete_own_message(text, uuid) to anon;
grant execute on function public.admin_list_chat_messages(text, int, int) to anon;
grant execute on function public.delete_user_account(text) to anon;

-- ============================================================
-- DEFAULT SITE SETTINGS (idempotent)
-- ============================================================
insert into public.site_settings (key, value) values
  ('site_logo', ''),
  ('favicon', ''),
  ('profile_header', ''),
  ('github_username', ''),
  ('site_title', 'Revy — Full-Stack Software Engineer'),
  ('site_description', 'Full-stack software engineer from Jambi, Indonesia.')
on conflict (key) do nothing;
