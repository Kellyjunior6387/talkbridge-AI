"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ArrowRight, AtSign, Camera, CheckCircle2, Loader2, Music2, Trash2 } from "lucide-react";
import { useToast } from "../layout";
import { supabase } from "../../../lib/supabase";
import { API_BASE_URL } from "../../../lib/api";

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
  profilePicture?: string | null;
  isActive: boolean;
}

export default function IntegratePage() {
  const { showToast } = useToast();
  const [userEmail, setUserEmail] = useState("connected user");
  const [businessName, setBusinessName] = useState("TalkBridge workspace");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  const fetchConnectedAccounts = useCallback(async () => {
    setIsAccountsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/zernio/accounts`);
      if (!res.ok) {
        throw new Error("Failed to load connected accounts");
      }
      const data = await res.json();
      const accounts = Array.isArray(data) ? data : data?.accounts || [];
      setConnectedAccounts(accounts);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load connected accounts", "error");
    } finally {
      setIsAccountsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) {
        return;
      }

      if (session) {
        const currentUserId = session.user.id;
        setUserEmail(session.user.email || "connected user");
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "TalkBridge workspace");

        // Fetch connected accounts
        fetchConnectedAccounts();

        // Fetch Zernio profile details
        fetch(`${API_BASE_URL}/api/zernio/profiles/${currentUserId}`)
          .then(async (res) => {
            if (!res.ok) {
              const payload = await res.json().catch(() => ({}));
              throw new Error(payload.error || "Could not load your Zernio profile");
            }
            return res.json();
          })
          .then((profile) => {
            if (!mounted) return;
            setProfileId(profile?.zernio_profile_id || null);
          })
          .catch((err) => {
            if (!mounted) return;
            setProfileId(null);
            showToast(err instanceof Error ? err.message : "Could not load your Zernio profile", "error");
          })
          .finally(() => {
            if (mounted) {
              setIsProfileLoading(false);
            }
          });
        return;
      }

      setIsProfileLoading(false);
      setIsAccountsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [showToast, fetchConnectedAccounts]);

  const handleConnect = async (platform: Platform) => {
    if (!profileId) {
      showToast("Create or load your Zernio profile before connecting a platform.", "error");
      return;
    }

    setActivePlatform(platform);

    try {
      const res = await fetch(`${API_BASE_URL}/api/zernio/connect/${platform}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          redirectUrl: `${window.location.origin}/dashboard/integrate`,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Failed to connect ${platform}`);
      }

      const payload = await res.json();
      const authUrl =
        typeof payload === "string"
          ? payload
          : payload?.url || payload?.authUrl || payload?.connectUrl || payload?.data?.url || payload?.data?.authUrl;

      if (authUrl) {
        showToast(`${platform} connection opened. Finish the provider flow to complete linking.`, "success");
        window.location.assign(authUrl);
        return;
      }

      showToast(`${platform} connection request sent.`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to connect ${platform}`, "error");
    } finally {
      setActivePlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    setIsDisconnecting(accountId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/zernio/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to disconnect account");
      }

      showToast("Account disconnected successfully.", "success");
      fetchConnectedAccounts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to disconnect account", "error");
    } finally {
      setIsDisconnecting(null);
    }
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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-10 pb-20">
      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C2640] pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-white font-display">Integrations</h1>
          <p className="text-sm text-[#7A8BAD] max-w-md">
            Manage your connected social profiles and link new platforms to sync replies.
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-xl border border-[#1C2640] bg-[#0F1624] text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold">{businessName}</span>
          </div>
          <p className="text-[#7A8BAD] text-[10px]">{userEmail}</p>
          <p className="text-[#7A8BAD] font-mono break-all text-[10px]">ID: {profileId || "loading..."}</p>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Connected Accounts</h2>
        
        {isAccountsLoading ? (
          <div className="flex items-center justify-center p-8 rounded-2xl border border-[#1C2640] bg-[#080B14]">
            <Loader2 size={24} className="animate-spin text-[#4DFFC3]" />
          </div>
        ) : connectedAccounts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-[#1C2640] bg-[#080B14] space-y-2">
            <p className="text-sm text-[#B8C5E0]">No social media accounts connected yet.</p>
            <p className="text-xs text-[#7A8BAD]">Link a platform below to start tracking and auto-replying to messages.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1C2640] bg-[#080B14] overflow-hidden divide-y divide-[#1C2640]">
            {connectedAccounts.map((account) => (
              <div key={account._id} className="flex items-center justify-between p-4 bg-[#080B14] hover:bg-[#0F1624] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#1C2640] bg-[#0F1624]">
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{account.displayName || account.platform}</h3>
                    <p className="text-xs text-[#7A8BAD] font-mono">{account.username ? `@${account.username}` : "Active connection"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>Active</span>
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleDisconnect(account._id)}
                    disabled={isDisconnecting !== null}
                    className="p-2 rounded-lg border border-[#1C2640] text-[#7A8BAD] hover:text-[#FF0050] hover:border-[#FF0050]/20 hover:bg-[#FF0050]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
        <h2 className="text-lg font-semibold text-white">Connect New Account</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platformCards.map((platform) => {
            const Icon = platform.icon;
            const isLoading = isProfileLoading || activePlatform === platform.id;
            const isAlreadyConnected = connectedAccounts.some(acc => acc.platform === platform.id);

            return (
              <div
                key={platform.id}
                className="rounded-2xl border border-[#1C2640] bg-[#080B14] p-5 space-y-4 hover:border-[#4DFFC3]/20 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{platform.name}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#1C2640] bg-[#0F1624]">
                      <Icon size={16} style={{ color: platform.accent }} />
                    </div>
                  </div>
                  <p className="text-xs text-[#B8C5E0] leading-5">{platform.description}</p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isLoading || !profileId}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-[#080B14] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <span>{isAlreadyConnected ? "Link Another" : "Link Account"}</span>
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