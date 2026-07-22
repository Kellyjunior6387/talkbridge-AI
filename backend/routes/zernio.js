import express from 'express';
import crypto from 'crypto';
import { classifyAndReply, generateProductMetadata } from '../services/gemini.js';
import {
  createWorkspaceProfile,
  getConnectUrlForPlatform,
  listConnectedAccounts,
  deleteConnectedAccount,
  createWebhookSubscription,
  generateMediaUploadLink,
  createProductPost,
} from '../services/zernio.js';
import { getRow, listRows, upsertRows } from '../services/supabase.js';
import { log } from '../utils/logger.js';

const router = express.Router();

function normalizePlatforms(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((platform) => String(platform || '').toLowerCase())
    .filter((platform) => ['instagram', 'tiktok', 'twitter'].includes(platform));
}

router.post('/profiles', async (req, res) => {
  try {
    const { userId, name, description, color } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    const zernioProfile = await createWorkspaceProfile({ name, description, color });
    const profileRecord = {
      user_id: userId,
      zernio_profile_id: zernioProfile?.profile?._id || zernioProfile?.profile?.id || zernioProfile?._id || zernioProfile?.id || null,
      name,
      description: description || null,
      color: color || null,
    };

    const saved = await upsertRows('user_profiles', profileRecord, 'user_id');
    return res.json({ success: true, profile: saved[0] || profileRecord, zernio: zernioProfile });
  } catch (err) {
    log('error', `[Zernio API] create profile failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/profiles/:userId', async (req, res) => {
  try {
    const profile = await getRow('user_profiles', { user_id: req.params.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.json(profile);
  } catch (err) {
    log('error', `[Zernio API] get profile failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/accounts', async (req, res) => {
  try {
    const accounts = await listConnectedAccounts();
    return res.json(accounts);
  } catch (err) {
    log('error', `[Zernio API] list accounts failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const result = await deleteConnectedAccount(accountId);
    return res.json(result || { success: true, message: 'Account disconnected successfully' });
  } catch (err) {
    log('error', `[Zernio API] delete account failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/connect/:platform', async (req, res) => {
  try {
    console.log('req.body:', req.body); 
    const { platform } = req.params;
    const { profileId, redirectUrl } = req.body;
    const authUrl = await getConnectUrlForPlatform({
      platform,
      profileId,
      redirectUrl,
      headless: true,
    });

    return res.json(authUrl);
  } catch (err) {
    log('error', `[Zernio API] connect failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks', async (req, res) => {
  try {
    const { name, url, secret, events } = req.body;
    if (!name || !url || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'name, url, and events are required' });
    }

    const webhook = await createWebhookSubscription({
      name,
      url,
      secret,
      events,
      isActive: true,
      customHeaders: req.body.customHeaders || {},
    });

    return res.json(webhook);
  } catch (err) {
    log('error', `[Zernio API] create webhook failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/webhooks', async (req, res) => {
  try {
    const webhooks = await listRows('webhooks');
    return res.json(webhooks);
  } catch (err) {
    log('error', `[Zernio API] list webhook records failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/media/upload-link', async (req, res) => {
  try {
    const { filename, contentType, size } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const upload = await generateMediaUploadLink({ filename, contentType, size });
    return res.json(upload);
  } catch (err) {
    log('error', `[Zernio API] media upload link failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { userId, name, description, price, sizes = [], platforms = [], imageUrl, aiInstructions } = req.body;
    if (!userId || !name || price === undefined) {
      return res.status(400).json({ error: 'userId, name, and price are required' });
    }

    const productMetadata = await generateProductMetadata({
      name,
      description,
      price,
      sizes,
      platforms,
      aiInstructions,
    });

    const profile = await getRow('user_profiles', { user_id: userId });
    const productId = crypto.randomUUID();
    const row = {
      id: productId,
      user_id: userId,
      name,
      description,
      price,
      sizes,
      platforms: normalizePlatforms(platforms),
      image_url: imageUrl || null,
      ai_instructions: aiInstructions || null,
      ai_metadata: productMetadata,
      zernio_profile_id: profile?.zernio_profile_id || null,
    };

    const saved = await upsertRows('products', row, 'id');
    return res.json({ success: true, product: saved[0] || row });
  } catch (err) {
    log('error', `[Zernio API] create product failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/products/:userId', async (req, res) => {
  try {
    const products = await listRows('products', { user_id: req.params.userId });
    return res.json(products);
  } catch (err) {
    log('error', `[Zernio API] list products failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const { userId, productId, content, platforms, mediaItems = [], publishNow = true, scheduledFor } = req.body;
    if (!userId || !productId || !content) {
      return res.status(400).json({ error: 'userId, productId, and content are required' });
    }

    const product = await getRow('products', { id: productId, user_id: userId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found for this user' });
    }

    const profile = await getRow('user_profiles', { user_id: userId });
    const targetPlatforms = normalizePlatforms(platforms.length ? platforms : product.platforms);

    const post = await createProductPost({
      title: product.name,
      content,
      profileId: profile?.zernio_profile_id,
      platforms: targetPlatforms.map((platform) => ({
        platform,
        accountId: req.body.accountIds?.[platform] || '',
      })),
      mediaItems,
      publishNow,
      scheduledFor,
      metadata: {
        productId,
        productName: product.name,
        productMetadata: product.ai_metadata || {},
      },
    });

    const postRow = {
      id: post?.post?._id || post?.post?.id || crypto.randomUUID(),
      user_id: userId,
      product_id: productId,
      zernio_post_id: post?.post?._id || post?.post?.id || null,
      content,
      platforms: targetPlatforms,
      media_items: mediaItems,
      status: publishNow ? 'published' : 'scheduled',
      scheduled_for: scheduledFor || null,
      metadata: {
        productId,
        productName: product.name,
      },
    };

    const saved = await upsertRows('posts', postRow, 'id');
    return res.json({ success: true, post: saved[0] || postRow, zernio: post });
  } catch (err) {
    log('error', `[Zernio API] create post failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/posts/:userId', async (req, res) => {
  try {
    const posts = await listRows('posts', { user_id: req.params.userId });
    return res.json(posts);
  } catch (err) {
    log('error', `[Zernio API] list posts failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

export default router;