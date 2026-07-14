-- Add expires_at to api_keys
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Add expires_at to short_urls
ALTER TABLE public.short_urls ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Drop functions that change return type before recreating
DROP FUNCTION IF EXISTS public.list_short_urls(text);
DROP FUNCTION IF EXISTS public.list_api_keys(text);
DROP FUNCTION IF EXISTS public.create_api_key(text, text);
DROP FUNCTION IF EXISTS public.create_short_url(text, text, text);

-- Update create_api_key to accept p_expires_in (interval string or NULL for never)
CREATE OR REPLACE FUNCTION public.create_api_key(p_token text, p_name text, p_expires_in text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session app_sessions%rowtype;
  v_key text;
  v_key_hash text;
  v_key_prefix text;
  v_expires_at timestamptz;
BEGIN
  SELECT * INTO v_session FROM app_sessions WHERE token = p_token AND is_active = true AND expires_at > now();
  IF NOT FOUND THEN RETURN json_build_object('error', 'Invalid session.'); END IF;

  v_key := encode(gen_random_bytes(32), 'hex');
  v_key_hash := encode(sha256(v_key::bytea), 'hex');
  v_key_prefix := substring(v_key from 1 for 8);

  IF p_expires_in IS NOT NULL AND p_expires_in != 'never' THEN
    v_expires_at := now()::timestamptz + p_expires_in::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  INSERT INTO public.api_keys (user_id, name, key_hash, key_prefix, expires_at)
  VALUES (v_session.user_id, p_name, v_key_hash, v_key_prefix, v_expires_at)
  RETURNING id INTO v_key;

  RETURN json_build_object('key', v_key, 'id', (SELECT id FROM public.api_keys WHERE key_hash = v_key_hash), 'key_prefix', v_key_prefix);
END;
$$;

-- Update create_short_url to accept p_expires_in
CREATE OR REPLACE FUNCTION public.create_short_url(
  p_api_key text,
  p_url text,
  p_slug text DEFAULT NULL,
  p_expires_in text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key api_keys%rowtype;
  v_user_id uuid;
  v_slug varchar(16);
  v_url short_urls%rowtype;
  v_expires_at timestamptz;
BEGIN
  v_key := public.verify_api_key_internal(p_api_key);
  IF v_key IS NULL THEN RETURN json_build_object('error', 'Invalid or inactive API key.'); END IF;
  v_user_id := v_key.user_id;

  -- Check expiry
  IF v_key.expires_at IS NOT NULL AND v_key.expires_at < now() THEN
    RETURN json_build_object('error', 'API key has expired.');
  END IF;

  -- Generate slug if not provided
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := substring(encode(gen_random_bytes(6), 'base64') from 1 for 8);
    v_slug := regexp_replace(v_slug, '[^a-zA-Z0-9_-]', '', 'g');
  ELSE
    v_slug := p_slug;
  END IF;

  -- Calculate expiry
  IF p_expires_in IS NOT NULL AND p_expires_in != 'never' THEN
    v_expires_at := now()::timestamptz + p_expires_in::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Check for existing slug
  SELECT * INTO v_url FROM short_urls WHERE slug = v_slug;

  IF v_url.id IS NOT NULL THEN
    IF v_url.user_id != v_user_id THEN
      -- Try to find unique slug
      FOR i IN 1..10 LOOP
        v_slug := v_slug || substring(encode(gen_random_bytes(2), 'hex') from 1 for 2);
        SELECT * INTO v_url FROM short_urls WHERE slug = v_slug;
        EXIT WHEN v_url.id IS NULL;
      END LOOP;
    ELSE
      -- Update existing
      UPDATE short_urls SET original_url = p_url, slug = v_slug, expires_at = v_expires_at WHERE id = v_url.id;
      RETURN json_build_object('short_url', 'https://revy.my.id/s/' || v_slug, 'slug', v_slug, 'existing', true);
    END IF;
  END IF;

  INSERT INTO short_urls (slug, original_url, user_id, api_key_id, expires_at)
  VALUES (v_slug, p_url, v_user_id, v_key.id, v_expires_at)
  RETURNING * INTO v_url;

  RETURN json_build_object('short_url', 'https://revy.my.id/s/' || v_slug, 'slug', v_slug);
END;
$$;

-- Update list_short_urls to include expires_at
CREATE OR REPLACE FUNCTION public.list_short_urls(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session app_sessions%rowtype;
BEGIN
  SELECT * INTO v_session FROM app_sessions WHERE token = p_token AND is_active = true AND expires_at > now();
  IF NOT FOUND THEN RETURN json_build_object('error', 'Invalid session.'); END IF;

  RETURN json_build_object('urls', (
    SELECT json_agg(json_build_object(
      'id', s.id,
      'slug', s.slug,
      'short_url', 'https://revy.my.id/s/' || s.slug,
      'original_url', s.original_url,
      'clicks', s.clicks,
      'created_at', s.created_at,
      'expires_at', s.expires_at
    ))
    FROM short_urls s WHERE s.user_id = v_session.user_id
    ORDER BY s.created_at DESC
  ));
END;
$$;

-- Update list_api_keys to include expires_at
CREATE OR REPLACE FUNCTION public.list_api_keys(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session app_sessions%rowtype;
BEGIN
  SELECT * INTO v_session FROM app_sessions WHERE token = p_token AND is_active = true AND expires_at > now();
  IF NOT FOUND THEN RETURN json_build_object('error', 'Invalid session.'); END IF;

  RETURN json_build_object('keys', (
    SELECT json_agg(json_build_object(
      'id', k.id,
      'name', k.name,
      'key_prefix', k.key_prefix,
      'rate_limit', k.rate_limit,
      'is_active', k.is_active,
      'created_at', k.created_at,
      'last_used_at', k.last_used_at,
      'expires_at', k.expires_at
    ))
    FROM public.api_keys k WHERE k.user_id = v_session.user_id
    ORDER BY k.created_at DESC
  ));
END;
$$;

-- Auto-expire check function
CREATE OR REPLACE FUNCTION public.check_expired_keys() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.api_keys SET is_active = false WHERE expires_at IS NOT NULL AND expires_at < now() AND is_active = true;
  UPDATE public.short_urls SET is_active = false WHERE expires_at IS NOT NULL AND expires_at < now() AND is_active = true;
END;
$$;
