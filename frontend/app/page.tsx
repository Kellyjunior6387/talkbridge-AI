"use client";

import React, { useState, useEffect } from "react";
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
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F0F4FF] font-body selection:bg-[#4DFFC3]/30 selection:text-[#4DFFC3]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6 lg:px-12 overflow-hidden border-b border-[#1C2640]">
        {/* Glow dots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7B6EF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4DFFC3]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
          {/* Left Column */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-[#4DFFC3] font-mono text-[11px] tracking-wider text-[#4DFFC3] uppercase bg-[#4DFFC3]/5">
              AI COMMUNICATION BRIDGE
            </span>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-tight tracking-tight">
              Every comment. <br />
              <span className="text-[#4DFFC3] bg-gradient-to-r from-[#4DFFC3] to-[#4DFFC3]/80 bg-clip-text text-transparent">Instantly handled.</span>
            </h1>

            <p className="text-base text-[#7A8BAD] max-w-[440px] leading-relaxed">
              TalkBridge connects your Instagram, TikTok, and WhatsApp to one AI inbox — so you never miss a customer, complaint, or sale again.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                href="/auth?mode=signup" 
                className="h-12 px-8 rounded-full bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 text-[#080B14] font-display font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(77,255,195,0.4)] flex items-center justify-center"
              >
                Get started free
              </Link>
              <a 
                href="#features" 
                className="h-12 px-8 rounded-full border border-[#1C2640] hover:border-[#4DFFC3] text-[#F0F4FF] hover:text-[#4DFFC3] font-display font-semibold text-sm tracking-wide transition-all duration-300 bg-transparent flex items-center justify-center"
              >
                See how it works
              </a>
            </div>

            <div className="pt-8 border-t border-[#1C2640]/50 w-full">
              <p className="text-[12px] font-mono text-[#7A8BAD] uppercase tracking-wider flex flex-wrap items-center gap-2">
                Powered by 
                <span className="text-[#F0F4FF]">Claude AI</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7B6EF6]" />
                <span className="text-[#F0F4FF]">Zernio</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4DFFC3]" />
                <span className="text-[#F0F4FF]">ElevenLabs</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />
                <span className="text-[#F0F4FF]">Twilio</span>
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-[480px] bg-[#0F1624] border border-[#1C2640] rounded-2xl p-6 shadow-2xl relative group transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_20px_rgba(77,255,195,0.1)]">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#1C2640] pb-4 mb-4">
                <span className="font-mono text-[11px] text-[#4DFFC3] tracking-widest font-semibold">LIVE INBOX</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4DFFC3] animate-pulse" />
                  <span className="text-xs text-[#7A8BAD]">Connected</span>
                </div>
              </div>

              {/* Message Rows */}
              <div className="space-y-4">
                {/* Row 1 */}
                <div className="flex items-center justify-between p-3.5 bg-[#080B14] rounded-xl border-l-[3px] border-[#FF0050]">
                  <div className="flex items-center gap-3">
                    {/* TikTok SVG Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[#FF0050]/10 flex items-center justify-center text-[#FF0050] shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.6-.67-.02 3.28-.01 6.56-.02 9.84-.04 2.11-.6 4.31-2.07 5.9-1.64 1.84-4.22 2.77-6.66 2.58-2.44-.13-4.88-1.42-6.07-3.6-1.53-2.62-1.25-6.19.74-8.5 1.57-1.87 4.15-2.73 6.55-2.29v4.06c-1.3-.4-2.8-.08-3.71.93-.93.97-1.12 2.51-.48 3.73.61 1.22 1.98 1.99 3.35 1.91 1.48-.04 2.82-1.14 2.94-2.61.07-2.4.03-17.39.03-17.39z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#7A8BAD] font-mono">@user_ke</p>
                      <p className="text-[13px] text-[#F0F4FF] font-medium truncate">where is my order 😡</p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30 uppercase">
                    ⚠ Urgent
                  </span>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between p-3.5 bg-[#080B14] rounded-xl border-l-[3px] border-[#E1306C]">
                  <div className="flex items-center gap-3">
                    {/* Instagram SVG Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C] shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#7A8BAD] font-mono">@nairobi_fan</p>
                      <p className="text-[13px] text-[#F0F4FF] font-medium truncate">do you ship to Uganda?</p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4DFFC3]/15 text-[#4DFFC3] border border-[#4DFFC3]/30 uppercase">
                    ✓ Replied
                  </span>
                </div>

                {/* Row 3 */}
                <div className="flex items-center justify-between p-3.5 bg-[#080B14] rounded-xl border-l-[3px] border-[#25D366]">
                  <div className="flex items-center gap-3">
                    {/* WhatsApp SVG Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.908-6.995-1.878-1.88-4.357-2.912-6.997-2.914-5.443 0-9.865 4.421-9.87 9.867-.002 1.734.457 3.424 1.332 4.919l-.982 3.595 3.684-.967zm12.189-7.142c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#7A8BAD] font-mono">+254 792 109 008</p>
                      <p className="text-[13px] text-[#F0F4FF] font-medium truncate">LOVE this hoodie 🔥🔥</p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4DFFC3]/15 text-[#4DFFC3] border border-[#4DFFC3]/30 uppercase">
                    ✓ Replied
                  </span>
                </div>
              </div>

              {/* Typing Indicator */}
              <div className="mt-5 pt-4 border-t border-[#1C2640] flex items-center gap-2">
                <span className="flex space-x-1 shrink-0">
                  <span className="w-1.5 h-1.5 bg-[#7B6EF6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-[#7B6EF6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-[#7B6EF6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </span>
                <span className="text-xs italic text-[#7A8BAD] font-body">AI is drafting a reply{dots}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-[#080B14] relative border-b border-[#1C2640]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F0F4FF]">
              Everything your brand needs
            </h2>
            <p className="text-[#7A8BAD] max-w-xl mx-auto text-sm md:text-base">
              Say goodbye to messy DMs. TalkBridge automates the hard parts so you can focus on building your streetwear or retail business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.1)] group">
              <div className="w-12 h-12 rounded-xl bg-[#4DFFC3]/10 flex items-center justify-center text-[#4DFFC3] mb-5 group-hover:scale-105 transition-transform">
                <MessageSquare size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-[#F0F4FF] mb-2">AI Message Triage</h3>
              <p className="text-[13px] text-[#7A8BAD] leading-relaxed">
                Every comment classified by intent and urgency in 200ms.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.1)] group">
              <div className="w-12 h-12 rounded-xl bg-[#4DFFC3]/10 flex items-center justify-center text-[#4DFFC3] mb-5 group-hover:scale-105 transition-transform">
                <Globe size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-[#F0F4FF] mb-2">Swahili, Sheng & English</h3>
              <p className="text-[13px] text-[#7A8BAD] leading-relaxed">
                Built for how Nairobi actually communicates online.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.1)] group">
              <div className="w-12 h-12 rounded-xl bg-[#4DFFC3]/10 flex items-center justify-center text-[#4DFFC3] mb-5 group-hover:scale-105 transition-transform">
                <Zap size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-[#F0F4FF] mb-2">Auto-Reply in 4 Seconds</h3>
              <p className="text-[13px] text-[#7A8BAD] leading-relaxed">
                Replies posted directly to your platforms via Zernio.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.1)] group">
              <div className="w-12 h-12 rounded-xl bg-[#4DFFC3]/10 flex items-center justify-center text-[#4DFFC3] mb-5 group-hover:scale-105 transition-transform">
                <PhoneCall size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-[#F0F4FF] mb-2">Urgent Alert System</h3>
              <p className="text-[13px] text-[#7A8BAD] leading-relaxed">
                High-urgency messages reach you via SMS instantly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.1)] group">
              <div className="w-12 h-12 rounded-xl bg-[#4DFFC3]/10 flex items-center justify-center text-[#4DFFC3] mb-5 group-hover:scale-105 transition-transform">
                <Package size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-[#F0F4FF] mb-2">Product Catalogue AI</h3>
              <p className="text-[13px] text-[#7A8BAD] leading-relaxed">
                AI knows your stock, prices, and sizes — and tells customers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.1)] group">
              <div className="w-12 h-12 rounded-xl bg-[#4DFFC3]/10 flex items-center justify-center text-[#4DFFC3] mb-5 group-hover:scale-105 transition-transform">
                <BarChart2 size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-[16px] text-[#F0F4FF] mb-2">Usage Dashboard</h3>
              <p className="text-[13px] text-[#7A8BAD] leading-relaxed">
                Track every reply, token used, and escalation in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 lg:px-12 bg-[#080B14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F0F4FF]">
              Simple pricing, local scale
            </h2>
            <p className="text-[#7A8BAD] text-sm md:text-base">
              Start free, upgrade as your shop expands. No hidden platform costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Starter Card */}
            <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-8 flex flex-col justify-between transition-all duration-300 hover:border-[#4DFFC3]/50">
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#F0F4FF]">Starter</h3>
                  <p className="text-[#7A8BAD] text-xs mt-1">Perfect for new shops and solo vendors</p>
                </div>
                <div className="flex items-baseline">
                  <span className="font-display font-bold text-3xl text-[#4DFFC3]">Ksh 2,500</span>
                  <span className="text-[#7A8BAD] text-sm font-mono">/month</span>
                </div>
                <ul className="space-y-3 border-t border-[#1C2640] pt-6">
                  {["Unified Inbox (1,000 comments)", "1 Brand Voice tone profile", "Instagram & TikTok integrations", "AI custom reply drafting", "SMS escalations for complaints"].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#7A8BAD]">
                      <Check size={14} className="text-[#4DFFC3] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link 
                  href="/auth?mode=signup" 
                  className="w-full h-11 bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 text-[#080B14] font-display font-bold text-sm tracking-wide rounded-full flex items-center justify-center transition-all duration-200"
                >
                  Get started
                </Link>
              </div>
            </div>

            {/* Growth Card */}
            <div className="bg-[#0F1624] border-2 border-[#4DFFC3] rounded-xl p-8 flex flex-col justify-between relative shadow-lg shadow-[#4DFFC3]/5">
              <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#7B6EF6] text-[#F0F4FF] uppercase tracking-wide">
                MOST POPULAR
              </span>
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#F0F4FF]">Growth</h3>
                  <p className="text-[#7A8BAD] text-xs mt-1">For active brands and busy shops</p>
                </div>
                <div className="flex items-baseline">
                  <span className="font-display font-bold text-3xl text-[#7B6EF6]">Ksh 8,500</span>
                  <span className="text-[#7A8BAD] text-sm font-mono">/month</span>
                </div>
                <ul className="space-y-3 border-t border-[#1C2640] pt-6">
                  {["Unlimited incoming messages", "Multi-platform auto-publishing", "WhatsApp Business support", "Custom brand instructions", "Product Catalogue Sync (Unlimited items)", "Priority WhatsApp/SMS support"].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#7A8BAD]">
                      <Check size={14} className="text-[#4DFFC3] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link 
                  href="/auth?mode=signup" 
                  className="w-full h-11 bg-[#7B6EF6] hover:bg-[#7B6EF6]/90 text-[#F0F4FF] font-display font-bold text-sm tracking-wide rounded-full flex items-center justify-center transition-all duration-200"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F1624] border-t border-[#1C2640] py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4DFFC3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 17c4-5 16-5 20 0" />
              <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" />
              <path d="M2 12c3-1 17-1 20 0" />
              <path d="M6 12v2" />
              <path d="M12 11v4" />
              <path d="M18 12v2" />
            </svg>
            <span className="font-display font-bold text-base text-[#F0F4FF]">
              TalkBridge<span className="text-[#4DFFC3]">AI</span>
            </span>
          </div>

          <div className="flex gap-8 text-xs text-[#7A8BAD]">
            <a href="#features" className="hover:text-[#F0F4FF] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#F0F4FF] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#F0F4FF] transition-colors">Privacy Policy</a>
          </div>

          <p className="text-xs text-[#7A8BAD] font-mono">
            &copy; {new Date().getFullYear()} TalkBridge AI. Built for Nairobi SMEs.
          </p>
        </div>
      </footer>
    </div>
  );
}
