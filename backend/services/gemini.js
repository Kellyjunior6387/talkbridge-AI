import { GoogleGenerativeAI } from '@google/generative-ai';
import { log } from '../utils/logger.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;

// The classification model (reply drafting) and the lightweight tagging model
// are configurable. Gemma powers the insights layer per the product story; the
// id defaults to the same Google Generative AI flash model the rest of the app
// already uses so the feature works out of the box.
const CLASSIFY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemini-3.1-flash-lite';

let genAI;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  log('error', 'Gemini Service: Missing GEMINI_API_KEY in environment variables.');
}

/** Safely parse a JSON response, tolerating markdown code fences. */
function parseJsonResponse(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
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
      log('info', `[Gemini] Querying ${CLASSIFY_MODEL} (Attempt ${attempts}/2)...`);

      // Initialize the model with the system instructions and JSON output mode
      const model = genAI.getGenerativeModel({
        model: CLASSIFY_MODEL,
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

/**
 * Reduces a raw message into one or more comparable TOPIC slugs and guesses
 * which product it is about. Gemma reuses an existing slug from the growing
 * vocabulary whenever one fits, and only coins a NEW snake_case slug when the
 * message genuinely describes something not yet in the vocabulary. This is the
 * "turn each message into comparable topics" + "growing vocabulary" step.
 *
 * @param {string} messageText - Cleaned message text
 * @param {Object} [opts]
 * @param {Array<{slug:string,label:string}>} [opts.existingTopics] - Current vocabulary
 * @param {string[]} [opts.products] - Known product names the message might reference
 * @param {string} [opts.sentiment] - Message sentiment, copied onto the tags
 * @returns {Promise<{product_ref:string, topics:Array}>}
 */
export async function extractTopics(messageText, opts = {}) {
  const { existingTopics = [], products = [], sentiment = 'neutral' } = opts;

  const empty = { product_ref: 'general', topics: [] };
  if (!genAI || !messageText) return empty;

  const vocabList = existingTopics.length
    ? existingTopics.map(t => `- ${t.slug}: ${t.label}`).join('\n')
    : '(vocabulary is empty — coin new slugs as needed)';

  const productList = products.length
    ? products.map(p => `- ${p}`).join('\n')
    : '(no product catalogue provided)';

  const systemInstruction = `You are the topic-extraction layer for TalkBridge AI, a social inbox for African SMEs.

Reduce a customer message into comparable TOPIC tags so that many differently-worded
complaints about the same thing become countable. Also identify which PRODUCT it is about.

EXISTING VOCABULARY (reuse a slug from here whenever it fits — do NOT invent a near-duplicate):
${vocabList}

KNOWN PRODUCTS:
${productList}

RULES:
- Return 0-3 topics. Return an empty array for pure spam or contentless chatter.
- Prefer reusing an existing slug. Only set "is_new": true when nothing fits.
- Slugs are lowercase snake_case, specific but reusable: shipping_delay, checkout_bug,
  mpesa_failure, wrong_size, damaged_item, out_of_stock, love_product, price_complaint.
- category is one of: logistics | payment | quality | sizing | pricing | availability | praise | other
- polarity is one of: negative | neutral | positive
- "keyword" is the short raw phrase from the message that triggered the tag.
- product_ref: a snake_case slug of the product referenced, matched to KNOWN PRODUCTS when
  possible, else a best-guess slug, else "general" if no product is identifiable.
- Detect topics in English, Swahili, or mixed ("Sheng").

Return ONLY valid JSON:
{
  "product_ref": "<snake_case product slug or 'general'>",
  "topics": [
    {
      "slug": "shipping_delay",
      "label": "Shipping Delay",
      "category": "logistics",
      "polarity": "negative",
      "keyword": "still waiting for my order",
      "is_new": false,
      "confidence": 0.0-1.0
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: GEMMA_MODEL,
      systemInstruction,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
    });

    const result = await model.generateContent(messageText);
    const data = parseJsonResponse(result.response.text() || '{}');

    const topics = Array.isArray(data.topics) ? data.topics : [];
    const normalized = topics
      .filter(t => t && typeof t.slug === 'string' && t.slug.trim())
      .map(t => ({
        slug: t.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
        label: t.label || t.slug,
        category: t.category || 'other',
        polarity: t.polarity || 'neutral',
        keyword: (t.keyword || '').slice(0, 200),
        isNew: !!t.is_new,
        confidence: typeof t.confidence === 'number' ? t.confidence : 0.5,
        sentiment
      }))
      .filter(t => t.slug);

    const productRef = (data.product_ref || 'general')
      .toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'general';

    log('info', `[Gemma] Extracted ${normalized.length} topic(s) for product '${productRef}'.`);
    return { product_ref: productRef, topics: normalized };
  } catch (err) {
    log('warn', `[Gemma] Topic extraction failed: ${err.message}. Returning empty tag set.`);
    return empty;
  }
}

/**
 * Resolves a cluster of similar messages about one (product, topic) spike into a
 * single human-facing KNOWN ISSUE record: a title, a plain-language description,
 * a severity, and a drafted holding statement the brand could post while the
 * issue is being worked. This is the "resolve similar issues into a known issue
 * record" step.
 *
 * @param {Object} params
 * @param {string} params.topicLabel - e.g. 'Mpesa Checkout Failure'
 * @param {string} params.productRef - product slug or 'general'
 * @param {string[]} params.sampleMessages - representative raw messages
 * @returns {Promise<{title:string, description:string, severity:string, suggested_statement:string}>}
 */
export async function summarizeKnownIssue({ topicLabel, productRef, sampleMessages = [] }) {
  const fallback = {
    title: `${topicLabel}${productRef && productRef !== 'general' ? ` — ${productRef}` : ''}`,
    description: `Multiple customers are reporting issues related to "${topicLabel}".`,
    severity: 'medium',
    suggested_statement: `We're aware of an issue affecting some customers and our team is actively working on a fix. Thanks for your patience 🙏`
  };

  if (!genAI || sampleMessages.length === 0) return fallback;

  const systemInstruction = `You are the incident-summarization layer for TalkBridge AI.
Several customers have raised the same issue. Produce a concise KNOWN ISSUE record an SME
admin can act on, plus a short, on-brand holding statement (friendly, professional, may be
posted publicly). Never invent refund amounts, dates, or policies.

Return ONLY valid JSON:
{
  "title": "<= 60 chars, specific",
  "description": "1-2 sentences describing the shared problem",
  "severity": "low" | "medium" | "high",
  "suggested_statement": "<= 200 chars public holding statement"
}`;

  const userContent = `Topic: ${topicLabel}
Product: ${productRef}
Representative customer messages:
${sampleMessages.slice(0, 8).map((m, i) => `${i + 1}. ${m}`).join('\n')}`;

  try {
    const model = genAI.getGenerativeModel({
      model: GEMMA_MODEL,
      systemInstruction,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
    });
    const result = await model.generateContent(userContent);
    const data = parseJsonResponse(result.response.text() || '{}');
    return {
      title: (data.title || fallback.title).slice(0, 80),
      description: data.description || fallback.description,
      severity: ['low', 'medium', 'high'].includes(data.severity) ? data.severity : 'medium',
      suggested_statement: (data.suggested_statement || fallback.suggested_statement).slice(0, 280)
    };
  } catch (err) {
    log('warn', `[Gemma] Known-issue summarization failed: ${err.message}. Using fallback.`);
    return fallback;
  }
}
