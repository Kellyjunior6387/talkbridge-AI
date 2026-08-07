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

// Support both backend-only service keys 
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export let supabase = null;

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
 * @param {string|null} userId - The optional user ID to filter messages by
 * @returns {Promise<Array>} List of messages sorted by created_at DESC
 */
export async function getLatestMessages(limit = 20, userId = null) {
  return retryQuery(async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized due to missing credentials');
      }

      let query = supabase.from('messages').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query
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

/**
 * Generic row upsert helper for product/profile tables.
 * @param {string} table
 * @param {Object|Array<Object>} rows
 * @param {string} [onConflict]
 */
export async function upsertRows(table, rows, onConflict) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized due to missing credentials');
  }

  const payload = Array.isArray(rows) ? rows : [rows];
  const query = supabase.from(table).upsert(payload, onConflict ? { onConflict } : undefined).select();
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data;
}

export async function listRows(table, filters = {}) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized due to missing credentials');
  }

  let query = supabase.from(table).select('*');
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data || [];
}

export async function getRow(table, filters = {}) {
  const rows = await listRows(table, filters);
  return rows[0] || null;
}

export async function ensureMediaBucket() {
  if (!supabase) return;
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      log('warn', `[Supabase Storage] Failed to list buckets: ${listError.message}`);
      return;
    }
    const hasMedia = buckets.some(b => b.id === 'media' || b.name === 'media');
    if (!hasMedia) {
      log('info', '[Supabase Storage] Media bucket not found. Attempting to create it...');
      const { error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      if (createError) {
        log('error', `[Supabase Storage] Failed to create media bucket: ${createError.message}`);
      } else {
        log('info', '[Supabase Storage] Media bucket successfully created and configured as public.');
      }
    } else {
      log('info', '[Supabase Storage] Media bucket verified.');
    }
  } catch (err) {
    log('error', `[Supabase Storage] Error verifying media bucket: ${err.message}`);
  }
}

export async function createSignedUploadUrl(filePath) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized due to missing credentials');
  }
  const { data, error } = await supabase.storage
    .from('media')
    .createSignedUploadUrl(filePath);

  if (error) {
    throw error;
  }
  return data; // returns { signedUrl, token, path }
}

