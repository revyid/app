-- ============================================================
-- SHORT URLS TABLE (API key auth version)
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
-- RPC: Validate API key and return user_id + key_id
-- ============================================================
create or replace function public.validate_api_key_for_shorten(
  p_key_hash text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key api_keys%rowtype;
begin
  select * into v_key from api_keys where key_hash = p_key_hash and is_active = true;
  if v_key.id is null then
    return jsonb_build_object('valid', false);
  end if;
  update api_keys set last_used_at = now() where id = v_key.id;
  return jsonb_build_object('valid', true, 'user_id', v_key.user_id, 'key_id', v_key.id);
end;
$$;

-- ============================================================
-- RPC: Create short URL
-- ============================================================
create or replace function public.create_short_url(
  p_user_id uuid,
  p_key_id uuid,
  p_url text,
  p_slug text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_existing short_urls%rowtype;
  v_chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_i int;
begin
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
    select * into v_existing from short_urls where slug = v_slug;
    if v_existing.id is not null then
      return jsonb_build_object('error', 'Slug already taken');
    end if;
  else
    loop
      v_slug := '';
      for v_i in 1..7 loop
        v_slug := v_slug || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
      end loop;
      exit when not exists (select 1 from short_urls where slug = v_slug);
    end loop;
  end if;

  insert into short_urls (slug, original_url, user_id, api_key_id)
  values (v_slug, p_url, p_user_id, p_key_id)
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
  p_user_id uuid,
  p_slug text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url short_urls%rowtype;
begin
  select * into v_url from short_urls where slug = p_slug and user_id = p_user_id;
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
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id,
      'slug', s.slug,
      'short_url', 'https://revy.my.id/s/' || s.slug,
      'original_url', s.original_url,
      'clicks', s.clicks,
      'created_at', s.created_at
    ) order by s.created_at desc), '[]'::jsonb)
    from short_urls s where s.user_id = p_user_id
  );
end;
$$;

-- ============================================================
-- RPC: Delete short URL
-- ============================================================
create or replace function public.delete_short_url(
  p_user_id uuid,
  p_slug text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted short_urls%rowtype;
begin
  delete from short_urls where slug = p_slug and user_id = p_user_id
  returning * into v_deleted;

  if v_deleted.id is null then
    return jsonb_build_object('error', 'Not found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;
