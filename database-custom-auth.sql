-- ============================================
-- CUSTOM AUTH SYSTEM — Run this in Supabase SQL Editor
-- ============================================

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- ============================================
-- 1. APP USERS TABLE
-- ============================================
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,  -- null for OAuth-only users
  display_name text,
  avatar_url text,
  provider text not null default 'email',  -- 'email', 'google', 'github'
  provider_id text,  -- OAuth provider user ID
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- SECURE RLS: users can only read their own row (via RPC); no direct table access
alter table public.app_users enable row level security;
-- Drop old permissive policies
drop policy if exists "app_users_public_read" on public.app_users;
drop policy if exists "app_users_public_write" on public.app_users;
drop policy if exists "app_users_public_update" on public.app_users;
-- No direct access — all operations go through security definer RPC functions
create policy "app_users_deny_all" on public.app_users for all to anon, authenticated using (false) with check (false);

-- ============================================
-- 2. APP SESSIONS TABLE
-- ============================================
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
-- Drop old permissive policy
drop policy if exists "app_sessions_public" on public.app_sessions;
-- No direct access — all operations go through security definer RPC functions
create policy "app_sessions_deny_all" on public.app_sessions for all to anon, authenticated using (false) with check (false);

-- Enable realtime (only for session revocation — filtered by token in app)
alter publication supabase_realtime add table app_sessions;

-- ============================================
-- 3. RATE LIMITING TABLE
-- ============================================
create table if not exists public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,  -- email or IP
  action text not null,       -- 'login', 'register'
  attempt_count int not null default 1,
  window_start timestamptz not null default now(),
  blocked_until timestamptz
);
create unique index if not exists auth_rate_limits_identifier_action on public.auth_rate_limits(identifier, action);

alter table public.auth_rate_limits enable row level security;
create policy "rate_limits_deny_all" on public.auth_rate_limits for all to anon, authenticated using (false) with check (false);

-- ============================================
-- 4. PASSKEYS & DEVICES — SECURE RLS
-- ============================================
alter table public.user_passkeys drop constraint if exists user_passkeys_user_id_fkey;
alter table public.user_devices drop constraint if exists user_devices_user_id_fkey;

drop policy if exists "Users can view own passkeys" on public.user_passkeys;
drop policy if exists "Users can insert own passkeys" on public.user_passkeys;
drop policy if exists "Users can update own passkeys" on public.user_passkeys;
drop policy if exists "Users can delete own passkeys" on public.user_passkeys;
drop policy if exists "passkeys_public" on public.user_passkeys;
create policy "passkeys_deny_all" on public.user_passkeys for all to anon, authenticated using (false) with check (false);

drop policy if exists "Users can view own devices" on public.user_devices;
drop policy if exists "Users can insert own devices" on public.user_devices;
drop policy if exists "Users can update own devices" on public.user_devices;
drop policy if exists "devices_public" on public.user_devices;
create policy "devices_deny_all" on public.user_devices for all to anon, authenticated using (false) with check (false);

alter publication supabase_realtime add table user_devices;
alter publication supabase_realtime add table user_passkeys;

-- ============================================
-- 5. PORTFOLIO DATA TABLE (for admin CRUD)
-- ============================================
create table if not exists public.portfolio_data (
  id uuid primary key default gen_random_uuid(),
  section text not null,  -- 'profile', 'projects', 'experiences', 'education', 'skills', 'social_links', 'contacts', 'languages', 'intro'
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.app_users(id)
);
create unique index if not exists portfolio_data_section on public.portfolio_data(section);

alter table public.portfolio_data enable row level security;
-- Public can read portfolio data (it's a public portfolio)
create policy "portfolio_public_read" on public.portfolio_data for select to anon, authenticated using (true);
-- Only admins can write (via RPC)
create policy "portfolio_deny_write" on public.portfolio_data for insert to anon, authenticated with check (false);
create policy "portfolio_deny_update" on public.portfolio_data for update to anon, authenticated using (false);
create policy "portfolio_deny_delete" on public.portfolio_data for delete to anon, authenticated using (false);

-- ============================================
-- 6. HELPER: RATE LIMIT CHECK
-- ============================================
create or replace function private.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts int default 5,
  p_window_minutes int default 15,
  p_block_minutes int default 30
) returns boolean  -- returns true if allowed, false if blocked
language plpgsql security definer as $$
declare
  v_record auth_rate_limits%rowtype;
begin
  select * into v_record from auth_rate_limits
  where identifier = p_identifier and action = p_action;

  if not found then
    insert into auth_rate_limits (identifier, action) values (p_identifier, p_action);
    return true;
  end if;

  -- Check if currently blocked
  if v_record.blocked_until is not null and v_record.blocked_until > now() then
    return false;
  end if;

  -- Reset window if expired
  if v_record.window_start < now() - (p_window_minutes || ' minutes')::interval then
    update auth_rate_limits set
      attempt_count = 1,
      window_start = now(),
      blocked_until = null
    where identifier = p_identifier and action = p_action;
    return true;
  end if;

  -- Increment and check
  update auth_rate_limits set attempt_count = attempt_count + 1
  where identifier = p_identifier and action = p_action;

  if v_record.attempt_count + 1 >= p_max_attempts then
    update auth_rate_limits set blocked_until = now() + (p_block_minutes || ' minutes')::interval
    where identifier = p_identifier and action = p_action;
    return false;
  end if;

  return true;
end;
$$;

-- ============================================
-- 7. RPC FUNCTIONS (security definer = runs as owner)
-- ============================================

-- REGISTER
create or replace function public.register_user(
  p_email text,
  p_password text,
  p_display_name text default null
) returns json
language plpgsql security definer as $$
declare
  v_user app_users%rowtype;
  v_token text;
begin
  -- Rate limit by email
  if not private.check_rate_limit(lower(trim(p_email)), 'register', 3, 60, 60) then
    return json_build_object('error', 'Too many registration attempts. Please try again later.');
  end if;

  -- Check existing
  if exists (select 1 from app_users where email = lower(trim(p_email))) then
    return json_build_object('error', 'An account with this email already exists.');
  end if;

  -- Validate password length
  if length(p_password) < 8 then
    return json_build_object('error', 'Password must be at least 8 characters.');
  end if;

  -- Create user
  insert into app_users (email, password_hash, display_name, provider)
  values (lower(trim(p_email)), crypt(p_password, gen_salt('bf', 10)), p_display_name, 'email')
  returning * into v_user;

  -- Create session with expiry
  insert into app_sessions (user_id, expires_at)
  values (v_user.id, now() + interval '30 days')
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    )
  );
end;
$$;

-- LOGIN
create or replace function public.login_user(
  p_email text,
  p_password text
) returns json
language plpgsql security definer as $$
declare
  v_user app_users%rowtype;
  v_token text;
begin
  -- Rate limit by email
  if not private.check_rate_limit(lower(trim(p_email)), 'login', 5, 15, 30) then
    return json_build_object('error', 'Too many login attempts. Please try again in 30 minutes.');
  end if;

  select * into v_user from app_users where email = lower(trim(p_email));

  if not found then
    return json_build_object('error', 'Invalid email or password.');
  end if;

  if v_user.password_hash is null then
    return json_build_object('error', 'This account uses social login. Please sign in with Google or GitHub.');
  end if;

  if v_user.password_hash != crypt(p_password, v_user.password_hash) then
    return json_build_object('error', 'Invalid email or password.');
  end if;

  -- Create session with expiry
  insert into app_sessions (user_id, expires_at)
  values (v_user.id, now() + interval '30 days')
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    )
  );
end;
$$;

-- VALIDATE SESSION
create or replace function public.validate_session(p_token text) returns json
language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_user app_users%rowtype;
begin
  select * into v_session from app_sessions
  where token = p_token and is_active = true and expires_at > now();

  if not found then
    return json_build_object('error', 'Invalid or expired session.');
  end if;

  -- Touch last_active_at
  update app_sessions set last_active_at = now() where id = v_session.id;

  select * into v_user from app_users where id = v_session.user_id;

  return json_build_object(
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    ),
    'session_id', v_session.id,
    'device_id', v_session.device_id
  );
end;
$$;

-- LOGOUT
create or replace function public.logout_session(p_token text) returns json
language plpgsql security definer as $$
begin
  update app_sessions set is_active = false where token = p_token;
  return json_build_object('success', true);
end;
$$;

-- OAUTH LOGIN (Google / GitHub)
create or replace function public.oauth_login(
  p_email text,
  p_display_name text,
  p_avatar_url text,
  p_provider text,
  p_provider_id text
) returns json
language plpgsql security definer as $$
declare
  v_user app_users%rowtype;
  v_token text;
begin
  -- Find or create by email
  select * into v_user from app_users where email = lower(trim(p_email));

  if not found then
    insert into app_users (email, display_name, avatar_url, provider, provider_id)
    values (lower(trim(p_email)), p_display_name, p_avatar_url, p_provider, p_provider_id)
    returning * into v_user;
  else
    update app_users set
      display_name = coalesce(p_display_name, display_name),
      avatar_url = coalesce(p_avatar_url, avatar_url),
      provider_id = coalesce(p_provider_id, provider_id)
    where id = v_user.id
    returning * into v_user;
  end if;

  -- Create session with expiry
  insert into app_sessions (user_id, expires_at)
  values (v_user.id, now() + interval '30 days')
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    )
  );
end;
$$;

-- PASSKEY LOGIN
create or replace function public.passkey_login(
  p_credential_id text,
  p_old_token text
) returns json
language plpgsql security definer as $$
declare
  v_passkey user_passkeys%rowtype;
  v_user app_users%rowtype;
  v_token text;
begin
  select * into v_passkey from user_passkeys where credential_id = p_credential_id;
  if not found then
    return json_build_object('error', 'Passkey not found or has been revoked.');
  end if;

  select * into v_user from app_users where id = v_passkey.user_id;
  if not found then
    return json_build_object('error', 'User not found.');
  end if;

  update user_passkeys set last_used_at = now() where id = v_passkey.id;

  insert into app_sessions (user_id, expires_at)
  values (v_user.id, now() + interval '30 days')
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    )
  );
end;
$$;

-- UPDATE PROFILE
create or replace function public.update_user_profile(
  p_token text,
  p_display_name text default null,
  p_avatar_url text default null
) returns json
language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_user app_users%rowtype;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  update app_users set
    display_name = coalesce(p_display_name, display_name),
    avatar_url = coalesce(p_avatar_url, avatar_url)
  where id = v_session.user_id
  returning * into v_user;

  return json_build_object(
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'is_admin', v_user.is_admin,
      'created_at', v_user.created_at
    )
  );
end;
$$;

-- UPDATE SESSION DEVICE INFO
create or replace function public.update_session_device(
  p_token text,
  p_device_id text,
  p_device_name text,
  p_browser_name text
) returns void
language plpgsql security definer as $$
begin
  update app_sessions set
    device_id = p_device_id,
    device_name = p_device_name,
    browser_name = p_browser_name,
    last_active_at = now()
  where token = p_token and is_active = true and expires_at > now();
end;
$$;

-- GET USER SESSIONS
create or replace function public.get_user_sessions(p_token text) returns json
language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_result json;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  select json_agg(row_to_json(s)) into v_result
  from (
    select id, device_id, device_name, browser_name, is_active, created_at, last_active_at, expires_at
    from app_sessions
    where user_id = v_session.user_id and is_active = true and expires_at > now()
    order by last_active_at desc
  ) s;

  return json_build_object('sessions', coalesce(v_result, '[]'::json));
end;
$$;

-- REVOKE A SESSION
create or replace function public.revoke_session(p_token text, p_session_id uuid) returns json
language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  update app_sessions set is_active = false
  where id = p_session_id and user_id = v_session.user_id;

  return json_build_object('success', true);
end;
$$;

-- ============================================
-- 8. ADMIN PORTFOLIO CRUD FUNCTIONS
-- ============================================

-- Helper: verify admin session
create or replace function private.verify_admin(p_token text) returns uuid
language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_user app_users%rowtype;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if not found then
    raise exception 'Invalid session.';
  end if;

  select * into v_user from app_users where id = v_session.user_id;
  if not v_user.is_admin then
    raise exception 'Unauthorized: admin access required.';
  end if;

  return v_user.id;
end;
$$;

-- GET portfolio section (public)
create or replace function public.get_portfolio_section(p_section text) returns json
language plpgsql security definer as $$
declare
  v_data jsonb;
begin
  select data into v_data from portfolio_data where section = p_section;
  if not found then
    return null;
  end if;
  return v_data;
end;
$$;

-- GET all portfolio sections (public)
create or replace function public.get_all_portfolio_data() returns json
language plpgsql security definer as $$
declare
  v_result json;
begin
  select json_object_agg(section, data) into v_result from portfolio_data;
  return coalesce(v_result, '{}'::json);
end;
$$;

-- UPSERT portfolio section (admin only)
create or replace function public.upsert_portfolio_section(
  p_token text,
  p_section text,
  p_data jsonb
) returns json
language plpgsql security definer as $$
declare
  v_admin_id uuid;
begin
  v_admin_id := private.verify_admin(p_token);

  insert into portfolio_data (section, data, updated_at, updated_by)
  values (p_section, p_data, now(), v_admin_id)
  on conflict (section) do update set
    data = excluded.data,
    updated_at = now(),
    updated_by = v_admin_id;

  return json_build_object('success', true, 'section', p_section);
exception when others then
  return json_build_object('error', sqlerrm);
end;
$$;

-- DELETE portfolio item within a section (admin only)
-- e.g. delete a project by id from the projects array
create or replace function public.delete_portfolio_item(
  p_token text,
  p_section text,
  p_item_id text
) returns json
language plpgsql security definer as $$
declare
  v_admin_id uuid;
  v_data jsonb;
  v_new_data jsonb;
begin
  v_admin_id := private.verify_admin(p_token);

  select data into v_data from portfolio_data where section = p_section;
  if not found then
    return json_build_object('error', 'Section not found.');
  end if;

  -- Remove item with matching id from array
  select jsonb_agg(item) into v_new_data
  from jsonb_array_elements(v_data) as item
  where item->>'id' != p_item_id;

  update portfolio_data set
    data = coalesce(v_new_data, '[]'::jsonb),
    updated_at = now(),
    updated_by = v_admin_id
  where section = p_section;

  return json_build_object('success', true);
exception when others then
  return json_build_object('error', sqlerrm);
end;
$$;

-- ============================================
-- 9. GRANT EXECUTE TO anon ROLE
-- ============================================
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

-- ============================================
-- 10. CLEANUP: expire old sessions (run periodically)
-- ============================================
create or replace function public.cleanup_expired_sessions() returns void
language plpgsql security definer as $$
begin
  update app_sessions set is_active = false
  where expires_at < now() and is_active = true;

  -- Clean old rate limit records
  delete from auth_rate_limits
  where window_start < now() - interval '24 hours'
    and (blocked_until is null or blocked_until < now());
end;
$$;
grant execute on function public.cleanup_expired_sessions() to anon;
