import express from 'express';
import { classifyAndReply } from '../services/gemini.js';
import { publishReply, publishCommentReply, publishDirectMessageReply } from '../services/zernio.js';
import { escalateToAgent } from '../services/africastalking.js';
import { supabase, insertMessage, updateMessage, getRow } from '../services/supabase.js';
import { recordMessageTopics, findActiveIssueForTopics } from '../services/insights.js';
import { log } from '../utils/logger.js';

const router = express.Router();
const processingIds = new Set();

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

/**
 * Resolves the user's ID based on the webhook payload.
 * First tries to locate the post/product owner, then profile ID, then fallback to first user profile.
 * @param {Object} payload - Webhook payload
 * @returns {Promise<string|null>} Resolved user_id
 */
export async function resolveUserId(payload) {
  let userId = null;

  try {
    // 1. Try to resolve via comment's post owner
    const postId = payload.post?.id || payload.comment?.postId || payload.message?.postId;
    if (postId) {
      const postRecord = await getRow('posts', { zernio_post_id: postId });
      if (postRecord?.user_id) {
        userId = postRecord.user_id;
      }
    }

    // 2. Try to resolve via Zernio profile ID (if present in payload)
    if (!userId) {
      const profileId = payload.profileId || payload.profile?.id || payload.comment?.profileId || payload.message?.profileId;
      if (profileId) {
        const profileRecord = await getRow('user_profiles', { zernio_profile_id: profileId });
        if (profileRecord?.user_id) {
          userId = profileRecord.user_id;
        }
      }
    }

    // 3. Fallback: retrieve the first user profile in the database
    if (!userId) {
      const { data: allProfiles } = await supabase
        .from('user_profiles')
        .select('user_id')
        .limit(1);
      if (allProfiles && allProfiles.length > 0) {
        userId = allProfiles[0].user_id;
      }
    }
  } catch (err) {
    log('error', `[Webhook] resolveUserId failed: ${err.message}`);
  }

  return userId;
}

/**
 * Resolves the user's phone number based on the webhook payload.
 * First tries to locate the post/product owner, then queries Supabase Auth Admin.
 * @param {Object} payload - Webhook payload
 * @returns {Promise<string|null>} Resolved phone number
 */
async function resolveUserPhoneNumber(payload) {
  try {
    const userId = await resolveUserId(payload);

    // 4. Query auth admin to fetch the sms_phone or phone metadata
    if (userId && supabase) {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error) {
        log('error', `[Webhook] Supabase Admin getUserById failed: ${error.message}`);
      } else if (data?.user) {
        const phone = data.user.user_metadata?.sms_phone || data.user.phone;
        if (phone) {
          log('info', `[Webhook] Resolved phone number "${phone}" for user ${userId}`);
          return phone;
        }
      }
    }
  } catch (err) {
    log('error', `[Webhook] resolveUserPhoneNumber failed: ${err.message}`);
  }

  log('warn', `[Webhook] Could not resolve a custom phone number. Using environment fallback.`);
  return null;
}

router.post('/tiktok', (req, res) => {
  const payload = req.body;

  // Step 1: Validate the payload
  if (payload.event !== 'comment.created' || !payload.data?.text) {
    log('warn', `[Webhook] Rejected invalid payload: ${JSON.stringify(payload)}`);
    return res.status(400).json({ error: 'Invalid TikTok webhook payload' });
  }

  const { data } = payload;
  const commentId = data?.comment_id;

  if (commentId && processingIds.has(commentId)) {
    log('info', `[Webhook] TikTok comment ${commentId} is already being processed. Ignoring duplicate.`);
    return res.status(200).json({ status: 'ignored', reason: 'already processing' });
  }
  if (commentId) {
    processingIds.add(commentId);
  }

  // Return 200 immediately to acknowledge (TikTok requires fast ACK)
  res.status(200).json({ received: true });

  // Process the rest asynchronously (do not await before sending 200)
  (async () => {
    let rowId = null;
    try {
      const userId = await resolveUserId(payload);
      if (commentId) {
        const existing = await getRow('messages', { channel_message_id: commentId });
        if (existing) {
          log('info', `[Webhook] TikTok comment ${commentId} already processed. Skipping duplicate.`);
          return;
        }
      }
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
        user_id: userId,
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

      // Step 4b: Sentiment Insights — extract comparable topics & grow vocabulary
      const { productRef, topics } = await recordMessageTopics({
        messageId: rowId,
        messageText,
        sentiment
      });

      if (urgency >= 7) {
        // If a tracked known issue already covers this, the brand is handling it —
        // attach quietly instead of firing yet another human escalation.
        const coveringIssue = await findActiveIssueForTopics(productRef, topics);
        if (coveringIssue) {
          log('info', `[Webhook] Urgency ${urgency} but covered by known issue "${coveringIssue.title}" — escalation suppressed, auto-replying.`);
        } else {
          // Resolve user phone number
          const recipientPhone = await resolveUserPhoneNumber(payload);

          // Call Africa's Talking to send SMS alert to human agent
          await escalateToAgent({
            platform,
            authorUsername,
            messageText,
            urgency,
            intent,
            aiReply: reply,
            recipientPhone
          });

          // Update Supabase status
          await updateMessage(rowId, {
            status: 'escalated',
            escalated_at: new Date().toISOString()
          });
          log('warn', `[Webhook] High urgency (${urgency}/10) — Escalated to Africa's Talking agent.`);
          return;
        }
      }

      // Auto-reply via Zernio (low urgency, or high urgency already covered by a known issue)
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
    } finally {
      if (commentId) {
        processingIds.delete(commentId);
      }
    }
  })();
});

/**
 * Main Zernio Webhook Handler (monitors Instagram comments)
 */
router.post('/zernio', (req, res) => {
  const payload = req.body;

  // Step 1: Validate the payload
  if (payload.event !== 'comment.received' || !payload.comment?.text) {
    log('warn', `[Zernio Webhook] Rejected invalid or non-comment payload: ${JSON.stringify(payload)}`);
    return res.status(400).json({ error: 'Invalid Zernio webhook payload' });
  }

  const comment = payload.comment;
  const authorUsername = comment.author?.username || 'unknown';
  const commentId = comment.id;

  if (commentId && processingIds.has(commentId)) {
    log('info', `[Zernio Webhook] Comment ${commentId} is already being processed. Ignoring duplicate.`);
    return res.status(200).json({ status: 'ignored', reason: 'already processing' });
  }
  if (commentId) {
    processingIds.add(commentId);
  }

  // Safeguard: Do not reply if this comment is a reply itself or is from our own account
  // This prevents infinite loops where our bot replies to its own comment
  if (comment.isReply || authorUsername === payload.account?.username) {
    log('info', `[Zernio Webhook] Ignored comment from @${authorUsername} (isReply: ${comment.isReply}). Loop protection active.`);
    if (commentId) processingIds.delete(commentId);
    return res.status(200).json({ status: 'ignored', reason: 'comment is a reply or from self' });
  }

  // ACK immediately to Zernio
  res.status(200).json({ received: true });

  // Process asynchronously
  (async () => {
    let rowId = null;
    try {
      const userId = await resolveUserId(payload);
      if (commentId) {
        const existing = await getRow('messages', { channel_message_id: commentId });
        if (existing) {
          log('info', `[Zernio Webhook] Comment ${commentId} already processed. Skipping duplicate.`);
          return;
        }
      }
      const platform = comment.platform || 'instagram';
      const messageText = sanitizeMessage(comment.text);
      const accountId = payload.account?.id;
      const postId = payload.post?.id || comment.postId;

      log('info', `[Zernio Webhook] Asynchronously processing Zernio ${platform} comment from @${authorUsername}: "${messageText}"`);

      // Retrieve product context linked to the post
      let product = null;
      if (postId) {
        try {
          const postRecord = await getRow('posts', { zernio_post_id: postId });
          if (postRecord?.product_id) {
            product = await getRow('products', { id: postRecord.product_id });
            log('info', `[Zernio Webhook] Loaded product context: ${product?.name} for post ${postId}`);
          }
        } catch (dbErr) {
          log('error', `[Zernio Webhook] Database lookup for product context failed: ${dbErr.message}`);
        }
      }

      // Step 2: Call Gemini for classification + reply (passing product context)
      const { intent, urgency, sentiment, language, reply, reasoning } =
        await classifyAndReply(messageText, platform, authorUsername, product);

      log('info', `[Zernio Webhook] Gemini results: intent=${intent} urgency=${urgency} lang=${language}`);
      log('info', `[Zernio Webhook] Reasoning: ${reasoning}`);

      // Step 3: Save to Supabase (status = 'pending')
      const row = await insertMessage({
        user_id: userId,
        platform,
        channel_message_id: commentId,
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

      // Step 4: Route based on urgency
      if (intent === 'spam') {
        await updateMessage(rowId, { status: 'human_reviewed' });
        log('info', `[Zernio Webhook] Spam detected — skipping reply silently.`);
        return;
      }

      // Step 4b: Sentiment Insights — extract comparable topics & grow vocabulary
      const { productRef, topics } = await recordMessageTopics({
        messageId: rowId,
        messageText,
        sentiment
      });

      if (urgency >= 7) {
        const coveringIssue = await findActiveIssueForTopics(productRef, topics);
        if (coveringIssue) {
          log('info', `[Zernio Webhook] Urgency ${urgency} but covered by known issue "${coveringIssue.title}" — escalation suppressed, replying.`);
        } else {
          // Resolve user phone number
          const recipientPhone = await resolveUserPhoneNumber(payload);

          // Escalation alert via Africa's Talking
          await escalateToAgent({
            platform,
            authorUsername,
            messageText,
            urgency,
            intent,
            aiReply: reply,
            recipientPhone
          });

          await updateMessage(rowId, {
            status: 'escalated',
            escalated_at: new Date().toISOString()
          });
          log('warn', `[Zernio Webhook] High urgency (${urgency}/10) — Escalated to Africa's Talking agent.`);
          return;
        }
      }

      // Direct reply via Zernio (low urgency, or high urgency already covered by a known issue)
      if (accountId && commentId) {
        try {
          await publishCommentReply(reply, accountId, commentId, postId);
          await updateMessage(rowId, {
            status: 'auto_replied',
            zernio_post_id: 'comment_reply' // Mark as direct comment reply
          });
          log('info', `[Zernio Webhook] Comment reply successfully published.`);
        } catch (zernioErr) {
          log('error', `[Zernio Webhook] Direct comment reply failed: ${zernioErr.message}`);
          // Record remains 'pending' in Supabase
        }
      } else {
        log('warn', `[Zernio Webhook] Missing accountId (${accountId}) or commentId (${commentId}). Cannot reply.`);
      }

    } catch (err) {
      log('error', `[Zernio Webhook] Async webhook processing failed: ${err.message}`);
    } finally {
      if (commentId) {
        processingIds.delete(commentId);
      }
    }
  })();
});

router.post('/zernio/comments', (req, res) => {
  const payload = req.body;

  if (!payload?.id || payload.event !== 'comment.received' || !payload.comment?.text) {
    log('warn', `[Zernio Webhook] Rejected invalid comment payload: ${JSON.stringify(payload)}`);
    return res.status(400).json({ error: 'Invalid Zernio comment webhook payload' });
  }

  res.status(200).json({ received: true });

  (async () => {
    try {
      const comment = payload.comment;
      const authorUsername = comment.author?.username || 'unknown';
      const messageText = sanitizeMessage(comment.text);

      log('info', `[Zernio Webhook] Received comment ${payload.id} on post ${comment.postId || 'unknown'} from @${authorUsername}: "${messageText}"`);
    } catch (err) {
      log('error', `[Zernio Webhook] comment delivery handling failed: ${err.message}`);
    }
  })();
});

router.post('/zernio/messages', (req, res) => {
  const payload = req.body;

  // Step 1: Validate payload
  if (payload.event !== 'message.received' || !payload.message?.text) {
    log('warn', `[Zernio Message Webhook] Rejected invalid message webhook payload: ${JSON.stringify(payload)}`);
    return res.status(400).json({ error: 'Invalid Zernio message webhook payload' });
  }

  const message = payload.message;
  const authorUsername = message.sender?.username || 'unknown';
  const messageText = sanitizeMessage(message.text);
  const conversationId = payload.conversation?.id || message.conversationId;
  const accountId = payload.account?.id;
  const platform = message.platform || 'instagram';
  const messageId = message.id;

  if (messageId && processingIds.has(messageId)) {
    log('info', `[Zernio Message Webhook] Message ${messageId} is already being processed. Ignoring duplicate.`);
    return res.status(200).json({ status: 'ignored', reason: 'already processing' });
  }
  if (messageId) {
    processingIds.add(messageId);
  }

  // Safeguard: Loop protection
  if (authorUsername === payload.account?.username) {
    log('info', `[Zernio Message Webhook] Ignored message from @${authorUsername} (self). Loop protection active.`);
    if (messageId) processingIds.delete(messageId);
    return res.status(200).json({ status: 'ignored', reason: 'message from self' });
  }

  // ACK immediately to Zernio
  res.status(200).json({ received: true });

  // Process asynchronously
  (async () => {
    let rowId = null;
    try {
      const userId = await resolveUserId(payload);
      if (messageId) {
        const existing = await getRow('messages', { channel_message_id: messageId });
        if (existing) {
          log('info', `[Zernio Message Webhook] Message ${messageId} already processed. Skipping duplicate.`);
          return;
        }
      }
      log('info', `[Zernio Message Webhook] Asynchronously processing Zernio DM from @${authorUsername} via ${platform}: "${messageText}"`);

      // Step 2: Call Gemini for classification + reply (passing null product since DMs don't belong to a post)
      const { intent, urgency, sentiment, language, reply, reasoning } =
        await classifyAndReply(messageText, platform, authorUsername);

      log('info', `[Zernio Message Webhook] Gemini results: intent=${intent} urgency=${urgency} lang=${language}`);
      log('info', `[Zernio Message Webhook] Reasoning: ${reasoning}`);

      // Step 3: Save to Supabase (status = 'pending')
      const row = await insertMessage({
        user_id: userId,
        platform,
        channel_message_id: message.id,
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

      // Step 4: Route based on urgency
      if (intent === 'spam') {
        await updateMessage(rowId, { status: 'human_reviewed' });
        log('info', `[Zernio Message Webhook] Spam detected — skipping reply silently.`);
        return;
      }

      if (urgency >= 7) {
        // Resolve user phone number
        const recipientPhone = await resolveUserPhoneNumber(payload);

        // SMS alert to human agent
        await escalateToAgent({
          platform,
          authorUsername,
          messageText,
          urgency,
          intent,
          aiReply: reply,
          recipientPhone
        });

        await updateMessage(rowId, {
          status: 'escalated',
          escalated_at: new Date().toISOString()
        });
        log('warn', `[Zernio Message Webhook] High urgency (${urgency}/10) — Escalated to agent.`);
        return;
      }

      // Urgency < 7 AND intent !== 'spam' -> Direct DM reply via Zernio
      if (accountId && conversationId) {
        try {
          await publishDirectMessageReply(reply, accountId, conversationId);
          await updateMessage(rowId, {
            status: 'auto_replied',
            zernio_post_id: 'dm_reply'
          });
          log('info', `[Zernio Message Webhook] DM auto-reply successfully published.`);
        } catch (zernioErr) {
          log('error', `[Zernio Message Webhook] Direct message reply failed: ${zernioErr.message}`);
        }
      } else {
        log('warn', `[Zernio Message Webhook] Missing accountId (${accountId}) or conversationId (${conversationId}). Cannot reply.`);
      }

    } catch (err) {
      log('error', `[Zernio Message Webhook] Async processing failed: ${err.message}`);
    } finally {
      if (messageId) {
        processingIds.delete(messageId);
      }
    }
  })();
});

export default router;
