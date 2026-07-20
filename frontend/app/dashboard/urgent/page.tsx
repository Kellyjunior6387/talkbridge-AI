"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../layout";
import { PhoneCall, Check, Send, Play } from "lucide-react";

interface UrgentMessage {
  id: string;
  platform: "instagram" | "tiktok" | "whatsapp";
  username: string;
  timestamp: string;
  urgency: number;
  intent: string;
  originalText: string;
  detectedLang: string;
  aiDraft: string;
  smsSent: boolean;
  smsRecipient?: string;
  smsTime?: string;
}

interface DBMessage {
  id: string;
  platform: "instagram" | "tiktok" | "whatsapp";
  author_username?: string;
  raw_content: string;
  language?: string;
  intent?: string;
  urgency?: number;
  ai_reply?: string;
  status?: string;
  zernio_post_id?: string;
  created_at: string;
  escalated_at?: string;
}

export default function UrgentPage() {
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<"all" | "complaint" | "escalated">("all");
  const [messages, setMessages] = useState<UrgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch messages from backend
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/test/messages");
      if (!res.ok) throw new Error("Failed to fetch messages from backend server");
      const data = await res.json();
      
      // Filter only messages requiring human review (pending or escalated)
      const mapped = data
        .filter((m: DBMessage) => m.status === "pending" || m.status === "escalated")
        .map((m: DBMessage) => {
          // Format relative time
          const ageMin = Math.max(1, Math.round((Date.now() - new Date(m.created_at).getTime()) / 60000));
          const relativeTime = ageMin < 60 ? `${ageMin} min ago` : `${Math.round(ageMin/60)} hours ago`;
          
          return {
            id: m.id,
            platform: m.platform,
            username: m.author_username || "anonymous",
            timestamp: relativeTime,
            urgency: m.urgency || 1,
            intent: (m.intent || "QUESTION").toUpperCase(),
            originalText: m.raw_content,
            detectedLang: m.language === "sw" ? "Detected: Swahili + Sheng" : `Detected: ${m.language || "English"}`,
            aiDraft: m.ai_reply || "",
            smsSent: m.status === "escalated",
            smsRecipient: m.status === "escalated" ? "+254 712 *** 345" : undefined,
            smsTime: m.status === "escalated" ? new Date(m.escalated_at || m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
          };
        });
      setMessages(mapped);
    } catch (err) {
      showToast(`Error connecting to backend: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleDraftChange = (id: string, text: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, aiDraft: text } : m));
  };

  const handleSend = async (id: string, username: string, draftText: string, platform: string) => {
    try {
      const res = await fetch(`http://localhost:4000/test/messages/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", replyText: draftText, platform })
      });
      if (!res.ok) throw new Error("Could not submit reply to backend");
      
      showToast(`Reply sent to ${username} successfully!`, "success");
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      showToast(`Failed to send reply: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  const handleDismiss = async (id: string, username: string) => {
    try {
      const res = await fetch(`http://localhost:4000/test/messages/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" })
      });
      if (!res.ok) throw new Error("Could not dismiss message on backend");

      showToast(`Conversation with ${username} dismissed.`, "info");
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      showToast(`Failed to dismiss message: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  const handleMarkAllRead = async () => {
    if (messages.length === 0) return;
    try {
      const res = await fetch("http://localhost:4000/test/messages/mark-all-read", {
        method: "POST"
      });
      if (!res.ok) throw new Error("Mark all read failed on server");
      
      setMessages([]);
      showToast("All urgent messages marked as read.", "success");
    } catch (err) {
      showToast(`Failed to mark all read: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  // Simulate comment pipeline trigger for developer testing
  const handleSimulateScenario = async (scenario: "complaint" | "payment" | "inquiry") => {
    let payload = {};
    if (scenario === "complaint") {
      payload = {
        platform: "tiktok",
        username: "mwangi_wear",
        message: "where is my order 😡 mlikataa kuleta cargo hoodie yangu niko hapa tao!",
        scenario: "TikTok customer complaint"
      };
    } else if (scenario === "payment") {
      payload = {
        platform: "whatsapp",
        username: "+254 702 334 455",
        message: "Niko na shida ya payment, m-pesa payment link yenu inaleta error ya service unavailable.",
        scenario: "M-Pesa payment issue"
      };
    } else {
      payload = {
        platform: "instagram",
        username: "nairobi_slay",
        message: "Sema! Do you guys offer custom bulk designs for streetwear or is it only retail?",
        scenario: "Inquiry on bulk order"
      };
    }

    try {
      showToast("Triggering AI pipeline simulation...", "info");
      const res = await fetch("http://localhost:4000/test/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Simulation endpoint returned an error");
      const data = await res.json();
      
      if (data.success) {
        showToast("Simulated message processed & logged!", "success");
        fetchMessages();
      }
    } catch (err) {
      showToast(`Simulation failed: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    if (activeFilter === "complaint") return m.intent === "COMPLAINT" || m.intent === "PAYMENT ERROR";
    if (activeFilter === "escalated") return m.smsSent === true;
    return true;
  });

  return (

    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1C2640] pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Urgent Messages</h1>
          <p className="text-sm text-[#7A8BAD] mt-1">
            These need your personal attention. AI has drafted replies — approve or edit before sending.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {messages.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-full border border-[#1C2640] hover:border-[#FF6B6B] hover:text-[#FF6B6B] text-xs font-semibold font-display text-white transition-all text-center flex-grow sm:flex-grow-0"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => fetchMessages()}
            className="px-4 py-2 rounded-full border border-[#1C2640] hover:border-[#4DFFC3] text-xs font-semibold font-display text-white transition-all text-center flex-grow sm:flex-grow-0"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Developer Sandbox Simulation Controls */}
      <div className="bg-[#0F1624]/60 border border-[#1C2640] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#F5A623]">
          <Play size={14} />
          <span>DEVELOPER PLAYGROUND: SIMULATE AI WORKFLOWS</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleSimulateScenario("complaint")}
            className="px-3.5 py-1.5 rounded-lg bg-[#0F1624] border border-[#1C2640] hover:border-[#FF6B6B] text-xs text-white transition-all"
          >
            + Sim TikTok Complaint 😡
          </button>
          <button
            onClick={() => handleSimulateScenario("payment")}
            className="px-3.5 py-1.5 rounded-lg bg-[#0F1624] border border-[#1C2640] hover:border-[#F5A623] text-xs text-white transition-all"
          >
            + Sim WhatsApp M-Pesa Issue 💳
          </button>
          <button
            onClick={() => handleSimulateScenario("inquiry")}
            className="px-3.5 py-1.5 rounded-lg bg-[#0F1624] border border-[#1C2640] hover:border-[#4DFFC3] text-xs text-white transition-all"
          >
            + Sim IG Sheng Inquiry 💬
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeFilter === "all"
              ? "bg-[#4DFFC3] text-[#080B14] shadow-[0_0_12px_rgba(77,255,195,0.2)]"
              : "border border-[#1C2640] hover:border-[#4DFFC3]/50 text-[#7A8BAD] hover:text-white"
          }`}
        >
          All ({messages.length})
        </button>
        <button
          onClick={() => setActiveFilter("complaint")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeFilter === "complaint"
              ? "bg-[#4DFFC3] text-[#080B14] shadow-[0_0_12px_rgba(77,255,195,0.2)]"
              : "border border-[#1C2640] hover:border-[#4DFFC3]/50 text-[#7A8BAD] hover:text-white"
          }`}
        >
          Complaints ({messages.filter(m => m.intent === "COMPLAINT" || m.intent === "PAYMENT ERROR").length})
        </button>
        <button
          onClick={() => setActiveFilter("escalated")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeFilter === "escalated"
              ? "bg-[#4DFFC3] text-[#080B14] shadow-[0_0_12px_rgba(77,255,195,0.2)]"
              : "border border-[#1C2640] hover:border-[#4DFFC3]/50 text-[#7A8BAD] hover:text-white"
          }`}
        >
          Escalated ({messages.filter(m => m.smsSent).length})
        </button>
      </div>

      {/* Loader */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#7A8BAD] font-mono text-sm">
          <span className="w-8 h-8 rounded-full border-2 border-[#4DFFC3] border-t-transparent animate-spin" />
          <span>Synchronizing inbox with database...</span>
        </div>
      ) : (
        /* Message Cards Stack */
        <div className="space-y-6">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => {
              const isTikTok = msg.platform === "tiktok";
              const isInstagram = msg.platform === "instagram";
              const isWhatsApp = msg.platform === "whatsapp";

              return (
                <div
                  key={msg.id}
                  className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.05)] relative"
                >
                  {/* Top Row: User, platform, and urgency */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1C2640]/40 pb-4">
                    <div className="flex items-center gap-3">
                      {/* Platform Brand Circle */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                        isTikTok 
                          ? "bg-[#FF0050]/10 border-[#FF0050]/30 text-[#FF0050]" 
                          : isInstagram 
                          ? "bg-[#E1306C]/10 border-[#E1306C]/30 text-[#E1306C]"
                          : "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]"
                      }`}>
                        {isTikTok && (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.6-.67-.02 3.28-.01 6.56-.02 9.84-.04 2.11-.6 4.31-2.07 5.9-1.64 1.84-4.22 2.77-6.66 2.58-2.44-.13-4.88-1.42-6.07-3.6-1.53-2.62-1.25-6.19.74-8.5 1.57-1.87 4.15-2.73 6.55-2.29v4.06c-1.3-.4-2.8-.08-3.71.93-.93.97-1.12 2.51-.48 3.73.61 1.22 1.98 1.99 3.35 1.91 1.48-.04 2.82-1.14 2.94-2.61.07-2.4.03-17.39.03-17.39z" />
                          </svg>
                        )}
                        {isInstagram && (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        )}
                        {isWhatsApp && (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.908-6.995-1.878-1.88-4.357-2.912-6.997-2.914-5.443 0-9.865 4.421-9.87 9.867-.002 1.734.457 3.424 1.332 4.919l-.982 3.595 3.684-.967zm12.189-7.142c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">{msg.username}</span>
                        <span className="text-xs text-[#7A8BAD] font-mono ml-2">&middot; {msg.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30 uppercase">
                        URGENCY {msg.urgency}/10
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30 uppercase">
                        {msg.intent}
                      </span>
                    </div>
                  </div>

                  {/* Message Text Box */}
                  <div className="mt-4 p-4 bg-[#080B14] rounded-lg border border-[#1C2640]/60 space-y-2">
                    <p className="text-sm text-[#F0F4FF] leading-relaxed">{msg.originalText}</p>
                    <p className="font-mono text-[10px] text-[#7A8BAD] uppercase tracking-wider">{msg.detectedLang}</p>
                  </div>

                  {/* AI Reply Section */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#7B6EF6] font-semibold tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7B6EF6] inline-block animate-pulse" />
                        AI DRAFTED REPLY
                      </span>
                      <span className="text-[#7A8BAD]">{msg.aiDraft.length} / 500 characters</span>
                    </div>
                    
                    <textarea
                      value={msg.aiDraft}
                      onChange={(e) => handleDraftChange(msg.id, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-[#162033]/60 border border-[#1C2640] rounded-lg text-sm text-[#F0F4FF] focus:outline-none focus:border-[#4DFFC3] transition-all"
                    />
                  </div>

                  {/* Escalation Alert Panel */}
                  {msg.smsSent && (
                    <div className="mt-4 p-3 bg-[#F5A623]/5 rounded-lg border-l-2 border-[#F5A623] flex items-center gap-2.5 text-xs text-[#7A8BAD]">
                      <PhoneCall size={14} className="text-[#F5A623]" />
                      <span>
                        SMS alert sent to <strong className="text-[#F0F4FF]">{msg.smsRecipient}</strong> at {msg.smsTime}
                      </span>
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="mt-5 flex justify-end gap-3 border-t border-[#1C2640]/40 pt-4">
                    <button
                      onClick={() => handleDismiss(msg.id, msg.username)}
                      className="px-4 py-2 text-xs font-semibold text-[#7A8BAD] hover:text-white transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        showToast("Opened full details view", "info");
                      }}
                      className="px-4 py-2 text-xs font-semibold text-[#7B6EF6] border border-[#7B6EF6]/40 hover:border-[#7B6EF6] rounded-full transition-all"
                    >
                      Edit & Send
                    </button>
                    <button
                      onClick={() => handleSend(msg.id, msg.username, msg.aiDraft, msg.platform)}
                      className="px-5 py-2 text-xs font-bold font-display bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 text-[#080B14] rounded-full transition-all hover:shadow-[0_0_12px_rgba(77,255,195,0.3)] flex items-center gap-1"
                    >
                      Send Reply <Send size={12} className="ml-0.5" />
                    </button>
                  </div>

                </div>
              );
            })
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[#0F1624]/30 border border-dashed border-[#1C2640] rounded-2xl p-8">
              <div className="w-16 h-16 rounded-full bg-[#4DFFC3]/15 flex items-center justify-center text-[#4DFFC3]">
                <Check size={36} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-white">You&apos;re all caught up</h3>
                <p className="text-sm text-[#7A8BAD] max-w-sm mx-auto">
                  No urgent messages right now. TalkBridge is handling everything automatically. Use the Playground above to simulate alerts!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
