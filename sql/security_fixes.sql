-- ============================================
-- SECURITY FIXES
-- App uses custom session auth, NOT Supabase Auth
-- JWT claims are empty — don't reference them in RLS
-- Auth is enforced at app level (deleteMessage/deleteMessageAdmin)
-- ============================================

-- 1. chat_insert: allow public (auth checked app-side)
drop policy if exists "chat_insert" on public.chat_messages;
drop policy if exists "chat_delete" on public.chat_messages;
drop policy if exists "chat_delete_owner" on public.chat_messages;
create policy "chat_insert" on public.chat_messages
  for insert to public with check (true);
create policy "chat_delete" on public.chat_messages
  for delete to public using (true);

-- 2. Enable realtime for themes table
do $$ begin
  alter publication supabase_realtime add table themes;
exception when others then null;
end $$;
