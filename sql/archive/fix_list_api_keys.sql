-- Drop old function
DROP FUNCTION IF EXISTS public.list_api_keys(text);

-- Recreate with expires_at
CREATE OR REPLACE FUNCTION public.list_api_keys(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session app_sessions%rowtype;
  v_keys json;
BEGIN
  SELECT * INTO v_session FROM app_sessions WHERE token = p_token AND is_active = true AND expires_at > now();
  IF NOT FOUND THEN RETURN json_build_object('error', 'Invalid session.'); END IF;

  SELECT coalesce(json_agg(t), '[]'::json) INTO v_keys
  FROM (
    SELECT json_build_object(
      'id', k.id,
      'name', k.name,
      'key_prefix', k.key_prefix,
      'rate_limit', k.rate_limit,
      'is_active', k.is_active,
      'created_at', k.created_at,
      'last_used_at', k.last_used_at,
      'expires_at', k.expires_at
    ) AS t
    FROM public.api_keys k WHERE k.user_id = v_session.user_id
    ORDER BY k.created_at DESC
  ) sub;

  RETURN json_build_object('keys', v_keys);
END;
$$;

-- Grant
GRANT EXECUTE ON FUNCTION public.list_api_keys(text) TO anon;
