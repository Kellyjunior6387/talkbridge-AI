-- TalkBridge AI Supabase schema
-- Run this in the Supabase SQL editor for the new project.

create extension if not exists "pgcrypto";

-- Profile row linked to the authenticated app user.
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  zernio_profile_id text unique,
  name text not null,
  description text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Zernio-postable product catalogue.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  zernio_profile_id text,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  image_url text,
  sizes jsonb not null default '[]'::jsonb,
  platforms jsonb not null default '[]'::jsonb,
  ai_instructions text,
  ai_metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Posts created from products and published through Zernio.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  zernio_post_id text,
  content text not null,
  platforms jsonb not null default '[]'::jsonb,
  media_items jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Webhook settings / delivery audit records.
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  secret text,
  events jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  custom_headers jsonb not null default '{}'::jsonb,
  zernio_webhook_id text,
  last_fired_at timestamptz,
  failure_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing message log table used by the webhook simulator and dashboards.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null,
  channel_message_id text,
  author_username text,
  raw_content text not null,
  language text,
  intent text,
  urgency integer,
  sentiment text,
  ai_reply text,
  status text default 'pending',
  zernio_post_id text,
  escalated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_user_id_idx on public.messages (user_id);
create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists products_zernio_profile_id_idx on public.products (zernio_profile_id);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_product_id_idx on public.posts (product_id);
create index if not exists webhooks_is_active_idx on public.webhooks (is_active);

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists set_webhooks_updated_at on public.webhooks;
create trigger set_webhooks_updated_at
before update on public.webhooks
for each row execute function public.set_updated_at();

drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.products enable row level security;
alter table public.posts enable row level security;
alter table public.webhooks enable row level security;
alter table public.messages enable row level security;

-- Users can only access their own records from the client side.
create policy "read own profile" on public.user_profiles
for select using (auth.uid() = user_id);
create policy "insert own profile" on public.user_profiles
for insert with check (auth.uid() = user_id);
create policy "update own profile" on public.user_profiles
for update using (auth.uid() = user_id);
create policy "delete own profile" on public.user_profiles
for delete using (auth.uid() = user_id);

create policy "read own products" on public.products
for select using (auth.uid() = user_id);
create policy "insert own products" on public.products
for insert with check (auth.uid() = user_id);
create policy "update own products" on public.products
for update using (auth.uid() = user_id);
create policy "delete own products" on public.products
for delete using (auth.uid() = user_id);

create policy "read own posts" on public.posts
for select using (auth.uid() = user_id);
create policy "insert own posts" on public.posts
for insert with check (auth.uid() = user_id);
create policy "update own posts" on public.posts
for update using (auth.uid() = user_id);
create policy "delete own posts" on public.posts
for delete using (auth.uid() = user_id);

-- Webhooks and message logs are backend-managed. The service role bypasses RLS,
-- so we intentionally do not add public client policies here.

-- Optional seed row for local testing only.
-- Insert a profile after signup through the app or admin console.