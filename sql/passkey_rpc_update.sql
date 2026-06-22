-- ============================================================
-- PASSKEY RPC FUNCTIONS UPDATE
-- Run this in Supabase SQL Editor to fix passkey 401 errors.
-- Adds register_passkey, list_passkeys, delete_passkey RPCs
-- and grants execute to anon.
-- ============================================================

-- 1. Register a new passkey (validates session via token)
create or replace function public.register_passkey(
  p_token text,
  p_credential_id text,
  p_public_key text,
  p_device_name text,
  p_browser_name text
) returns json language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_new_id uuid;
begin
  select * into v_session
  from app_sessions
  where token = p_token and is_active = true and expires_at > now();

  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  insert into user_passkeys (user_id, credential_id, public_key, device_name, browser_name)
  values (v_session.user_id, p_credential_id, p_public_key, p_device_name, p_browser_name)
  returning id into v_new_id;

  return json_build_object('success', true, 'id', v_new_id);
exception
  when unique_violation then
    return json_build_object('error', 'A passkey is already registered for this credential.');
end; $$;

-- 2. List all passkeys for the authenticated user
create or replace function public.list_passkeys(p_token text)
returns json language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
  v_result json;
begin
  select * into v_session
  from app_sessions
  where token = p_token and is_active = true and expires_at > now();

  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  select json_agg(row_to_json(pk)) into v_result
  from (
    select id, credential_id, device_name, browser_name, created_at, last_used_at
    from user_passkeys
    where user_id = v_session.user_id
    order by created_at desc
  ) pk;

  return json_build_object('passkeys', coalesce(v_result, '[]'::json));
end; $$;

-- 3. Delete a passkey (only own passkeys)
create or replace function public.delete_passkey(p_token text, p_id uuid)
returns json language plpgsql security definer as $$
declare
  v_session app_sessions%rowtype;
begin
  select * into v_session
  from app_sessions
  where token = p_token and is_active = true and expires_at > now();

  if not found then
    return json_build_object('error', 'Invalid session.');
  end if;

  delete from user_passkeys
  where id = p_id and user_id = v_session.user_id;

  if not found then
    return json_build_object('error', 'Passkey not found.');
  end if;

  return json_build_object('success', true);
end; $$;

-- 4. Grant execute to anon (required since client uses anon key)
grant execute on function public.register_passkey(text, text, text, text, text) to anon;
grant execute on function public.list_passkeys(text) to anon;
grant execute on function public.delete_passkey(text, uuid) to anon;
