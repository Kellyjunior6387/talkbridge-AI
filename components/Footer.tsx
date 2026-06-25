"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M2 17c4-5 16-5 20 0" />
            <path d="M2 12c3-1 17-1 20 0" />
            <path d="M6 12v2" />
            <path d="M12 11v4" />
            <path d="M18 12v2" />
          </svg>
          <span className="font-display font-bold text-sm tracking-wide text-textPrimary">
            TalkBridge<span className="text-primary">AI</span>
          </span>
        </div>

        {/* Center: Credits */}
        <div className="text-center text-xs text-textSecondary font-medium">
          Built for{" "}
          <span className="text-textPrimary font-semibold">
            AI Communication Bridge Hackathon 2026
          </span>{" "}
          ·{" "}
          <a
            href="https://bit.ly/aibridgehackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline hover:text-primary/90 transition-colors"
          >
            BrickLabs AI
          </a>
        </div>

        {/* Right: GitHub Link */}
        <div className="flex items-center">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-textSecondary hover:text-primary transition-colors duration-200 p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border"
            aria-label="GitHub Repository"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
