"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../layout";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Activity,
  Search as SearchIcon,
  Copy,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";

const API = "http://localhost:4000";

interface KnownIssue {
  id: string;
  product_ref: string;
  topic_slug: string;
  title: string;
  description: string;
  status: "open" | "investigating" | "resolved";
  review_status: "unreviewed" | "real_issue" | "noise";
  severity: "low" | "medium" | "high";
  z_score: number;
  baseline_avg: number;
  spike_count: number;
  message_count: number;
  suggested_statement: string;
  first_detected_at: string;
  last_seen_at: string;
}

interface Topic {
  slug: string;
  label: string;
  category: string;
  polarity: string;
  occurrence_count: number;
  created_by: string;
  example_phrases: string[];
}

// Demo fallback so the page tells a story even without a live backend.
const DEMO_ISSUES: KnownIssue[] = [
  {
    id: "demo-1",
    product_ref: "cargo_hoodie",
    topic_slug: "mpesa_failure",
    title: "Mpesa checkout failing at payment",
    description: "Several customers report the Mpesa STK push never arrives, blocking checkout on the Cargo Hoodie.",
    status: "investigating",
    review_status: "real_issue",
    severity: "high",
    z_score: 6.9,
    baseline_avg: 2.1,
    spike_count: 14,
    message_count: 27,
    suggested_statement: "We're aware some customers are hitting an Mpesa checkout error and our team is on it. A fix is rolling out shortly — thanks for your patience 🙏",
    first_detected_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    last_seen_at: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: "demo-2",
    product_ref: "general",
    topic_slug: "shipping_delay",
    title: "Shipping delays this week",
    description: "A cluster of customers are asking where their orders are, above the normal weekly volume.",
    status: "open",
    review_status: "unreviewed",
    severity: "medium",
    z_score: 3.4,
    baseline_avg: 4.0,
    spike_count: 11,
    message_count: 11,
    suggested_statement: "Deliveries are running a little behind this week due to high demand. Every order is on its way — DM us your order number and we'll track it for you.",
    first_detected_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
    last_seen_at: new Date(Date.now() - 40 * 60_000).toISOString(),
  },
];

const DEMO_TOPICS: Topic[] = [
  { slug: "mpesa_failure", label: "Mpesa Failure", category: "payment", polarity: "negative", occurrence_count: 27, created_by: "llm", example_phrases: ["stk push not coming", "mpesa error"] },
  { slug: "shipping_delay", label: "Shipping Delay", category: "logistics", polarity: "negative", occurrence_count: 19, created_by: "llm", example_phrases: ["where is my order", "bado sijapokea"] },
  { slug: "wrong_size", label: "Wrong Size", category: "sizing", polarity: "negative", occurrence_count: 8, created_by: "llm", example_phrases: ["size ni ndogo"] },
  { slug: "love_product", label: "Love Product", category: "praise", polarity: "positive", occurrence_count: 34, created_by: "llm", example_phrases: ["this goes hard 🔥"] },
];

function relTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const SEVERITY: Record<string, { label: string; cls: string }> = {
  high: { label: "HIGH", cls: "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30" },
  medium: { label: "MEDIUM", cls: "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30" },
  low: { label: "LOW", cls: "bg-[#4DFFC3]/15 text-[#4DFFC3] border-[#4DFFC3]/30" },
};

const CATEGORY_COLOR: Record<string, string> = {
  payment: "#F5A623",
  logistics: "#7B6EF6",
  quality: "#FF6B6B",
  sizing: "#4D9CFF",
  pricing: "#FF6B6B",
  availability: "#F5A623",
  praise: "#4DFFC3",
  other: "#7A8BAD",
};

export default function InsightsPage() {
  const { showToast } = useToast();
  const [issues, setIssues] = useState<KnownIssue[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, tRes] = await Promise.all([
        fetch(`${API}/insights/known-issues`),
        fetch(`${API}/insights/topics`),
      ]);
      if (!iRes.ok || !tRes.ok) throw new Error("backend unavailable");
      const iData: KnownIssue[] = await iRes.json();
      const tData: Topic[] = await tRes.json();
      setIssues(iData);
      setTopics(tData);
      setDemoMode(false);
    } catch {
      setIssues(DEMO_ISSUES);
      setTopics(DEMO_TOPICS);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${API}/insights/detect-spikes`, { method: "POST" });
      if (!res.ok) throw new Error("scan failed");
      const data = await res.json();
      showToast(`Scan complete — ${data.created || 0} new, ${data.updated || 0} refreshed.`, "success");
      await fetchAll();
    } catch {
      showToast("Couldn't reach the detection engine. Showing demo data.", "info");
    } finally {
      setScanning(false);
    }
  };

  const patchIssue = (id: string, patch: Partial<KnownIssue>) =>
    setIssues((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const review = async (id: string, review_status: "real_issue" | "noise") => {
    setBusyId(id);
    // Optimistic
    patchIssue(id, { review_status, ...(review_status === "noise" ? { status: "resolved" as const } : {}) });
    try {
      if (!demoMode) {
        const res = await fetch(`${API}/insights/known-issues/${id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ review_status }),
        });
        if (!res.ok) throw new Error();
      }
      showToast(
        review_status === "real_issue" ? "Marked as a real issue." : "Dismissed as noise — it won't re-alert.",
        review_status === "real_issue" ? "success" : "info"
      );
    } catch {
      showToast("Update failed — reverting.", "error");
      fetchAll();
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (id: string, status: KnownIssue["status"]) => {
    setBusyId(id);
    patchIssue(id, { status });
    try {
      if (!demoMode) {
        const res = await fetch(`${API}/insights/known-issues/${id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
      }
      showToast(`Status set to ${status}.`, "success");
    } catch {
      showToast("Update failed — reverting.", "error");
      fetchAll();
    } finally {
      setBusyId(null);
    }
  };

  const copyStatement = (text: string) => {
    navigator.clipboard?.writeText(text);
    showToast("Holding statement copied to clipboard.", "success");
  };

  const visibleIssues = issues.filter((it) =>
    showResolved ? true : it.status !== "resolved" && it.review_status !== "noise"
  );
  const hiddenCount = issues.length - visibleIssues.length;

  const openCount = issues.filter((it) => it.status !== "resolved" && it.review_status !== "noise").length;
  const unreviewedCount = issues.filter((it) => it.review_status === "unreviewed" && it.status !== "resolved").length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1C2640] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Sentiment Insights</h1>
            {demoMode && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#7B6EF6]/15 text-[#7B6EF6] border border-[#7B6EF6]/30">
                DEMO DATA
              </span>
            )}
          </div>
          <p className="text-sm text-[#7A8BAD] mt-1 max-w-xl">
            When many customers raise the same problem, we flag it once — statistically, above each
            product&apos;s normal baseline — so you fix the root cause instead of replying 100 times.
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="px-5 py-2.5 bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 disabled:opacity-60 text-[#080B14] font-display font-bold text-sm tracking-wide rounded-full transition-all hover:shadow-[0_0_12px_rgba(77,255,195,0.3)] flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={15} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Scanning…" : "Run detection scan"}
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<AlertTriangle size={16} className="text-[#FF6B6B]" />} label="Active issues" value={openCount} />
        <StatCard icon={<Activity size={16} className="text-[#F5A623]" />} label="Awaiting review" value={unreviewedCount} />
        <StatCard icon={<TrendingUp size={16} className="text-[#4DFFC3]" />} label="Topics tracked" value={topics.length} />
      </div>

      {/* Known issues */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Flame size={17} className="text-[#FF6B6B]" /> Flagged known issues
          </h2>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowResolved((v) => !v)}
              className="text-xs font-mono text-[#7A8BAD] hover:text-[#4DFFC3] transition-colors"
            >
              {showResolved ? "Hide" : "Show"} resolved / dismissed ({hiddenCount})
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-[#0F1624] border border-[#1C2640] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : visibleIssues.length === 0 ? (
          <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-10 text-center">
            <ShieldCheck size={32} className="text-[#4DFFC3] mx-auto mb-3" />
            <p className="text-sm text-white font-semibold">No active issues right now</p>
            <p className="text-xs text-[#7A8BAD] mt-1">
              Nothing is spiking above baseline. New clusters appear here automatically.
            </p>
          </div>
        ) : (
          visibleIssues.map((it) => {
            const sev = SEVERITY[it.severity] || SEVERITY.medium;
            const isExpanded = expanded === it.id;
            const busy = busyId === it.id;
            return (
              <div
                key={it.id}
                className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-5 space-y-4 transition-all hover:border-[#1C2640]/80"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${sev.cls}`}>{sev.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/25 flex items-center gap-1">
                        <TrendingUp size={10} /> z = {Number(it.z_score).toFixed(1)}
                      </span>
                      {it.review_status === "real_issue" && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#4DFFC3]/15 text-[#4DFFC3] border border-[#4DFFC3]/30">
                          CONFIRMED
                        </span>
                      )}
                      {it.review_status === "noise" && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#7A8BAD]/15 text-[#7A8BAD] border border-[#7A8BAD]/30">
                          NOISE
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-[16px] text-white leading-snug truncate">{it.title}</h3>
                    <p className="text-sm text-[#B4C0DA] leading-relaxed">{it.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono text-[#7A8BAD] pt-1">
                      <span className="px-2 py-0.5 rounded bg-[#162033] text-[#F0F4FF]">{it.product_ref}</span>
                      <span className="px-2 py-0.5 rounded bg-[#162033] text-[#7B6EF6]">#{it.topic_slug}</span>
                      <span>{it.message_count} mentions</span>
                      <span>~{Number(it.baseline_avg).toFixed(1)}/day baseline</span>
                      <span>updated {relTime(it.last_seen_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Suggested statement */}
                <div className="border-t border-[#1C2640] pt-3">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : it.id)}
                    className="flex items-center gap-1.5 text-xs font-mono text-[#4DFFC3] hover:underline"
                  >
                    Gemma-drafted holding statement {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 bg-[#080B14] border border-[#1C2640] rounded-lg p-3 flex items-start justify-between gap-3">
                      <p className="text-sm text-[#F0F4FF] italic leading-relaxed">“{it.suggested_statement}”</p>
                      <button
                        onClick={() => copyStatement(it.suggested_statement)}
                        className="shrink-0 p-2 text-[#7A8BAD] hover:text-[#4DFFC3] transition-colors"
                        title="Copy statement"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 border-t border-[#1C2640] pt-3">
                  {it.review_status === "unreviewed" ? (
                    <>
                      <span className="text-[11px] font-mono text-[#7A8BAD] mr-1">Review:</span>
                      <button
                        disabled={busy}
                        onClick={() => review(it.id, "real_issue")}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#4DFFC3] text-[#080B14] hover:bg-[#4DFFC3]/90 disabled:opacity-50 transition-all"
                      >
                        Real issue
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => review(it.id, "noise")}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#1C2640] text-[#7A8BAD] hover:border-[#FF6B6B] hover:text-[#FF6B6B] disabled:opacity-50 transition-all"
                      >
                        Noise
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-mono text-[#7A8BAD] mr-1">Status:</span>
                      {(["open", "investigating", "resolved"] as const).map((s) => (
                        <button
                          key={s}
                          disabled={busy}
                          onClick={() => setStatus(it.id, s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all disabled:opacity-50 ${
                            it.status === s
                              ? "bg-[#7B6EF6] text-white"
                              : "border border-[#1C2640] text-[#7A8BAD] hover:text-white hover:border-[#7B6EF6]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Trending topics vocabulary */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <SearchIcon size={16} className="text-[#4DFFC3]" /> Topic vocabulary
        </h2>
        <p className="text-xs text-[#7A8BAD] -mt-2">
          Gemma reduces every message to a reusable topic. The list grows itself as new problems appear.
        </p>
        <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-4 flex flex-wrap gap-2">
          {topics.length === 0 ? (
            <span className="text-xs text-[#7A8BAD] font-mono py-4">No topics tagged yet.</span>
          ) : (
            topics.map((t) => (
              <span
                key={t.slug}
                title={t.example_phrases?.join(" · ") || t.category}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono border flex items-center gap-1.5"
                style={{
                  borderColor: (CATEGORY_COLOR[t.category] || "#7A8BAD") + "40",
                  color: CATEGORY_COLOR[t.category] || "#7A8BAD",
                  backgroundColor: (CATEGORY_COLOR[t.category] || "#7A8BAD") + "12",
                }}
              >
                #{t.slug}
                <span className="text-[#7A8BAD]">{t.occurrence_count}</span>
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#162033] flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="font-display font-bold text-2xl text-white leading-none">{value}</p>
        <p className="text-[11px] font-mono text-[#7A8BAD] mt-1 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}
