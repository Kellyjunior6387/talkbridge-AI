"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navbarVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const navLinks = [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "Integrations", href: "#integrations" },
  ];

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "py-3 bg-background/85 backdrop-blur-md border-border/40 shadow-lg shadow-background/20"
          : "py-5 bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border group-hover:border-primary/50 transition-all duration-300">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary transition-transform duration-300 group-hover:scale-110"
            >
              {/* Suspended bridge deck */}
              <path d="M2 17c4-5 16-5 20 0" />
              {/* Roadway */}
              <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" />
              <path d="M2 12c3-1 17-1 20 0" />
              {/* Suspension cables */}
              <path d="M6 12v2" />
              <path d="M12 11v4" />
              <path d="M18 12v2" />
            </svg>
            <div className="absolute inset-0 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          </div>
          <span className="font-display font-bold text-xl tracking-wide text-textPrimary">
            TalkBridge<span className="text-primary font-bold">AI</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Button (Desktop) */}
        <div className="hidden md:block">
          <a
            href="https://bit.ly/aibridgehackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-primary/80 text-primary text-sm font-semibold font-display tracking-wide hover:bg-primary hover:text-background transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,255,195,0.3)]"
          >
            Register for Hackathon <span className="text-xs">→</span>
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 md:hidden rounded-lg bg-surface border border-border text-textSecondary hover:text-primary transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-b border-border bg-background/95 backdrop-blur-lg py-6 px-6 flex flex-col gap-5 shadow-xl shadow-background/80">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-textSecondary hover:text-primary transition-colors py-1"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <hr className="border-border/40" />
          <a
            href="https://bit.ly/aibridgehackathon"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full py-3 rounded-full border border-primary text-primary text-sm font-semibold font-display text-center hover:bg-primary hover:text-background transition-all duration-300"
          >
            Register for Hackathon →
          </a>
        </div>
      )}
    </motion.header>
  );
}
