import express from 'express';
import { detectSpikes } from '../services/insights.js';
import {
  getKnownIssues,
  updateKnownIssue,
  getTopics,
  getTopicDailyCounts
} from '../services/supabase.js';
import { log } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /insights/known-issues
 * Lists auto-detected known issues. Optional ?status= & ?review_status= filters.
 */
router.get('/known-issues', async (req, res) => {
  try {
    const issues = await getKnownIssues({
      status: req.query.status,
      reviewStatus: req.query.review_status
    });
    return res.json(issues);
  } catch (err) {
    log('error', `[Insights] list known-issues failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /insights/detect-spikes
 * Runs the trailing-7-day z-score scan and materializes/refreshes known issues.
 * Intended for a scheduler (cron) but exposed for on-demand dashboard refresh.
 */
router.post('/detect-spikes', async (req, res) => {
  try {
    const result = await detectSpikes();
    return res.json({ success: true, ...result });
  } catch (err) {
    log('error', `[Insights] detect-spikes failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /insights/known-issues/:id/review
 * Human verdict on an alert: body { review_status: 'real_issue' | 'noise', reviewed_by? }
 */
router.post('/known-issues/:id/review', async (req, res) => {
  const { id } = req.params;
  const { review_status: reviewStatus, reviewed_by: reviewedBy } = req.body;

  if (!['real_issue', 'noise', 'unreviewed'].includes(reviewStatus)) {
    return res.status(400).json({ error: "review_status must be 'real_issue', 'noise', or 'unreviewed'" });
  }

  try {
    const updates = { review_status: reviewStatus, reviewed_by: reviewedBy || 'admin' };
    // Marking as noise closes the alert so it stops resurfacing on the dashboard.
    if (reviewStatus === 'noise') {
      updates.status = 'resolved';
      updates.resolved_at = new Date().toISOString();
    }
    const updated = await updateKnownIssue(id, updates);
    log('info', `[Insights] Known issue ${id} reviewed as '${reviewStatus}'.`);
    return res.json({ success: true, issue: updated });
  } catch (err) {
    log('error', `[Insights] review known-issue ${id} failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /insights/known-issues/:id/status
 * Lifecycle update: body { status: 'open' | 'investigating' | 'resolved' }
 */
router.post('/known-issues/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['open', 'investigating', 'resolved'].includes(status)) {
    return res.status(400).json({ error: "status must be 'open', 'investigating', or 'resolved'" });
  }

  try {
    const updates = { status };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
    const updated = await updateKnownIssue(id, updates);
    log('info', `[Insights] Known issue ${id} status -> '${status}'.`);
    return res.json({ success: true, issue: updated });
  } catch (err) {
    log('error', `[Insights] status update ${id} failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /insights/topics — the growing vocabulary, most-seen first.
 */
router.get('/topics', async (req, res) => {
  try {
    return res.json(await getTopics());
  } catch (err) {
    log('error', `[Insights] list topics failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /insights/trends?days=8 — per-day topic tag counts for trend charts.
 */
router.get('/trends', async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 8));
    return res.json(await getTopicDailyCounts(days));
  } catch (err) {
    log('error', `[Insights] trends failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
