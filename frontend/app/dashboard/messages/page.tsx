"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { useToast } from "../layout";

interface LogEntry {
  id: string;
  platform: "instagram" | "tiktok" | "whatsapp";
  username: string;
  originalText: string;
  intent: "complaint" | "question" | "hype" | "purchase" | "spam";
  urgency: number;
  aiReply: string;
  status: "auto-replied" | "escalated" | "skipped";
  time: string;
  tokensUsed: number;
  zernioId: string;
}

interface DBMessage {
  id: string;
  platform: "instagram" | "tiktok" | "whatsapp";
  author_username?: string;
  raw_content: string;
  intent?: string;
  urgency?: number;
  ai_reply?: string;
  status?: string;
  zernio_post_id?: string;
  created_at: string;
  escalated_at?: string;
}

export default function MessageLogPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "instagram" | "tiktok" | "whatsapp">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "auto-replied" | "escalated" | "skipped">("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch messages logs from backend database
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/test/messages");
      if (!res.ok) throw new Error("Backend connection failed");
      const data = await res.json();
      
      const mapped = data.map((m: DBMessage) => {
        // Calculate relative age
        const ageMin = Math.max(1, Math.round((Date.now() - new Date(m.created_at).getTime()) / 60000));
        let relativeTime = `${ageMin} min ago`;
        if (ageMin >= 60 && ageMin < 1440) relativeTime = `${Math.round(ageMin/60)} hours ago`;
        if (ageMin >= 1440) relativeTime = `${Math.round(ageMin/1440)} days ago`;

        // Normalize status
        let normalStatus: LogEntry["status"] = "auto-replied";
        if (m.status === "escalated") normalStatus = "escalated";
        else if (m.status === "human_reviewed" && m.intent === "spam") normalStatus = "skipped";
        else if (m.status === "human_reviewed" || m.status === "pending") normalStatus = "auto-replied"; // fallback or edited
        
        // Normalize intent
        let normalIntent: LogEntry["intent"] = "question";
        if (m.intent === "complaint") normalIntent = "complaint";
        else if (m.intent === "purchase_intent" || m.intent === "purchase") normalIntent = "purchase";
        else if (m.intent === "hype") normalIntent = "hype";
        else if (m.intent === "spam") normalIntent = "spam";

        return {
          id: m.id,
          platform: m.platform,
          username: m.author_username || "anonymous",
          originalText: m.raw_content,
          intent: normalIntent,
          urgency: m.urgency || 1,
          aiReply: m.ai_reply || "",
          status: normalStatus,
          time: relativeTime,
          // Claude token counts details (mock details mapped per token scale)
          tokensUsed: m.ai_reply ? Math.floor(m.raw_content.length * 0.4 + m.ai_reply.length * 0.8 + 80) : 45,
          zernioId: m.zernio_post_id || "none"
        };
      });
      setLogs(mapped);
    } catch (err) {
      showToast(`Error fetching logs: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);


  const handleRowClick = (id: string) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.originalText.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlatform = platformFilter === "all" || log.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Message Log</h1>
          <p className="text-sm text-[#7A8BAD] mt-1">All messages TalkBridge handled automatically across your platforms.</p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8BAD]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments..."
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-full bg-[#0F1624] border border-[#1C2640] text-sm text-[#F0F4FF] focus:outline-none focus:border-[#4DFFC3] transition-all"
            />
          </div>
          <button 
            onClick={() => fetchLogs()} 
            className="p-2.5 rounded-full border border-[#1C2640] hover:border-[#4DFFC3] text-xs font-semibold font-display text-white bg-[#0F1624] transition-all shrink-0"
          >
            Sync Logs
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-[#0F1624] border border-[#1C2640] rounded-xl flex flex-wrap gap-6 items-center">
        {/* Platforms */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-mono text-[#7A8BAD] uppercase tracking-wider">PLATFORM</span>
          <div className="flex gap-1.5">
            {["all", "instagram", "tiktok", "whatsapp"].map((plat) => (
              <button
                key={plat}
                onClick={() => setPlatformFilter(plat as "all" | "instagram" | "tiktok" | "whatsapp")}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  platformFilter === plat
                    ? "bg-[#4DFFC3] text-[#080B14]"
                    : "bg-[#080B14] border border-[#1C2640] text-[#7A8BAD] hover:text-white"
                }`}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>

        {/* Statuses */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-mono text-[#7A8BAD] uppercase tracking-wider">STATUS</span>
          <div className="flex gap-1.5">
            {["all", "auto-replied", "escalated", "skipped"].map((stat) => (
              <button
                key={stat}
                onClick={() => setStatusFilter(stat as "all" | "auto-replied" | "escalated" | "skipped")}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  statusFilter === stat
                    ? "bg-[#4DFFC3] text-[#080B14]"
                    : "bg-[#080B14] border border-[#1C2640] text-[#7A8BAD] hover:text-white"
                }`}
              >
                {stat.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table View Container */}
      <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#7A8BAD] font-mono text-sm">
            <span className="w-8 h-8 rounded-full border-2 border-[#4DFFC3] border-t-transparent animate-spin" />
            <span>Fetching message history...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1C2640] bg-[#080B14]/40 font-mono text-[11px] uppercase tracking-wider text-[#7A8BAD]">
                  <th className="py-4 px-6">Platform</th>
                  <th className="py-4 px-6">Message</th>
                  <th className="py-4 px-6">Intent</th>
                  <th className="py-4 px-6 text-center">Urgency</th>
                  <th className="py-4 px-6">AI Reply</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2640]/55">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedRow === log.id;
                    const isTikTok = log.platform === "tiktok";
                    const isInstagram = log.platform === "instagram";
                    const isWhatsApp = log.platform === "whatsapp";

                    return (
                      <React.Fragment key={log.id}>
                        {/* Standard Row */}
                        <tr
                          onClick={() => handleRowClick(log.id)}
                          className="hover:bg-[#162033]/50 cursor-pointer transition-colors duration-150"
                        >
                          {/* Platform column */}
                          <td className="py-4 px-6 text-xs font-semibold text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                                isTikTok 
                                  ? "bg-[#FF0050]/10 border-[#FF0050]/20 text-[#FF0050]" 
                                  : isInstagram 
                                  ? "bg-[#E1306C]/10 border-[#E1306C]/20 text-[#E1306C]"
                                  : "bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366]"
                              }`}>
                                {isTikTok && <span className="font-bold text-[9px]">TT</span>}
                                {isInstagram && <span className="font-bold text-[9px]">IG</span>}
                                {isWhatsApp && <span className="font-bold text-[9px]">WA</span>}
                              </span>
                              <span className="capitalize">{log.platform}</span>
                            </div>
                          </td>

                          {/* Message Column */}
                          <td className="py-4 px-6 text-sm text-[#F0F4FF] max-w-[180px] truncate" title={log.originalText}>
                            <span className="font-mono text-xs block text-[#7A8BAD] mb-0.5">{log.username}</span>
                            {log.originalText}
                          </td>

                          {/* Intent Column */}
                          <td className="py-4 px-6 text-xs whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              log.intent === "complaint" 
                                ? "bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20"
                                : log.intent === "purchase"
                                ? "bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20"
                                : log.intent === "hype"
                                ? "bg-[#4DFFC3]/10 text-[#4DFFC3] border border-[#4DFFC3]/20"
                                : log.intent === "spam"
                                ? "bg-[#7A8BAD]/10 text-[#7A8BAD] border border-[#7A8BAD]/20"
                                : "bg-[#7B6EF6]/10 text-[#7B6EF6] border border-[#7B6EF6]/20"
                            }`}>
                              {log.intent}
                            </span>
                          </td>

                          {/* Urgency Column */}
                          <td className="py-4 px-6 text-xs text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                log.urgency >= 7 ? "bg-[#FF6B6B]" : log.urgency >= 4 ? "bg-[#F5A623]" : "bg-[#4DFFC3]"
                              }`} />
                              <span className="font-mono text-[#F0F4FF]">{log.urgency}/10</span>
                            </div>
                          </td>

                          {/* AI Reply Column */}
                          <td className="py-4 px-6 text-[12px] font-mono text-[#7A8BAD] max-w-[160px] truncate">
                            {log.aiReply || "—"}
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-6 text-xs whitespace-nowrap font-medium">
                            {log.status === "auto-replied" && <span className="text-[#4DFFC3]">✓ Auto-replied</span>}
                            {log.status === "escalated" && <span className="text-[#F5A623]">⚠ Escalated</span>}
                            {log.status === "skipped" && <span className="text-[#7A8BAD]">— Skipped</span>}
                          </td>

                          {/* Time Column */}
                          <td className="py-4 px-6 text-xs text-[#7A8BAD] whitespace-nowrap">
                            {log.time}
                          </td>

                          {/* Toggle Icon */}
                          <td className="py-4 px-6 text-right font-mono">
                            {isExpanded ? "[^]" : "[v]"}
                          </td>
                        </tr>

                        {/* Expanded Accordion Details */}
                        {isExpanded && (
                          <tr className="bg-[#080B14]/30">
                            <td colSpan={8} className="py-4 px-6 border-b border-[#1C2640] space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-mono text-[#7A8BAD] uppercase tracking-wider">FULL ORIGINAL MESSAGE</span>
                                  <p className="text-sm text-[#F0F4FF] bg-[#0F1624] p-3 rounded-lg border border-[#1C2640] leading-relaxed">
                                    {log.originalText}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-mono text-[#7A8BAD] uppercase tracking-wider">AI POSTED RESPONSE</span>
                                  <p className="text-sm text-[#F0F4FF] bg-[#0F1624] p-3 rounded-lg border border-[#1C2640] leading-relaxed italic">
                                    {log.aiReply || "No reply was posted for this event (Spam filter/Manual skip)."}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-6 text-[11px] font-mono text-[#7A8BAD] border-t border-[#1C2640]/50 pt-3">
                                <span>Tokens utilized: <strong className="text-white">{log.tokensUsed}</strong></span>
                                <span>&middot;</span>
                                <span>Zernio Request ID: <strong className="text-white">{log.zernioId}</strong></span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-[#7A8BAD]">
                      No messages logged. Generate sandbox runs in the Urgent dashboard tab to populate logs!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="p-4 bg-[#080B14]/40 border-t border-[#1C2640] flex items-center justify-between text-xs text-[#7A8BAD] font-mono">
          <span>Showing 1–{filteredLogs.length} of {filteredLogs.length}</span>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1.5 rounded bg-[#080B14] border border-[#1C2640] opacity-50 cursor-not-allowed">Previous</button>
            <button disabled className="px-3 py-1.5 rounded bg-[#080B14] border border-[#1C2640] opacity-50 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

    </div>
  );
}
