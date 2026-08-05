"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  PhoneCall, 
  Send, 
  RefreshCw, 
  CheckCircle2
} from "lucide-react";
import { useToast } from "../layout";

// Typings for logs
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

interface MockMessage {
  id: string;
  platform: "instagram" | "tiktok" | "whatsapp";
  username: string;
  originalText: string;
  detectedLang: string;
  intent: string;
  urgency: number;
  aiDraft: string;
  status: string;
  smsSent: boolean;
  smsRecipient?: string;
  smsTime?: string;
  created_at: string;
  aiReply?: string;
  escalated_at?: string;
}

export default function UnifiedMessagesPage() {
  const { showToast } = useToast();
  
  // Workspace tabs: "urgent" (Actions Required) or "log" (Auto-Reply History)
  const [activeTab, setActiveTab] = useState<"urgent" | "log">("urgent");

  // Local state for all conversations (Simulates database storage on frontend)
  const [dbMessages, setDbMessages] = useState<MockMessage[]>([
    {
      id: "msg-1",
      platform: "instagram",
      username: "nairobi_chic",
      originalText: "How much is the Cargo Hoodie? Do you have size L in stock? 😍",
      detectedLang: "Detected: English",
      intent: "QUESTION",
      urgency: 4,
      aiDraft: "Sema nairobi_chic! Cargo Hoodie yetu ni Ksh 2,800 na ukubwa wa size L uko kwa stock ready to ship. Utapenda ubora wake! Utapenda tufanye delivery leo? 😊",
      status: "pending",
      smsSent: false,
      created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    },
    {
      id: "msg-2",
      platform: "tiktok",
      username: "kendy_k",
      originalText: "mnapatikana wapi? niko kitengela mnaweza deliver leo?",
      detectedLang: "Detected: Swahili + Sheng",
      intent: "QUESTION",
      urgency: 5,
      aiDraft: "Sema kendy_k! Duka letu liko Nairobi CBD lakini tunafanya delivery Kitengela kupitia Rider au G4S kwa Ksh 300 pekee. Ukituma order sasa hivi itafika jioni hii! 🛵",
      status: "pending",
      smsSent: false,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: "msg-3",
      platform: "whatsapp",
      username: "+254 722 998 811",
      originalText: "I placed an order yesterday and paid via M-Pesa but no one has confirmed yet. What is going on??",
      detectedLang: "Detected: English",
      intent: "COMPLAINT",
      urgency: 9,
      aiDraft: "Hello! We sincerely apologize for the delay. We are reviewing your payment transaction right now and our dispatch team will call you back in 5 minutes. Thank you for your patience.",
      status: "escalated",
      smsSent: true,
      smsRecipient: "+254 712 *** 345",
      smsTime: new Date(Date.now() - 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      escalated_at: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: "msg-4",
      platform: "instagram",
      username: "john_doe_99",
      originalText: "Awesome designs! Keep up the good work guys.",
      detectedLang: "Detected: English",
      intent: "HYPE",
      urgency: 1,
      aiDraft: "Sema john_doe_99! Asante sana kwa support yako! Itutii motisha kuendelea kuboresha streetwear zetu. 🙏🔥",
      status: "auto-replied",
      smsSent: false,
      aiReply: "Sema john_doe_99! Asante sana kwa support yako! Itutii motisha kuendelea kuboresha streetwear zetu. 🙏🔥",
      created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    },
    {
      id: "msg-5",
      platform: "tiktok",
      username: "spambot_tiktok",
      originalText: "👉 CLICK HERE TO GET 1000 FREE FOLLOWERS NOW!!! 👈",
      detectedLang: "Detected: English",
      intent: "SPAM",
      urgency: 1,
      aiDraft: "",
      status: "skipped",
      smsSent: false,
      created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    }
  ]);

  const [urgentMessages, setUrgentMessages] = useState<UrgentMessage[]>([]);
  const [isUrgentLoading, setIsUrgentLoading] = useState(false);
  const [urgentFilter, setUrgentFilter] = useState<"all" | "complaint" | "escalated">("all");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "instagram" | "tiktok" | "whatsapp">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "auto-replied" | "escalated" | "skipped">("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Sync state between dbMessages state templates and UI views
  const syncUIRecords = useCallback(() => {
    // 1. Process Urgent Messages (status === 'pending' || status === 'escalated')
    const urgentMapped = dbMessages
      .filter((m) => m.status === "pending" || m.status === "escalated")
      .map((m) => {
        const ageMin = Math.max(1, Math.round((Date.now() - new Date(m.created_at).getTime()) / 60000));
        const relativeTime = ageMin < 60 ? `${ageMin} min ago` : `${Math.round(ageMin/60)} hours ago`;
        
        return {
          id: m.id,
          platform: m.platform,
          username: m.username,
          timestamp: relativeTime,
          urgency: m.urgency,
          intent: m.intent,
          originalText: m.originalText,
          detectedLang: m.detectedLang,
          aiDraft: m.aiDraft,
          smsSent: m.smsSent,
          smsRecipient: m.smsRecipient,
          smsTime: m.smsTime
        };
      });
    setUrgentMessages(urgentMapped);

    // 2. Process Auto-Reply Logs History
    const logMapped = dbMessages.map((m) => {
      const ageMin = Math.max(1, Math.round((Date.now() - new Date(m.created_at).getTime()) / 60000));
      let relativeTime = `${ageMin} min ago`;
      if (ageMin >= 60 && ageMin < 1440) relativeTime = `${Math.round(ageMin/60)} hours ago`;
      if (ageMin >= 1440) relativeTime = `${Math.round(ageMin/1440)} days ago`;

      let normalStatus: LogEntry["status"] = "auto-replied";
      if (m.status === "escalated") normalStatus = "escalated";
      else if (m.status === "skipped") normalStatus = "skipped";
      else if (m.status === "pending") normalStatus = "auto-replied"; // fallback or pre-reply

      let normalIntent: LogEntry["intent"] = "question";
      if (m.intent.toLowerCase() === "complaint") normalIntent = "complaint";
      else if (m.intent.toLowerCase() === "purchase") normalIntent = "purchase";
      else if (m.intent.toLowerCase() === "hype") normalIntent = "hype";
      else if (m.intent.toLowerCase() === "spam") normalIntent = "spam";

      return {
        id: m.id,
        platform: m.platform,
        username: m.username,
        originalText: m.originalText,
        intent: normalIntent,
        urgency: m.urgency,
        aiReply: m.aiReply || m.aiDraft || "",
        status: normalStatus,
        time: relativeTime,
        tokensUsed: m.aiReply ? Math.floor(m.originalText.length * 0.4 + m.aiReply.length * 0.8 + 80) : 45,
        zernioId: `zn-req-${m.id}`
      };
    });
    setLogs(logMapped);
  }, [dbMessages]);

  useEffect(() => {
    syncUIRecords();
  }, [syncUIRecords]);

  const handleSyncButton = () => {
    setIsUrgentLoading(true);
    setIsLogsLoading(true);
    setTimeout(() => {
      syncUIRecords();
      setIsUrgentLoading(false);
      setIsLogsLoading(false);
      showToast("Inbox logs synchronized successfully!", "success");
    }, 450);
  };

  // Urgent actions handlers
  const handleDraftChange = (id: string, text: string) => {
    setDbMessages(prev => prev.map(m => m.id === id ? { ...m, aiDraft: text } : m));
  };

  const handleSendUrgent = (id: string, username: string, draftText: string, platform: string) => {
    setDbMessages(prev => prev.map(m => m.id === id ? { ...m, status: "auto-replied", aiReply: draftText, urgency: 1, smsSent: false } : m));
    showToast(`Reply sent to ${username} successfully via ${platform}!`, "success");
  };

  const handleDismissUrgent = (id: string, username: string) => {
    setDbMessages(prev => prev.map(m => m.id === id ? { ...m, status: "skipped" } : m));
    showToast(`Conversation with ${username} dismissed.`, "info");
    setSelectedMessageId(null);
  };

  const handleMarkAllRead = () => {
    setDbMessages(prev => prev.map(m => (m.status === "pending" || m.status === "escalated") ? { ...m, status: "auto-replied" } : m));
    showToast("All urgent messages marked as read.", "success");
  };

  // Filter urgent cards
  const filteredUrgent = urgentMessages.filter(m => {
    if (urgentFilter === "complaint") return m.intent === "COMPLAINT" || m.intent === "PAYMENT ERROR";
    if (urgentFilter === "escalated") return m.smsSent === true;
    return true;
  });



  // Filter history logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.originalText.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlatform = platformFilter === "all" || log.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-16 text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">Conversations & Messages</h1>
          <p className="text-sm text-slate-500 mt-1">Review urgent messages requiring approval or browse auto-reply logs.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button 
            onClick={handleSyncButton}
            className="flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-sm"
          >
            <RefreshCw size={14} className="text-slate-500 animate-spin" style={{ animationDuration: '6s' }} /> Sync Messages
          </button>
        </div>
      </div>

      {/* WORKSPACE SUB-NAVIGATION TABS */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("urgent")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all relative ${
            activeTab === "urgent"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Urgent Action Required
          {urgentMessages.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
              {urgentMessages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "log"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Auto-Reply Log
        </button>
      </div>

      {/* URGENT ACTIONS CONTENT */}
      {activeTab === "urgent" && (
        <div className="space-y-6">
          {/* Sub Filters for Urgent messages */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2">
              {["all", "complaint", "escalated"].map((f) => (
                <button
                  key={f}
                  onClick={() => setUrgentFilter(f as "all" | "complaint" | "escalated")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                    urgentFilter === f
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f} ({
                    f === "all" ? urgentMessages.length :
                    f === "complaint" ? urgentMessages.filter(m => m.intent === "COMPLAINT" || m.intent === "PAYMENT ERROR").length :
                    urgentMessages.filter(m => m.smsSent).length
                  })
                </button>
              ))}
            </div>

            {urgentMessages.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-1.5 rounded-full border border-slate-200 hover:border-red-500 hover:text-red-500 text-xs font-semibold bg-white text-slate-700 transition-all shadow-sm"
              >
                Mark all read
              </button>
            )}
          </div>

          {isUrgentLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 font-mono text-sm">
              <span className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>Fetching actions required...</span>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {filteredUrgent.length > 0 ? (
                (() => {
                  const activeMsg = filteredUrgent.find(m => m.id === selectedMessageId);

                  // If no message is selected, show the full list of conversations
                  if (!activeMsg) {
                    return (
                      <div className="space-y-3">
                        {filteredUrgent.map((msg) => {
                          const isTikTok = msg.platform === "tiktok";
                          const isInstagram = msg.platform === "instagram";
                          const isWhatsApp = msg.platform === "whatsapp";

                          return (
                            <div
                              key={msg.id}
                              onClick={() => setSelectedMessageId(msg.id)}
                              className="p-5 cursor-pointer transition-all duration-150 flex items-start gap-4 hover:border-blue-650 hover:shadow-md border border-slate-200 rounded-xl bg-white"
                            >
                              {/* Platform Icon Badge */}
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold ${
                                isTikTok 
                                  ? "bg-[#FF0050]/10 border-[#FF0050]/20 text-[#FF0050]" 
                                  : isInstagram 
                                  ? "bg-[#E1306C]/10 border-[#E1306C]/20 text-[#E1306C]"
                                  : "bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366]"
                              }`}>
                                {isTikTok && "TT"}
                                {isInstagram && "IG"}
                                {isWhatsApp && "WA"}
                              </div>

                              {/* Message details snippet */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex justify-between items-baseline gap-2">
                                  <span className="text-sm font-bold text-slate-900">{msg.username}</span>
                                  <span className="text-xs text-slate-400 font-mono shrink-0">{msg.timestamp}</span>
                                </div>
                                <p className="text-sm text-slate-600 truncate font-semibold">{msg.originalText}</p>
                                <div className="flex gap-2 pt-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-650 border border-red-100 uppercase">
                                    Urgency {msg.urgency}/10
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-orange-655 border border-orange-100 uppercase">
                                    {msg.intent}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // If a message is selected, show the full-page details
                  const isTikTok = activeMsg.platform === "tiktok";
                  const isInstagram = activeMsg.platform === "instagram";
                  const isWhatsApp = activeMsg.platform === "whatsapp";

                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[480px] space-y-6">
                      
                      {/* Detail Header with Back Button */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedMessageId(null)}
                            className="px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-sm flex items-center gap-1 shrink-0"
                          >
                            ← Back to Inbox
                          </button>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${
                              isTikTok 
                                ? "bg-[#FF0050]/10 border-[#FF0050]/20 text-[#FF0050]" 
                                : isInstagram 
                                ? "bg-[#E1306C]/10 border-[#E1306C]/20 text-[#E1306C]"
                                : "bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366]"
                            }`}>
                              {isTikTok && "TT"}
                              {isInstagram && "IG"}
                              {isWhatsApp && "WA"}
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-900 block leading-tight">{activeMsg.username}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Platform: <span className="capitalize font-semibold text-slate-650">{activeMsg.platform}</span> &middot; Received {activeMsg.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0 ml-auto sm:ml-0">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-50 text-red-650 border border-red-100 uppercase">
                            Urgency {activeMsg.urgency}/10
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-orange-50 text-orange-655 border border-orange-100 uppercase">
                            {activeMsg.intent}
                          </span>
                        </div>
                      </div>

                      {/* Message Box */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                        <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Original Message</span>
                        <p className="text-sm text-slate-800 leading-relaxed font-semibold">{activeMsg.originalText}</p>
                        <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest font-bold">{activeMsg.detectedLang}</p>
                      </div>

                      {/* AI Draft Response Editor */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-indigo-650 font-bold tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block animate-pulse" />
                            AI DRAFTED RESPONSE
                          </span>
                          <span className="text-slate-400 font-semibold">{activeMsg.aiDraft.length} / 500 chars</span>
                        </div>
                        
                        <textarea
                          value={activeMsg.aiDraft}
                          onChange={(e) => handleDraftChange(activeMsg.id, e.target.value)}
                          rows={5}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all font-medium resize-none"
                        />
                      </div>

                      {/* Escalation alert info */}
                      {activeMsg.smsSent && (
                        <div className="p-3 bg-orange-50/50 rounded-lg border-l-2 border-orange-500 flex items-center gap-2 text-xs text-slate-650">
                          <PhoneCall size={13} className="text-orange-500 shrink-0" />
                          <span>
                            SMS alert pushed to agent (<strong className="text-slate-850">{activeMsg.smsRecipient}</strong>) at {activeMsg.smsTime}
                          </span>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0 bg-white">
                        <button
                          onClick={() => handleDismissUrgent(activeMsg.id, activeMsg.username)}
                          className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-850 transition-colors"
                        >
                          Dismiss / Ignore
                        </button>
                        <button
                          onClick={() => {
                            handleSendUrgent(activeMsg.id, activeMsg.username, activeMsg.aiDraft, activeMsg.platform);
                            setSelectedMessageId(null);
                          }}
                          className="px-5 py-2 text-xs font-bold font-display bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] flex items-center gap-1.5"
                        >
                          Send Draft Reply <Send size={12} />
                        </button>
                      </div>

                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white border border-dashed border-slate-200 rounded-2xl p-8 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-sm">
                    <CheckCircle2 size={36} strokeWidth={2} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-xl text-slate-900">You&apos;re all caught up</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      No urgent messages requiring human moderation. TalkBridge is handling inbox comments automatically!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AUTO-REPLY LOGS CONTENT */}
      {activeTab === "log" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter and search bar */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            
            {/* Left side filters */}
            <div className="flex flex-wrap gap-4 items-center bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Platform:</span>
                <div className="flex gap-1">
                  {["all", "instagram", "tiktok", "whatsapp"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatformFilter(p as "all" | "instagram" | "tiktok" | "whatsapp")}
                      className={`px-2.5 py-1 rounded-full text-xs capitalize transition-all ${
                        platformFilter === p
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Status:</span>
                <div className="flex gap-1">
                  {["all", "auto-replied", "escalated", "skipped"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s as "all" | "auto-replied" | "escalated" | "skipped")}
                      className={`px-2.5 py-1 rounded-full text-xs capitalize transition-all ${
                        statusFilter === s
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {s.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full lg:w-64 pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-650 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Table history */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {isLogsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 font-mono text-sm">
                <span className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span>Synchronizing logs...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6 font-bold">Conversation</th>
                      <th className="py-4 px-6 font-bold">Message & Response</th>
                      <th className="py-4 px-6 font-bold">Analysis</th>
                      <th className="py-4 px-6 font-bold">Status</th>
                      <th className="py-4 px-6 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => {
                        const isExpanded = expandedRow === log.id;
                        const isTikTok = log.platform === "tiktok";
                        const isInstagram = log.platform === "instagram";
                        const isWhatsApp = log.platform === "whatsapp";

                        return (
                          <React.Fragment key={log.id}>
                            <tr
                              onClick={() => setExpandedRow(prev => (prev === log.id ? null : log.id))}
                              className="hover:bg-slate-50/80 cursor-pointer transition-colors duration-150"
                            >
                              {/* 1. Conversation */}
                              <td className="py-3.5 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 text-[8px] font-bold ${
                                    isTikTok 
                                      ? "bg-[#FF0050]/10 border-[#FF0050]/20 text-[#FF0050]" 
                                      : isInstagram 
                                      ? "bg-[#E1306C]/10 border-[#E1306C]/20 text-[#E1306C]"
                                      : "bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366]"
                                  }`}>
                                    {isTikTok && "TT"}
                                    {isInstagram && "IG"}
                                    {isWhatsApp && "WA"}
                                  </span>
                                  <div>
                                    <span className="font-mono text-xs font-semibold text-slate-800 block leading-tight">{log.username}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">{log.time}</span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Message & Response */}
                              <td className="py-3.5 px-6 max-w-[280px] min-w-[200px]">
                                <p className="text-xs text-slate-700 truncate font-semibold mb-0.5">{log.originalText}</p>
                                <p className="text-[11px] font-mono text-slate-400 truncate">{log.aiReply || "—"}</p>
                              </td>

                              {/* 3. Analysis */}
                              <td className="py-3.5 px-6 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0 ${
                                    log.intent === "complaint" 
                                      ? "bg-red-50 text-red-655 border border-red-100"
                                      : log.intent === "purchase"
                                      ? "bg-orange-50 text-orange-655 border border-orange-100"
                                      : log.intent === "hype"
                                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                                      : log.intent === "spam"
                                      ? "bg-slate-100 text-slate-500 border border-slate-200"
                                      : "bg-indigo-50 text-indigo-650 border border-indigo-100"
                                  }`}>
                                    {log.intent}
                                  </span>
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      log.urgency >= 7 ? "bg-red-500" : log.urgency >= 4 ? "bg-orange-500" : "bg-blue-500"
                                    }`} />
                                    <span className="font-mono text-slate-550">{log.urgency}/10</span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. Status */}
                              <td className="py-3.5 px-6 text-xs whitespace-nowrap font-semibold">
                                {log.status === "auto-replied" && <span className="text-blue-600">✓ Auto-replied</span>}
                                {log.status === "escalated" && <span className="text-orange-550">⚠ Escalated</span>}
                                {log.status === "skipped" && <span className="text-slate-450">— Skipped</span>}
                              </td>

                              {/* 5. Toggle */}
                              <td className="py-3.5 px-6 text-right text-xs text-slate-400 font-mono">
                                {isExpanded ? "[^]" : "[v]"}
                              </td>
                            </tr>

                            {/* Details Details */}
                            {isExpanded && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={5} className="py-4 px-6 border-b border-slate-200/60 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">FULL ORIGINAL MESSAGE</span>
                                      <p className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-semibold">
                                        {log.originalText}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase">AI POSTED RESPONSE</span>
                                      <p className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed italic font-semibold">
                                        {log.aiReply || "No reply was posted for this event (Spam filter/Manual skip)."}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-6 text-[10px] font-mono text-slate-400 border-t border-slate-200/50 pt-3">
                                    <span>Tokens utilized: <strong className="text-slate-700">{log.tokensUsed}</strong></span>
                                    <span>&middot;</span>
                                    <span>Zernio Request ID: <strong className="text-slate-700">{log.zernioId}</strong></span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                          No messages logged. Trigger simulation runs above to generate conversation events!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Showing 1–{filteredLogs.length} of {filteredLogs.length}</span>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1.5 rounded bg-white border border-slate-200 opacity-50 cursor-not-allowed">Previous</button>
                <button disabled className="px-3 py-1.5 rounded bg-white border border-slate-200 opacity-50 cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
