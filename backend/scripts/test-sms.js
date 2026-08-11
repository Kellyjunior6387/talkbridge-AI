import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory name in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env first before importing services so environment variables are populated
dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendSms, escalateToAgent } = await import('../services/africastalking.js');

console.log('============= Africa\'s Talking SMS Test Tool =============');
console.log(`Username:       ${process.env.AFRICASTALKING_USERNAME || 'sandbox'}`);
console.log(`API Key:        ${process.env.AFRICASTALKING_API_KEY ? '***' + process.env.AFRICASTALKING_API_KEY.slice(-6) : 'MISSING'}`);
console.log(`Sender ID:      ${process.env.AFRICASTALKING_SENDER_ID || 'None'}`);
console.log(`Recipient:      ${process.env.AFRICASTALKING_RECIPIENT || 'None'}`);
console.log(`Agent Number:   ${process.env.TWILIO_AGENT_NUMBER || 'None'}`);
console.log('========================================================\n');

async function run() {
  const recipient = process.env.AFRICASTALKING_RECIPIENT || process.env.TWILIO_AGENT_NUMBER;
  if (!recipient) {
    console.error('❌ Error: No AFRICASTALKING_RECIPIENT or TWILIO_AGENT_NUMBER configured in .env');
    process.exit(1);
  }

  console.log(`1. Testing raw sendSms to ${recipient}...`);
  try {
    const response = await sendSms([recipient], `Test message from TalkBridge SMS troubleshooting tool at ${new Date().toLocaleTimeString()}`);
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (err) {
    console.error('❌ sendSms Failed:', err);
  }

  console.log('\n2. Testing escalateToAgent workflow...');
  try {
    const payload = {
      platform: 'tiktok',
      authorUsername: 'troubleshooter',
      messageText: 'This is a high-priority test comment for Africa\'s Talking verification.',
      urgency: 9,
      intent: 'complaint',
      aiReply: 'We apologize for the inconvenience. Our team is investigating.',
      recipientPhone: recipient
    };
    console.log('Sending escalation payload:', JSON.stringify(payload, null, 2));
    const response = await escalateToAgent(payload);
    console.log('Response from escalateToAgent:', JSON.stringify(response, null, 2));
    if (response) {
      console.log('✅ escalateToAgent succeeded!');
    } else {
      console.log('❌ escalateToAgent returned null (check logs above).');
    }
  } catch (err) {
    console.error('❌ escalateToAgent Failed:', err);
  }
}

run();
