"use client";

import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md border-b border-slate-200"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:scale-110"
          >
            <path d="M2 17c4-5 16-5 20 0" />
            <path d="M2 12h20" strokeDasharray="1 1" className="opacity-40" stroke="#2563EB" />
            <path d="M2 12c3-1 17-1 20 0" />
            <path d="M6 12v2" />
            <path d="M12 11v4" />
            <path d="M18 12v2" />
          </svg>
          <span className="font-display font-bold text-xl tracking-wide text-slate-900">
            TalkBridge<span className="text-[#2563EB]">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-[#2563EB] transition-colors duration-200">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-[#2563EB] transition-colors duration-200">
            Pricing
          </a>
        </nav>

        {/* Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/auth?mode=login"
            className="px-5 py-2 text-sm font-medium text-slate-700 hover:text-[#2563EB] transition-colors duration-200"
          >
            Log in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-display font-bold text-sm tracking-wide rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            Get started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 md:hidden rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#2563EB] transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-b border-slate-200 bg-white/95 backdrop-blur-lg py-6 px-6 flex flex-col gap-5 shadow-xl">
          <nav className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium text-slate-600 hover:text-[#2563EB] transition-colors py-1"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium text-slate-600 hover:text-[#2563EB] transition-colors py-1"
            >
              Pricing
            </a>
          </nav>
          <hr className="border-slate-100" />
          <div className="flex flex-col gap-3">
            <Link
              href="/auth?mode=login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold font-display text-center hover:border-[#2563EB] transition-all duration-200"
            >
              Log in
            </Link>
            <Link
              href="/auth?mode=signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-full bg-[#2563EB] text-white text-sm font-semibold font-display text-center hover:bg-[#2563EB]/90 transition-all duration-200"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
