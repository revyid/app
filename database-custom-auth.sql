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
  created_at timestamptz not null default now()
);

-- Permissive RLS (auth handled by RPC functions)
alter table public.app_users enable row level security;
create policy "app_users_public_read" on public.app_users for select to anon, authenticated using (true);
create policy "app_users_public_write" on public.app_users for insert to anon, authenticated with check (true);
create policy "app_users_public_update" on public.app_users for update to anon, authenticated using (true);

-- ============================================
-- 2. APP SESSIONS TABLE (replaces user_devices)
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
  last_active_at timestamptz not null default now()
);

alter table public.app_sessions enable row level security;
create policy "app_sessions_public" on public.app_sessions for all to anon, authenticated using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table app_sessions;

-- ============================================
-- 3. DROP OLD FK CONSTRAINTS
-- ============================================
-- user_passkeys: change FK from auth.users to app_users
-- First, drop the old constraint and column, then re-add
alter table public.user_passkeys drop constraint if exists user_passkeys_user_id_fkey;
-- Make user_id a plain uuid (no FK to auth.users)
-- We'll reference app_users.id in application logic

-- user_devices: same treatment
alter table public.user_devices drop constraint if exists user_devices_user_id_fkey;

-- Make passkeys and devices accessible without auth
drop policy if exists "Users can view own passkeys" on public.user_passkeys;
drop policy if exists "Users can insert own passkeys" on public.user_passkeys;
drop policy if exists "Users can update own passkeys" on public.user_passkeys;
drop policy if exists "Users can delete own passkeys" on public.user_passkeys;

create policy "passkeys_public" on public.user_passkeys for all to anon, authenticated using (true) with check (true);

drop policy if exists "Users can view own devices" on public.user_devices;
drop policy if exists "Users can insert own devices" on public.user_devices;
drop policy if exists "Users can update own devices" on public.user_devices;

create policy "devices_public" on public.user_devices for all to anon, authenticated using (true) with check (true);

-- Enable realtime for devices
alter publication supabase_realtime add table user_devices;
alter publication supabase_realtime add table user_passkeys;

-- ============================================
-- 4. RPC FUNCTIONS (security definer = runs as owner)
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
  -- Check existing
  if exists (select 1 from app_users where email = lower(trim(p_email))) then
    return json_build_object('error', 'An account with this email already exists.');
  end if;

  -- Create user
  insert into app_users (email, password_hash, display_name, provider)
  values (lower(trim(p_email)), crypt(p_password, gen_salt('bf', 10)), p_display_name, 'email')
  returning * into v_user;

  -- Create session
  insert into app_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
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

  -- Create session
  insert into app_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
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
  where token = p_token and is_active = true;

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
    -- Update profile info from OAuth provider
    update app_users set
      display_name = coalesce(p_display_name, display_name),
      avatar_url = coalesce(p_avatar_url, avatar_url),
      provider_id = coalesce(p_provider_id, provider_id)
    where id = v_user.id
    returning * into v_user;
  end if;

  -- Create session
  insert into app_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'created_at', v_user.created_at
    )
  );
end;
$$;

-- PASSKEY LOGIN — creates a new session from a stored session token
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
  -- Find the passkey
  select * into v_passkey from user_passkeys where credential_id = p_credential_id;
  if not found then
    return json_build_object('error', 'Passkey not found or has been revoked.');
  end if;

  -- Find the user
  select * into v_user from app_users where id = v_passkey.user_id;
  if not found then
    return json_build_object('error', 'User not found.');
  end if;

  -- Update last_used_at
  update user_passkeys set last_used_at = now() where id = v_passkey.id;

  -- Create a fresh session
  insert into app_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  return json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
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
  select * into v_session from app_sessions where token = p_token and is_active = true;
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
  where token = p_token and is_active = true;
end;
$$;

-- GET USER SESSIONS (for device management)
create or replace function public.get_user_sessions(p_token text) returns json
language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_result json;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true;
  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  select json_agg(row_to_json(s)) into v_result
  from (
    select id, device_id, device_name, browser_name, is_active, created_at, last_active_at
    from app_sessions
    where user_id = v_session.user_id and is_active = true
    order by last_active_at desc
  ) s;

  return json_build_object('sessions', coalesce(v_result, '[]'::json));
end;
$$;

-- REVOKE A SESSION (remote logout)
create or replace function public.revoke_session(p_token text, p_session_id uuid) returns json
language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
begin
  -- Verify caller's session
  select * into v_session from app_sessions where token = p_token and is_active = true;
  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  -- Revoke the target session (must belong to same user)
  update app_sessions set is_active = false
  where id = p_session_id and user_id = v_session.user_id;

  return json_build_object('success', true);
end;
$$;

-- ============================================
-- 5. GRANT EXECUTE TO anon ROLE
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
