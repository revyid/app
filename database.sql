-- ============================================================
-- CONSOLIDATED DATABASE SCHEMA
-- Run once in Supabase SQL Editor to set up everything.
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
create policy "chat_delete" on public.chat_messages for delete to public using (true);
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
    'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
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
    'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
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
    'is_admin', v_user.is_admin, 'created_at', v_user.created_at),
    'session_id', v_session.id, 'device_id', v_session.device_id);
end; $$;

create or replace function public.logout_session(p_token text) returns json language plpgsql security definer as $$
begin update app_sessions set is_active = false where token = p_token; return json_build_object('success', true); end; $$;

create or replace function public.oauth_login(p_email text, p_display_name text, p_avatar_url text, p_provider text, p_provider_id text)
returns json language plpgsql security definer as $$
declare v_user app_users%rowtype; v_token text; begin
  select * into v_user from app_users where email = lower(trim(p_email));
  if not found then
    insert into app_users (email, display_name, avatar_url, provider, provider_id)
    values (lower(trim(p_email)), p_display_name, p_avatar_url, p_provider, p_provider_id) returning * into v_user;
  else
    update app_users set display_name = coalesce(p_display_name, display_name),
      avatar_url = coalesce(p_avatar_url, avatar_url), provider_id = coalesce(p_provider_id, provider_id)
    where id = v_user.id returning * into v_user;
  end if;
  insert into app_sessions (user_id, expires_at) values (v_user.id, now() + interval '30 days') returning token into v_token;
  return json_build_object('token', v_token, 'user', json_build_object('id', v_user.id, 'email', v_user.email,
    'display_name', v_user.display_name, 'avatar_url', v_user.avatar_url, 'provider', v_user.provider,
    'is_admin', v_user.is_admin, 'created_at', v_user.created_at));
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
-- SITE SETTINGS RPC FUNCTIONS
-- ============================================================

-- get_site_setting: public read
create or replace function public.get_site_setting(p_key text) returns text language plpgsql security definer as $$
declare v_value text; begin
  select value into v_value from site_settings where key = p_key; return v_value;
end; $$;

-- update_site_setting: admin only, uses session token
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

-- track_event: public insert
create or replace function public.track_event(
  p_event_type text, p_event_data jsonb default null,
  p_user_agent text default null, p_ip_address text default null, p_referrer text default null
) returns void language plpgsql security definer as $$
begin
  insert into analytics_events (event_type, event_data, user_agent, ip_address, referrer)
  values (p_event_type, p_event_data, p_user_agent, p_ip_address, p_referrer);
end; $$;

-- get_public_analytics: public read (no auth required) — returns aggregated stats only
create or replace function public.get_public_analytics()
returns json language plpgsql security definer as $$
declare v_today text; begin
  v_today := current_date::text;
  return json_build_object(
    'total_views',    (select count(*) from analytics_events where event_type = 'page_view'),
    'today_views',    (select count(*) from analytics_events where event_type = 'page_view' and created_at::date = current_date),
    'unique_visitors',(select count(distinct ip_address) from analytics_events where event_type = 'page_view' and ip_address is not null and ip_address != 'unknown'),
    'user_agents',    (select coalesce(json_agg(user_agent), '[]'::json) from analytics_events where event_type = 'page_view' and user_agent is not null)
  );
end; $$;

-- get_analytics_summary: admin only
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
  p_user_id uuid, p_id uuid default null, p_description text default null,
  p_is_public boolean default true
) returns uuid language plpgsql security definer as $$
declare v_theme_id uuid; v_admin_id uuid; begin
  -- p_user_id here is the session token — resolve to user id via session
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

create or replace function public.delete_theme(p_id uuid, p_user_id uuid)
returns boolean language plpgsql security definer as $$
declare v_admin_id uuid; begin
  -- p_user_id here is the session token
  select user_id into v_admin_id from app_sessions where token = p_user_id and is_active = true and expires_at > now();
  if v_admin_id is null then return false; end if;
  if exists (select 1 from public.themes where id = p_id and is_default = true) then return false; end if;
  delete from public.themes where id = p_id
    and (created_by = v_admin_id or exists (select 1 from app_users where id = v_admin_id and is_admin));
  return found;
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
grant execute on function public.upsert_theme(text, text, jsonb, jsonb, uuid, uuid, text, boolean) to anon;
grant execute on function public.delete_theme(uuid, uuid) to anon;
grant execute on function public.cleanup_expired_sessions() to anon;

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
