"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface StatItem {
  number: string;
  label: string;
}

const STATS: StatItem[] = [
  { number: "5", label: "Platforms Unified" },
  { number: "< 200ms", label: "AI Response Time" },
  { number: "1", label: "Unified Inbox" },
];

export default function DemoCTA() {
  const shouldReduceMotion = useReducedMotion();

  const handleWatchDemoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const heroElement = document.getElementById("hero");
    if (heroElement) {
      heroElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-32 relative overflow-hidden bg-background border-t border-border/40">
      {/* Premium Violet Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,110,246,0.18)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Grid Overlay for Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(28,38,64,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(28,38,64,0.15)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-40" />

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        {/* Title */}
        <h2 className="font-display font-black text-4xl md:text-6xl text-textPrimary mb-4 tracking-tight leading-tight">
          See TalkBridge in action.
        </h2>

        {/* Subtitle */}
        <p className="font-mono text-xs md:text-sm text-textSecondary uppercase tracking-widest mb-10 max-w-xl mx-auto">
          June 27, 2026 · AI Communication Bridge Hackathon · BrickLabs AI
        </p>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <a
            href="https://bit.ly/aibridgehackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-background font-display font-bold text-base tracking-wide shadow-[0_0_20px_rgba(77,255,195,0.4)] hover:shadow-[0_0_30px_rgba(77,255,195,0.6)] transition-all duration-300 hover:scale-[1.03]"
          >
            Register at bit.ly/aibridgehackathon
          </a>
          <a
            href="#hero"
            onClick={handleWatchDemoClick}
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-border/80 text-textPrimary font-display font-bold text-base tracking-wide hover:bg-surface hover:border-textSecondary/30 transition-all duration-300 hover:scale-[1.03]"
          >
            Watch Demo
          </a>
        </div>

        {/* Stats Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-border/40 pt-16">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="font-display font-black text-4xl md:text-5xl text-primary tracking-tight mb-2">
                {stat.number}
              </span>
              <span className="font-mono text-[11px] text-textSecondary uppercase tracking-wider">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
