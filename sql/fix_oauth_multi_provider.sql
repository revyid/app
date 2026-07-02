-- Add linked_providers column and update oauth_login to track multiple providers
-- Run this in Supabase SQL Editor

-- 1. Add linked_providers column
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS linked_providers jsonb not null default '[]'::jsonb;

-- 2. Backfill existing users with their current provider
UPDATE public.app_users
SET linked_providers = jsonb_build_array(jsonb_build_object('provider', provider, 'provider_id', provider_id))
WHERE linked_providers = '[]'::jsonb AND provider != 'email' AND provider_id IS NOT NULL;

-- 3. Update oauth_login to track linked providers
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

-- 4. Update validate_session to include linked_providers
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

-- 5. Update register_user to include linked_providers
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

-- 6. Update login_user to include linked_providers
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
