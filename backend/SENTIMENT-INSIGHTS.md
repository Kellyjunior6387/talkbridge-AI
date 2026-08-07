# TalkBridge AI — Sentiment Insights & Known-Issue Detection

> _Are people raising the same problem about a product? Flag it once, early, and warn the
> admin to fix the root cause — instead of handling 100 identical complaints one-by-one._

This feature turns the raw firehose of comments, DMs and inquiries into a small, ranked list of
**known issues** an SME owner can actually act on. It sits alongside the existing per-message
pipeline (classify → reply → escalate) and adds a second, aggregate brain on top of it.

---

## 1. The problem it solves

The core product replies to every message individually. That's great until a **systemic** problem
appears — the Mpesa checkout breaks, a batch ships late, a size runs small. Suddenly the same
complaint arrives 100 times. Handling those 1:1 is noise; the admin needs **one** signal:

> _"Mpesa checkout is spiking on the Cargo Hoodie — 14 today vs ~2/day normally. Fix it."_

...and once they're on it, the dashboard should stop screaming about the other 99 escalations.

---

## 2. How it works — the pipeline

```
incoming message
      │
      ▼
 classifyAndReply()         ← existing: intent, urgency, sentiment, reply (Gemma)
      │
      ▼
 recordMessageTopics()      ← NEW: reduce to comparable topics + product guess (Gemma)
      │   ├─ grow the topic VOCABULARY   (topics table)
      │   └─ record each tag             (message_topics table)
      │
      ▼
 escalation check           ← NEW: if an open known issue already covers this topic,
      │                        suppress the duplicate Twilio escalation (still auto-replies)
      ▼
 ── (asynchronous / scheduled) ──
 detectSpikes()             ← NEW: trailing-7-day z-score per (product, topic)
      │
      ▼
 summarizeKnownIssue()      ← NEW: resolve the cluster into ONE record + holding statement (Gemma)
      │
      ▼
 known_issues table  →  dashboard  →  human marks "Real issue" or "Noise"
```

### Where Gemma is used (all three LLM jobs the brief asks for)

| Job | Function | File |
| --- | --- | --- |
| **Keyword extraction + topic grouping + classification** | `extractTopics()` | `services/gemini.js` |
| **Resolving similar messages into a known-issue record** | `summarizeKnownIssue()` | `services/gemini.js` |

Both default to the same Google Generative AI flash model the rest of the app uses, and are
overridable with `GEMMA_MODEL` in the environment.

---

## 3. Turning messages into comparable topics (the growing vocabulary)

Free-text complaints are not countable — _"my package is late"_, _"bado sijapokea order yangu"_ and
_"where is my stuff??"_ are the same problem in three shapes. `extractTopics()` reduces each message
to one or more **topic slugs** so they collapse onto a single countable label:

```jsonc
// message: "the mpesa prompt never came, can't pay for the hoodie 😩"
{
  "product_ref": "cargo_hoodie",
  "topics": [
    { "slug": "mpesa_failure", "label": "Mpesa Failure", "category": "payment",
      "polarity": "negative", "keyword": "mpesa prompt never came", "is_new": false, "confidence": 0.9 }
  ]
}
```

Key design points:

- **Reuse over invention.** The current vocabulary is fed to Gemma on every call. It is told to
  reuse an existing slug whenever one fits and only set `is_new: true` when nothing matches. This
  stops the vocabulary from fragmenting into `shipping_delay` / `late_delivery` / `delivery_late`.
- **The vocabulary grows itself.** New slugs are inserted into the `topics` table (`created_by:'llm'`),
  so tomorrow's messages can be tagged against today's discoveries.
- **Multilingual.** English, Swahili and Sheng (code-switched) are all handled, matching the
  product's African-market focus.
- **Product-aware.** Each tag carries a `product_ref` guess so a spike is scoped to _a product_,
  not the whole store.

---

## 4. Detecting spikes _statistically_ (so growth ≠ false alarms)

A fixed threshold ("alert at 20 complaints/day") breaks the moment the business grows or a
seasonal rush hits — you'd drown in false alarms. Instead we ask a relative question:

> _Is today's volume for this (product, topic) **abnormal for this (product, topic)**?_

That's a **z-score against a trailing 7-day baseline**, computed in `computeSpikes()`:

```
baseline = the last 7 calendar days (zero-filled) for this (product, topic)
mean     = average of those 7 daily counts
std      = standard deviation of those 7 daily counts
z        = (today_count − mean) / max(std, 1)
```

A topic is **flagged** when:

| Condition | Rule | Why |
| --- | --- | --- |
| Enough history (`≥ 3` baseline days) | `today ≥ 3` **and** `z ≥ 2.0` | 2σ ≈ top ~2% of days — genuinely unusual, and scales automatically as the business grows |
| Cold start (little/no history) | `today ≥ 6` | A brand-new product/topic can't have a baseline yet; an obvious day-one burst still trips |

Details worth knowing:

- **Zero-filling.** Days with no messages count as `0`, so a quiet week produces a low, honest
  baseline (not a missing one).
- **`std` floor of 1.** With near-constant low volume `std` can be ~0, which would make the z-score
  explode on a single extra message. Flooring the denominator at "1 message of noise" both prevents
  divide-by-zero and stops hair-trigger alerts.
- **Nairobi day boundaries.** The SQL RPC buckets by `Africa/Nairobi` date and the Node math uses
  the same tz, so "today" means the same thing on both sides.
- **Timezone-safe, DB-light.** Postgres only does the `GROUP BY` (via the `get_topic_daily_counts`
  RPC); the statistics live in plain, unit-testable JavaScript.

All thresholds are environment-overridable — see [Configuration](#7-configuration).

---

## 5. Known-issue records: dedupe, resolve, and stop the escalation storm

When a spike is confirmed, `detectSpikes()` creates **one** `known_issues` record per
`(product_ref, topic_slug)`:

1. **Dedupe.** If an active (non-resolved) issue already exists for that pair, it's _refreshed_
   (new z-score, counts, `last_seen_at`) rather than duplicated.
2. **Resolve the cluster into a record.** For a _new_ issue, `summarizeKnownIssue()` reads a sample
   of the real messages and produces a titled, plain-language record **plus a drafted holding
   statement** the brand could post while fixing it.
3. **Suppress repeat escalations.** Before the per-message pipeline fires a Twilio escalation, it
   calls `findActiveIssueForTopics()`. If an open, non-noise known issue already covers the topic,
   the escalation is suppressed (the customer still gets an auto-reply). This is what stops the
   _"Mpesa checkout issue with 100 escalations on the dashboard while it's already being handled"_
   problem.

### Human-in-the-loop review

Every alert is reviewable. An admin marks it:

- **Real issue** → it enters the `open → investigating → resolved` lifecycle.
- **Noise** → it's closed **and remembered** — a `noise` verdict permanently suppresses re-alerting
  for that pattern, so the same false positive never nags again.

---

## 6. Data model

Migration: [`db/sentiment-insights.sql`](db/sentiment-insights.sql) (idempotent; run after the base
`messages` table).

| Table | Purpose |
| --- | --- |
| `topics` | The growing vocabulary — one row per topic slug, with category, polarity, example phrases and lifetime count. |
| `message_topics` | Fact table — one row per `(message, topic)` tag, carrying `product_ref`. This is what the z-score aggregates. |
| `known_issues` | Deduped, human-reviewable records with spike stats (`z_score`, `baseline_avg`, `spike_count`), lifecycle `status` and `review_status`. |

Plus the `get_topic_daily_counts(days_back)` RPC that returns per-day tag counts for the detector.

---

## 7. Configuration

| Env var | Default | Meaning |
| --- | --- | --- |
| `GEMMA_MODEL` | `gemini-3.1-flash-lite` | Model for topic extraction & issue summarization |
| `INSIGHTS_WINDOW_DAYS` | `7` | Trailing baseline length |
| `INSIGHTS_Z_THRESHOLD` | `2.0` | Std-devs above baseline required to flag |
| `INSIGHTS_MIN_SPIKE_COUNT` | `3` | Minimum tags on the spike day (ignores tiny bumps) |
| `INSIGHTS_HARD_MIN_COUNT` | `6` | Cold-start absolute trip when no baseline exists |
| `INSIGHTS_MIN_BASELINE_DAYS` | `3` | Days of history needed before the z-score is trusted |

---

## 8. API

Base URL: `http://localhost:4000`

| Method & path | Purpose |
| --- | --- |
| `GET  /insights/known-issues` | List issues (optional `?status=` & `?review_status=`) |
| `POST /insights/detect-spikes` | Run the z-score scan; create/refresh issues (cron or on-demand) |
| `POST /insights/known-issues/:id/review` | Human verdict — body `{ "review_status": "real_issue" | "noise" }` |
| `POST /insights/known-issues/:id/status` | Lifecycle — body `{ "status": "open" | "investigating" | "resolved" }` |
| `GET  /insights/topics` | The topic vocabulary |
| `GET  /insights/trends?days=8` | Per-day topic counts for charts |

### Running detection on a schedule

`detectSpikes()` is exposed via `POST /insights/detect-spikes` so any scheduler can drive it, e.g.:

```bash
# hourly cron
0 * * * * curl -s -X POST http://localhost:4000/insights/detect-spikes >/dev/null
```

---

## 9. Dashboard

A new **Insights** tab (`frontend/app/dashboard/insights/page.tsx`) shows flagged issues with their
spike badge (`z = …`), baseline, mention count and Gemma-drafted holding statement, plus the
**Real issue / Noise** review buttons and the status lifecycle. It renders demo data when the
backend is unreachable so the feature always tells its story in a pitch.

---

## 10. Trying it end-to-end

1. Apply the migration in the Supabase SQL editor: contents of `db/sentiment-insights.sql`.
2. Start the backend (`npm run dev`) and simulate a burst of the same complaint:
   ```bash
   for i in $(seq 1 8); do
     curl -s -X POST http://localhost:4000/test/simulate \
       -H "Content-Type: application/json" \
       -d '{"platform":"instagram","username":"cust'$i'","message":"mpesa checkout failing on the cargo hoodie, prompt never comes"}' >/dev/null
   done
   ```
   Each response now includes `product_ref` and the extracted `topics`.
3. Run detection and watch the known issue appear:
   ```bash
   curl -s -X POST http://localhost:4000/insights/detect-spikes | jq
   curl -s http://localhost:4000/insights/known-issues | jq
   ```
4. Open **Dashboard → Insights** to review, confirm, or dismiss it.
