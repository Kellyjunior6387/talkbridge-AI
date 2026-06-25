"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface MessageItem {
  id: string;
  platform: "TikTok" | "Instagram" | "WhatsApp" | "SMS";
  platformColor: string;
  sender: string;
  text: string;
  time: string;
  replyText: string;
  status: "Sent" | "Escalated";
  statusText: string;
}

const MESSAGES_DATA: MessageItem[] = [
  {
    id: "msg-1",
    platform: "TikTok",
    platformColor: "#FF0050",
    sender: "@hypebeast_ke",
    text: "this hoodie goes HARD 🔥",
    time: "just now",
    replyText: "Thanks for the support! ⚡ Drop by our store next week for the custom drops.",
    status: "Sent",
    statusText: "✓ Sent",
  },
  {
    id: "msg-2",
    platform: "Instagram",
    platformColor: "#E1306C",
    sender: "@mariam.mwangi",
    text: "where is my order??",
    time: "1m ago",
    replyText: "Hi Mariam! Let me look up your order status. Can you DM your order number?",
    status: "Sent",
    statusText: "✓ Sent",
  },
  {
    id: "msg-3",
    platform: "WhatsApp",
    platformColor: "#25D366",
    sender: "+254 712 345678",
    text: "do you ship to Uganda?",
    time: "2m ago",
    replyText: "Yes, we ship to Kampala and Entebbe weekly! Rates start at KES 1,200.",
    status: "Sent",
    statusText: "✓ Sent",
  },
  {
    id: "msg-4",
    platform: "SMS",
    platformColor: "#4DFFC3",
    sender: "+254 799 888111",
    text: "complained 3x no response. refund me now",
    time: "3m ago",
    replyText: "High urgency detected. Order flagged and escalated to store manager for immediate refund.",
    status: "Escalated",
    statusText: "⚠ Escalated",
  },
  {
    id: "msg-5",
    platform: "Instagram",
    platformColor: "#E1306C",
    sender: "@juma_brands",
    text: "Are you open on Sundays?",
    time: "4m ago",
    replyText: "Yes, our physical hub is open on Sundays from 10 AM to 4 PM!",
    status: "Sent",
    statusText: "✓ Sent",
  },
  {
    id: "msg-6",
    platform: "TikTok",
    platformColor: "#FF0050",
    sender: "@dancetrends",
    text: "is the black tee restocked?",
    time: "5m ago",
    replyText: "Restocking next Friday! Sign up on our site to get notified first.",
    status: "Sent",
    statusText: "✓ Sent",
  },
  {
    id: "msg-7",
    platform: "WhatsApp",
    platformColor: "#25D366",
    sender: "+256 701 555222",
    text: "Your payment link is failing",
    time: "6m ago",
    replyText: "Payment issue flagged. Connecting you with a live billing specialist right away.",
    status: "Escalated",
    statusText: "⚠ Escalated",
  },
  {
    id: "msg-8",
    platform: "SMS",
    platformColor: "#4DFFC3",
    sender: "+254 722 111222",
    text: "Thanks for the fast delivery!",
    time: "7m ago",
    replyText: "Awesome to hear! We appreciate your business. Let us know if you need anything else.",
    status: "Sent",
    statusText: "✓ Sent",
  },
];

export default function MessageStream() {
  const [incoming, setIncoming] = useState<MessageItem[]>([]);
  const [replies, setReplies] = useState<MessageItem[]>([]);
  const [aiStatus, setAiStatus] = useState<"Classifying..." | "Drafting..." | "Routing..." | "Idle">("Idle");
  const currentIndexRef = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  // Platform Icons SVGs
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "TikTok":
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#FF0050]" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.17 1.12 1.25 2.7 2.06 4.37 2.29v3.76a8.877 8.877 0 0 1-5.26-1.8c-.19-.16-.38-.34-.55-.53v6.78c.02 4.11-2.87 7.77-6.88 8.65-4.44.97-8.93-1.68-9.97-6.08a8.86 8.86 0 0 1 5.92-10.5c.23-.07.47-.12.7-.18v3.77a5.1 5.1 0 0 0-3.32 4.88c-.08 3.09 2.55 5.67 5.66 5.58 2.81-.08 5.13-2.24 5.24-5.05L12.5 0h.025z" />
          </svg>
        );
      case "Instagram":
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#E1306C]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        );
      case "WhatsApp":
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#25D366]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        );
      case "SMS":
      default:
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#4DFFC3]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
    }
  };

  useEffect(() => {
    // Seed initial messages to make it look full right away
    setIncoming([
      { ...MESSAGES_DATA[4], id: "seed-1" },
      { ...MESSAGES_DATA[5], id: "seed-2" },
      { ...MESSAGES_DATA[6], id: "seed-3" },
    ]);
    setReplies([
      { ...MESSAGES_DATA[4], id: "seed-reply-1" },
      { ...MESSAGES_DATA[5], id: "seed-reply-2" },
    ]);

    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current;
      const nextMsg = { ...MESSAGES_DATA[nextIndex], id: `incoming-${Date.now()}` };
      
      // Step 1: Slide in the incoming message card
      setIncoming((prev) => {
        const updated = [...prev, nextMsg];
        if (updated.length > 3) updated.shift();
        return updated;
      });

      // Step 2: Cycle AI Node status
      setAiStatus("Classifying...");
      
      const draftTimeout = setTimeout(() => {
        setAiStatus("Drafting...");
      }, 700);

      const routeTimeout = setTimeout(() => {
        setAiStatus("Routing...");
      }, 1400);

      // Step 3: Slide out the replies card
      const replyTimeout = setTimeout(() => {
        setReplies((prev) => {
          const updated = [...prev, { ...nextMsg, id: `reply-${Date.now()}` }];
          if (updated.length > 3) updated.shift();
          return updated;
        });
        setAiStatus("Idle");
      }, 2000);

      currentIndexRef.current = (currentIndexRef.current + 1) % MESSAGES_DATA.length;

      return () => {
        clearTimeout(draftTimeout);
        clearTimeout(routeTimeout);
        clearTimeout(replyTimeout);
      };
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full py-8 md:py-12">
      {/* Background SVG Flow Lines (Desktop Only) */}
      <div className="absolute inset-0 w-full h-full hidden md:block pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 800 400" fill="none">
          {/* Incoming column bounding box center is roughly x=180, y=200 */}
          {/* AI node is at x=400, y=200 */}
          {/* Replies column bounding box center is roughly x=620, y=200 */}
          
          {/* Line Left to Center */}
          <path
            d="M 220,180 Q 310,180 370,195"
            stroke="#1C2640"
            strokeWidth="1.5"
          />
          <path
            d="M 220,200 H 370"
            stroke="#1C2640"
            strokeWidth="1.5"
          />
          <path
            d="M 220,220 Q 310,220 370,205"
            stroke="#1C2640"
            strokeWidth="1.5"
          />
          {/* Glowing Animated Dash Flow (Left to Center) */}
          <path
            d="M 220,200 H 370"
            stroke="#4DFFC3"
            strokeWidth="2.5"
            className="animate-dash-flow opacity-80"
          />

          {/* Line Center to Right */}
          <path
            d="M 430,195 Q 490,180 580,180"
            stroke="#1C2640"
            strokeWidth="1.5"
          />
          <path
            d="M 430,200 H 580"
            stroke="#1C2640"
            strokeWidth="1.5"
          />
          <path
            d="M 430,205 Q 490,220 580,220"
            stroke="#1C2640"
            strokeWidth="1.5"
          />
          {/* Glowing Animated Dash Flow (Center to Right) */}
          <path
            d="M 430,200 H 580"
            stroke="#7B6EF6"
            strokeWidth="2.5"
            className="animate-dash-flow opacity-80"
          />
        </svg>
      </div>

      {/* Desktop Version: Three Columns */}
      <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-6 max-w-5xl mx-auto relative z-10">
        {/* COLUMN 1: INCOMING */}
        <div className="flex flex-col gap-4 items-end w-full">
          <div className="font-mono text-[11px] tracking-wider text-textSecondary uppercase mb-1 mr-4">
            ● Incoming Channels
          </div>
          <div className="flex flex-col gap-3.5 w-full max-w-[320px]">
            <AnimatePresence mode="popLayout">
              {incoming.map((item) => (
                <motion.div
                  key={item.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -30, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-surface border border-border/80 rounded-xl p-4 flex flex-col gap-2 relative shadow-md"
                  style={{ borderLeft: `4px solid ${item.platformColor}` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-background border border-border">
                        {getPlatformIcon(item.platform)}
                      </div>
                      <span className="font-mono text-xs font-semibold text-textPrimary">
                        {item.sender}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-textSecondary">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-sm text-textPrimary leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 2: AI CENTER NODE */}
        <div className="flex flex-col items-center justify-center px-4 w-[160px]">
          <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
            {/* Glowing Rings */}
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-primary/20 rounded-full animate-pulse-ring" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-primary/10 rounded-full animate-pulse-ring" style={{ animationDelay: "1.2s" }} />

            {/* Central Node */}
            <div className="relative w-16 h-16 rounded-full bg-surface border-2 border-primary flex items-center justify-center shadow-[0_0_25px_rgba(77,255,195,0.4)] z-20">
              <span className="font-display font-black text-xl text-primary tracking-wider">
                AI
              </span>
            </div>
          </div>

          {/* Status Label */}
          <div className="h-6 flex items-center">
            <AnimatePresence mode="wait">
              {aiStatus !== "Idle" ? (
                <motion.span
                  key={aiStatus}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    aiStatus === "Classifying..."
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : aiStatus === "Drafting..."
                      ? "border-secondary/30 bg-secondary/10 text-secondary"
                      : "border-primary/30 bg-primary/10 text-primary animate-pulse"
                  }`}
                >
                  {aiStatus}
                </motion.span>
              ) : (
                <span className="font-mono text-xs text-textSecondary opacity-40">
                  Listening...
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 3: REPLIES */}
        <div className="flex flex-col gap-4 items-start w-full">
          <div className="font-mono text-[11px] tracking-wider text-textSecondary uppercase mb-1 ml-4">
            ● Intelligent Actions
          </div>
          <div className="flex flex-col gap-3.5 w-full max-w-[320px]">
            <AnimatePresence mode="popLayout">
              {replies.map((item) => (
                <motion.div
                  key={item.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 30, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-surface border border-border/80 rounded-xl p-4 flex flex-col gap-2 relative shadow-md w-full"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="p-0.5 rounded bg-background border border-border">
                        {getPlatformIcon(item.platform)}
                      </div>
                      <span className="font-mono text-[10px] text-textSecondary">
                        AI response to {item.sender}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <span
                      className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === "Sent"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-danger/30 bg-danger/10 text-danger"
                      }`}
                    >
                      {item.statusText}
                    </span>
                  </div>
                  <p className="text-xs text-textSecondary italic leading-relaxed bg-background/50 p-2.5 rounded border border-border/40">
                    &ldquo;{item.replyText}&rdquo;
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Version: Single Column Card Feed */}
      <div className="md:hidden flex flex-col gap-5 max-w-md mx-auto px-2">
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-1">
          <span className="font-mono text-xs text-textSecondary uppercase tracking-wider">
            Live Stream Feed
          </span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-mono text-[10px] text-primary font-bold">
              AI ACTIVE
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 relative min-h-[360px]">
          <AnimatePresence mode="popLayout">
            {incoming.map((item) => {

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 shadow-md"
                  style={{ borderLeft: `4px solid ${item.platformColor}` }}
                >
                  {/* Incoming Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-background border border-border">
                        {getPlatformIcon(item.platform)}
                      </div>
                      <span className="font-mono text-xs font-semibold text-textPrimary">
                        {item.sender}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-textSecondary">
                      INCOMING
                    </span>
                  </div>
                  
                  <p className="text-sm text-textPrimary leading-relaxed font-body">
                    {item.text}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-border/40 my-1" />

                  {/* AI Response Section */}
                  <div className="flex flex-col gap-2 bg-background/55 p-3 rounded-lg border border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-primary font-bold">
                        TalkBridge AI REPLY
                      </span>
                      <span
                        className={`font-mono text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === "Sent"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-danger/30 bg-danger/10 text-danger"
                        }`}
                      >
                        {item.statusText}
                      </span>
                    </div>
                    <p className="text-xs text-textSecondary italic leading-relaxed">
                      &ldquo;{item.replyText}&rdquo;
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
