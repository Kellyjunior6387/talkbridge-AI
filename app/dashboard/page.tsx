"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity,
  Share2,
  CreditCard,
  Settings,
  LogOut,
  RefreshCw,
  Zap,
  Check,
  Copy,
  MessageSquare,
  Smartphone,
  CheckCircle,
  HelpCircle,
  Eye,
  EyeOff,
  User,
  Shield,
  Sliders,
  Send,
  X
} from "lucide-react";

// Types
interface Message {
  id: string;
  platform: string;
  channel_message_id?: string;
  author_username: string;
  raw_content: string;
  language?: string;
  intent?: string;
  urgency: number;
  sentiment?: string;
  ai_reply?: string;
  status: string; // 'pending' | 'escalated' | 'auto_replied' | 'human_reviewed'
  created_at?: string;
}

// Fallback Mock Data
const MOCK_MESSAGES: Message[] = [
  {
    id: "mock-1",
    platform: "instagram",
    channel_message_id: "inst-101",
    author_username: "fashion_maven",
    raw_content: "Hey, is this jacket available in red? I need it by next Thursday!",
    language: "english",
    intent: "inquiry",
    urgency: 5,
    sentiment: "neutral",
    ai_reply: "Hi @fashion_maven! Yes, the Crimson Peak Jacket is in stock and ready. If you order today with Express Shipping, it will arrive by Tuesday!",
    status: "auto_replied",
    created_at: new Date(Date.now() - 5 * 60000).toISOString() // 5m ago
  },
  {
    id: "mock-2",
    platform: "tiktok",
    channel_message_id: "tt-202",
    author_username: "angry_shopper99",
    raw_content: "Absolute scam! My order #4819 never arrived and support is completely ignoring my emails! Refund me now!!!",
    language: "english",
    intent: "complaint",
    urgency: 9,
    sentiment: "negative",
    ai_reply: "Hello @angry_shopper99, we are extremely sorry for this experience. We have escalated order #4819 immediately to our tier-2 support leads. They are reviewing your delivery logs now.",
    status: "escalated",
    created_at: new Date(Date.now() - 12 * 60000).toISOString() // 12m ago
  },
  {
    id: "mock-3",
    platform: "whatsapp",
    channel_message_id: "wa-303",
    author_username: "+1 (555) 019-9321",
    raw_content: "Can we schedule a demo of your enterprise plan for a team of 40 people?",
    language: "english",
    intent: "lead",
    urgency: 6,
    sentiment: "positive",
    ai_reply: "Hello! We would love to walk you through our Enterprise tier. Please pick a slot that works for your team here: https://talkbridge.ai/demo-scheduler",
    status: "auto_replied",
    created_at: new Date(Date.now() - 25 * 60000).toISOString() // 25m ago
  },
  {
    id: "mock-4",
    platform: "sms",
    channel_message_id: "sms-404",
    author_username: "+1 (415) 883-9912",
    raw_content: "URGENT: My API access token is returning a 403 Forbidden error. Blocked from pushing updates.",
    language: "english",
    intent: "support",
    urgency: 8,
    sentiment: "negative",
    ai_reply: "Hi there. We have detected a credential block on your key space. We are escalating this to our on-call engineering team right now. They will contact you shortly.",
    status: "escalated",
    created_at: new Date(Date.now() - 45 * 60000).toISOString() // 45m ago
  },
  {
    id: "mock-5",
    platform: "instagram",
    channel_message_id: "inst-105",
    author_username: "lisa_v",
    raw_content: "Wow, this product looks incredible! Can't wait to try it out! 😍🔥",
    language: "english",
    intent: "positive",
    urgency: 2,
    sentiment: "positive",
    ai_reply: "Thank you so much @lisa_v! We appreciate your support and hope you absolutely love it. Let us know if you need anything!",
    status: "auto_replied",
    created_at: new Date(Date.now() - 90 * 60000).toISOString() // 1.5h ago
  },
  {
    id: "mock-6",
    platform: "tiktok",
    channel_message_id: "tt-206",
    author_username: "cryptoking_promo",
    raw_content: "Earn $5000/day working from home! Click the link in bio for free bitcoin tutorial no scam!!! 🚀🚀🚀",
    language: "english",
    intent: "spam",
    urgency: 1,
    sentiment: "positive",
    ai_reply: "",
    status: "human_reviewed",
    created_at: new Date(Date.now() - 120 * 60000).toISOString() // 2h ago
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "channels" | "pricing" | "settings">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Simulation Form State
  const [simPlatform, setSimPlatform] = useState("tiktok");
  const [simUsername, setSimUsername] = useState("john_doe");
  const [simMessage, setSimMessage] = useState("");
  const simScenario = "demo_test";
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);

  // Channels Connection State
  const [channels, setChannels] = useState({
    instagram: { connected: true, username: "@talk.bridgeai", api: "Zernio API v1" },
    tiktok: { connected: true, username: "@talkbridge.official", api: "Native Webhook" },
    whatsapp: { connected: false, username: "+1 (555) 010-4499", api: "Cloud API" },
    sms: { connected: true, username: "+1 (415) 902-8822", api: "Twilio Gateway" }
  });

  // Settings Form State
  const webhookUrl = "https://talkbridge-tunnel.pinggy.link/webhook/zernio";
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [geminiKey, setGeminiKey] = useState("••••••••••••••••••••••••••••••••••••");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [escalationThreshold, setEscalationThreshold] = useState(7);
  const [toneOfVoice, setToneOfVoice] = useState("professional");
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Pricing State
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("monthly");

  // Fetch Messages from Server
  const fetchMessages = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/test/messages", {
        headers: { "Cache-Control": "no-cache" }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
        setIsBackendOnline(true);
      } else {
        throw new Error("Backend responded with error");
      }
    } catch (err) {
      // Fallback to mock data on error/offline
      console.warn("Failed to fetch messages from server:", err);
      setIsBackendOnline(false);
      setMessages((prev) => (prev.length > 0 ? prev : MOCK_MESSAGES));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Polling Loop
  useEffect(() => {
    fetchMessages(true);
    
    const interval = setInterval(() => {
      if (isPolling) {
        fetchMessages(false);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPolling, fetchMessages]);

  // Handle Simulation Request
  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setIsSimulating(true);

    try {
      if (isBackendOnline) {
        const res = await fetch("http://localhost:4000/test/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: simPlatform,
            username: simUsername,
            message: simMessage,
            scenario: simScenario
          })
        });

        if (res.ok) {
          await fetchMessages(false);
          setSimMessage("");
          setShowSimModal(false);
        } else {
          throw new Error("Failed to simulate on backend");
        }
      } else {
        // Simulated local fallback run
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const isSpam = simMessage.toLowerCase().includes("spam") || simMessage.toLowerCase().includes("bitcoin");
        const isUrgent = simMessage.toLowerCase().includes("urgent") || simMessage.toLowerCase().includes("broken") || simMessage.toLowerCase().includes("scam");
        const urgencyScore = isUrgent ? 8 : isSpam ? 1 : 4;
        const intentVal = isSpam ? "spam" : isUrgent ? "complaint" : "inquiry";
        const replyVal = isSpam ? "" : `Hi @${simUsername}! Thanks for reaching out. We have received your query regarding "${simMessage.substring(0, 20)}..." and our automated team is looking into it.`;
        const statusVal = isSpam ? "human_reviewed" : urgencyScore >= 7 ? "escalated" : "auto_replied";

        const newMsg: Message = {
          id: `sim-local-${Date.now()}`,
          platform: simPlatform,
          channel_message_id: `sim-${Date.now()}`,
          author_username: simUsername,
          raw_content: simMessage,
          language: "english",
          intent: intentVal,
          urgency: urgencyScore,
          sentiment: isUrgent ? "negative" : "neutral",
          ai_reply: replyVal,
          status: statusVal,
          created_at: new Date().toISOString()
        };

        setMessages((prev) => [newMsg, ...prev]);
        setSimMessage("");
        setShowSimModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper for Relative Time
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "just now";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Copy Webhook Handler
  const copyWebhookToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Save Settings Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  // Toggle Channel Connection
  const toggleChannel = (key: keyof typeof channels) => {
    setChannels((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        connected: !prev[key].connected
      }
    }));
  };

  // Helper for rendering Platform Badge
  const renderPlatformBadge = (platform: string) => {
    let style = "bg-slate-500/10 text-slate-400 border-slate-500/20";
    let icon = <MessageSquare size={12} />;

    if (platform === "instagram") {
      style = "bg-pink-500/10 text-pink-400 border-pink-500/20";
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    } else if (platform === "tiktok") {
      style = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    } else if (platform === "whatsapp") {
      style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    } else if (platform === "sms") {
      style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      icon = <Smartphone size={12} className="mr-1" />;
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono border ${style}`}>
        {icon}
        {platform.toUpperCase()}
      </span>
    );
  };

  // Helper for rendering Urgency Score
  const renderUrgencyBadge = (score: number) => {
    let color = "text-emerald-400 bg-emerald-500/10";
    if (score >= 5 && score <= 6) color = "text-amber-400 bg-amber-500/10";
    if (score >= 7) color = "text-rose-400 bg-rose-500/10 border-rose-500/20";

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${color}`}>
        {score}/10
      </span>
    );
  };

  // Helper for rendering Status Badge
  const renderStatusBadge = (status: string) => {
    let style = "bg-slate-500/10 text-slate-400 border-slate-500/20";
    let text = "Pending";

    if (status === "auto_replied") {
      style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      text = "Auto Replied";
    } else if (status === "escalated") {
      style = "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse";
      text = "Escalated (SMS)";
    } else if (status === "human_reviewed") {
      style = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      text = "Spam Skipped";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-medium ${style}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen bg-background text-textPrimary flex font-body">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/3 blur-[120px] pointer-events-none z-0" />

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border/40 bg-surface/30 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <path d="M2 17c4-5 16-5 20 0" />
                <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" />
                <path d="M2 12c3-1 17-1 20 0" />
                <path d="M6 12v2" />
                <path d="M12 11v4" />
                <path d="M18 12v2" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg tracking-wide">
              TalkBridge<span className="text-primary">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => { setActiveTab("overview"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "overview"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-textSecondary hover:bg-surface/50 hover:text-textPrimary"
              }`}
            >
              <Activity size={18} />
              <span>Activity Logs</span>
            </button>
            <button
              onClick={() => { setActiveTab("channels"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "channels"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-textSecondary hover:bg-surface/50 hover:text-textPrimary"
              }`}
            >
              <Share2 size={18} />
              <span>Connected Channels</span>
            </button>
            <button
              onClick={() => { setActiveTab("pricing"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "pricing"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-textSecondary hover:bg-surface/50 hover:text-textPrimary"
              }`}
            >
              <CreditCard size={18} />
              <span>Pricing Tiers</span>
            </button>
            <button
              onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "settings"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-textSecondary hover:bg-surface/50 hover:text-textPrimary"
              }`}
            >
              <Settings size={18} />
              <span>System Settings</span>
            </button>
          </nav>
        </div>

        {/* User Info / Log Out */}
        <div className="p-6 border-t border-border/40 bg-surface/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary">
              <User size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-textPrimary truncate">Sandbox Developer</p>
              <p className="text-[10px] text-textSecondary truncate">sandbox@talkbridge.ai</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:border-danger/40 text-textSecondary hover:text-danger text-xs font-semibold transition-all duration-200"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* 2. MAIN CONTAINER */}
      <div className="flex-grow md:pl-64 flex flex-col min-h-screen relative z-10">
        
        {/* TOP BAR */}
        <header className="h-16 border-b border-border/40 px-6 flex items-center justify-between bg-surface/10 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 md:hidden rounded-lg bg-surface border border-border text-textSecondary hover:text-primary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            <h2 className="text-sm font-display font-bold tracking-wide uppercase text-textSecondary">
              {activeTab === "overview" && "Inbox Pipeline Activity"}
              {activeTab === "channels" && "Omnichannel Connections"}
              {activeTab === "pricing" && "License & Subscriptions"}
              {activeTab === "settings" && "Developer Configuration"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Pipeline Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface/30">
              <span className={`w-2 h-2 rounded-full ${isBackendOnline ? "bg-primary animate-pulse" : "bg-amber-400 animate-pulse"}`} />
              <span className="text-[11px] font-mono text-textSecondary uppercase tracking-wider">
                {isBackendOnline ? "Engine: Online" : "Sandbox Mode"}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW / ACTIVITY LOGS */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Header Title Grid */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display font-black text-3xl text-textPrimary tracking-tight mb-1.5">
                    Activity Logs
                  </h1>
                  <p className="text-sm text-textSecondary max-w-xl">
                    Real-time feed of comment streams, classified intents, and AI actions. Synchronized with database.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Simulation Trigger Button */}
                  <button
                    onClick={() => setShowSimModal(true)}
                    className="px-4 py-2 bg-primary text-background font-display font-bold text-xs tracking-wide rounded-xl shadow-[0_0_10px_rgba(77,255,195,0.2)] hover:shadow-[0_0_15px_rgba(77,255,195,0.4)] transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                  >
                    <Zap size={14} />
                    <span>Simulate Action</span>
                  </button>

                  {/* Force Sync */}
                  <button
                    onClick={() => fetchMessages(true)}
                    className="p-2 border border-border hover:border-primary/50 text-textSecondary hover:text-primary bg-surface/20 rounded-xl transition-all duration-200"
                    title="Force Sync"
                  >
                    <RefreshCw size={14} className={`${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* TABLE CARD */}
              <div className="bg-surface/20 border border-border/40 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                  <div className="p-16 flex flex-col items-center justify-center gap-3">
                    <RefreshCw size={24} className="animate-spin text-primary" />
                    <span className="text-xs font-mono text-textSecondary uppercase tracking-widest">
                      Ingesting Pipeline Records...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-16 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-4">
                    <Activity size={36} className="text-textSecondary/40" />
                    <div>
                      <p className="font-semibold text-textPrimary mb-1">No messages logged yet</p>
                      <p className="text-xs text-textSecondary leading-relaxed">
                        Use the &quot;Simulate Action&quot; button to feed test comments into the AI classifier.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 bg-surface/30 font-mono text-[10px] text-textSecondary uppercase tracking-wider">
                          <th className="px-6 py-4">Platform</th>
                          <th className="px-6 py-4">Sender</th>
                          <th className="px-6 py-4 max-w-[280px]">Content</th>
                          <th className="px-6 py-4">Urgency</th>
                          <th className="px-6 py-4">Intent</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 text-sm">
                        {messages.map((msg) => (
                          <motion.tr
                            key={msg.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setSelectedMessage(msg)}
                            className="hover:bg-surface/40 cursor-pointer transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              {renderPlatformBadge(msg.platform)}
                            </td>
                            <td className="px-6 py-4.5 font-mono text-xs text-textPrimary font-semibold whitespace-nowrap">
                              {msg.author_username}
                            </td>
                            <td className="px-6 py-4.5 max-w-[280px] truncate text-textSecondary group-hover:text-textPrimary transition-colors">
                              {msg.raw_content}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              {renderUrgencyBadge(msg.urgency)}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-surface border border-border/60 text-textSecondary text-[11px] font-mono capitalize">
                                {msg.intent || "unknown"}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              {renderStatusBadge(msg.status)}
                            </td>
                            <td className="px-6 py-4.5 text-xs text-textSecondary font-mono whitespace-nowrap">
                              {getRelativeTime(msg.created_at)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED CHANNELS */}
          {activeTab === "channels" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display font-black text-3xl text-textPrimary tracking-tight mb-1.5">
                  Connected Channels
                </h1>
                <p className="text-sm text-textSecondary max-w-xl">
                  Manage integrations and sync state across social platform APIs. Green pulses indicate an active data webhook.
                </p>
              </div>

              {/* Central Core Connection Graph Mock */}
              <div className="bg-surface/20 border border-border/40 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden h-64 shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,255,195,0.04)_0%,transparent_60%)] pointer-events-none" />
                
                {/* Central Node */}
                <div className="relative w-16 h-16 rounded-full bg-surface border border-primary flex items-center justify-center shadow-[0_0_20px_rgba(77,255,195,0.2)] z-10">
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <path d="M2 17c4-5 16-5 20 0" />
                    <path d="M2 12c3-1 17-1 20 0" />
                  </svg>
                </div>

                <div className="mt-6 text-center z-10">
                  <p className="font-display font-bold text-sm text-textPrimary">TalkBridge AI Dispatcher</p>
                  <p className="font-mono text-[10px] text-textSecondary uppercase tracking-widest mt-1">
                    {Object.values(channels).filter(c => c.connected).length} of 4 channels synced
                  </p>
                </div>

                {/* Simulated Connection Waves */}
                <div className="absolute inset-0 flex items-center justify-center opacity-35 pointer-events-none">
                  <div className="w-48 h-48 rounded-full border border-dashed border-primary/20 animate-[spin_40s_linear_infinite]" />
                  <div className="w-80 h-80 rounded-full border border-dashed border-secondary/20 absolute animate-[spin_60s_linear_infinite]" />
                </div>
              </div>

              {/* CHANNELS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Instagram Channel */}
                <div className={`bg-surface/20 border rounded-2xl p-6 transition-all duration-300 ${
                  channels.instagram.connected ? "border-primary/30 shadow-[0_0_15px_rgba(77,255,195,0.05)]" : "border-border/40"
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-textPrimary">Instagram Professional</h3>
                        <p className="font-mono text-[10px] text-textSecondary uppercase tracking-wider">{channels.instagram.api}</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleChannel("instagram")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        channels.instagram.connected ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform duration-200 ${
                        channels.instagram.connected ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  {channels.instagram.connected ? (
                    <div className="space-y-3 pt-3 border-t border-border/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Synced Account</span>
                        <span className="font-mono font-semibold text-textPrimary">{channels.instagram.username}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Active Endpoint</span>
                        <span className="font-mono text-textPrimary">/webhook/zernio</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-textSecondary italic pt-3 border-t border-border/20">
                      Disconnected. Direct messages and comments will not be routed.
                    </p>
                  )}
                </div>

                {/* TikTok Channel */}
                <div className={`bg-surface/20 border rounded-2xl p-6 transition-all duration-300 ${
                  channels.tiktok.connected ? "border-primary/30 shadow-[0_0_15px_rgba(77,255,195,0.05)]" : "border-border/40"
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-textPrimary">TikTok Business</h3>
                        <p className="font-mono text-[10px] text-textSecondary uppercase tracking-wider">{channels.tiktok.api}</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleChannel("tiktok")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        channels.tiktok.connected ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform duration-200 ${
                        channels.tiktok.connected ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  {channels.tiktok.connected ? (
                    <div className="space-y-3 pt-3 border-t border-border/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Synced Account</span>
                        <span className="font-mono font-semibold text-textPrimary">{channels.tiktok.username}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Active Endpoint</span>
                        <span className="font-mono text-textPrimary">/webhook/tiktok</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-textSecondary italic pt-3 border-t border-border/20">
                      Disconnected. TikTok comment events will be ignored.
                    </p>
                  )}
                </div>

                {/* WhatsApp Channel */}
                <div className={`bg-surface/20 border rounded-2xl p-6 transition-all duration-300 ${
                  channels.whatsapp.connected ? "border-primary/30 shadow-[0_0_15px_rgba(77,255,195,0.05)]" : "border-border/40"
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-textPrimary">WhatsApp Business</h3>
                        <p className="font-mono text-[10px] text-textSecondary uppercase tracking-wider">{channels.whatsapp.api}</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleChannel("whatsapp")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        channels.whatsapp.connected ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform duration-200 ${
                        channels.whatsapp.connected ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  {channels.whatsapp.connected ? (
                    <div className="space-y-3 pt-3 border-t border-border/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Sandbox Number</span>
                        <span className="font-mono font-semibold text-textPrimary">{channels.whatsapp.username}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Gateway status</span>
                        <span className="font-mono text-primary font-bold">Active Connect</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-textSecondary italic pt-3 border-t border-border/20">
                      Sandbox bypass toggle. Flip switch to test dummy WhatsApp message flows.
                    </p>
                  )}
                </div>

                {/* Twilio SMS Channel */}
                <div className={`bg-surface/20 border rounded-2xl p-6 transition-all duration-300 ${
                  channels.sms.connected ? "border-primary/30 shadow-[0_0_15px_rgba(77,255,195,0.05)]" : "border-border/40"
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-textPrimary">Twilio SMS Escaler</h3>
                        <p className="font-mono text-[10px] text-textSecondary uppercase tracking-wider">{channels.sms.api}</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleChannel("sms")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        channels.sms.connected ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform duration-200 ${
                        channels.sms.connected ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  {channels.sms.connected ? (
                    <div className="space-y-3 pt-3 border-t border-border/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Escalation Agent Number</span>
                        <span className="font-mono font-semibold text-textPrimary">{channels.sms.username}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-textSecondary">Twilio SID Output</span>
                        <span className="font-mono text-textPrimary">Verified (Trial Account Link)</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-textSecondary italic pt-3 border-t border-border/20">
                      SMS Escalations disabled. High urgency messages will NOT trigger text alerts.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING TIERS */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h1 className="font-display font-black text-3xl text-textPrimary tracking-tight">
                  Pricing & Subscriptions
                </h1>
                <p className="text-sm text-textSecondary">
                  Deploy dedicated AI agents to your social channels. Upgrade your limits to handle high engagement volume.
                </p>

                {/* Period Selector Toggle */}
                <div className="inline-flex items-center p-1 bg-surface/80 border border-border/60 rounded-full">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      billingPeriod === "monthly" ? "bg-primary text-background" : "text-textSecondary"
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => setBillingPeriod("annually")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      billingPeriod === "annually" ? "bg-primary text-background" : "text-textSecondary"
                    }`}
                  >
                    Annually (Save 20%)
                  </button>
                </div>
              </div>

              {/* CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-8">
                {/* Plan 1: Starter */}
                <div className="bg-surface/20 border border-border/40 rounded-2xl p-6 flex flex-col justify-between hover:border-border/80 transition-all duration-200 relative">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-textPrimary">Starter</h3>
                      <p className="text-xs text-textSecondary mt-1">Ideal for personal brands & small creators.</p>
                    </div>

                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-textPrimary">
                        {billingPeriod === "monthly" ? "$29" : "$23"}
                      </span>
                      <span className="text-textSecondary text-xs">/mo</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-textSecondary pt-4 border-t border-border/15">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>1,000 processed comments/mo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>2 Connected Channels (IG, TikTok)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Basic Intent Classifier (Gemini Lite)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Email Support (24h SLA)</span>
                      </li>
                    </ul>
                  </div>

                  <button className="w-full mt-8 py-2.5 px-4 bg-surface hover:bg-surface/80 border border-border rounded-xl text-xs font-semibold text-textPrimary transition-all duration-200">
                    Current Plan (Sandbox)
                  </button>
                </div>

                {/* Plan 2: Pro */}
                <div className="bg-surface/40 border-2 border-primary rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative shadow-[0_0_25px_rgba(77,255,195,0.06)]">
                  {/* Popular tag */}
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-background font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Most Popular
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-textPrimary">Professional</h3>
                      <p className="text-xs text-textSecondary mt-1">Perfect for scaling business profiles.</p>
                    </div>

                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-textPrimary">
                        {billingPeriod === "monthly" ? "$79" : "$63"}
                      </span>
                      <span className="text-textSecondary text-xs">/mo</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-textSecondary pt-4 border-t border-border/15">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span className="text-textPrimary font-medium">10,000 processed comments/mo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span className="text-textPrimary font-medium">All 4 Channels Unified</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Advanced Gemini Tone Tuning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span className="text-textPrimary font-medium">Twilio SMS Escalation Routing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Priority support (1h SLA)</span>
                      </li>
                    </ul>
                  </div>

                  <button className="w-full mt-8 py-2.5 px-4 bg-primary text-background font-display font-bold text-xs tracking-wide rounded-xl shadow-[0_0_15px_rgba(77,255,195,0.2)] hover:shadow-[0_0_20px_rgba(77,255,195,0.4)] transition-all duration-300 hover:scale-[1.01]">
                    Upgrade to Professional
                  </button>
                </div>

                {/* Plan 3: Enterprise */}
                <div className="bg-surface/20 border border-border/40 rounded-2xl p-6 flex flex-col justify-between hover:border-border/80 transition-all duration-200 relative">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-textPrimary">Enterprise</h3>
                      <p className="text-xs text-textSecondary mt-1">For corporate teams and agencies.</p>
                    </div>

                    <div className="pt-2">
                      <span className="font-display font-black text-4xl text-textPrimary">Custom</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-textSecondary pt-4 border-t border-border/15">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Unlimited message volume</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Dedicated Gemini fine-tuned nodes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Custom SMS webhook thresholds</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-primary" />
                        <span>Dedicated Account Manager & SLA</span>
                      </li>
                    </ul>
                  </div>

                  <button className="w-full mt-8 py-2.5 px-4 bg-surface hover:bg-surface/80 border border-border rounded-xl text-xs font-semibold text-textPrimary transition-all duration-200">
                    Contact Enterprise Sales
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="font-display font-black text-3xl text-textPrimary tracking-tight mb-1.5">
                  System Settings
                </h1>
                <p className="text-sm text-textSecondary">
                  Configure API endpoints, Gemini model prompts, and automation escalation rules.
                </p>
              </div>

              {/* TOAST NOTIFICATION */}
              <AnimatePresence>
                {showSaveToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-background px-4 py-3 rounded-xl font-display font-bold text-xs tracking-wide shadow-lg"
                  >
                    <CheckCircle size={16} />
                    <span>Configuration saved successfully.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SETTINGS FORM */}
              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* 1. Public Webhook Url Section */}
                <div className="bg-surface/20 border border-border/40 rounded-2xl p-6 space-y-4">
                  <div className="flex gap-2.5 items-start">
                    <Sliders className="text-primary shrink-0 mt-0.5" size={18} />
                    <div>
                      <h3 className="font-display font-bold text-sm text-textPrimary">Public Webhook Receiver</h3>
                      <p className="text-xs text-textSecondary mt-0.5">
                        Provide this URL on the Zernio dashboard to route Instagram comment events to your backend.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-grow px-4 py-2.5 bg-background/60 border border-border/80 rounded-xl text-xs font-mono text-textPrimary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyWebhookToClipboard}
                      className="px-4 bg-surface border border-border hover:border-primary/50 text-textSecondary hover:text-primary transition-all duration-200 rounded-xl text-xs font-semibold flex items-center gap-2"
                    >
                      {copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedWebhook ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* 2. AI Prompt and Escalation Parameters */}
                <div className="bg-surface/20 border border-border/40 rounded-2xl p-6 space-y-5">
                  <div className="flex gap-2.5 items-start">
                    <Shield className="text-primary shrink-0 mt-0.5" size={18} />
                    <div>
                      <h3 className="font-display font-bold text-sm text-textPrimary">Agent Parameters & Keys</h3>
                      <p className="text-xs text-textSecondary mt-0.5">
                        Tune classifier criteria, API credentials, and agent persona.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Gemini Key */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">
                        Gemini Model API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showGeminiKey ? "text" : "password"}
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 bg-background/60 border border-border/80 rounded-xl text-xs font-mono focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-textSecondary hover:text-textPrimary"
                        >
                          {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Tone Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">
                        AI Agent Tone Profile
                      </label>
                      <select
                        value={toneOfVoice}
                        onChange={(e) => setToneOfVoice(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background/60 border border-border/80 rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                      >
                        <option value="professional">Professional & Technical</option>
                        <option value="casual">Casual & Friendly</option>
                        <option value="enthusiastic">Enthusiastic & Hype</option>
                        <option value="empathetic">Empathetic & Supportive</option>
                      </select>
                    </div>
                  </div>

                  {/* Escalation Slider */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-mono tracking-wider uppercase text-textSecondary">
                        SMS Escalation Threshold
                      </label>
                      <span className="font-mono text-primary font-bold">Urgency &gt;= {escalationThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={escalationThreshold}
                      onChange={(e) => setEscalationThreshold(Number(e.target.value))}
                      className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-textSecondary/60 font-mono">
                      <span>1 (Auto reply all)</span>
                      <span>5 (Moderate)</span>
                      <span>10 (Never escalate)</span>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-background font-display font-bold text-xs tracking-wide rounded-xl shadow-[0_0_15px_rgba(77,255,195,0.2)] hover:shadow-[0_0_20px_rgba(77,255,195,0.4)] transition-all duration-300 hover:scale-[1.01]"
                >
                  Save System Settings
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* 3. INTERACTIVE SIMULATOR MODAL */}
      <AnimatePresence>
        {showSimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
              className="bg-surface/90 border border-border/80 rounded-2xl max-w-md w-full p-6 relative shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSimModal(false)}
                className="absolute top-4 right-4 text-textSecondary hover:text-textPrimary transition-colors"
              >
                <X size={18} />
              </button>

              {/* Title */}
              <div className="flex items-center gap-2.5 mb-5 border-b border-border/40 pb-3">
                <Zap className="text-primary" size={20} />
                <div>
                  <h3 className="font-display font-bold text-lg text-textPrimary">Simulate Inbox Input</h3>
                  <p className="text-xs text-textSecondary">Manually inject a message events feed into the pipeline.</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSimulate} className="space-y-4">
                {/* Platform Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">Platform Channel</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["tiktok", "instagram", "whatsapp", "sms"].map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setSimPlatform(plat)}
                        className={`py-2 text-[10px] font-mono rounded-lg border capitalize font-semibold transition-all duration-150 ${
                          simPlatform === plat
                            ? "bg-primary/15 text-primary border-primary"
                            : "bg-background/40 text-textSecondary border-border/80 hover:bg-surface"
                        }`}
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">Sender Username / ID</label>
                  <input
                    type="text"
                    required
                    value={simUsername}
                    onChange={(e) => setSimUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-background/60 border border-border/80 rounded-xl text-xs focus:outline-none focus:border-primary"
                    placeholder="e.g. fashion_maven"
                  />
                </div>

                {/* Message Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">Raw Message Content</label>
                  <textarea
                    required
                    rows={3}
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-background/60 border border-border/80 rounded-xl text-xs focus:outline-none focus:border-primary resize-none"
                    placeholder="Type comments to test classification: e.g., 'Do you ship to Red? urgent!' or 'Bitcoin free money!'"
                  />
                </div>

                {/* Scenario Hint */}
                <div className="p-3 bg-surface/80 border border-border/60 rounded-xl flex gap-2 items-start text-[10px] text-textSecondary">
                  <HelpCircle className="text-primary shrink-0 mt-0.5" size={14} />
                  <p>
                    <span className="font-semibold text-textPrimary">Demo Guide:</span> Type <code className="text-primary font-bold font-mono">urgent</code> or <code className="text-primary font-bold font-mono">scam</code> to force Twilio escalations. Type <code className="text-primary font-bold font-mono">bitcoin</code> to trigger spam filters.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full py-3 px-4 mt-2 bg-primary text-background font-display font-bold text-xs tracking-wide rounded-xl shadow-[0_0_15px_rgba(77,255,195,0.2)] hover:shadow-[0_0_20px_rgba(77,255,195,0.4)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-80"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      <span>Running Pipeline Analysis...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Inject Simulator Stream</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DETAIL OVERLAY SLIDE-OUT PANEL */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
            {/* Click outside background */}
            <div onClick={() => setSelectedMessage(null)} className="absolute inset-0" />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35 }}
              className="relative w-full max-w-md md:max-w-lg bg-surface border-l border-border/60 h-full flex flex-col justify-between shadow-2xl z-10"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-border/40 flex justify-between items-center bg-surface/30">
                <div className="flex items-center gap-3">
                  {renderPlatformBadge(selectedMessage.platform)}
                  <span className="font-mono text-xs text-textSecondary">
                    ID: {selectedMessage.channel_message_id || selectedMessage.id.substring(0, 8)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 text-textSecondary hover:text-textPrimary hover:bg-surface/50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* Sender card */}
                <div className="flex items-center gap-3 p-4 bg-background/40 border border-border/60 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono">
                    {selectedMessage.author_username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold text-textPrimary">@{selectedMessage.author_username}</p>
                    <p className="text-[10px] text-textSecondary font-mono">{getRelativeTime(selectedMessage.created_at)}</p>
                  </div>
                </div>

                {/* Raw Content */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">Raw User Message</label>
                  <div className="p-4 bg-background/60 border border-border/40 rounded-xl text-sm leading-relaxed text-textPrimary font-body">
                    &quot;{selectedMessage.raw_content}&quot;
                  </div>
                </div>

                {/* AI Analysis Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">Gemini Pipeline Analysis</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-background/30 border border-border/30 rounded-xl text-center">
                      <p className="text-[10px] font-mono text-textSecondary uppercase tracking-wider mb-1">Intent Category</p>
                      <p className="font-mono font-bold text-sm text-primary capitalize">{selectedMessage.intent || "unknown"}</p>
                    </div>
                    <div className="p-3.5 bg-background/30 border border-border/30 rounded-xl text-center">
                      <p className="text-[10px] font-mono text-textSecondary uppercase tracking-wider mb-1">Urgency Priority</p>
                      <div className="flex items-center justify-center gap-1.5">
                        {renderUrgencyBadge(selectedMessage.urgency)}
                      </div>
                    </div>
                    <div className="p-3.5 bg-background/30 border border-border/30 rounded-xl text-center">
                      <p className="text-[10px] font-mono text-textSecondary uppercase tracking-wider mb-1">Sentiment</p>
                      <p className="font-mono font-bold text-xs text-textPrimary capitalize">{selectedMessage.sentiment || "neutral"}</p>
                    </div>
                    <div className="p-3.5 bg-background/30 border border-border/30 rounded-xl text-center">
                      <p className="text-[10px] font-mono text-textSecondary uppercase tracking-wider mb-1">Language</p>
                      <p className="font-mono font-bold text-xs text-textPrimary capitalize">{selectedMessage.language || "english"}</p>
                    </div>
                  </div>
                </div>

                {/* AI response draft */}
                {selectedMessage.status !== "human_reviewed" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">AI Response Suggestion</label>
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-mono font-bold">
                        Auto-Drafted
                      </span>
                    </div>
                    <div className="p-4 bg-surface/80 border-2 border-primary/20 rounded-xl text-sm leading-relaxed text-textPrimary font-body relative">
                      {selectedMessage.ai_reply ? (
                        <span>&quot;{selectedMessage.ai_reply}&quot;</span>
                      ) : (
                        <span className="text-textSecondary italic text-xs">No reply drafted. Message was classified as low priority or spam.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Dispatch details */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">Routing Action Logs</label>
                  <div className="p-4 bg-background/30 border border-border/40 rounded-xl text-xs space-y-2.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Pipeline Result:</span>
                      <span className="text-textPrimary font-semibold">{selectedMessage.status.toUpperCase()}</span>
                    </div>
                    {selectedMessage.status === "escalated" && (
                      <div className="flex justify-between">
                        <span className="text-textSecondary">Notification Sid:</span>
                        <span className="text-amber-400">twilio_agent_alert_sent</span>
                      </div>
                    )}
                    {selectedMessage.status === "auto_replied" && (
                      <div className="flex justify-between">
                        <span className="text-textSecondary">Zernio Post Ref:</span>
                        <span className="text-primary font-bold">auto_resolved</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Record Index ID:</span>
                      <span className="text-textSecondary truncate max-w-[200px]">{selectedMessage.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-border/40 bg-surface/30">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="w-full py-3 bg-surface border border-border hover:border-primary text-textPrimary hover:text-primary font-display font-bold text-xs tracking-wide rounded-xl transition-all duration-200"
                >
                  Dismiss Activity Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
