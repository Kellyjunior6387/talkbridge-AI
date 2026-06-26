"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Animated sequence of verification steps for premium SaaS feel
    const phrases = isLogin 
      ? ["Validating account...", "Connecting to secure database...", "Establishing session..."]
      : ["Creating secure profile...", "Provisioning cloud workspace...", "Setting up API nodes..."];
      
    setLoadingText(phrases[0]);
    
    // Simulate steps
    for (let i = 1; i < phrases.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoadingText(phrases[i]);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    // Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-background text-textPrimary flex flex-col justify-between overflow-hidden font-body py-8 px-4">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none z-0" />

      {/* Header / Back Link */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-textSecondary hover:text-primary transition-colors group"
        >
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
          Back to landing page
        </button>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex-grow flex items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-surface/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 md:p-10 shadow-2xl relative group"
        >
          {/* Subtle Mint Glow Border on Card Hover */}
          <div className="absolute inset-0 rounded-2xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-sm" />

          {/* Brand/Logo Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface border border-border group-hover:border-primary/40 transition-all duration-300 mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M2 17c4-5 16-5 20 0" />
                <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" />
                <path d="M2 12c3-1 17-1 20 0" />
                <path d="M6 12v2" />
                <path d="M12 11v4" />
                <path d="M18 12v2" />
              </svg>
            </div>
            <h1 className="font-display font-bold text-2xl tracking-wide text-textPrimary mb-1.5">
              {isLogin ? "Welcome Back" : "Get Started Now"}
            </h1>
            <p className="text-sm text-textSecondary max-w-[280px]">
              {isLogin 
                ? "Sign in to manage your unified social comments with AI automation"
                : "Create a dummy account to explore the AI agent dashboard"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border/80 rounded-xl text-textPrimary placeholder:text-textSecondary/40 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-mono tracking-wider uppercase text-textSecondary">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="text-xs text-primary/80 hover:text-primary transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-background/50 border border-border/80 rounded-xl text-textPrimary placeholder:text-textSecondary/40 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-textSecondary hover:text-textPrimary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms of Service (Signup only) */}
            {!isLogin && (
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  required
                  id="terms"
                  className="mt-1 accent-primary rounded bg-background/50 border-border"
                />
                <label htmlFor="terms" className="text-xs text-textSecondary leading-normal select-none">
                  I agree to the dummy{" "}
                  <span className="text-primary/80 hover:underline cursor-pointer">Terms of Service</span>{" "}
                  and{" "}
                  <span className="text-primary/80 hover:underline cursor-pointer">Privacy Policy</span>.
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-background font-display font-bold text-sm tracking-wide rounded-xl shadow-[0_0_15px_rgba(77,255,195,0.2)] hover:shadow-[0_0_20px_rgba(77,255,195,0.4)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-85 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>{loadingText}</span>
                </>
              ) : (
                <span>{isLogin ? "Sign In to Workspace" : "Create Developer Account"}</span>
              )}
            </button>
          </form>

          {/* Social / Dummy Auth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/90 px-3 text-textSecondary/60 font-mono tracking-widest">
                Protected Session
              </span>
            </div>
          </div>

          {/* Secondary Auth Method (Sandbox bypass note) */}
          <div className="bg-surface/80 border border-border/60 rounded-xl p-3 flex gap-2.5 items-start">
            <ShieldCheck className="text-primary shrink-0 mt-0.5" size={16} />
            <div className="text-[11px] text-textSecondary font-body leading-normal">
              <span className="font-semibold text-textPrimary">Sandbox Developer Access:</span> No real accounts are connected here. Any email and password combinations will be authorized instantly.
            </div>
          </div>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
              className="text-xs text-textSecondary hover:text-primary transition-colors focus:outline-none"
            >
              {isLogin 
                ? "Don't have an account? Sign up free"
                : "Already have an account? Sign in instead"
              }
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-textSecondary/50 font-mono tracking-wider">
        © {new Date().getFullYear()} TalkBridge AI Inc. All rights reserved.
      </footer>
    </div>
  );
}
