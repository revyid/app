-- 1. Drop broken RLS policies that rely on JWT claims (app uses custom auth, not Supabase auth)
drop policy if exists "chat_delete" on public.chat_messages;
drop policy if exists "chat_delete_admin" on public.chat_messages;

-- Permissive delete policy: allow delete to public
-- App-level code handles who can delete what
create policy "chat_delete" on public.chat_messages
  for delete to public using (true);

-- 2. Recreate get_public_analytics with daily views for chart
create or replace function public.get_public_analytics()
returns json language plpgsql security definer as $$
begin
  return json_build_object(
    'total_views',     (select count(*) from analytics_events where event_type = 'page_view'),
    'today_views',     (select count(*) from analytics_events where event_type = 'page_view' and created_at::date = current_date),
    'unique_visitors', (select count(distinct ip_address) from analytics_events where event_type = 'page_view' and ip_address is not null and ip_address != 'unknown'),
    'user_agents',     (select coalesce(json_agg(user_agent), '[]'::json) from analytics_events where event_type = 'page_view' and user_agent is not null),
    'daily_views',     (select coalesce(json_agg(row_to_json(t) order by t.date), '[]'::json) from (
                          select created_at::date as date, count(*) as views
                          from analytics_events
                          where event_type = 'page_view' and created_at > now() - interval '7 days'
                          group by created_at::date order by created_at::date
                        ) t),
    'hourly_views',    (select coalesce(json_agg(row_to_json(t) order by t.hour), '[]'::json) from (
                          select date_trunc('hour', created_at) as hour, count(*) as views
                          from analytics_events
                          where event_type = 'page_view' and created_at > now() - interval '24 hours'
                          group by date_trunc('hour', created_at) order by date_trunc('hour', created_at)
                        ) t)
  );
end; $$;

-- 3. Grant execute
grant execute on function public.get_public_analytics() to anon;
grant execute on function public.get_public_analytics() to authenticated;
