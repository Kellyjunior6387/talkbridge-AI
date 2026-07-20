import { GoogleGenerativeAI } from '@google/generative-ai';
import { log } from '../utils/logger.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;

let genAI;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  log('error', 'Gemini Service: Missing GEMINI_API_KEY in environment variables.');
}

/**
 * Classifies an incoming message and drafts an appropriate reply using Gemini 1.5 Flash.
 * @param {string} messageText - The cleaned text of the incoming message
 * @param {string} platform - The source channel ('tiktok', 'instagram', 'sms', 'whatsapp')
 * @param {string} authorUsername - The handle/number of the sender
 * @returns {Promise<Object>} The classification and reply object
 */
export async function classifyAndReply(messageText, platform, authorUsername) {
  const fallback = {
    intent: 'question',
    urgency: 3,
    sentiment: 'neutral',
    language: 'en',
    reply: 'Thanks for reaching out! Please DM us.',
    reasoning: 'Parse error fallback'
  };

  if (!genAI) {
    log('error', '[Gemini] Google Generative AI SDK not initialized due to missing API key. Returning fallback.');
    return fallback;
  }

  const systemInstruction = `You are TalkBridge AI, the communication intelligence layer for a brand's social media inbox.

Your job: analyze incoming messages and generate a structured JSON response.

RULES:
- Be concise. Replies must respect platform character limits.
- Detect the language (English, Swahili, or mixed). Reply in the same language.
- Match the brand voice: friendly, helpful, Gen-Z aware but professional.
- Never make up order details, prices, or policies.
- For complaints: acknowledge, apologize briefly, promise follow-up.
- For questions: answer if you can, otherwise ask them to DM.
- For hype/compliments: celebrate it, encourage UGC (tag us!).
- For purchase intent: direct to DM or link.
- For spam: mark it, do not engage.

Platform character limits:
- tiktok: 150 characters
- twitter: 280 characters
- instagram: 300 characters
- sms: 160 characters
- whatsapp: 1000 characters

Current platform: ${platform}
Author username: @${authorUsername}

RESPONSE FORMAT — return ONLY valid JSON:
{
  "intent": "complaint" | "question" | "hype" | "purchase_intent" | "spam",
  "urgency": <integer 1-10>,
  "sentiment": "positive" | "neutral" | "negative",
  "language": "<ISO 639-1 code, e.g. en, sw>",
  "reply": "<the drafted reply text, within platform character limit>",
  "reasoning": "<one sentence explaining the urgency score>"
}`;

  let attempts = 0;
  while (attempts < 2) {
    try {
      attempts++;
      log('info', `[Gemini] Querying gemini-3.1-flash-lite (Attempt ${attempts}/2)...`);

      // Initialize the model with the system instructions and JSON output mode
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
        systemInstruction: systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });

      const result = await model.generateContent(messageText);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error('Received empty response from Gemini API');
      }

      // Parse and validate fields
      const data = JSON.parse(responseText.trim());
      
      // Ensure basic structure and fallbacks inside the parsed output
      const finalData = {
        intent: data.intent || 'question',
        urgency: typeof data.urgency === 'number' ? data.urgency : 3,
        sentiment: data.sentiment || 'neutral',
        language: data.language || 'en',
        reply: data.reply || 'Thanks for reaching out! Please DM us.',
        reasoning: data.reasoning || 'Successfully classified'
      };

      log('info', `[Gemini] Successfully classified incoming message from @${authorUsername}.`);
      return finalData;

    } catch (err) {
      log('warn', `[Gemini] Attempt ${attempts} failed: ${err.message}`);
      if (attempts >= 2) {
        log('error', `[Gemini] Failed to generate valid classification after 2 attempts. Returning fallback.`);
        return fallback;
      }
      // Loop continues for the retry attempt
    }
  }

  return fallback;
}
