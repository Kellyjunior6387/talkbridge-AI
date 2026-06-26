import express from 'express';
import { classifyAndReply } from '../services/gemini.js';
import { publishReply } from '../services/zernio.js';
import { escalateToAgent } from '../services/twilio.js';
import { insertMessage, updateMessage } from '../services/supabase.js';
import { log } from '../utils/logger.js';

const router = express.Router();

/**
 * Sanitizes input message text for safety and limits
 * @param {string} text - Raw message text
 * @returns {string} Sanitized text
 */
export function sanitizeMessage(text) {
  if (!text) return '';
  // Trim whitespace
  let clean = text.trim();
  // Strip HTML tags using regex
  clean = clean.replace(/<[^>]*>/g, '');
  // Truncate to 2000 characters
  return clean.slice(0, 2000);
}

router.post('/tiktok', (req, res) => {
  const payload = req.body;

  // Step 1: Validate the payload
  if (payload.event !== 'comment.created' || !payload.data?.text) {
    log('warn', `[Webhook] Rejected invalid payload: ${JSON.stringify(payload)}`);
    return res.status(400).json({ error: 'Invalid TikTok webhook payload' });
  }

  // Return 200 immediately to acknowledge (TikTok requires fast ACK)
  res.status(200).json({ received: true });

  // Process the rest asynchronously (do not await before sending 200)
  (async () => {
    let rowId = null;
    try {
      const { data } = payload;
      const platform = 'tiktok';
      const authorUsername = data.author?.username || 'unknown';
      
      // Sanitize input text
      const messageText = sanitizeMessage(data.text);

      log('info', `[Webhook] Asynchronously processing ${platform} comment from @${authorUsername}: "${messageText}"`);

      // Step 2: Call Gemini for classification + reply
      const { intent, urgency, sentiment, language, reply, reasoning } =
        await classifyAndReply(messageText, platform, authorUsername);

      log('info', `[Webhook] Gemini results: intent=${intent} urgency=${urgency} lang=${language}`);
      log('info', `[Webhook] Reasoning: ${reasoning}`);

      // Step 3: Save to Supabase (status = 'pending')
      const row = await insertMessage({
        platform,
        channel_message_id: data.comment_id,
        author_username: authorUsername,
        raw_content: messageText,
        language,
        intent,
        urgency,
        sentiment,
        ai_reply: reply,
        status: 'pending'
      });
      
      rowId = row.id;

      // Step 4: Route based on urgency score
      if (intent === 'spam') {
        await updateMessage(rowId, { status: 'human_reviewed' });
        log('info', `[Webhook] Spam detected — skipping reply silently.`);
        return;
      }

      if (urgency >= 7) {
        // Call Twilio to send SMS alert to human agent
        await escalateToAgent({ 
          platform, 
          authorUsername, 
          messageText, 
          urgency, 
          intent, 
          aiReply: reply 
        });
        
        // Update Supabase status
        await updateMessage(rowId, { 
          status: 'escalated', 
          escalated_at: new Date().toISOString() 
        });
        log('warn', `[Webhook] High urgency (${urgency}/10) — Escalated to Twilio agent.`);
        return;
      }

      // Urgency < 7 AND intent !== 'spam' -> Publish reply via Zernio
      try {
        const zernioPostId = await publishReply(reply, platform);
        await updateMessage(rowId, { 
          status: 'auto_replied', 
          zernio_post_id: zernioPostId 
        });
        log('info', `[Webhook] Auto-replied via Zernio — post ID: ${zernioPostId}`);
      } catch (zernioErr) {
        // A failure in Zernio publishing should NOT crash the server or lose the Supabase record.
        // It is already saved with status = 'pending', so we log it and proceed.
        log('error', `[Webhook] Zernio publishing failed but Supabase log is preserved as 'pending': ${zernioErr.message}`);
      }

    } catch (err) {
      log('error', `[Webhook] Async webhook processing failed: ${err.message}`);
    }
  })();
});

export default router;
