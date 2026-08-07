"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  MessageSquare, 
  Globe, 
  Zap, 
  PhoneCall, 
  Package, 
  BarChart2, 
  Check 
} from "lucide-react";

export default function LandingPage() {


  return (
    <div className="min-h-screen bg-white text-slate-800 font-body selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6 lg:px-12 overflow-hidden border-b border-slate-100 bg-slate-50/30">
        {/* Glow dots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center space-y-6 z-10">
          {/* Left Column */}
          <div className="flex flex-col items-center text-center space-y-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-150 font-mono text-[11px] tracking-wider text-blue-600 uppercase bg-blue-50">
              AI COMMUNICATION BRIDGE
            </span>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-tight tracking-tight text-slate-900">
              Every comment. <br />
              <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Instantly handled.</span>
            </h1>

            <p className="text-base text-slate-600 max-w-xl leading-relaxed">
              TalkBridge connects your Instagram, TikTok, and WhatsApp to one AI inbox — so you never miss a customer, complaint, or sale again.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link 
                href="/auth?mode=signup" 
                className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-[0_4px_20px_rgba(37,99,235,0.3)] flex items-center justify-center"
              >
                Get started free
              </Link>
              <a 
                href="#features" 
                className="h-12 px-8 rounded-full border border-slate-200 hover:border-blue-650 text-slate-700 hover:text-blue-600 font-display font-semibold text-sm tracking-wide transition-all duration-300 bg-white flex items-center justify-center"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-slate-50 relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900">
              Everything your brand needs
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
              Say goodbye to messy DMs. TalkBridge automates the hard parts so you can focus on building your streetwear or retail business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 transition-all duration-300 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-105 transition-transform">
                <MessageSquare size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-slate-900 mb-2">AI Message Triage</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Every comment classified by intent and urgency in 200ms.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 transition-all duration-300 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-105 transition-transform">
                <Globe size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-slate-900 mb-2">Swahili, Sheng & English</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Built for how Nairobi actually communicates online.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 transition-all duration-300 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-105 transition-transform">
                <Zap size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-slate-900 mb-2">Auto-Reply in 4 Seconds</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Replies posted directly to your platforms via Zernio.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 transition-all duration-300 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-105 transition-transform">
                <PhoneCall size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-slate-900 mb-2">Urgent Alert System</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                High-urgency messages reach you via SMS instantly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 transition-all duration-300 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-105 transition-transform">
                <Package size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-slate-900 mb-2">Product Catalogue AI</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                AI knows your stock, prices, and sizes — and tells customers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 transition-all duration-300 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-105 transition-transform">
                <BarChart2 size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-slate-900 mb-2">Usage Dashboard</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Track every reply, token used, and escalation in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900">
              Simple pricing, local scale
            </h2>
            <p className="text-slate-500 text-sm md:text-base">
              Start free, upgrade as your shop expands. No hidden platform costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Starter Card */}
            <div className="bg-white border border-slate-100 rounded-xl p-8 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/50 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-950">Starter</h3>
                  <p className="text-slate-500 text-xs mt-1">Perfect for new shops and solo vendors</p>
                </div>
                <div className="flex items-baseline">
                  <span className="font-display font-bold text-3xl text-blue-600">Ksh 2,500</span>
                  <span className="text-slate-500 text-sm font-mono">/month</span>
                </div>
                <ul className="space-y-3 border-t border-slate-100 pt-6">
                  {["Unified Inbox (1,000 comments)", "1 Brand Voice tone profile", "Instagram & TikTok integrations", "AI custom reply drafting", "SMS escalations for complaints"].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link 
                  href="/auth?mode=signup" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm tracking-wide rounded-full flex items-center justify-center transition-all duration-200 shadow-lg shadow-blue-600/10"
                >
                  Get started
                </Link>
              </div>
            </div>

            {/* Growth Card */}
            <div className="bg-white border-2 border-blue-600 rounded-xl p-8 flex flex-col justify-between relative shadow-xl shadow-blue-600/5">
              <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-600 text-white uppercase tracking-wide">
                MOST POPULAR
              </span>
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-950">Growth</h3>
                  <p className="text-slate-500 text-xs mt-1">For active brands and busy shops</p>
                </div>
                <div className="flex items-baseline">
                  <span className="font-display font-bold text-3xl text-blue-600">Ksh 8,500</span>
                  <span className="text-slate-500 text-sm font-mono">/month</span>
                </div>
                <ul className="space-y-3 border-t border-slate-100 pt-6">
                  {["Unlimited incoming messages", "Multi-platform auto-publishing", "WhatsApp Business support", "Custom brand instructions", "Product Catalogue Sync (Unlimited items)", "Priority WhatsApp/SMS support"].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link 
                  href="/auth?mode=signup" 
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-sm tracking-wide rounded-full flex items-center justify-center transition-all duration-200 shadow-md"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 17c4-5 16-5 20 0" />
              <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" stroke="#3B82F6" />
              <path d="M2 12c3-1 17-1 20 0" />
              <path d="M6 12v2" />
              <path d="M12 11v4" />
              <path d="M18 12v2" />
            </svg>
            <span className="font-display font-bold text-base text-white">
              TalkBridge<span className="text-blue-500">AI</span>
            </span>
          </div>

          <div className="flex gap-8 text-xs text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>

          <p className="text-xs text-slate-500 font-mono">
            &copy; {new Date().getFullYear()} TalkBridge AI. Built for Nairobi SMEs.
          </p>
        </div>
      </footer>
    </div>
  );
}
