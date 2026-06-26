import twilio from 'twilio';
import { log } from '../utils/logger.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
} else {
  log('error', 'Twilio Service: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in environment variables.');
}

/**
 * Escolates an urgent message to a human agent via Twilio SMS
 * @param {Object} payload - Escalation details
 */
export async function escalateToAgent({ 
  platform, 
  authorUsername, 
  messageText, 
  urgency, 
  intent, 
  aiReply 
}) {
  try {
    if (!client) {
      throw new Error('Twilio client is not initialized due to missing credentials');
    }

    const body = [
      `🚨 TB [U:${urgency}] @${authorUsername}`,
      `Msg: "${messageText.slice(0, 40)}${messageText.length > 40 ? '...' : ''}"`,
      `Draft: "${aiReply.slice(0, 40)}${aiReply.length > 40 ? '...' : ''}"`,
      `Reply YES to approve`
    ].join('\n');

    const response = await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TWILIO_AGENT_NUMBER
    });

    log('info', `[Twilio] Escalation SMS dispatched to ${process.env.TWILIO_AGENT_NUMBER}. SID: ${response.sid}`);
    return response.sid;
  } catch (err) {
    // Log Twilio escalation failure loudly but do not throw to avoid breaking the core pipeline
    log('error', `❌ [Twilio] CRITICAL SMS ESCALATION FAILURE: ${err.message}`);
    return null;
  }
}
