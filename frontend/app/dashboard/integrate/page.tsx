"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, AtSign, Camera, CheckCircle2, Loader2, Music2, Trash2 } from "lucide-react";
import { useToast } from "../layout";
import { supabase } from "../../../lib/supabase";

type Platform = "twitter" | "instagram" | "tiktok";

interface PlatformCardConfig {
  id: Platform;
  name: string;
  description: string;
  accent: string;
  icon: React.ElementType;
}

const platformCards: PlatformCardConfig[] = [
  {
    id: "twitter",
    name: "Twitter",
    description: "Link Twitter to sync public replies and mentions.",
    accent: "#1DA1F2",
    icon: AtSign,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Sync your comments, DMs, and creator replies.",
    accent: "#E1306C",
    icon: Camera,
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Keep short-form comments and replies in sync.",
    accent: "#FF0050",
    icon: Music2,
  },
];

interface ConnectedAccount {
  _id: string;
  platform: Platform;
  username?: string;
  displayName?: string;
  isActive: boolean;
}

export default function ConnectionsPage() {
  const { showToast } = useToast();
  const [userEmail, setUserEmail] = useState("jane@threads.co.ke");
  const [businessName, setBusinessName] = useState("Threads Kenya");
  const profileId = "zn-prof-8a302e83";
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  
  // Local state for connected accounts (Bypasses backend database fetch)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    {
      _id: "acc-1",
      platform: "instagram",
      username: "threads.ke",
      displayName: "Instagram Business",
      isActive: true
    },
    {
      _id: "acc-2",
      platform: "tiktok",
      username: "threads_kenya",
      displayName: "TikTok Creator Profile",
      isActive: true
    }
  ]);
  const isAccountsLoading = false;
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email || "jane@threads.co.ke");
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");
      }
    });
  }, []);

  const handleConnect = (platform: Platform) => {
    setActivePlatform(platform);
    showToast(`Initializing secure OAuth link with ${platform}...`, "info");

    setTimeout(() => {
      const mockId = `acc-${Math.random().toString(36).substring(2, 9)}`;
      const newAcc: ConnectedAccount = {
        _id: mockId,
        platform,
        username: `${businessName.toLowerCase().replace(/\s+/g, "_")}_${platform}`,
        displayName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Channel`,
        isActive: true
      };

      setConnectedAccounts(prev => {
        if (prev.some(a => a.platform === platform)) {
          return prev;
        }
        return [...prev, newAcc];
      });

      showToast(`${platform} channel successfully integrated!`, "success");
      setActivePlatform(null);
    }, 1200);
  };

  const handleDisconnect = (accountId: string) => {
    setIsDisconnecting(accountId);
    setTimeout(() => {
      setConnectedAccounts(prev => prev.filter((a) => a._id !== accountId));
      showToast("Account channel disconnected successfully.", "success");
      setIsDisconnecting(null);
    }, 600);
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case "twitter":
        return <AtSign size={18} className="text-[#1DA1F2]" />;
      case "instagram":
        return <Camera size={18} className="text-[#E1306C]" />;
      case "tiktok":
        return <Music2 size={18} className="text-[#FF0050]" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-10 pb-20 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Social Connections</h1>
          <p className="text-sm text-slate-500 max-w-md">
            Manage your connected social accounts and link new profiles to automate customer replies.
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{businessName}</span>
          </div>
          <p className="text-slate-500">{userEmail}</p>
          <p className="text-slate-400 font-mono break-all text-[10px] pt-0.5">ID: {profileId || "loading..."}</p>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Connected Social Profiles</h2>
        
        {isAccountsLoading ? (
          <div className="flex items-center justify-center p-12 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        ) : connectedAccounts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
            <p className="text-sm font-semibold text-slate-700">No social media accounts connected yet.</p>
            <p className="text-xs text-slate-500">Link a platform below to start tracking and auto-replying to comments.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
            {connectedAccounts.map((account) => (
              <div key={account._id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-150 bg-slate-50">
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{account.displayName || account.platform}</h3>
                    <p className="text-xs text-slate-500 font-mono">{account.username ? `@${account.username}` : "Active connection"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border bg-green-50 border-green-150 text-green-600">
                    <CheckCircle2 size={12} />
                    <span>Active</span>
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleDisconnect(account._id)}
                    disabled={isDisconnecting !== null}
                    className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Disconnect account"
                  >
                    {isDisconnecting === account._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect New Account Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Integrate New Channel</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platformCards.map((platform) => {
            const Icon = platform.icon;
            const isLoading = activePlatform === platform.id;
            const isAlreadyConnected = connectedAccounts.some(acc => acc.platform === platform.id);

            return (
              <div
                key={platform.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 hover:border-blue-600/35 hover:shadow-lg hover:shadow-blue-600/5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{platform.name}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-150 bg-slate-50">
                      <Icon size={16} style={{ color: platform.accent }} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{platform.description}</p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isLoading || isAlreadyConnected}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <span>{isAlreadyConnected ? "Integrated" : "Link Account"}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}