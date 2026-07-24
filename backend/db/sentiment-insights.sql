-- =====================================================================
-- TalkBridge AI — Sentiment Insights & Known-Issue Detection
-- Run this in the Supabase SQL editor AFTER the base `messages` table
-- (see services/supabase.js) has been created.
-- Safe to re-run: every statement is idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. topics — the growing, LLM-fed vocabulary of comparable topics.
--    Each incoming message is reduced to one or more topic slugs so that
--    "my package is late", "still waiting for delivery" and "order hasn't
--    arrived" all collapse onto `shipping_delay` and become countable.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS topics (
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

-- ---------------------------------------------------------------------
-- 2. message_topics — join table: one row per (message, topic) tag.
--    This is the fact table the statistical spike detector aggregates.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID REFERENCES messages(id) ON DELETE CASCADE,
  topic_slug  TEXT REFERENCES topics(slug) ON DELETE CASCADE,
  product_ref TEXT DEFAULT 'general',             -- LLM's best guess of the product referenced; 'general' if none
  keyword     TEXT,                               -- the raw phrase that triggered the tag
  sentiment   TEXT,                               -- copied from the message for convenience
  confidence  REAL DEFAULT 0.5,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_topics_lookup
  ON message_topics (product_ref, topic_slug, created_at DESC);

-- ---------------------------------------------------------------------
-- 3. known_issues — deduped, human-reviewable records auto-created when a
--    (product, topic) pair spikes above its trailing-7-day baseline.
--    One active record per (product_ref, topic_slug) suppresses the
--    "100 escalations for the same mpesa bug" problem.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS known_issues (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_ref         TEXT DEFAULT 'general',
  topic_slug          TEXT REFERENCES topics(slug),
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
  ON known_issues (product_ref, topic_slug, status);

-- ---------------------------------------------------------------------
-- 4. get_topic_daily_counts — RPC returning per-day tag counts for every
--    (product_ref, topic_slug) over a trailing window. The z-score math
--    (trailing-7-day mean/std) is computed in Node so the statistical
--    logic stays readable and unit-testable; Postgres only does the
--    heavy GROUP BY. Timezone is pinned so "a day" means a Nairobi day.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_topic_daily_counts(days_back INT DEFAULT 8)
RETURNS TABLE (product_ref TEXT, topic_slug TEXT, day DATE, cnt BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT mt.product_ref,
         mt.topic_slug,
         (mt.created_at AT TIME ZONE 'Africa/Nairobi')::date AS day,
         COUNT(*) AS cnt
  FROM message_topics mt
  WHERE mt.created_at >= (NOW() - (days_back || ' days')::interval)
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;
$$;

-- Expose the new tables to the realtime dashboard.
ALTER PUBLICATION supabase_realtime ADD TABLE known_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE message_topics;
