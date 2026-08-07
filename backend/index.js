import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import webhookRouter from './routes/webhook.js';
import zernioRouter from './routes/zernio.js';
import testRouter from './routes/test.js';
import insightsRouter from './routes/insights.js';
import { log } from './utils/logger.js';
import { ensureMediaBucket } from './services/supabase.js';
import { createWebhookSubscription, listWebhookSubscriptions } from './services/zernio.js';

// Startup Security Checks
const aiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
const zernioKey = process.env.ZERNIO_API_KEY;
const twilioSid = process.env.TWILIO_ACCOUNT_SID;

if (!aiKey || !zernioKey || !twilioSid) {
  log('error', 'CRITICAL STARTUP ERROR: Missing required configuration keys.');
  if (!aiKey) log('warn', 'Warning: GEMINI_API_KEY (or ANTHROPIC_API_KEY) is missing on startup.');
  if (!zernioKey) log('warn', 'Warning: ZERNIO_API_KEY is missing on startup.');
  if (!twilioSid) log('warn', 'Warning: TWILIO_ACCOUNT_SID is missing on startup.');
  log('error', 'Server shutting down due to missing API configurations.');
  process.exit(1);
}

// Log keys safely (first 8 characters only)
log('info', `AI API Key detected: ${aiKey.slice(0, 8)}...`);
log('info', `Zernio API Key detected: ${zernioKey.slice(0, 8)}...`);
log('info', `Twilio Account SID detected: ${twilioSid.slice(0, 8)}...`);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Reject webhook payloads larger than 10kb for security
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'TalkBridge AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/webhook', webhookRouter);
app.use('/api/zernio', zernioRouter);
app.use('/test', testRouter);
app.use('/insights', insightsRouter);

// Global error handler
app.use((err, req, res, next) => {
  log('error', `Global Error Caught: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

async function ensureWebhookSubscriptions() {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    log('warn', '[Startup] WEBHOOK_URL is not set in environment. Skipping auto webhook registration.');
    return;
  }

  const cleanUrl = webhookUrl.trim();
  const dmUrl = `${cleanUrl}/webhook/zernio/messages`;
  const commentUrl = `${cleanUrl}/webhook/zernio`;

  log('info', `[Startup] Checking Zernio webhook subscriptions...`);
  try {
    const response = await listWebhookSubscriptions();
    const data = response?.data || response?.webhooks || response;
    const existingHooks = Array.isArray(data) ? data : data?.webhooks || [];

    const hasDmSub = existingHooks.some(hook => hook.url === dmUrl && (hook.events || []).includes('message.received'));
    const hasCommentSub = existingHooks.some(hook => hook.url === commentUrl && (hook.events || []).includes('comment.received'));

    if (!hasDmSub) {
      // Register message.received webhook
      await createWebhookSubscription({
        name: 'TalkBridge DM Webhook',
        url: dmUrl,
        secret: 'talkbridge_secret_123',
        events: ['message.received']
      });
      log('info', '[Startup] Zernio DM webhook (message.received) subscribed successfully.');
    } else {
      log('info', '[Startup] Zernio DM webhook (message.received) is already subscribed.');
    }

    if (!hasCommentSub) {
      // Register comment.received webhook
      await createWebhookSubscription({
        name: 'TalkBridge Comment Webhook',
        url: commentUrl,
        secret: 'talkbridge_secret_123',
        events: ['comment.received']
      });
      log('info', '[Startup] Zernio Comment webhook (comment.received) subscribed successfully.');
    } else {
      log('info', '[Startup] Zernio Comment webhook (comment.received) is already subscribed.');
    }
  } catch (err) {
    log('error', `[Startup] Webhook subscription auto-registration failed: ${err.message}`);
  }
}

app.listen(PORT, () => {
  log('info', `TalkBridge server running on port ${PORT}`);
  log('info', `Test simulate: POST http://localhost:${PORT}/test/simulate`);
  log('info', `Detect spikes: POST http://localhost:${PORT}/insights/detect-spikes`);
  log('info', `Health check:  GET  http://localhost:${PORT}/health`);
  ensureMediaBucket();
  ensureWebhookSubscriptions();
});
