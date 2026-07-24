import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { log } from '../utils/logger.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;

// Legacy client for backward-compatible Gemini routing
let genAI;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  log('error', 'Gemini Service: Missing GEMINI_API_KEY in environment variables.');
}

// Unified client for Gemma and new model routing
let genAIUnified;
if (apiKey) {
  genAIUnified = new GoogleGenAI({ apiKey });
}

/**
 * Classifies an incoming message and drafts an appropriate reply using Gemini 1.5 Flash.
 * @param {string} messageText - The cleaned text of the incoming message
 * @param {string} platform - The source channel ('tiktok', 'instagram', 'sms', 'whatsapp')
 * @param {string} authorUsername - The handle/number of the sender
 * @returns {Promise<Object>} The classification and reply object
 */
export async function classifyAndReply(messageText, platform, authorUsername, product = null) {
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

  let productInstruction = '';
  if (product) {
    productInstruction = `
PRODUCT CONTEXT:
- Name: ${product.name}
- Description: ${product.description || 'N/A'}
- Price: Ksh ${Number(product.price).toLocaleString()}
- Sizes: ${Array.isArray(product.sizes) ? product.sizes.map(s => s.size).join(', ') : 'N/A'}
- Specific Guidance / Instructions: ${product.ai_instructions || 'N/A'}

You MUST use this product context when answering questions about this product. If the customer asks about price, sizes, or details, match them exactly. Do not invent or guess any details not present in this context.
`;
  }

  const systemInstruction = `You are TalkBridge AI, the communication intelligence layer for a brand's social media inbox.

Your job: analyze incoming messages and generate a structured JSON response.
${productInstruction}
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

  const provider = process.env.AI_PROVIDER || 'gemini';
  const defaultModelName = provider === 'gemma' ? 'gemma-4-26b-a4b-it' : 'gemini-3.1-flash-lite';
  const modelName = process.env.AI_MODEL || defaultModelName;

  let attempts = 0;
  while (attempts < 2) {
    try {
      attempts++;
      log('info', `[AI Service] Querying ${modelName} via ${provider} provider (Attempt ${attempts}/2)...`);

      let responseText = '';

      if (provider === 'gemma') {
        if (!genAIUnified) {
          throw new Error('GoogleGenAI unified SDK not initialized');
        }

        const config = {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        };

        if (modelName.includes('gemma-4') || modelName.includes('thinking')) {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
        }

        const response = await genAIUnified.models.generateContent({
          model: modelName,
          contents: messageText,
          config: config
        });

        responseText = response.text;
      } else {
        if (!genAI) {
          throw new Error('Generative AI SDK not initialized');
        }
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          }
        });

        const result = await model.generateContent(messageText);
        responseText = result.response.text();
      }

      if (!responseText) {
        throw new Error('Received empty response from AI API');
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

      log('info', `[AI Service] Successfully classified incoming message from @${authorUsername}.`);
      return finalData;

    } catch (err) {
      log('warn', `[AI Service] Attempt ${attempts} failed: ${err.message}`);
      if (attempts >= 2) {
        log('error', `[AI Service] Failed to generate valid classification after 2 attempts. Returning fallback.`);
        return fallback;
      }
      // Loop continues for the retry attempt
    }
  }

  return fallback;
}

/**
 * Generates structured product metadata for AI-assisted catalog entries.
 * @param {Object} product
 * @returns {Promise<Object>}
 */
export async function generateProductMetadata(product) {
  const fallback = {
    summary: product.description || '',
    audience: ['general'],
    keywords: [],
    suggestedHashtags: [],
    talkingPoints: [],
    responseGuidance: 'Use the product name, price, and availability from the record.'
  };

  const provider = process.env.AI_PROVIDER || 'gemini';
  const defaultModelName = provider === 'gemma' ? 'gemma-4-26b-a4b-it' : 'gemini-3.1-flash-lite';
  const modelName = process.env.AI_MODEL || defaultModelName;

  if (provider === 'gemini' && !genAI) {
    log('warn', '[Gemini] Product metadata requested but model is unavailable. Returning fallback metadata.');
    return fallback;
  }
  if (provider === 'gemma' && !genAIUnified) {
    log('warn', '[Gemma] Product metadata requested but GoogleGenAI is unavailable. Returning fallback metadata.');
    return fallback;
  }

  const systemInstruction = `You are TalkBridge AI. Create structured product intelligence from catalog data.

Return ONLY valid JSON with this shape:
{
  "summary": "one concise sentence about the product",
  "audience": ["buyer segment 1", "buyer segment 2"],
  "keywords": ["keyword1", "keyword2"],
  "suggestedHashtags": ["#hashtag1", "#hashtag2"],
  "talkingPoints": ["fact 1", "fact 2"],
  "responseGuidance": "how the AI should answer questions about the product"
}`;

  try {
    let responseText = '';

    const prompt = JSON.stringify({
      name: product.name,
      description: product.description,
      price: product.price,
      sizes: product.sizes,
      platforms: product.platforms,
      aiInstructions: product.aiInstructions || ''
    });

    if (provider === 'gemma') {
      const config = {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      };

      if (modelName.includes('gemma-4') || modelName.includes('thinking')) {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH
        };
      }

      const result = await genAIUnified.models.generateContent({
        model: modelName,
        contents: prompt,
        config: config
      });

      responseText = result.text;
    } else {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });

      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    }

    if (!responseText) {
      return fallback;
    }

    const data = JSON.parse(responseText.trim());
    return {
      summary: data.summary || fallback.summary,
      audience: Array.isArray(data.audience) ? data.audience : fallback.audience,
      keywords: Array.isArray(data.keywords) ? data.keywords : fallback.keywords,
      suggestedHashtags: Array.isArray(data.suggestedHashtags) ? data.suggestedHashtags : fallback.suggestedHashtags,
      talkingPoints: Array.isArray(data.talkingPoints) ? data.talkingPoints : fallback.talkingPoints,
      responseGuidance: data.responseGuidance || fallback.responseGuidance,
    };
  } catch (err) {
    log('warn', `[Gemini] Product metadata generation failed: ${err.message}`);
    return fallback;
  }
}
