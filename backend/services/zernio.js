import Zernio from '@zernio/node';
import crypto from 'crypto';
import { log } from '../utils/logger.js';

let zernio;

function getZernioClient() {
  if (zernio) {
    return zernio;
  }

  if (!process.env.ZERNIO_API_KEY) {
    throw new Error('Zernio API key is missing from environment variables');
  }

  zernio = new Zernio({ apiKey: process.env.ZERNIO_API_KEY });
  return zernio;
}

function unwrapSdkResult(result) {
  if (!result) {
    return result;
  }

  return result.data
    ?? result.post
    ?? result.profile
    ?? result.webhook
    ?? result.accounts
    ?? result.files
    ?? result;
}

function resolveProfileId(profileId) {
  return profileId || process.env.ZERNIO_PROFILE_ID || null;
}

export async function createWorkspaceProfile({ name, description, color }) {
  const client = getZernioClient();
  const response = await client.profiles.createProfile({
    body: { name, description, color },
  });
  return unwrapSdkResult(response);
}

export async function getConnectUrlForPlatform({ platform, profileId, redirectUrl, headless = true }) {
  const client = getZernioClient();
  const response = await client.connect.getConnectUrl({
    path: { platform },
    query: {
      profileId: resolveProfileId(profileId),
      redirect_url: redirectUrl,
      headless,
    },
  });
  return unwrapSdkResult(response);
}

export async function listConnectedAccounts(profileId) {
  const client = getZernioClient();
  const options = {};
  const resolvedId = resolveProfileId(profileId);
  if (resolvedId) {
    options.query = { profileId: resolvedId };
  }
  const response = await client.accounts.listAccounts(options);
  return unwrapSdkResult(response);
}

export async function createWebhookSubscription({ name, url, secret, events, isActive = true, customHeaders = {} }) {
  const client = getZernioClient();
  const response = await client.webhooks.createWebhookSettings({
    body: { name, url, secret, events, isActive, customHeaders },
  });
  return unwrapSdkResult(response);
}

export async function generateMediaUploadLink({ filename, contentType, size }) {
  const client = getZernioClient();
  const response = await client.media.getMediaPresignedUrl({
    body: { filename, contentType, size },
  });
  return unwrapSdkResult(response);
}

export async function createProductPost({
  content,
  title,
  profileId,
  platforms,
  mediaItems = [],
  publishNow = true,
  scheduledFor,
  metadata = {},
  ...extra
}) {
  const client = getZernioClient();
  const response = await client.posts.createPost({
    body: {
      title,
      content,
      mediaItems,
      platforms,
      publishNow,
      scheduledFor,
      metadata,
      queuedFromProfile: resolveProfileId(profileId) || undefined,
      ...extra
    },
    headers: {
      'x-request-id': crypto.randomUUID(),
    },
  });
  return unwrapSdkResult(response);
}

/**
 * Publishes an auto-reply via the Zernio API
 * @param {string} replyText - The text to post
 * @param {string} platform - The TalkBridge source platform
 * @returns {Promise<string|null>} The Zernio post ID or null
 */
export async function publishReply(replyText, platform) {
  try {
    const client = getZernioClient();

    // Map TalkBridge platform names to Zernio platform names
    const platformMap = {
      tiktok: 'twitter',
      instagram: 'instagram',
      twitter: 'twitter',
      sms: null,
      whatsapp: null
    };

    const zernioPlatform = platformMap[platform];
    if (!zernioPlatform) {
      log('info', `[Zernio] Mapped platform is null for source '${platform}'. Skipping Zernio publishing.`);
      return null; 
    }

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

    log('info', `[Zernio] Publishing reply on ${zernioPlatform} to account ${accountId}...`);
    const response = await client.posts.createPost({
      body: {
        content: replyText,
        publishNow: true,
        platforms: [{ platform: zernioPlatform, accountId }],
      },
    });

    const post = unwrapSdkResult(response)?.post || unwrapSdkResult(response);
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
    const client = getZernioClient();

    const platforms = [
      { platform: 'twitter', accountId: process.env.ZERNIO_ACCOUNT_ID_TWITTER },
      { platform: 'linkedin', accountId: process.env.ZERNIO_ACCOUNT_ID_LINKEDIN }
    ].filter(p => p.accountId); // only include configured accounts

    if (platforms.length === 0) {
      log('warn', '[Zernio] No platforms configured for scheduling public statement.');
      return null;
    }

    log('info', `[Zernio] Scheduling public statement to ${platforms.length} platforms for ${scheduledFor}...`);
    const response = await client.posts.createPost({
      body: {
        content,
        scheduledFor,
        timezone: 'Africa/Nairobi',
        platforms,
      },
    });

    const post = unwrapSdkResult(response)?.post || unwrapSdkResult(response);
    const postId = post?._id || post?.id || 'simulated_zernio_sched_id';
    log('info', `[Zernio] Post scheduled successfully. Post ID: ${postId}`);
    return postId;
  } catch (err) {
    log('error', `[Zernio] schedulePublicStatement failed: ${err.message}`);
    throw new Error(`Zernio schedule failed: ${err.message}`);
  }
}

/**
 * Publishes a reply directly to a specific comment (e.g., an Instagram comment)
 * Matches Zernio REST API reference: POST /v1/inbox/comments/{postId}
 * @param {string} replyText - The reply content
 * @param {string} accountId - The Zernio account ID
 * @param {string} commentId - The original platform comment ID
 * @param {string} postId - The Zernio post ID
 * @returns {Promise<boolean>} True if successful
 */
export async function publishCommentReply(replyText, accountId, commentId, postId) {
  try {
    const apiKey = process.env.ZERNIO_API_KEY;
    if (!apiKey) {
      throw new Error('Zernio API key is missing from environment variables');
    }

    if (!postId) {
      throw new Error('Missing required postId parameter for Zernio comment reply');
    }

    log('info', `[Zernio] Replying to comment ${commentId} on post ${postId} using account ${accountId} via REST API...`);
    
    const url = `https://zernio.com/api/v1/inbox/comments/${postId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId,
        message: replyText,
        commentId
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Zernio API returned status ${response.status}: ${errText}`);
    }

    const resData = await response.json();
    log('info', `[Zernio] Direct comment reply published successfully. Response: ${JSON.stringify(resData)}`);
    return resData.success || true;
  } catch (err) {
    log('error', `[Zernio] publishCommentReply failed: ${err.message}`);
    throw new Error(`Zernio comment reply failed: ${err.message}`);
  }
}

/**
 * Publishes a reply directly to a specific DM conversation
 * Matches Zernio REST API reference: POST /v1/inbox/conversations/{conversationId}/messages
 * @param {string} replyText - The reply content
 * @param {string} accountId - The Zernio account ID
 * @param {string} conversationId - The Zernio conversation ID
 * @returns {Promise<boolean>} True if successful
 */
export async function publishDirectMessageReply(replyText, accountId, conversationId) {
  try {
    const apiKey = process.env.ZERNIO_API_KEY;
    if (!apiKey) {
      throw new Error('Zernio API key is missing from environment variables');
    }

    if (!conversationId) {
      throw new Error('Missing required conversationId parameter for Zernio message reply');
    }

    log('info', `[Zernio] Replying to conversation ${conversationId} using account ${accountId} via REST API...`);
    
    const url = `https://zernio.com/api/v1/inbox/conversations/${conversationId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId,
        message: replyText
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Zernio API returned status ${response.status}: ${errText}`);
    }

    const resData = await response.json();
    log('info', `[Zernio] Direct message reply published successfully. Response: ${JSON.stringify(resData)}`);
    return resData.success || true;
  } catch (err) {
    log('error', `[Zernio] publishDirectMessageReply failed: ${err.message}`);
    throw new Error(`Zernio direct message reply failed: ${err.message}`);
  }
}

export async function deleteConnectedAccount(accountId) {
  const client = getZernioClient();
  const response = await client.accounts.deleteAccount({
    path: { accountId }
  });
  return unwrapSdkResult(response);
}

export async function listWebhookSubscriptions() {
  const client = getZernioClient();
  const response = await client.webhooks.getWebhookSettings();
  return unwrapSdkResult(response);
}
