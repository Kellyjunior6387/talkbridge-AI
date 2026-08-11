import { log } from '../utils/logger.js';

const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
const apiKey = process.env.AFRICASTALKING_API_KEY;
const senderId = process.env.AFRICASTALKING_SENDER_ID;

/**
 * Sends SMS via Africa's Talking bulk SMS API
 * @param {string[]} phoneNumbers - Array of phone numbers to receive the message
 * @param {string} message - Message text
 * @returns {Promise<Object>} API response data
 */
export async function sendSms(phoneNumbers, message) {
  try {
    if (!apiKey) {
      log('warn', '[Africa\'s Talking] API Key is missing. SMS not sent. Mocking success.');
      return { status: 'mock_success', message: 'API Key missing' };
    }

    const bodyParams = new URLSearchParams();
    bodyParams.append('username', username);
    bodyParams.append('to', phoneNumbers.join(','));
    bodyParams.append('message', message);

    if (senderId) {
      bodyParams.append('from', senderId);
    }

    log('info', `[Africa's Talking] Sending SMS to ${phoneNumbers.length} recipient(s): "${message.slice(0, 50)}..."`);

    const url = username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey
      },
      body: bodyParams.toString()
    });

    const resText = await res.text();
    let data;
    try {
      data = JSON.parse(resText);
    } catch (parseErr) {
      throw new Error(`Africa's Talking API returned non-JSON response: "${resText.slice(0, 150)}" (status ${res.status})`);
    }

    if (!res.ok) {
      throw new Error(data.errorMessage || data.message || `HTTP error! Status: ${res.status}`);
    }

    log('info', `[Africa's Talking] SMS sent successfully. Response: ${JSON.stringify(data)}`);
    return data;
  } catch (err) {
    log('error', `❌ [Africa's Talking] SMS send failure: ${err.message}`);
    throw err;
  }
}

/**
 * Escalates an urgent message to a human agent via Africa's Talking SMS
 * @param {Object} payload - Escalation details
 */
export async function escalateToAgent({
  platform,
  authorUsername,
  messageText,
  urgency,
  intent,
  aiReply,
  recipientPhone
}) {
  const recipient = recipientPhone || process.env.AFRICASTALKING_RECIPIENT;
  if (!recipient) {
    log('error', '[Africa\'s Talking] No agent recipient phone number configured.');
    return null;
  }

  const body = [
    `🚨 TB [U:${urgency}] @${authorUsername}`,
    `Msg: "${messageText.slice(0, 40)}${messageText.length > 40 ? '...' : ''}"`,
    `Draft: "${aiReply.slice(0, 40)}${aiReply.length > 40 ? '...' : ''}"`,
    `Reply YES to approve`
  ].join('\n');

  try {
    const response = await sendSms([recipient], body);
    return response;
  } catch (err) {
    log('error', `❌ [Africa's Talking] Agent escalation failed: ${err.message}`);
    return null;
  }
}
