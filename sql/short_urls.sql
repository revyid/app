-- ============================================================
-- SHORT URLS TABLE
-- Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.short_urls (
  id uuid primary key default gen_random_uuid(),
  slug varchar(16) unique not null,
  original_url text not null,
  api_key_id uuid references public.api_keys(id) on delete set null,
  user_id uuid not null references public.app_users(id) on delete cascade,
  clicks int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists short_urls_slug on public.short_urls(slug);
create index if not exists short_urls_user_id on public.short_urls(user_id);

alter table public.short_urls enable row level security;
drop policy if exists "short_urls_deny_all" on public.short_urls;
create policy "short_urls_deny_all" on public.short_urls for all to anon, authenticated using (false) with check (false);

-- ============================================================
-- RPC: Increment clicks (used by redirect handler)
-- ============================================================
create or replace function public.increment_short_url_clicks(
  p_slug text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url short_urls%rowtype;
begin
  update short_urls set clicks = clicks + 1 where slug = p_slug returning original_url into v_url;
  return v_url.original_url;
end;
$$;

-- ============================================================
-- RPC: Create short URL
-- ============================================================
create or replace function public.create_short_url(
  p_token text,
  p_url text,
  p_slug text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session app_sessions%rowtype;
  v_slug text;
  v_existing short_urls%rowtype;
  v_chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_i int;
begin
  -- Validate session
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if v_session.id is null then
    return jsonb_build_object('error', 'Invalid session');
  end if;

  -- Validate URL
  if p_url is null or p_url = '' or (p_url not like 'http://%') then
    return jsonb_build_object('error', 'Invalid URL (must start with http:// or https://)');
  end if;

  -- Generate or validate slug
  if p_slug is not null and p_slug != '' then
    v_slug := lower(regexp_replace(p_slug, '[^a-z0-9-]', '', 'g'));
    if length(v_slug) < 3 or length(v_slug) > 16 then
      return jsonb_build_object('error', 'Slug must be 3-16 alphanumeric characters');
    end if;
    -- Check if slug already exists
    select * into v_existing from short_urls where slug = v_slug;
    if v_existing.id is not null then
      return jsonb_build_object('error', 'Slug already taken');
    end if;
  else
    -- Generate random slug
    loop
      v_slug := '';
      for v_i in 1..7 loop
        v_slug := v_slug || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
      end loop;
      exit when not exists (select 1 from short_urls where slug = v_slug);
    end loop;
  end if;

  -- Insert
  insert into short_urls (slug, original_url, user_id)
  values (v_slug, p_url, v_session.user_id)
  returning * into v_existing;

  return jsonb_build_object(
    'id', v_existing.id,
    'slug', v_existing.slug,
    'short_url', 'https://revy.my.id/s/' || v_existing.slug,
    'original_url', v_existing.original_url,
    'created_at', v_existing.created_at
  );
end;
$$;

-- ============================================================
-- RPC: Get short URL stats
-- ============================================================
create or replace function public.get_short_url_stats(
  p_token text,
  p_slug text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session app_sessions%rowtype;
  v_url short_urls%rowtype;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if v_session.id is null then
    return jsonb_build_object('error', 'Invalid session');
  end if;

  select * into v_url from short_urls where slug = p_slug and user_id = v_session.user_id;
  if v_url.id is null then
    return jsonb_build_object('error', 'Not found');
  end if;

  return jsonb_build_object(
    'id', v_url.id,
    'slug', v_url.slug,
    'original_url', v_url.original_url,
    'clicks', v_url.clicks,
    'created_at', v_url.created_at
  );
end;
$$;

-- ============================================================
-- RPC: List short URLs for user
-- ============================================================
create or replace function public.list_short_urls(
  p_token text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session app_sessions%rowtype;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if v_session.id is null then
    return jsonb_build_object('error', 'Invalid session');
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id,
      'slug', s.slug,
      'short_url', 'https://revy.my.id/s/' || s.slug,
      'original_url', s.original_url,
      'clicks', s.clicks,
      'created_at', s.created_at
    ) order by s.created_at desc), '[]'::jsonb)
    from short_urls s where s.user_id = v_session.user_id
  );
end;
$$;

-- ============================================================
-- RPC: Delete short URL
-- ============================================================
create or replace function public.delete_short_url(
  p_token text,
  p_slug text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session app_sessions%rowtype;
  v_deleted short_urls%rowtype;
begin
  select * into v_session from app_sessions where token = p_token and is_active = true and expires_at > now();
  if v_session.id is null then
    return jsonb_build_object('error', 'Invalid session');
  end if;

  delete from short_urls where slug = p_slug and user_id = v_session.user_id
  returning * into v_deleted;

  if v_deleted.id is null then
    return jsonb_build_object('error', 'Not found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;
