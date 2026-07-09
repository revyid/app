-- Re-grant permissions after function recreation
GRANT EXECUTE ON FUNCTION public.list_api_keys(text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_api_key(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.list_short_urls(text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_short_url(text, text, text, text) TO anon;

-- Fix: recreate list_api_keys with correct return type
DROP FUNCTION IF EXISTS public.list_api_keys(text);
CREATE OR REPLACE FUNCTION public.list_api_keys(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $
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
$;
GRANT EXECUTE ON FUNCTION public.list_api_keys(text) TO anon;
