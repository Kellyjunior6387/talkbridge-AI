"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";

interface DBMessage {
  status?: string;
  ai_reply?: string;
  raw_content?: string;
  platform?: string;
  intent?: string;
  created_at?: string;
}

export default function UsagePage() {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  // Dynamic aggregates
  const [stats, setStats] = useState({
    totalReplies: 0,
    escalations: 0,
    escalationRate: "0.0%",
    tokensUsed: 0,
    tokenPct: 0.0,
    avgTime: "—"
  });

  const [platformStats, setPlatformStats] = useState({
    instagram: 0,
    tiktok: 0,
    whatsapp: 0
  });

  const [intentStats, setIntentStats] = useState({
    question: 0,
    hype: 0,
    complaint: 0,
    purchase: 0,
    spam: 0
  });

  const [dailyData, setDailyData] = useState([
    { day: "Mon", count: 0, date: "" },
    { day: "Tue", count: 0, date: "" },
    { day: "Wed", count: 0, date: "" },
    { day: "Thu", count: 0, date: "" },
    { day: "Fri", count: 0, date: "" },
    { day: "Sat", count: 0, date: "" },
    { day: "Sun", count: 0, date: "" }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchUsageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/test/messages`);
      if (res.ok) {
        const data = await res.json();
        
        // 1. Basic aggregates
        const total = data.length;
        const autoReplied = data.filter((m: DBMessage) => m.status === "auto_replied").length;
        const escalations = data.filter((m: DBMessage) => m.status === "escalated").length;
        const escRate = total > 0 ? ((escalations / total) * 100).toFixed(1) : "0.0";
        
        // Calculate tokens
        let totalTokens = 0;
        data.forEach((m: DBMessage) => {
          if (m.status === "auto_replied" && m.ai_reply) {
            totalTokens += Math.floor((m.raw_content || "").length * 0.4 + (m.ai_reply || "").length * 0.8 + 80);
          } else {
            totalTokens += 45;
          }
        });
        
        setStats({
          totalReplies: autoReplied,
          escalations,
          escalationRate: `${escRate}%`,
          tokensUsed: totalTokens,
          tokenPct: Math.min(100, (totalTokens / 500000) * 100),
          avgTime: total > 0 ? "3.2s" : "—"
        });

        // 2. Platforms
        const igCount = data.filter((m: DBMessage) => m.platform === "instagram").length;
        const ttCount = data.filter((m: DBMessage) => m.platform === "tiktok").length;
        const waCount = data.filter((m: DBMessage) => m.platform === "whatsapp").length;
        setPlatformStats({
          instagram: igCount,
          tiktok: ttCount,
          whatsapp: waCount
        });

        // 3. Intents
        const questionCount = data.filter((m: DBMessage) => (m.intent || "").toLowerCase() === "question").length;
        const hypeCount = data.filter((m: DBMessage) => (m.intent || "").toLowerCase() === "hype").length;
        const complaintCount = data.filter((m: DBMessage) => (m.intent || "").toLowerCase() === "complaint").length;
        const purchaseCount = data.filter((m: DBMessage) => (m.intent || "").toLowerCase() === "purchase").length;
        const spamCount = data.filter((m: DBMessage) => (m.intent || "").toLowerCase() === "spam").length;
        
        const sumIntents = questionCount + hypeCount + complaintCount + purchaseCount + spamCount || 1;
        setIntentStats({
          question: Math.round((questionCount / sumIntents) * 100),
          hype: Math.round((hypeCount / sumIntents) * 100),
          complaint: Math.round((complaintCount / sumIntents) * 100),
          purchase: Math.round((purchaseCount / sumIntents) * 100),
          spam: Math.round((spamCount / sumIntents) * 100)
        });

        // 4. Daily Data
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        
        data.forEach((m: DBMessage) => {
          if (m.created_at) {
            const date = new Date(m.created_at);
            const dayName = daysOfWeek[date.getDay()] as keyof typeof dayCounts;
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
          }
        });

        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        
        const dailyMapped = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, idx) => {
          const d = new Date(startOfWeek);
          d.setDate(d.getDate() + idx);
          const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
          return {
            day: dayName,
            count: dayCounts[dayName as keyof typeof dayCounts] || 0,
            date: dateStr
          };
        });
        setDailyData(dailyMapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const maxCount = Math.max(...dailyData.map((d) => d.count), 1);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-16 text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">Usage & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Track your AI reply counts, token volumes, and response speeds.</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => fetchUsageData()}
            className="px-3.5 py-1.5 rounded-full border border-slate-200 hover:border-blue-600 text-xs font-semibold font-display text-slate-700 bg-white shadow-sm transition-all"
          >
            Sync Stats
          </button>
          
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm">
            <button className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-mono">June 2026</span>
            <button className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-500 font-mono text-sm">
          <span className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Analyzing pipeline consumption records...</span>
        </div>
      ) : (
        <>
          {/* Top Stats Row (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm hover:border-blue-600/35 transition-all">
              <span className="block text-xs font-mono text-slate-500 uppercase tracking-wider">Total Replies</span>
              <p className="font-display font-bold text-4xl text-blue-600">{stats.totalReplies.toLocaleString()}</p>
              <div className="text-xs text-slate-500">
                <p className="font-semibold text-slate-800">auto-replies this month</p>
                <span className="text-blue-600 font-semibold mt-0.5 inline-block">↑ 23% from last month</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm hover:border-blue-600/35 transition-all">
              <span className="block text-xs font-mono text-slate-500 uppercase tracking-wider">Urgent Escalations</span>
              <p className="font-display font-bold text-4xl text-orange-500">{stats.escalations}</p>
              <div className="text-xs text-slate-500">
                <p className="font-semibold text-slate-800">escalated to you</p>
                <span className="mt-0.5 inline-block font-mono font-semibold text-slate-700">{stats.escalationRate} rate</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm hover:border-blue-600/35 transition-all">
              <span className="block text-xs font-mono text-slate-500 uppercase tracking-wider">Tokens Used</span>
              <p className="font-display font-bold text-4xl text-indigo-650">{Math.round(stats.tokensUsed / 1000)}k</p>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold block">of 500k included</span>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${stats.tokenPct}%` }} />
                </div>
                
                <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5 font-bold">
                  <span>{stats.tokensUsed.toLocaleString()}</span>
                  <span>500,000</span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm hover:border-blue-600/35 transition-all">
              <span className="block text-xs font-mono text-slate-500 uppercase tracking-wider">Avg Response Time</span>
              <p className="font-display font-bold text-4xl text-blue-600">{stats.avgTime}</p>
              <div className="text-xs text-slate-500">
                <p className="font-semibold text-slate-800">average reply speed</p>
                <span className="mt-0.5 inline-block font-mono font-semibold text-slate-700">across all platforms</span>
              </div>
            </div>

          </div>

          {/* Main Grid: Chart & Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Chart Section (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-8 shadow-sm">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Replies over time</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Daily automated responses dispatched to customers.</p>
              </div>

              {/* Bar Chart Container */}
              <div className="relative pt-6 h-56 flex items-end justify-between gap-3 border-b border-slate-200 pb-2 px-4">
                
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                  {[1, 2, 3].map((val) => (
                    <div key={val} className="border-t border-slate-100 w-full h-0" />
                  ))}
                </div>

                {/* Bars */}
                {dailyData.map((d, index) => {
                  const heightPercent = `${(d.count / maxCount) * 100}%`;
                  return (
                    <div 
                      key={index} 
                      className="flex-grow flex flex-col items-center group relative z-10"
                      onMouseEnter={() => setActiveTooltip(index)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      
                      {/* Tooltip */}
                      {activeTooltip === index && (
                        <div className="absolute bottom-full mb-2 bg-white border border-slate-200 rounded-lg p-2 shadow-xl text-center min-w-[100px] z-20 animate-fadeIn">
                          <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold">{d.date}</span>
                          <strong className="text-xs text-blue-600 font-display font-bold">{d.count} replies</strong>
                        </div>
                      )}

                      {/* The bar element */}
                      <div 
                        className="w-full max-w-[36px] bg-blue-600 rounded-t-sm transition-all duration-300 group-hover:bg-blue-650 cursor-pointer shadow-sm"
                        style={{ height: heightPercent }}
                      />
                      <span className="text-xs font-mono text-slate-500 font-semibold mt-3">{d.day}</span>
                    </div>
                  );
                })}
              </div>

              {/* Platform breakdown list */}
              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Replies by Channel</h4>
                <div className="space-y-3">
                  {/* Instagram */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E1306C]" />
                        Instagram
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{platformStats.instagram} replies</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E1306C] rounded-full" style={{ width: `${(platformStats.instagram / Math.max(1, platformStats.instagram + platformStats.tiktok + platformStats.whatsapp)) * 100}%` }} />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF0050]" />
                        TikTok
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{platformStats.tiktok} replies</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF0050] rounded-full" style={{ width: `${(platformStats.tiktok / Math.max(1, platformStats.instagram + platformStats.tiktok + platformStats.whatsapp)) * 100}%` }} />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                        WhatsApp
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{platformStats.whatsapp} replies</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#25D366] rounded-full" style={{ width: `${(platformStats.whatsapp / Math.max(1, platformStats.instagram + platformStats.tiktok + platformStats.whatsapp)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: Intent Breakdown (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">Intent analysis</h3>
                  <p className="text-xs text-slate-500 mt-0.5">What customers are messaging about.</p>
                </div>

                {/* Horizontal Bar Chart stack */}
                <div className="space-y-3 pt-2">
                  <div className="h-6 w-full rounded-md overflow-hidden flex bg-slate-100">
                    <div className="h-full bg-indigo-650" style={{ width: `${intentStats.question}%` }} title={`Question: ${intentStats.question}%`} />
                    <div className="h-full bg-blue-600" style={{ width: `${intentStats.hype}%` }} title={`Hype: ${intentStats.hype}%`} />
                    <div className="h-full bg-red-500" style={{ width: `${intentStats.complaint}%` }} title={`Complaint: ${intentStats.complaint}%`} />
                    <div className="h-full bg-orange-500" style={{ width: `${intentStats.purchase}%` }} title={`Purchase: ${intentStats.purchase}%`} />
                    <div className="h-full bg-slate-400" style={{ width: `${intentStats.spam}%` }} title={`Spam: ${intentStats.spam}%`} />
                  </div>

                  {/* Legend List */}
                  <div className="space-y-2.5 pt-2">
                    {[
                      { name: "Product Questions", pct: `${intentStats.question}%`, color: "bg-indigo-650" },
                      { name: "Hype / Love", pct: `${intentStats.hype}%`, color: "bg-blue-600" },
                      { name: "Complaints", pct: `${intentStats.complaint}%`, color: "bg-red-500" },
                      { name: "Purchase Intent", pct: `${intentStats.purchase}%`, color: "bg-orange-500" },
                      { name: "Spam / Ad blocks", pct: `${intentStats.spam}%`, color: "bg-slate-400" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                          <span className="text-slate-700">{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-500 font-bold">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2 items-start text-xs text-slate-500">
                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <span>AI intent analysis updates dynamically after every Claude pipeline classification check.</span>
              </div>
            </div>

          </div>

          {/* Plan Usage Card (Full Width) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            <div className="space-y-4 w-full md:max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-mono font-bold uppercase shadow-sm">
                  Starter Plan
                </span>
                <button className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-display font-bold text-xs tracking-wide transition-all shadow-sm">
                  Upgrade Plan
                </button>
              </div>

              {/* Limits Progress Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Auto Replies */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-500">REPLIES</span>
                    <span className="text-slate-900">{stats.totalReplies} / 2,000</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${(stats.totalReplies / 2000) * 100}%` }} />
                  </div>
                </div>

                {/* Connected Channels */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-500">CHANNELS</span>
                    <span className="text-slate-900">2 / 3</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: "66.6%" }} />
                  </div>
                </div>

                {/* Token Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-500">TOKENS</span>
                    <span className="text-slate-900">{Math.round(stats.tokensUsed / 1000)}k / 500k</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-650" style={{ width: `${stats.tokenPct}%` }} />
                  </div>
                </div>

              </div>
            </div>

            <div className="text-right shrink-0 self-stretch md:self-auto flex items-center md:items-end justify-between md:justify-center flex-row md:flex-col border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
              <span className="text-xs text-slate-550 font-semibold font-mono">Next invoice date</span>
              <strong className="text-sm text-slate-900 font-mono block mt-0.5">July 1, 2026</strong>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
