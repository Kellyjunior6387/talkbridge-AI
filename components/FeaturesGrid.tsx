"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cpu, Languages, RefreshCw, Mic, Zap, LayoutDashboard } from "lucide-react";

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ElementType;
}

const FEATURES: FeatureItem[] = [
  {
    title: "AI Message Triage",
    description: "Classifies every message by intent, urgency, and sentiment in under 200ms.",
    icon: Cpu,
  },
  {
    title: "Multi-lingual Support",
    description: "Handles English, Swahili, and code-switching — built for African markets.",
    icon: Languages,
  },
  {
    title: "Cross-platform Publishing",
    description: "Zernio API pushes replies to Twitter, Instagram, and LinkedIn simultaneously.",
    icon: RefreshCw,
  },
  {
    title: "Voice Integration",
    description: "ElevenLabs synthesizes voice replies. Whisper transcribes incoming voice notes.",
    icon: Mic,
  },
  {
    title: "Instant Escalation",
    description: "Urgent messages reach a human agent via Twilio SMS in seconds.",
    icon: Zap,
  },
  {
    title: "Unified Dashboard",
    description: "Every message, reply, and escalation in one real-time Supabase-powered view.",
    icon: LayoutDashboard,
  },
];

export default function FeaturesGrid() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section id="features" className="py-24 relative bg-background border-t border-border/40">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-20">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-textPrimary mb-4 leading-tight">
            Everything a brand needs to own the conversation
          </h2>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((feat) => {
            const IconComponent = feat.icon;
            return (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                className="glow-mint-card bg-surface border border-border/60 p-6 rounded-2xl flex flex-col gap-4 group cursor-default"
              >
                {/* Icon Wrapper with Hover Glow */}
                <div className="w-11 h-11 rounded-xl bg-background border border-border/80 flex items-center justify-center text-textSecondary group-hover:text-primary group-hover:border-primary/40 transition-colors duration-300 shadow-sm">
                  <IconComponent size={20} className="transition-transform duration-300 group-hover:scale-110" />
                </div>

                {/* Text Content */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-display font-bold text-lg text-textPrimary tracking-wide group-hover:text-primary transition-colors duration-300">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-textSecondary leading-relaxed font-body">
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
