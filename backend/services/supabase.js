/*
-- Run this in Supabase SQL editor before starting the server

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,           -- 'tiktok' | 'instagram' | 'sms' | 'whatsapp'
  channel_message_id TEXT,          -- original ID from platform (e.g. TikTok comment ID)
  author_username TEXT,
  raw_content TEXT NOT NULL,        -- original message text
  language TEXT,                    -- detected language code e.g. 'en', 'sw'
  intent TEXT,                      -- 'complaint' | 'question' | 'hype' | 'purchase_intent' | 'spam'
  urgency INTEGER,                  -- 1-10
  sentiment TEXT,                   -- 'positive' | 'neutral' | 'negative'
  ai_reply TEXT,                    -- Claude's drafted reply
  status TEXT DEFAULT 'pending',    -- 'pending' | 'auto_replied' | 'escalated' | 'human_reviewed'
  zernio_post_id TEXT,              -- returned from Zernio after publishing
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime so the Next.js dashboard can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- The Sentiment Insights feature (topics, message_topics, known_issues and the
-- get_topic_daily_counts RPC) lives in a separate migration: db/sentiment-insights.sql
*/

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { log } from '../utils/logger.js';

// Polyfill WebSocket globally to satisfy Supabase SDK environment checks in Node.js < 22
globalThis.WebSocket = ws;

// Support both backend-only service keys and frontend public keys as fallbacks
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
      realtime: {
        websocket: ws,
      },
    });
  } catch (initErr) {
    log('error', `[Supabase] Initialization failed: ${initErr.message}`);
  }
} else {
  log('error', 'Supabase Service: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.');
}

/**
 * Helper utility to retry database operations on intermittent network dropouts
 * @param {Function} fn - Async operation to retry
 * @param {number} retries - Number of attempts
 * @param {number} delay - Delay between retries in milliseconds
 */
async function retryQuery(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      log('warn', `[Supabase] Query failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

/**
 * Inserts a new message record into Supabase
 * @param {Object} data - Row fields matching schema
 * @returns {Promise<Object>} Inserted row
 */
export async function insertMessage(data) {
  return retryQuery(async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized due to missing credentials');
      }

      const { data: row, error } = await supabase
        .from('messages')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return row;
    } catch (err) {
      log('error', `[Supabase] insertMessage attempt failed: ${err.message}`);
      throw err;
    }
  }).catch(err => {
    log('error', `[Supabase] insertMessage exhausted all retries: ${err.message}`);
    throw new Error(`Supabase insert failed: ${err.message}`);
  });
}

/**
 * Updates an existing message record in Supabase
 * @param {string} id - UUID of message
 * @param {Object} updates - Fields to update
 */
export async function updateMessage(id, updates) {
  return retryQuery(async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized due to missing credentials');
      }

      const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (err) {
      log('error', `[Supabase] updateMessage attempt failed for ID ${id}: ${err.message}`);
      throw err;
    }
  }).catch(err => {
    log('error', `[Supabase] updateMessage exhausted all retries for ID ${id}: ${err.message}`);
    throw new Error(`Supabase update failed: ${err.message}`);
  });
}

/**
 * Retrieves the latest messages from the database
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} List of messages sorted by created_at DESC
 */
export async function getLatestMessages(limit = 20) {
  return retryQuery(async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized due to missing credentials');
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }
      return data;
    } catch (err) {
      log('error', `[Supabase] getLatestMessages attempt failed: ${err.message}`);
      throw err;
    }
  }).catch(err => {
    log('error', `[Supabase] getLatestMessages exhausted all retries: ${err.message}`);
    throw new Error(`Supabase select failed: ${err.message}`);
  });
}

// =====================================================================
// Sentiment Insights data access (topics / message_topics / known_issues)
// =====================================================================

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized due to missing credentials');
  }
}

/**
 * Returns the current topic vocabulary (slug + label), most-seen first.
 */
export async function getTopics(limit = 300) {
  return retryQuery(async () => {
    requireClient();
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('occurrence_count', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }).catch(err => {
    log('error', `[Supabase] getTopics failed: ${err.message}`);
    return [];
  });
}

/**
 * Inserts a new topic or bumps an existing one's counters (read-modify-write;
 * fine at SME message volume). Keeps a small rolling set of example phrases.
 */
export async function upsertTopic(topic) {
  return retryQuery(async () => {
    requireClient();
    const { data: existing, error: selErr } = await supabase
      .from('topics')
      .select('slug, example_phrases, occurrence_count')
      .eq('slug', topic.slug)
      .maybeSingle();
    if (selErr) throw selErr;

    const now = new Date().toISOString();
    if (existing) {
      const phrases = new Set([...(existing.example_phrases || [])]);
      if (topic.keyword) phrases.add(topic.keyword);
      const { error } = await supabase
        .from('topics')
        .update({
          occurrence_count: (existing.occurrence_count || 0) + 1,
          last_seen_at: now,
          example_phrases: Array.from(phrases).slice(-8)
        })
        .eq('slug', topic.slug);
      if (error) throw error;
      return { created: false };
    }

    const { error } = await supabase.from('topics').insert([{
      slug: topic.slug,
      label: topic.label || topic.slug,
      description: topic.description || null,
      category: topic.category || 'other',
      polarity: topic.polarity || 'neutral',
      created_by: topic.createdBy || 'llm',
      example_phrases: topic.keyword ? [topic.keyword] : [],
      occurrence_count: 1,
      last_seen_at: now
    }]);
    if (error) throw error;
    return { created: true };
  }).catch(err => {
    log('error', `[Supabase] upsertTopic(${topic.slug}) failed: ${err.message}`);
    return { created: false, error: err.message };
  });
}

/**
 * Records a (message, topic) tag row.
 */
export async function insertMessageTopic(row) {
  return retryQuery(async () => {
    requireClient();
    const { error } = await supabase.from('message_topics').insert([row]);
    if (error) throw error;
  }).catch(err => {
    log('error', `[Supabase] insertMessageTopic failed: ${err.message}`);
  });
}

/**
 * Calls the get_topic_daily_counts RPC → per-day tag counts for every
 * (product_ref, topic_slug) over a trailing window.
 */
export async function getTopicDailyCounts(daysBack = 8) {
  return retryQuery(async () => {
    requireClient();
    const { data, error } = await supabase.rpc('get_topic_daily_counts', { days_back: daysBack });
    if (error) throw error;
    return data || [];
  }).catch(err => {
    log('error', `[Supabase] getTopicDailyCounts failed: ${err.message}`);
    return [];
  });
}

/**
 * Returns the active (non-resolved) known issue for a product+topic, if any.
 * Used to dedupe spikes and suppress repeat escalations.
 */
export async function getActiveKnownIssue(productRef, topicSlug) {
  return retryQuery(async () => {
    requireClient();
    const { data, error } = await supabase
      .from('known_issues')
      .select('*')
      .eq('product_ref', productRef)
      .eq('topic_slug', topicSlug)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }).catch(err => {
    log('error', `[Supabase] getActiveKnownIssue failed: ${err.message}`);
    return null;
  });
}

export async function createKnownIssue(row) {
  return retryQuery(async () => {
    requireClient();
    const { data, error } = await supabase.from('known_issues').insert([row]).select().single();
    if (error) throw error;
    return data;
  }).catch(err => {
    log('error', `[Supabase] createKnownIssue failed: ${err.message}`);
    throw new Error(`Supabase createKnownIssue failed: ${err.message}`);
  });
}

export async function updateKnownIssue(id, updates) {
  return retryQuery(async () => {
    requireClient();
    const { data, error } = await supabase
      .from('known_issues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }).catch(err => {
    log('error', `[Supabase] updateKnownIssue(${id}) failed: ${err.message}`);
    throw new Error(`Supabase updateKnownIssue failed: ${err.message}`);
  });
}

/**
 * Lists known issues, newest activity first. Optional filters: status, review_status.
 */
export async function getKnownIssues({ status, reviewStatus, limit = 100 } = {}) {
  return retryQuery(async () => {
    requireClient();
    let query = supabase.from('known_issues').select('*');
    if (status) query = query.eq('status', status);
    if (reviewStatus) query = query.eq('review_status', reviewStatus);
    const { data, error } = await query
      .order('last_seen_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }).catch(err => {
    log('error', `[Supabase] getKnownIssues failed: ${err.message}`);
    return [];
  });
}

/**
 * Returns representative raw messages for a product+topic spike, used to feed
 * the Gemma known-issue summarizer.
 */
export async function getSampleMessagesForTopic(productRef, topicSlug, limit = 8) {
  return retryQuery(async () => {
    requireClient();
    const { data, error } = await supabase
      .from('message_topics')
      .select('messages(raw_content)')
      .eq('product_ref', productRef)
      .eq('topic_slug', topicSlug)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || [])
      .map(r => r.messages?.raw_content)
      .filter(Boolean);
  }).catch(err => {
    log('error', `[Supabase] getSampleMessagesForTopic failed: ${err.message}`);
    return [];
  });
}

/**
 * Marks all pending messages as human reviewed
 */
export async function markAllMessagesRead() {
  return retryQuery(async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized due to missing credentials');
      }

      const { data, error } = await supabase
        .from('messages')
        .update({ status: 'human_reviewed' })
        .eq('status', 'pending');

      if (error) {
        throw error;
      }
      return data;
    } catch (err) {
      log('error', `[Supabase] markAllMessagesRead failed: ${err.message}`);
      throw err;
    }
  });
}

