import express from 'express';
import { classifyAndReply } from '../services/gemini.js';
import { publishReply } from '../services/zernio.js';
import { escalateToAgent } from '../services/twilio.js';
import { supabase, insertMessage, updateMessage, getLatestMessages, markAllMessagesRead } from '../services/supabase.js';
import { recordMessageTopics } from '../services/insights.js';
import { sanitizeMessage } from './webhook.js';
import { log } from '../utils/logger.js';

const router = express.Router();

/**
 * Endpoint to manually simulate any comment or message through the pipeline
 * Runs the pipeline synchronously to return full processing details for debugging/demos
 */
router.post('/simulate', async (req, res) => {
  try {
    const platform = req.body.platform || 'tiktok';
    const username = req.body.username || 'test_user';
    const message = req.body.message || '';
    const scenario = req.body.scenario || 'manual_simulation';

    log('info', `[Simulation] Starting simulation for platform: ${platform}, user: @${username}, scenario: ${scenario}`);

    if (!message) {
      log('warn', '[Simulation] Rejected empty simulation message.');
      return res.status(400).json({ error: 'Message text is required for simulation' });
    }

    // Resolve user ID
    let userId = req.body.userId;
    if (!userId) {
      const { data: allProfiles } = await supabase
        .from('user_profiles')
        .select('user_id')
        .limit(1);
      if (allProfiles && allProfiles.length > 0) {
        userId = allProfiles[0].user_id;
      }
    }

    // Step 1: Sanitize input
    const cleanMessage = sanitizeMessage(message);

    // Step 2: Call Gemini for classification + reply
    const classification = await classifyAndReply(cleanMessage, platform, username);
    log('info', `[Simulation] Gemini classification complete: intent=${classification.intent}, urgency=${classification.urgency}`);

    // Step 3: Save to Supabase (status = 'pending')
    const row = await insertMessage({
      user_id: userId,
      platform,
      channel_message_id: `sim-${Date.now()}`,
      author_username: username,
      raw_content: cleanMessage,
      language: classification.language,
      intent: classification.intent,
      urgency: classification.urgency,
      sentiment: classification.sentiment,
      ai_reply: classification.reply,
      status: 'pending'
    });

    log('info', `[Simulation] Supabase log created with ID: ${row.id}`);

    // Sentiment Insights: extract comparable topics & grow the vocabulary (skip pure spam)
    let insights = { productRef: 'general', topics: [] };
    if (classification.intent !== 'spam') {
      insights = await recordMessageTopics({
        messageId: row.id,
        messageText: cleanMessage,
        sentiment: classification.sentiment
      });
    }

    let action = 'auto_replied';
    let zernioPostId = null;
    let twilioSent = false;

    // Step 4: Route based on urgency
    if (classification.intent === 'spam') {
      action = 'spam_skipped';
      await updateMessage(row.id, { status: 'human_reviewed' });
      log('info', '[Simulation] Route Action: Spam detected. Marked as human_reviewed.');
    } else if (classification.urgency >= 7) {
      action = 'escalated';
      log('warn', `[Simulation] Route Action: High urgency (${classification.urgency}/10). Sending Twilio alert...`);
      
      const twilioSid = await escalateToAgent({
        platform,
        authorUsername: username,
        messageText: cleanMessage,
        urgency: classification.urgency,
        intent: classification.intent,
        aiReply: classification.reply
      });
      
      twilioSent = !!twilioSid;
      await updateMessage(row.id, {
        status: 'escalated',
        escalated_at: new Date().toISOString()
      });
    } else {
      // Auto-reply via Zernio
      log('info', `[Simulation] Route Action: Lower urgency (${classification.urgency}/10). Publishing to Zernio...`);
      try {
        zernioPostId = await publishReply(classification.reply, platform);
        await updateMessage(row.id, {
          status: 'auto_replied',
          zernio_post_id: zernioPostId
        });
      } catch (zernioErr) {
        log('error', `[Simulation] Zernio publishing failed: ${zernioErr.message}`);
        // Keep status as 'pending' in Supabase
      }
    }

    // Return the complete pipeline outcome synchronously
    return res.json({
      success: true,
      input: { platform, username, message, scenario },
      classification,
      action,
      supabase_id: row.id,
      zernio_post_id: zernioPostId,
      twilio_sent: twilioSent,
      product_ref: insights.productRef,
      topics: insights.topics.map(t => ({ slug: t.slug, label: t.label, keyword: t.keyword, is_new: t.isNew }))
    });

  } catch (err) {
    log('error', `[Simulation] Simulation route failed: ${err.message}`);
    return res.status(500).json({ error: `Simulation failed: ${err.message}` });
  }
});

/**
 * Endpoint to retrieve the last 20 processed messages
 */
router.get('/messages', async (req, res) => {
  try {
    const { userId } = req.query;
    log('info', `[Simulation] Fetching latest 20 messages from Supabase for user ${userId || 'all'}...`);
    const messages = await getLatestMessages(20, userId);
    return res.json(messages);
  } catch (err) {
    log('error', `[Simulation] Failed to get latest messages: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Handle human inbox actions: approve & reply (auto_replied) or dismiss (human_reviewed)
 */
router.post('/messages/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action, replyText, platform } = req.body;

  try {
    log('info', `[Action] Message ID ${id} action requested: ${action}`);

    if (action === 'send') {
      if (!replyText) {
        return res.status(400).json({ error: 'Reply text is required for send action' });
      }

      // Publish reply to social platform (TikTok/Instagram) via Zernio publishing
      let zernioPostId = 'manual_review_reply';
      try {
        zernioPostId = await publishReply(replyText, platform || 'instagram');
        log('info', `[Action] Zernio response successful: ${zernioPostId}`);
      } catch (publishErr) {
        log('error', `[Action] Zernio publishing failed but log will update: ${publishErr.message}`);
      }

      // Update database status
      await updateMessage(id, {
        status: 'auto_replied',
        ai_reply: replyText,
        zernio_post_id: zernioPostId
      });

      return res.json({ success: true, status: 'auto_replied', zernio_post_id: zernioPostId });
    } else if (action === 'dismiss') {
      // Dismiss flags as human reviewed / skipped
      await updateMessage(id, { status: 'human_reviewed' });
      return res.json({ success: true, status: 'human_reviewed' });
    } else {
      return res.status(400).json({ error: 'Invalid message action specified' });
    }
  } catch (err) {
    log('error', `[Action] Message ID ${id} action failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Mark all pending messages read
 */
router.post('/messages/mark-all-read', async (req, res) => {
  try {
    log('info', '[Action] Request to mark all pending messages read');
    await markAllMessagesRead();
    return res.json({ success: true });
  } catch (err) {
    log('error', `[Action] Mark all read failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

