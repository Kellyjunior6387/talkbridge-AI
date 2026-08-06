"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "../layout";
import { supabase } from "../../../lib/supabase";
import { Sliders, Bell } from "lucide-react";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [businessName, setBusinessName] = useState("Threads Kenya");
  const [smsPhone, setSmsPhone] = useState("+254 712 345 678");
  const [autoReplyDelay, setAutoReplyDelay] = useState("4");
  const [swahiliOnly, setSwahiliOnly] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");
        setSmsPhone(meta.sms_phone || "+254 712 345 678");
        setAutoReplyDelay(meta.auto_reply_delay || "4");
        setSwahiliOnly(!!meta.swahili_only);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          business_name: businessName,
          sms_phone: smsPhone,
          auto_reply_delay: autoReplyDelay,
          swahili_only: swahiliOnly
        }
      });
      if (error) throw error;

      if (userId) {
        // Update user_profiles table name row
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({ name: businessName })
          .eq("user_id", userId);
        if (profileError) console.error("Failed to sync profile name:", profileError);
      }

      showToast("Settings saved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings.", "error");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-16 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">Settings Preferences</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your TalkBridge AI sandbox settings and automation preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <Sliders size={18} className="text-blue-600" /> General Business Info
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Display Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">SMS Alert Phone Number</label>
              <input
                type="text"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-mono font-medium"
              />
            </div>
          </div>
        </div>

        {/* Notifications and AI configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <Bell size={18} className="text-blue-600" /> AI Pipeline Configurations
          </h3>

          <div className="space-y-4">
            {/* Auto reply delay */}
            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
              <div>
                <span className="block font-semibold text-slate-900">Auto-Reply Delay</span>
                <span className="text-xs text-slate-500">Seconds to wait before posting auto-replies via Zernio.</span>
              </div>
              <input
                type="number"
                value={autoReplyDelay}
                onChange={(e) => setAutoReplyDelay(e.target.value)}
                className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-center text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            {/* Language filter */}
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="block font-semibold text-slate-900">Strict Swahili Filter</span>
                <span className="text-xs text-slate-500">Only auto-reply to comments using Sheng/Swahili.</span>
              </div>
              <button
                type="button"
                onClick={() => setSwahiliOnly(!swahiliOnly)}
                className={`w-10 h-5.5 rounded-full relative p-0.5 transition-colors focus:outline-none ${
                  swahiliOnly ? "bg-blue-600" : "bg-slate-250"
                }`}
              >
                <span className={`block w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all transform ${
                  swahiliOnly ? "translate-x-4.5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm tracking-wide rounded-full transition-all hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
          >
            Save preferences
          </button>
        </div>
      </form>
    </div>
  );
}
