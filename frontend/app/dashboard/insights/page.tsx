"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../layout";
import { API_BASE_URL } from "../../../lib/api";
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

function relTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const SEVERITY: Record<string, { label: string; cls: string }> = {
  high: { label: "HIGH", cls: "bg-red-50 text-red-600 border-red-200" },
  medium: { label: "MEDIUM", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  low: { label: "LOW", cls: "bg-blue-50 text-blue-650 border-blue-200" },
};

const CATEGORY_COLOR: Record<string, string> = {
  payment: "#D97706",    // amber-600
  logistics: "#4F46E5",  // indigo-600
  quality: "#DC2626",    // red-600
  sizing: "#2563EB",     // blue-600
  pricing: "#DB2777",    // pink-600
  availability: "#D97706",
  praise: "#059669",     // emerald-600
  other: "#4B5563",      // gray-600
};

export default function InsightsPage() {
  const { showToast } = useToast();
  const [issues, setIssues] = useState<KnownIssue[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, tRes] = await Promise.all([
        fetch(`${API_BASE_URL}/insights/known-issues`),
        fetch(`${API_BASE_URL}/insights/topics`),
      ]);
      if (!iRes.ok || !tRes.ok) throw new Error("Backend service unavailable");
      const iData: KnownIssue[] = await iRes.json();
      const tData: Topic[] = await tRes.json();
      setIssues(iData);
      setTopics(tData);
    } catch (err) {
      console.error("Failed to load insights:", err);
      showToast("Unable to load insights data from server.", "error");
      setIssues([]);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/insights/detect-spikes`, { method: "POST" });
      if (!res.ok) throw new Error("scan failed");
      const data = await res.json();
      showToast(`Scan complete — ${data.created || 0} new, ${data.updated || 0} refreshed.`, "success");
      await fetchAll();
    } catch {
      showToast("Failed to connect to the detection engine.", "error");
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
      const res = await fetch(`${API_BASE_URL}/insights/known-issues/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status }),
      });
      if (!res.ok) throw new Error();
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
      const res = await fetch(`${API_BASE_URL}/insights/known-issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">Sentiment Insights</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            When many customers raise the same problem, we flag it once — statistically, above each
            product&apos;s normal baseline — so you fix the root cause instead of replying 100 times.
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-display font-bold text-sm tracking-wide rounded-full transition-all hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={15} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Scanning…" : "Run detection scan"}
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<AlertTriangle size={16} className="text-rose-500" />} label="Active issues" value={openCount} />
        <StatCard icon={<Activity size={16} className="text-amber-500" />} label="Awaiting review" value={unreviewedCount} />
        <StatCard icon={<TrendingUp size={16} className="text-blue-600" />} label="Topics tracked" value={topics.length} />
      </div>

      {/* Known issues */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <Flame size={17} className="text-rose-500" /> Flagged known issues
          </h2>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowResolved((v) => !v)}
              className="text-xs font-mono text-slate-500 hover:text-blue-600 transition-colors font-bold uppercase tracking-wider"
            >
              {showResolved ? "Hide" : "Show"} resolved / dismissed ({hiddenCount})
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : visibleIssues.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
            <ShieldCheck size={32} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-slate-800 font-semibold">No active issues right now</p>
            <p className="text-xs text-slate-500 mt-1">
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
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm hover:border-slate-300 transition-all"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${sev.cls}`}>{sev.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                        <TrendingUp size={10} /> z = {Number(it.z_score).toFixed(1)}
                      </span>
                      {it.review_status === "real_issue" && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          CONFIRMED
                        </span>
                      )}
                      {it.review_status === "noise" && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          NOISE
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-[16px] text-slate-900 leading-snug truncate">{it.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{it.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono text-slate-500 pt-1 font-semibold">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{it.product_ref}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-650">#{it.topic_slug}</span>
                      <span>{it.message_count} mentions</span>
                      <span>~{Number(it.baseline_avg).toFixed(1)}/day baseline</span>
                      <span>updated {relTime(it.last_seen_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Suggested statement */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : it.id)}
                    className="flex items-center gap-1.5 text-xs font-mono text-blue-600 hover:text-blue-700 hover:underline font-bold"
                  >
                    Gemma-drafted holding statement {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 bg-slate-50 border border-slate-200/60 rounded-lg p-3 flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-800 italic leading-relaxed font-medium">“{it.suggested_statement}”</p>
                      <button
                        onClick={() => copyStatement(it.suggested_statement)}
                        className="shrink-0 p-2 text-slate-500 hover:text-blue-600 transition-colors"
                        title="Copy statement"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {it.review_status === "unreviewed" ? (
                    <>
                      <span className="text-[11px] font-mono text-slate-500 mr-1 font-bold">Review:</span>
                      <button
                        disabled={busy}
                        onClick={() => review(it.id, "real_issue")}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                      >
                        Real issue
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => review(it.id, "noise")}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-200 text-slate-600 hover:border-red-500 hover:text-red-500 disabled:opacity-50 transition-all bg-white"
                      >
                        Noise
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-mono text-slate-500 mr-1 font-bold">Status:</span>
                      {(["open", "investigating", "resolved"] as const).map((s) => (
                        <button
                          key={s}
                          disabled={busy}
                          onClick={() => setStatus(it.id, s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all disabled:opacity-50 ${
                            it.status === s
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-indigo-500 bg-white"
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
        <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
          <SearchIcon size={16} className="text-blue-650" /> Topic vocabulary
        </h2>
        <p className="text-xs text-slate-500 -mt-2">
          Gemma reduces every message to a reusable topic. The list grows itself as new problems appear.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-2 shadow-sm">
          {topics.length === 0 ? (
            <span className="text-xs text-slate-500 font-mono py-4 font-semibold">No topics tagged yet.</span>
          ) : (
            topics.map((t) => (
              <span
                key={t.slug}
                title={t.example_phrases?.join(" · ") || t.category}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono border flex items-center gap-1.5 font-semibold"
                style={{
                  borderColor: (CATEGORY_COLOR[t.category] || "#7A8BAD") + "40",
                  color: CATEGORY_COLOR[t.category] || "#7A8BAD",
                  backgroundColor: (CATEGORY_COLOR[t.category] || "#7A8BAD") + "12",
                }}
              >
                #{t.slug}
                <span className="text-slate-400">{t.occurrence_count}</span>
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="font-display font-bold text-2xl text-slate-900 leading-none">{value}</p>
        <p className="text-[11px] font-mono text-slate-500 mt-1 uppercase tracking-wider font-bold">{label}</p>
      </div>
    </div>
  );
}
