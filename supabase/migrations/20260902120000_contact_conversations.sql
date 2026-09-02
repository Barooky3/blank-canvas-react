-- Contact form conversations + threaded messages.
-- All access goes through Vercel /api/contact/* routes using the service role,
-- so RLS is enabled with NO anon/authenticated policies (deny-by-default).

create extension if not exists pgcrypto;

create table if not exists public.contact_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  subject text not null default '',
  -- new: customer wrote, admin hasn't replied yet
  -- active: at least one admin reply exists (an "activated conversation")
  status text not null default 'new' check (status in ('new', 'active')),
  -- secret token embedded in emails so the customer can reply without logging in
  reply_token uuid not null unique default gen_random_uuid(),
  admin_unread boolean not null default true,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.contact_conversations(id) on delete cascade,
  sender text not null check (sender in ('customer', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_conversation_idx
  on public.contact_messages (conversation_id, created_at);
create index if not exists contact_conversations_status_idx
  on public.contact_conversations (status, last_message_at desc);

alter table public.contact_conversations enable row level security;
alter table public.contact_messages enable row level security;
-- Intentionally no policies: only the service role (server routes) can read/write.
