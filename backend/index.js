import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import webhookRouter from './routes/webhook.js';
import testRouter from './routes/test.js';
import { log } from './utils/logger.js';

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
app.use('/test', testRouter);

// Global error handler
app.use((err, req, res, next) => {
  log('error', `Global Error Caught: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  log('info', `TalkBridge server running on port ${PORT}`);
  log('info', `Test simulate: POST http://localhost:${PORT}/test/simulate`);
  log('info', `Health check:  GET  http://localhost:${PORT}/health`);
});
