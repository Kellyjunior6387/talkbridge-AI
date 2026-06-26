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
