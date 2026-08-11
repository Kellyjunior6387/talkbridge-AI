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

-- =====================================================================
-- Sentiment Insights & Known-Issue Detection
-- =====================================================================

-- 1. topics — the growing, LLM-fed vocabulary of comparable topics.
CREATE TABLE IF NOT EXISTS public.topics (
  slug             TEXT PRIMARY KEY,               -- 'shipping_delay', 'checkout_bug', 'mpesa_failure'
  label            TEXT NOT NULL,                  -- 'Shipping Delay'
  description      TEXT,                           -- what this topic captures
  category         TEXT DEFAULT 'other',           -- 'logistics'|'payment'|'quality'|'sizing'|'pricing'|'praise'|'other'
  polarity         TEXT DEFAULT 'negative',        -- 'negative'|'neutral'|'positive'
  created_by       TEXT DEFAULT 'llm',             -- 'llm'|'human'
  example_phrases  TEXT[] DEFAULT '{}',            -- sample raw phrases that mapped here
  occurrence_count INTEGER DEFAULT 0,              -- lifetime tag count
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. message_topics — join table: one row per (message, topic) tag.
CREATE TABLE IF NOT EXISTS public.message_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  topic_slug  TEXT REFERENCES public.topics(slug) ON DELETE CASCADE,
  product_ref TEXT DEFAULT 'general',             -- LLM's best guess of the product referenced; 'general' if none
  keyword     TEXT,                               -- the raw phrase that triggered the tag
  sentiment   TEXT,                               -- copied from the message for convenience
  confidence  REAL DEFAULT 0.5,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_topics_lookup
  ON public.message_topics (product_ref, topic_slug, created_at DESC);

-- 3. known_issues — deduped, human-reviewable records auto-created when a
--    (product, topic) pair spikes above its trailing-7-day baseline.
CREATE TABLE IF NOT EXISTS public.known_issues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_ref         TEXT DEFAULT 'general',
  topic_slug          TEXT REFERENCES public.topics(slug),
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT DEFAULT 'open',        -- 'open'|'investigating'|'resolved'
  review_status       TEXT DEFAULT 'unreviewed',  -- 'unreviewed'|'real_issue'|'noise'
  severity            TEXT DEFAULT 'medium',      -- 'low'|'medium'|'high'
  z_score             REAL,                       -- spike strength at detection
  baseline_avg        REAL,                       -- trailing 7-day mean daily count
  spike_count         INTEGER,                    -- tag count on the spike day
  message_count       INTEGER DEFAULT 0,          -- total linked messages so far
  suggested_statement TEXT,                       -- Gemma-drafted public holding statement
  first_detected_at   TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,
  reviewed_by         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_known_issues_active
  ON public.known_issues (product_ref, topic_slug, status);

-- 4. get_topic_daily_counts — RPC returning per-day tag counts.
CREATE OR REPLACE FUNCTION public.get_topic_daily_counts(days_back INT DEFAULT 8)
RETURNS TABLE (product_ref TEXT, topic_slug TEXT, day DATE, cnt BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT mt.product_ref,
         mt.topic_slug,
         (mt.created_at AT TIME ZONE 'Africa/Nairobi')::date AS day,
         COUNT(*) AS cnt
  FROM public.message_topics mt
  WHERE mt.created_at >= (NOW() - (days_back || ' days')::interval)
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;
$$;

-- Enable RLS
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_issues ENABLE ROW LEVEL SECURITY;

-- Read-only client policies for authenticated dashboard users
CREATE POLICY "read own topics" ON public.topics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read own message_topics" ON public.message_topics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read own known_issues" ON public.known_issues FOR SELECT USING (auth.role() = 'authenticated');

-- Realtime publication updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.known_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_topics;