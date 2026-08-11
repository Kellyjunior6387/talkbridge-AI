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
import { getRow, listRows, upsertRows, createSignedUploadUrl, supabase } from '../services/supabase.js';
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

router.get('/profiles/check-name', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'name parameter is required' });
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    // Case-insensitive search
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle();

    if (error) {
      throw error;
    }

    return res.json({ taken: !!data });
  } catch (err) {
    log('error', `[Zernio API] check-name failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/profiles', async (req, res) => {
  try {
    const { userId, name, description, color } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    // Double check name availability on backend
    const { data: existing, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      return res.status(400).json({ error: 'Business name is already taken. Please choose another name.' });
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
    const { profileId } = req.query;
    const accounts = await listConnectedAccounts(profileId);
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

router.post('/media/supabase-upload-link', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'filename is required' });
    }

    const fileExt = filename.split('.').pop();
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `videos/${uniqueName}`;

    const data = await createSignedUploadUrl(filePath);

    // Build the public URL
    const supabaseUrl = process.env.SUPABASE_URL;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${filePath}`;

    return res.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl,
    });
  } catch (err) {
    log('error', `[Supabase Storage] Failed to generate signed upload URL: ${err.message}`);
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
    const {
      userId,
      productId,
      content,
      platforms,
      mediaItems = [],
      publishNow = true,
      scheduledFor,
      tiktokSettings = { allowComment: true, allowDuet: true, allowStitch: true },
      facebookSettings = {}
    } = req.body;
    if (!userId || !productId || !content) {
      return res.status(400).json({ error: 'userId, productId, and content are required' });
    }

    const product = await getRow('products', { id: productId, user_id: userId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found for this user' });
    }

    const profile = await getRow('user_profiles', { user_id: userId });
    const targetPlatforms = normalizePlatforms(platforms.length ? platforms : product.platforms);

    const platformsToSend = targetPlatforms
      .map((platform) => {
        const accountId = req.body.accountIds?.[platform];
        if (!accountId) return null;
        return { platform, accountId };
      })
      .filter(Boolean);

    if (platformsToSend.length === 0) {
      return res.status(400).json({ error: 'No connected accounts found for the selected platforms. Please integrate your accounts first.' });
    }

    const post = await createProductPost({
      title: product.name,
      content,
      profileId: profile?.zernio_profile_id,
      platforms: platformsToSend,
      mediaItems,
      publishNow,
      scheduledFor,
      tiktokSettings,
      facebookSettings,
      metadata: {
        productId,
        productName: product.name,
        productMetadata: product.ai_metadata || {},
      },
    });

    const postRow = {
      id: crypto.randomUUID(),
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

    // Subscribe post/profile to Zernio comment.received webhooks
    try {
      const webhookUrl = `${process.env.WEBHOOK_URL || 'https://talkbridge.ngrok-free.app'}/webhook/zernio`;
      log('info', `[Webhook Setup] Subscribing Zernio webhook for comment.received to ${webhookUrl}...`);
      await createWebhookSubscription({
        name: `post_${postRow.id.replace(/-/g, '').slice(0, 16)}`,
        url: webhookUrl,
        events: ['comment.received'],
      });
      log('info', `[Webhook Setup] Webhook subscribed successfully.`);
    } catch (webhookErr) {
      log('error', `[Webhook Setup] Webhook subscription failed: ${webhookErr.message}`);
    }

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