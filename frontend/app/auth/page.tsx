"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { API_BASE_URL } from "../../lib/api";

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

    const finalEmail = email.trim();
    const finalPassword = password;

    try {
      if (isLogin) {
        // Sign in using email/password
        const { error } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password: finalPassword
        });
        if (error) throw error;
        router.push("/dashboard/urgent");
      } else {
        // Sign up using email/password + metadata
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              full_name: fullName,
              business_name: businessName
            }
          }
        });
        if (error) throw error;
        if (data.user?.id) {
          await fetch(`${API_BASE_URL}/api/zernio/profiles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              name: businessName,
              description: `${businessName} social publishing profile`,
              color: "#2563EB"
            })
          });
        }

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-body flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-lg space-y-8">
        
        {/* Top: Logo & Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 17c4-5 16-5 20 0" />
              <path d="M2 12h20" strokeDasharray="1 1" className="opacity-40" stroke="#2563EB" />
              <path d="M2 12c3-1 17-1 20 0" />
              <path d="M6 12v2" />
              <path d="M12 11v4" />
              <path d="M18 12v2" />
            </svg>
            <span className="font-display font-bold text-2xl tracking-wide text-slate-900">
              TalkBridge<span className="text-[#2563EB]">AI</span>
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">Every message. One inbox.</p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100"></div>

        {/* Header text */}
        <div className="space-y-2 text-center">
          <h2 className="font-display font-bold text-2xl text-slate-900">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-xs text-slate-500">
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Mwangi"
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all duration-200"
              />
            </div>
          )}

          {/* Business Name (Sign Up only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Threads Kenya"
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all duration-200"
              />
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@threadskenya.co.ke"
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              {isLogin && (
                <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-4 pr-10 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* CTA Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-display font-bold text-sm tracking-wide rounded-full flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_4px_15px_rgba(37,99,235,0.4)]"
          >
            {isLoading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>{isLogin ? "Log in" : "Create account"}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-mono text-slate-500 uppercase">or continue with</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Social Auth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 rounded-full border border-slate-200 hover:border-blue-600 text-slate-700 hover:text-blue-600 font-semibold text-sm flex items-center justify-center gap-3 bg-white transition-all duration-200 disabled:opacity-50"
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
            className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
          >
            {isLogin ? (
              <span>Don&apos;t have an account? <strong className="text-blue-600 font-semibold">Sign up</strong></span>
            ) : (
              <span>Already have an account? <strong className="text-blue-600 font-semibold">Log in</strong></span>
            )}
          </button>
        </div>

        {/* Bottom: Stats */}
        <div className="border-t border-slate-100 pt-6 flex justify-around text-[11px] font-mono text-slate-400">
          <span>5 platforms</span>
          <span>&middot;</span>
          <span>&lt; 4 seconds</span>
          <span>&middot;</span>
          <span>AI-powered</span>
        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500 font-mono">Loading Session...</div>}>
      <AuthContent />
    </React.Suspense>
  );
}
