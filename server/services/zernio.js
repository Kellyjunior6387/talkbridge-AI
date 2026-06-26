import Zernio from '@zernio/node';
import { log } from '../utils/logger.js';

// The Zernio client automatically reads process.env.ZERNIO_API_KEY
let zernio;
try {
  if (process.env.ZERNIO_API_KEY) {
    // If Zernio library uses a default constructor
    zernio = new Zernio();
  } else {
    log('error', 'Zernio Service: Missing ZERNIO_API_KEY in environment variables.');
  }
} catch (e) {
  log('error', `Zernio client instantiation failed: ${e.message}`);
}

/**
 * Publishes an auto-reply via the Zernio API
 * @param {string} replyText - The text to post
 * @param {string} platform - The TalkBridge source platform
 * @returns {Promise<string|null>} The Zernio post ID or null
 */
export async function publishReply(replyText, platform) {
  try {
    // Map TalkBridge platform names to Zernio platform names
    const platformMap = {
      tiktok: 'twitter',      // TikTok has no direct Zernio publish yet; publish to Twitter/X
      instagram: 'instagram',
      sms: null,              // SMS replies go via Twilio, not Zernio
      whatsapp: null
    };

    const zernioPlatform = platformMap[platform];
    if (!zernioPlatform) {
      log('info', `[Zernio] Mapped platform is null for source '${platform}'. Skipping Zernio publishing.`);
      return null; 
    }

    // Get the right account ID from env
    const accountIdMap = {
      twitter: process.env.ZERNIO_ACCOUNT_ID_TWITTER,
      instagram: process.env.ZERNIO_ACCOUNT_ID_INSTAGRAM,
      linkedin: process.env.ZERNIO_ACCOUNT_ID_LINKEDIN
    };

    const accountId = accountIdMap[zernioPlatform];
    if (!accountId) {
      log('warn', `[Zernio] No account ID configured for ${zernioPlatform} in env.`);
      return null;
    }

    if (!zernio) {
      throw new Error('Zernio client is not initialized');
    }

    log('info', `[Zernio] Publishing reply on ${zernioPlatform} to account ${accountId}...`);
    const { post } = await zernio.posts.createPost({
      content: replyText,
      publishNow: true,
      platforms: [{ platform: zernioPlatform, accountId }]
    });

    // Make sure we handle cases where post might be shaped differently
    const postId = post?._id || post?.id || 'simulated_zernio_id';
    log('info', `[Zernio] Post published successfully. Post ID: ${postId}`);
    return postId;
  } catch (err) {
    log('error', `[Zernio] publishReply failed: ${err.message}`);
    throw new Error(`Zernio publish failed: ${err.message}`);
  }
}

/**
 * Schedules a public statement to all configured channels
 * @param {string} content - The message content
 * @param {string} scheduledFor - ISO date/time string or target time
 * @returns {Promise<string>} The Zernio post ID
 */
export async function schedulePublicStatement(content, scheduledFor) {
  try {
    if (!zernio) {
      throw new Error('Zernio client is not initialized');
    }

    const platforms = [
      { platform: 'twitter', accountId: process.env.ZERNIO_ACCOUNT_ID_TWITTER },
      { platform: 'linkedin', accountId: process.env.ZERNIO_ACCOUNT_ID_LINKEDIN }
    ].filter(p => p.accountId); // only include configured accounts

    if (platforms.length === 0) {
      log('warn', '[Zernio] No platforms configured for scheduling public statement.');
      return null;
    }

    log('info', `[Zernio] Scheduling public statement to ${platforms.length} platforms for ${scheduledFor}...`);
    const { post } = await zernio.posts.createPost({
      content,
      scheduledFor,
      timezone: 'Africa/Nairobi',
      platforms
    });

    const postId = post?._id || post?.id || 'simulated_zernio_sched_id';
    log('info', `[Zernio] Post scheduled successfully. Post ID: ${postId}`);
    return postId;
  } catch (err) {
    log('error', `[Zernio] schedulePublicStatement failed: ${err.message}`);
    throw new Error(`Zernio schedule failed: ${err.message}`);
  }
}
