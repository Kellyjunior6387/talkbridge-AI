import { log } from '../utils/logger.js';
import { extractTopics, summarizeKnownIssue } from './gemini.js';
import {
  getTopics,
  upsertTopic,
  insertMessageTopic,
  getTopicDailyCounts,
  getActiveKnownIssue,
  createKnownIssue,
  updateKnownIssue,
  getSampleMessagesForTopic
} from './supabase.js';

// ---------------------------------------------------------------------
// Tunable detection parameters (env-overridable). See SENTIMENT-INSIGHTS.md
// for the statistical rationale behind each one.
// ---------------------------------------------------------------------
const WINDOW_DAYS = Number(process.env.INSIGHTS_WINDOW_DAYS || 7);   // trailing baseline length
const Z_THRESHOLD = Number(process.env.INSIGHTS_Z_THRESHOLD || 2.0); // std-devs above baseline to flag
const MIN_SPIKE_COUNT = Number(process.env.INSIGHTS_MIN_SPIKE_COUNT || 3); // ignore tiny "spikes"
const HARD_MIN_COUNT = Number(process.env.INSIGHTS_HARD_MIN_COUNT || 6);   // cold-start flag w/o baseline
const MIN_BASELINE_DAYS = Number(process.env.INSIGHTS_MIN_BASELINE_DAYS || 3); // history needed for z-score
const STD_FLOOR = 1; // treat sub-1 std-dev as 1 msg of noise → avoids div/0 & hair-trigger alerts

const NAIROBI_TZ = 'Africa/Nairobi';

// ---------------------------------------------------------------------
// Date helpers (calendar-day math in the same tz the SQL RPC buckets on).
// Nairobi has no DST, so plain calendar decrements are safe.
// ---------------------------------------------------------------------
function nairobiToday() {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: NAIROBI_TZ }).format(new Date());
}

function previousDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

// ---------------------------------------------------------------------
// Step 1 — turn an incoming message into comparable topics and persist them.
// ---------------------------------------------------------------------
/**
 * Extracts topics for a message, grows the vocabulary, and records the tags.
 * Non-fatal: any failure is logged and swallowed so the reply pipeline is never
 * blocked by the analytics layer.
 *
 * @returns {Promise<{productRef:string, topics:Array}>}
 */
export async function recordMessageTopics({ messageId, messageText, sentiment = 'neutral', products = [] }) {
  try {
    const vocab = await getTopics();
    const { product_ref: productRef, topics } = await extractTopics(messageText, {
      existingTopics: vocab.map(t => ({ slug: t.slug, label: t.label })),
      products,
      sentiment
    });

    for (const t of topics) {
      await upsertTopic(t);
      await insertMessageTopic({
        message_id: messageId,
        topic_slug: t.slug,
        product_ref: productRef,
        keyword: t.keyword || null,
        sentiment: t.sentiment || sentiment,
        confidence: t.confidence
      });
    }

    if (topics.length) {
      log('info', `[Insights] Recorded ${topics.length} topic(s) [${topics.map(t => t.slug).join(', ')}] for '${productRef}'.`);
    }
    return { productRef, topics };
  } catch (err) {
    log('warn', `[Insights] recordMessageTopics failed: ${err.message}`);
    return { productRef: 'general', topics: [] };
  }
}

// ---------------------------------------------------------------------
// Step 2 — statistical spike detection (trailing-7-day z-score).
// Pure function so it can be unit-tested without a database.
// ---------------------------------------------------------------------
/**
 * @param {Array<{product_ref:string, topic_slug:string, day:string, cnt:number|string}>} rows
 * @param {string} [today] - Nairobi date (YYYY-MM-DD); defaults to now
 * @returns {Array} spike descriptors that clear the flagging rules
 */
export function computeSpikes(rows, today = nairobiToday()) {
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.product_ref}||${r.topic_slug}`;
    if (!groups.has(key)) groups.set(key, new Map());
    groups.get(key).set(String(r.day).slice(0, 10), Number(r.cnt) || 0);
  }

  const baselineDays = previousDays(today, WINDOW_DAYS);
  const spikes = [];

  for (const [key, dayMap] of groups) {
    const [productRef, topicSlug] = key.split('||');
    const todayCount = dayMap.get(today) || 0;

    const baselineValues = baselineDays.map(d => dayMap.get(d) || 0);
    const baselinePresent = baselineDays.filter(d => dayMap.has(d)).length;
    const windowTotal = todayCount + baselineValues.reduce((a, b) => a + b, 0);

    const mean = baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length;
    const variance = baselineValues.reduce((a, b) => a + (b - mean) ** 2, 0) / baselineValues.length;
    const std = Math.sqrt(variance);
    const effectiveStd = Math.max(std, STD_FLOOR);
    const zScore = (todayCount - mean) / effectiveStd;

    let flagged = false;
    let reason = null;

    if (baselinePresent >= MIN_BASELINE_DAYS) {
      // Enough history → trust the z-score.
      if (todayCount >= MIN_SPIKE_COUNT && zScore >= Z_THRESHOLD) {
        flagged = true;
        reason = 'zscore';
      }
    } else if (todayCount >= HARD_MIN_COUNT) {
      // Cold start (new product/topic, no baseline yet) → absolute-volume trip.
      flagged = true;
      reason = 'cold_start';
    }

    if (flagged) {
      spikes.push({
        productRef,
        topicSlug,
        todayCount,
        baselineAvg: Number(mean.toFixed(2)),
        baselineStd: Number(std.toFixed(2)),
        zScore: Number(zScore.toFixed(2)),
        windowTotal,
        reason
      });
    }
  }

  return spikes;
}

// ---------------------------------------------------------------------
// Step 3 — run detection and materialize/refresh known-issue records.
// ---------------------------------------------------------------------
/**
 * Detects spikes and creates or updates deduped known-issue records. Existing
 * issues flagged as 'noise' by a human are respected (skipped). Intended to be
 * called on a schedule (cron) or on demand from the dashboard.
 */
export async function detectSpikes() {
  const rows = await getTopicDailyCounts(WINDOW_DAYS + 1);
  const spikes = computeSpikes(rows);

  const vocab = await getTopics();
  const labelOf = new Map(vocab.map(t => [t.slug, t.label]));

  const result = { scanned: rows.length, flagged: spikes.length, created: 0, updated: 0, suppressed: 0, issues: [] };

  for (const spike of spikes) {
    const existing = await getActiveKnownIssue(spike.productRef, spike.topicSlug);

    if (existing) {
      if (existing.review_status === 'noise') {
        // A human already labeled this pattern as noise — do not re-alert.
        result.suppressed++;
        continue;
      }
      const updated = await updateKnownIssue(existing.id, {
        z_score: Math.max(existing.z_score || 0, spike.zScore),
        baseline_avg: spike.baselineAvg,
        spike_count: spike.todayCount,
        message_count: spike.windowTotal,
        last_seen_at: new Date().toISOString()
      });
      result.updated++;
      result.issues.push(updated);
      continue;
    }

    // New issue → let Gemma resolve the cluster into a titled record + statement.
    const samples = await getSampleMessagesForTopic(spike.productRef, spike.topicSlug);
    const summary = await summarizeKnownIssue({
      topicLabel: labelOf.get(spike.topicSlug) || spike.topicSlug,
      productRef: spike.productRef,
      sampleMessages: samples
    });

    const created = await createKnownIssue({
      product_ref: spike.productRef,
      topic_slug: spike.topicSlug,
      title: summary.title,
      description: summary.description,
      severity: summary.severity,
      suggested_statement: summary.suggested_statement,
      status: 'open',
      review_status: 'unreviewed',
      z_score: spike.zScore,
      baseline_avg: spike.baselineAvg,
      spike_count: spike.todayCount,
      message_count: spike.windowTotal
    });
    result.created++;
    result.issues.push(created);
    log('warn', `[Insights] 🚩 New known issue: "${created.title}" (z=${spike.zScore}, ${spike.todayCount} today vs ~${spike.baselineAvg}/day baseline).`);
  }

  log('info', `[Insights] Spike scan complete — flagged:${result.flagged} created:${result.created} updated:${result.updated} suppressed:${result.suppressed}`);
  return result;
}

// ---------------------------------------------------------------------
// Step 4 — escalation suppression. If an open, non-noise known issue already
// covers one of a message's topics, the brand is already handling it — no need
// to blast a human agent with the 101st SMS about the same mpesa bug.
// ---------------------------------------------------------------------
/**
 * @returns {Promise<Object|null>} the covering known issue, or null
 */
export async function findActiveIssueForTopics(productRef, topics) {
  for (const t of topics) {
    // Check both the guessed product and the 'general' bucket.
    for (const ref of [productRef, 'general']) {
      const issue = await getActiveKnownIssue(ref, t.slug);
      if (issue && issue.review_status !== 'noise') {
        return issue;
      }
    }
  }
  return null;
}
