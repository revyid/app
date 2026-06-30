-- Drop old versions first to avoid ambiguity
drop function if exists public.upsert_theme(text, text, jsonb, jsonb, uuid, uuid, text, boolean);
drop function if exists public.upsert_theme(text, text, jsonb, jsonb, text, uuid, text, boolean);
drop function if exists public.delete_theme(uuid, uuid);
drop function if exists public.delete_theme(uuid, text);

-- upsert_theme: p_user_id is session token (text), not uuid
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

-- delete_theme: p_user_id is session token (text), not uuid
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

-- Re-grant
grant execute on function public.upsert_theme(text, text, jsonb, jsonb, text, uuid, text, boolean) to anon;
grant execute on function public.upsert_theme(text, text, jsonb, jsonb, text, uuid, text, boolean) to authenticated;
grant execute on function public.delete_theme(uuid, text) to anon;
grant execute on function public.delete_theme(uuid, text) to authenticated;
