-- Database Schema for Supabase Chat Messages

create table
  public.chat_messages (
    id uuid not null default gen_random_uuid (),
    user_id character varying not null,
    user_name character varying not null,
    user_image character varying null,
    message text not null,
    created_at timestamp with time zone not null default now(),
    constraint chat_messages_pkey primary key (id)
  ) tablespace pg_default;

-- Setup Row Level Security (RLS)
alter table public.chat_messages enable row level security;

-- Policy: Allow reading all messages for everyone
create policy "Allow read access to all users"
on public.chat_messages
for select
to public
using (true);

-- Policy: Allow insert
create policy "Allow insert for all users"
on public.chat_messages
for insert
to public
with check (true);

-- Policy: Allow delete for all users
-- NOTE: Since we use Supabase anon key without JWT user_id,
-- true server-side user verification is not possible via RLS.
-- Client-side verification is done by adding .eq('user_id', userId) 
-- to the delete query (defense-in-depth). For full security,
-- integrate Supabase JWT with Clerk.
create policy "Allow delete for all users"
on public.chat_messages
for delete
to public
using (true);

-- Enable real-time for chat_messages table
alter publication supabase_realtime add table chat_messages;

-- Database Schema for User Passkeys / Authorized Devices
create table
  public.user_passkeys (
    id uuid not null default gen_random_uuid (),
    user_id uuid not null references auth.users (id) on delete cascade,
    credential_id text not null unique,
    public_key text not null,
    device_name text not null,
    browser_name text not null,
    created_at timestamp with time zone not null default now(),
    last_used_at timestamp with time zone null,
    constraint user_passkeys_pkey primary key (id)
  ) tablespace pg_default;

-- Setup Row Level Security (RLS) for Passkeys
alter table public.user_passkeys enable row level security;

-- Policy: Users can view their own passkeys
create policy "Users can view own passkeys"
on public.user_passkeys
for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Users can insert their own passkeys
create policy "Users can insert own passkeys"
on public.user_passkeys
for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Users can update their own passkeys (for last_used_at)
create policy "Users can update own passkeys"
on public.user_passkeys
for update
to authenticated
using (auth.uid() = user_id);

-- Policy: Users can delete their own passkeys
create policy "Users can delete own passkeys"
on public.user_passkeys
for delete
to authenticated
using (auth.uid() = user_id);

-- Database Schema for General User Devices (Session Tracking)
create table
  public.user_devices (
    id uuid not null default gen_random_uuid (),
    user_id uuid not null references auth.users (id) on delete cascade,
    device_id text not null unique,
    device_name text not null,
    browser_name text not null,
    is_active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    last_active_at timestamp with time zone not null default now(),
    constraint user_devices_pkey primary key (id)
  ) tablespace pg_default;

-- Setup Row Level Security (RLS) for Devices
alter table public.user_devices enable row level security;

-- Policies for User Devices
create policy "Users can view own devices"
on public.user_devices for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own devices"
on public.user_devices for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own devices"
on public.user_devices for update to authenticated using (auth.uid() = user_id);

