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
import { log } from '../utils/logger.js';

// Support both backend-only service keys and frontend public keys as fallbacks
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (initErr) {
    log('error', `[Supabase] Initialization failed: ${initErr.message}`);
  }
} else {
  log('error', 'Supabase Service: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.');
}

/**
 * Inserts a new message record into Supabase
 * @param {Object} data - Row fields matching schema
 * @returns {Promise<Object>} Inserted row
 */
export async function insertMessage(data) {
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
    log('error', `[Supabase] insertMessage failed: ${err.message}`);
    throw new Error(`Supabase insert failed: ${err.message}`);
  }
}

/**
 * Updates an existing message record in Supabase
 * @param {string} id - UUID of message
 * @param {Object} updates - Fields to update
 */
export async function updateMessage(id, updates) {
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
    log('error', `[Supabase] updateMessage failed for ID ${id}: ${err.message}`);
    throw new Error(`Supabase update failed: ${err.message}`);
  }
}

/**
 * Retrieves the latest messages from the database
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} List of messages sorted by created_at DESC
 */
export async function getLatestMessages(limit = 20) {
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
    log('error', `[Supabase] getLatestMessages failed: ${err.message}`);
    throw new Error(`Supabase select failed: ${err.message}`);
  }
}
