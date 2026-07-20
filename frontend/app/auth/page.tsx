"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Switch between login and signup
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Set mode based on URL query param if present
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsLogin(false);
    } else if (mode === "login") {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (isLogin) {
        // Sign in using email/password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        router.push("/dashboard/urgent");
      } else {
        // Sign up using email/password + metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              business_name: businessName
            }
          }
        });
        if (error) throw error;
        router.push("/onboarding");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard/urgent`
        }
      });
      if (error) throw error;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to connect to Google Auth.");
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#080B14] text-[#F0F4FF] font-body flex flex-col md:flex-row select-none">
      {/* LEFT PANEL (40% width on large screens, responsive) */}
      <div className="w-full md:w-[40%] bg-[#0F1624] border-r border-[#1C2640] p-8 md:p-12 flex flex-col justify-between items-center text-center md:text-left">
        {/* Top: Logo & Title */}
        <div className="w-full flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4DFFC3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 17c4-5 16-5 20 0" />
              <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" />
              <path d="M2 12c3-1 17-1 20 0" />
              <path d="M6 12v2" />
              <path d="M12 11v4" />
              <path d="M18 12v2" />
            </svg>
            <span className="font-display font-bold text-2xl tracking-wide text-[#F0F4FF]">
              TalkBridge<span className="text-[#4DFFC3]">AI</span>
            </span>
          </div>
          <p className="text-[#7A8BAD] text-sm mt-1">Every message. One inbox.</p>
        </div>

        {/* Center: Live Inbox Simulation */}
        <div className="my-8 w-full max-w-[360px] bg-[#080B14] border border-[#1C2640] rounded-xl p-4 text-left hidden md:block">
          <div className="flex items-center justify-between border-b border-[#1C2640] pb-2.5 mb-3">
            <span className="font-mono text-[10px] text-[#4DFFC3] tracking-widest uppercase">LIVE PREVIEW</span>
            <span className="w-2 h-2 rounded-full bg-[#4DFFC3]" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-[#0F1624] rounded-lg border-l-2 border-[#FF0050] text-xs">
              <span className="text-[#7A8BAD] truncate max-w-[120px] font-mono">@streetwear_ke</span>
              <span className="text-[#F0F4FF] truncate max-w-[120px]">size M stock?</span>
              <span className="text-[9px] font-mono font-bold bg-[#FF6B6B]/10 text-[#FF6B6B] px-1.5 py-0.5 rounded-full border border-[#FF6B6B]/20">COMPLAINT</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#0F1624] rounded-lg border-l-2 border-[#E1306C] text-xs">
              <span className="text-[#7A8BAD] truncate max-w-[120px] font-mono">@nairobi_buyer</span>
              <span className="text-[#4DFFC3] truncate max-w-[120px]">Replied ✓</span>
              <span className="text-[9px] font-mono font-bold bg-[#4DFFC3]/10 text-[#4DFFC3] px-1.5 py-0.5 rounded-full border border-[#4DFFC3]/20">QUESTION</span>
            </div>
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="w-full border-t border-[#1C2640] pt-6 flex justify-around md:justify-between text-xs font-mono text-[#7A8BAD]">
          <span>5 platforms</span>
          <span>&middot;</span>
          <span>&lt; 4 seconds</span>
          <span>&middot;</span>
          <span>AI-powered</span>
        </div>
      </div>

      {/* RIGHT PANEL (60% width - Form) */}
      <div className="w-full md:w-[60%] bg-[#080B14] flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Header text */}
          <div className="space-y-2 text-center md:text-left">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-[#F0F4FF]">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-[#7A8BAD]">
              {isLogin 
                ? "Sign in to manage your unified inbox"
                : "Start your 14-day free trial — no card required"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Sign Up only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Mwangi"
                  className="w-full px-4 py-3 rounded-lg bg-[#0F1624] border border-[#1C2640] text-[#F0F4FF] placeholder:text-[#7A8BAD]/40 text-sm focus:outline-none focus:border-[#4DFFC3] focus:ring-1 focus:ring-[#4DFFC3]/30 transition-all duration-200"
                />
              </div>
            )}

            {/* Business Name (Sign Up only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Threads Kenya"
                  className="w-full px-4 py-3 rounded-lg bg-[#0F1624] border border-[#1C2640] text-[#F0F4FF] placeholder:text-[#7A8BAD]/40 text-sm focus:outline-none focus:border-[#4DFFC3] focus:ring-1 focus:ring-[#4DFFC3]/30 transition-all duration-200"
                />
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@threadskenya.co.ke"
                className="w-full px-4 py-3 rounded-lg bg-[#0F1624] border border-[#1C2640] text-[#F0F4FF] placeholder:text-[#7A8BAD]/40 text-sm focus:outline-none focus:border-[#4DFFC3] focus:ring-1 focus:ring-[#4DFFC3]/30 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs text-[#4DFFC3] hover:underline">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-4 pr-10 py-3 rounded-lg bg-[#0F1624] border border-[#1C2640] text-[#F0F4FF] placeholder:text-[#7A8BAD]/40 text-sm focus:outline-none focus:border-[#4DFFC3] focus:ring-1 focus:ring-[#4DFFC3]/30 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-[#7A8BAD] hover:text-[#F0F4FF] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg text-xs text-[#FF6B6B] leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-4 bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 disabled:bg-[#4DFFC3]/50 text-[#080B14] font-display font-bold text-sm tracking-wide rounded-full flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,255,195,0.4)]"
            >
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-[#080B14] border-t-transparent animate-spin" />
              ) : (
                <span>{isLogin ? "Log in" : "Create account"}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#1C2640]"></div>
            <span className="flex-shrink mx-4 text-xs font-mono text-[#7A8BAD] uppercase">or continue with</span>
            <div className="flex-grow border-t border-[#1C2640]"></div>
          </div>

          {/* Social Auth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 rounded-full border border-[#1C2640] hover:border-[#4DFFC3] text-[#F0F4FF] hover:text-[#4DFFC3] font-semibold text-sm flex items-center justify-center gap-3 bg-transparent transition-all duration-200 disabled:opacity-50"
          >
            {/* Google Icon SVG */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.886H12.24z" />
            </svg>
            Continue with Google
          </button>

          {/* Switch link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage("");
              }}
              className="text-xs text-[#7A8BAD] hover:text-[#4DFFC3] transition-colors"
            >
              {isLogin ? (
                <span>Don&apos;t have an account? <strong className="text-[#4DFFC3]">Sign up</strong></span>
              ) : (
                <span>Already have an account? <strong className="text-[#4DFFC3]">Log in</strong></span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#080B14] flex items-center justify-center text-sm text-[#7A8BAD] font-mono">Loading Session...</div>}>
      <AuthContent />
    </React.Suspense>
  );
}
