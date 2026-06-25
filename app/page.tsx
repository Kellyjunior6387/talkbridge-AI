"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/Navbar";
import MessageStream from "@/components/MessageStream";
import HowItWorks from "@/components/HowItWorks";
import FeaturesGrid from "@/components/FeaturesGrid";
import TechStack from "@/components/TechStack";
import DemoCTA from "@/components/DemoCTA";
import Footer from "@/components/Footer";

export default function Home() {
  const shouldReduceMotion = useReducedMotion();

  const heroContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const heroItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  const handleScrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("how-it-works");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-textPrimary overflow-hidden font-body">
      {/* Background Decorative Blob */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[130px] pointer-events-none z-0" />

      {/* Global Navigation */}
      <Navbar />

      {/* HERO SECTION */}
      <main id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 min-h-[92vh] flex items-center z-10 border-b border-border/20">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Side: Copy and CTAs */}
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            {/* Eyebrow */}
            <motion.div
              variants={heroItemVariants}
              className="font-mono text-xs md:text-sm font-bold uppercase tracking-widest text-primary mb-5"
            >
              AI Communication Bridge Hackathon 2026
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={heroItemVariants}
              className="font-display font-black text-4xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight text-textPrimary mb-6"
            >
              Every message.
              <span className="block bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent pb-2">
                One inbox.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={heroItemVariants}
              className="text-textSecondary font-body text-base md:text-lg leading-relaxed mb-10 max-w-[480px]"
            >
              TalkBridge unifies TikTok, Instagram, WhatsApp, and SMS into a single 
              AI-powered conversation layer — so brands never miss a comment, complaint, 
              or customer again.
            </motion.p>

            {/* Call to Actions */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12"
            >
              <a
                href="#how-it-works"
                onClick={handleScrollToHowItWorks}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-primary text-background font-display font-bold text-sm tracking-wide text-center shadow-[0_0_15px_rgba(77,255,195,0.3)] hover:shadow-[0_0_25px_rgba(77,255,195,0.5)] transition-all duration-300 hover:scale-[1.03]"
              >
                See How It Works
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-border hover:border-textSecondary/40 text-textPrimary font-display font-bold text-sm tracking-wide text-center bg-surface/30 hover:bg-surface/60 transition-all duration-300 hover:scale-[1.03]"
              >
                View on GitHub
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-y-3 gap-x-6 text-[11px] font-mono tracking-wider text-textSecondary border-t border-border/30 pt-8 w-full"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E0B88A]" />
                Powered by Claude AI
              </span>
              <span className="text-border/60 hidden sm:inline">·</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Built with Zernio
              </span>
              <span className="text-border/60 hidden sm:inline">·</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB347]" />
                ElevenLabs Voice
              </span>
            </motion.div>
          </motion.div>

          {/* Right Side: Message Stream Simulation */}
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
            className="lg:col-span-6 w-full flex justify-center lg:justify-end"
          >
            <MessageStream />
          </motion.div>

        </div>
      </main>

      {/* HOW IT WORKS SECTION */}
      <HowItWorks />

      {/* FEATURES GRID SECTION */}
      <FeaturesGrid />

      {/* TECH STACK SECTION */}
      <TechStack />

      {/* DEMO CTA SECTION */}
      <DemoCTA />

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
