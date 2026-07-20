"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface TechItem {
  name: string;
  role: string;
  brandColor: string;
  hoverBg: string;
  logoClass: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: "Anthropic",
    role: "Natural Language Reasoning",
    brandColor: "group-hover:border-[#E0B88A]/40",
    hoverBg: "group-hover:bg-[#E0B88A]/5",
    logoClass: "group-hover:text-[#E0B88A] font-extrabold",
  },
  {
    name: "Zernio",
    role: "Cross-platform API Publishing",
    brandColor: "group-hover:border-[#7B6EF6]/40",
    hoverBg: "group-hover:bg-[#7B6EF6]/5",
    logoClass: "group-hover:text-[#7B6EF6] font-bold tracking-tight",
  },
  {
    name: "ElevenLabs",
    role: "Voice Synthesis & Cloning",
    brandColor: "group-hover:border-[#FFB347]/40",
    hoverBg: "group-hover:bg-[#FFB347]/5",
    logoClass: "group-hover:text-[#FFB347] font-semibold italic",
  },
  {
    name: "Twilio",
    role: "SMS Escalation Gateway",
    brandColor: "group-hover:border-[#F22F46]/40",
    hoverBg: "group-hover:bg-[#F22F46]/5",
    logoClass: "group-hover:text-[#F22F46] font-black tracking-tighter",
  },
  {
    name: "Supabase",
    role: "Real-time State Sync",
    brandColor: "group-hover:border-[#3ECF8E]/40",
    hoverBg: "group-hover:bg-[#3ECF8E]/5",
    logoClass: "group-hover:text-[#3ECF8E] font-bold",
  },
  {
    name: "Next.js",
    role: "Server-side Rendering Hub",
    brandColor: "group-hover:border-white/20",
    hoverBg: "group-hover:bg-white/5",
    logoClass: "group-hover:text-white font-black tracking-widest",
  },
];

export default function TechStack() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="integrations" className="py-24 relative bg-background border-t border-border/40">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-mono text-xs uppercase tracking-wider text-primary font-bold mb-2">
            INTEGRATION LAYER
          </p>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-textPrimary mb-4">
            Built on APIs that matter
          </h2>
          <p className="text-sm text-textSecondary font-body">
            We didn&apos;t reinvent the wheel — we bridged it.
          </p>
        </div>

        {/* Tech Stack Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TECH_STACK.map((tech) => (
            <motion.div
              key={tech.name}
              whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -4 }}
              className={`group bg-surface/40 border border-border/60 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-default transition-all duration-300 ${tech.brandColor} ${tech.hoverBg}`}
            >
              {/* Logo Treatment */}
              <div className={`font-display text-lg md:text-xl text-textSecondary/60 transition-colors duration-300 ${tech.logoClass} mb-2`}>
                {tech.name}
              </div>

              {/* Role */}
              <div className="text-[10px] font-mono text-textSecondary uppercase tracking-wider leading-relaxed">
                {tech.role}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
