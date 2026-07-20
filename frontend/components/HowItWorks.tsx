"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Radio, Brain, MessageSquareCheck, BellRing } from "lucide-react";

interface StepItem {
  number: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "LISTEN",
    icon: Radio,
    description: "Messages arrive from TikTok, Instagram, WhatsApp, SMS, and voice — aggregated in real time via webhooks.",
  },
  {
    number: "02",
    title: "UNDERSTAND",
    icon: Brain,
    description: "Claude AI reads every message, detects intent, language, sentiment, and urgency — in any language, including Swahili.",
  },
  {
    number: "03",
    title: "RESPOND",
    icon: MessageSquareCheck,
    description: "TalkBridge auto-drafts on-brand replies and publishes them across platforms via the Zernio API — instantly.",
  },
  {
    number: "04",
    title: "ESCALATE",
    icon: BellRing,
    description: "High-urgency messages (angry customers, viral complaints) trigger an immediate SMS alert to a human agent via Twilio.",
  },
];

// Re-map RESPOND_ICON to work with the type system cleanly
const stepIcons = [Radio, Brain, MessageSquareCheck, BellRing];

export default function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-background">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-textPrimary mb-4 leading-tight">
            The bridge between chaos and clarity
          </h2>
          <p className="font-mono text-sm uppercase tracking-wider text-primary font-semibold">
            Four steps. Zero missed messages.
          </p>
        </div>

        {/* Timeline container */}
        <div className="relative">
          {/* Desktop Connecting Dashed Line */}
          <div className="hidden md:block absolute top-[68px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-border z-0" />

          {/* Steps Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10"
          >
            {STEPS.map((step, index) => {
              const IconComponent = stepIcons[index];
              return (
                <motion.div
                  key={step.number}
                  variants={cardVariants}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                  className="flex flex-col items-center md:items-start text-center md:text-left bg-surface/50 border border-border/60 p-6 md:p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:border-primary/30"
                >
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between w-full mb-6">
                    <div className="p-3.5 rounded-xl bg-background border border-border/80 text-primary flex items-center justify-center shadow-md">
                      <IconComponent size={24} />
                    </div>
                    <span className="font-mono font-bold text-3xl text-textSecondary/40 leading-none">
                      {step.number}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-lg text-textPrimary tracking-wider uppercase mb-3">
                    {step.title}
                  </h3>

                  {/* Body Text */}
                  <p className="text-sm text-textSecondary leading-relaxed font-body">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
