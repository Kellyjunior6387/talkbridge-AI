"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { API_BASE_URL } from "../../lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Threads Kenya");
  const [profileId, setProfileId] = useState("");
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isConnectingPlat, setIsConnectingPlat] = useState<string | null>(null);

  // Connections state (WhatsApp and Zernio are handled locally/mock, Instagram and TikTok are real backend)
  const [connections, setConnections] = useState({
    instagram: false,
    tiktok: false,
    whatsapp: false,
    zernio: true // defaulted to true because the profile is already created on signup
  });

  const fetchConnectedAccounts = useCallback(async (pId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/zernio/accounts?profileId=${pId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.accounts || [];
        setConnectedAccounts(list);
        
        // Sync connections with actual backend connections
        setConnections(prev => ({
          ...prev,
          instagram: list.some((acc: any) => acc.platform === "instagram"),
          tiktok: list.some((acc: any) => acc.platform === "tiktok")
        }));
      }
    } catch (err) {
      console.error("Failed to load connected accounts:", err);
    }
  }, []);

  const handleConnect = async (platform: "instagram" | "tiktok" | "whatsapp" | "zernio") => {
    if (platform === "whatsapp") {
      setConnections(prev => ({ ...prev, whatsapp: !prev.whatsapp }));
      return;
    }
    if (platform === "zernio") {
      setConnections(prev => ({ ...prev, zernio: !prev.zernio }));
      return;
    }

    if (!profileId) {
      alert("Social profile ID is not loaded yet. Please wait a moment.");
      return;
    }

    const isAlreadyConnected = connectedAccounts.some(acc => acc.platform === platform);
    
    setIsConnectingPlat(platform);
    try {
      if (isAlreadyConnected) {
        // Disconnect
        const account = connectedAccounts.find(acc => acc.platform === platform);
        if (account) {
          const res = await fetch(`${API_BASE_URL}/api/zernio/accounts/${account._id}`, {
            method: "DELETE"
          });
          if (res.ok) {
            await fetchConnectedAccounts(profileId);
          }
        }
      } else {
        // Connect via OAuth url redirect
        const res = await fetch(`${API_BASE_URL}/api/zernio/connect/${platform}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            redirectUrl: window.location.origin + "/onboarding"
          })
        });
        if (res.ok) {
          const data = await res.json();
          const authUrl = typeof data === "string" ? data : data.url || data.authUrl;
          if (authUrl) {
            window.location.href = authUrl;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to toggle connect for ${platform}:`, err);
    } finally {
      setIsConnectingPlat(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setUserId(session.user.id);
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");

        // Fetch Zernio profile
        try {
          const res = await fetch(`${API_BASE_URL}/api/zernio/profiles/${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            const pId = data.zernio_profile_id || "";
            setProfileId(pId);
            fetchConnectedAccounts(pId);
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }
      } else {
        router.push("/auth?mode=login");
      }
    });
    return () => {
      mounted = false;
    };
  }, [router, fetchConnectedAccounts]);

  const canContinue = connections.instagram || connections.tiktok || connections.whatsapp;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-body py-12 px-6 flex flex-col items-center select-none">
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-xl text-center space-y-6 mb-10">
        <div className="flex items-center justify-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 17c4-5 16-5 20 0" />
            <path d="M2 12h20" strokeDasharray="1 1" className="opacity-40" stroke="#2563EB" />
            <path d="M2 12c3-1 17-1 20 0" />
            <path d="M6 12v2" />
            <path d="M12 11v4" />
            <path d="M18 12v2" />
          </svg>
          <span className="font-display font-bold text-xl text-slate-900">
            TalkBridge<span className="text-[#2563EB]">AI</span>
          </span>
        </div>
      </div>

      {/* CORE CONTAINER */}
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-lg space-y-8 animate-fadeIn">
        
        <div className="space-y-1.5">
          <h2 className="font-display font-bold text-2xl text-slate-900">Connect your social accounts</h2>
          <p className="text-sm text-slate-500">TalkBridge monitors these channels for new comments and DMs.</p>
        </div>

        {/* Channels List */}
        <div className="space-y-3">
          {/* Instagram Card */}
          <div className={`p-4 rounded-xl border bg-slate-50 flex items-center justify-between transition-all duration-300 ${
            connections.instagram ? "border-blue-600 bg-blue-50/20" : "border-slate-200"
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Instagram</p>
                <p className="text-xs text-slate-500 font-mono">
                  {connections.instagram 
                    ? `@${connectedAccounts.find(acc => acc.platform === "instagram")?.username || businessName.toLowerCase().replace(/\s+/g, "_")}` 
                    : "Not connected"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleConnect("instagram")}
              disabled={isConnectingPlat !== null}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all min-w-[100px] flex items-center justify-center ${
                connections.instagram 
                  ? "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {isConnectingPlat === "instagram" ? (
                <Loader2 size={14} className="animate-spin text-slate-400" />
              ) : connections.instagram ? (
                "Disconnect"
              ) : (
                "Connect"
              )}
            </button>
          </div>

          {/* TikTok Card */}
          <div className={`p-4 rounded-xl border bg-slate-50 flex items-center justify-between transition-all duration-300 ${
            connections.tiktok ? "border-blue-600 bg-blue-50/20" : "border-slate-200"
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FF0050]/10 flex items-center justify-center text-[#FF0050]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.6-.67-.02 3.28-.01 6.56-.02 9.84-.04 2.11-.6 4.31-2.07 5.9-1.64 1.84-4.22 2.77-6.66 2.58-2.44-.13-4.88-1.42-6.07-3.6-1.53-2.62-1.25-6.19.74-8.5 1.57-1.87 4.15-2.73 6.55-2.29v4.06c-1.3-.4-2.8-.08-3.71.93-.93.97-1.12 2.51-.48 3.73.61 1.22 1.98 1.99 3.35 1.91 1.48-.04 2.82-1.14 2.94-2.61.07-2.4.03-17.39.03-17.39z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">TikTok</p>
                <p className="text-xs text-slate-500 font-mono">
                  {connections.tiktok 
                    ? `@${connectedAccounts.find(acc => acc.platform === "tiktok")?.username || businessName.toLowerCase().replace(/\s+/g, "_")}` 
                    : "Not connected"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleConnect("tiktok")}
              disabled={isConnectingPlat !== null}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all min-w-[100px] flex items-center justify-center ${
                connections.tiktok 
                  ? "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {isConnectingPlat === "tiktok" ? (
                <Loader2 size={14} className="animate-spin text-slate-400" />
              ) : connections.tiktok ? (
                "Disconnect"
              ) : (
                "Connect"
              )}
            </button>
          </div>

          {/* WhatsApp Card */}
          <div className={`p-4 rounded-xl border bg-slate-50 flex items-center justify-between transition-all duration-300 ${
            connections.whatsapp ? "border-blue-600 bg-blue-50/20" : "border-slate-200"
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.908-6.995-1.878-1.88-4.357-2.912-6.997-2.914-5.443 0-9.865 4.421-9.87 9.867-.002 1.734.457 3.424 1.332 4.919l-.982 3.595 3.684-.967zm12.189-7.142c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">WhatsApp</p>
                <p className="text-xs text-slate-500 font-mono">
                  {connections.whatsapp ? "+254 792 109 008" : "Not connected"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleConnect("whatsapp")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                connections.whatsapp 
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {connections.whatsapp ? "Connected ✓" : "Connect"}
            </button>
          </div>
        </div>

        {/* Zernio Box */}
        <div className={`p-4 rounded-xl border bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
          connections.zernio ? "border-amber-500 bg-amber-50/20" : "border-slate-200"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                REQUIRED FOR AUTO-REPLY
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Zernio Publishing</h3>
            <p className="text-xs text-slate-500">TalkBridge uses Zernio to post replies to your accounts.</p>
          </div>
          <button
            onClick={() => handleConnect("zernio")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all self-stretch sm:self-auto text-center ${
              connections.zernio 
                ? "bg-amber-50 text-amber-700 border border-amber-300"
                : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/10"
            }`}
          >
            {connections.zernio ? "Connected ✓" : "Connect Zernio"}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={() => router.push("/dashboard/messages")}
            className="text-xs text-slate-400 hover:text-slate-650 transition-colors font-semibold"
          >
            Skip for now
          </button>
          <button
            onClick={() => router.push("/dashboard/messages")}
            disabled={!canContinue}
            className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 disabled:text-white/60 disabled:cursor-not-allowed text-white font-display font-bold text-sm tracking-wide flex items-center gap-1 transition-all shadow-md shadow-blue-500/20"
          >
            Go to Dashboard <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
