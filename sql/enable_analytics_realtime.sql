-- Enable realtime for analytics_events table
-- Run this in Supabase SQL Editor

-- 1. Add to realtime publication
do $$ begin
  alter publication supabase_realtime add table analytics_events;
exception when others then null;
end $$;

-- 2. Verify it's enabled
SELECT pubname, tablename 
FROM pg_publication_tables 
WHERE tablename = 'analytics_events';
