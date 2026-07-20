"use client";

import React, { useState } from "react";
import { useToast } from "../layout";
import { Sliders, Bell } from "lucide-react";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [businessName, setBusinessName] = useState("Threads Kenya");
  const [smsPhone, setSmsPhone] = useState("+254 712 345 678");
  const [autoReplyDelay, setAutoReplyDelay] = useState("4");
  const [swahiliOnly, setSwahiliOnly] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Settings saved successfully!", "success");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Header */}
      <div className="border-b border-[#1C2640] pb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Settings</h1>
        <p className="text-sm text-[#7A8BAD] mt-1">Configure your TalkBridge AI sandbox settings and preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Sliders size={18} className="text-[#4DFFC3]" /> General Business Info
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Business Display Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2 bg-[#080B14] border border-[#1C2640] rounded-lg text-sm text-[#F0F4FF] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">SMS Alert Phone Number</label>
              <input
                type="text"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                className="w-full px-4 py-2 bg-[#080B14] border border-[#1C2640] rounded-lg text-sm text-[#F0F4FF] focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Notifications and AI configuration */}
        <div className="bg-[#0F1624] border border-[#1C2640] rounded-xl p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Bell size={18} className="text-[#4DFFC3]" /> AI Pipeline Configurations
          </h3>

          <div className="space-y-4">
            {/* Auto reply delay */}
            <div className="flex justify-between items-center text-sm border-b border-[#1C2640]/40 pb-3">
              <div>
                <span className="block font-semibold text-white">Auto-Reply Delay</span>
                <span className="text-xs text-[#7A8BAD]">Seconds to wait before posting auto-replies via Zernio.</span>
              </div>
              <input
                type="number"
                value={autoReplyDelay}
                onChange={(e) => setAutoReplyDelay(e.target.value)}
                className="w-20 px-2 py-1 bg-[#080B14] border border-[#1C2640] rounded text-center text-sm text-white"
              />
            </div>

            {/* Language filter */}
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="block font-semibold text-white">Strict Swahili Filter</span>
                <span className="text-xs text-[#7A8BAD]">Only auto-reply to comments using Sheng/Swahili.</span>
              </div>
              <button
                type="button"
                onClick={() => setSwahiliOnly(!swahiliOnly)}
                className={`w-10 h-5.5 rounded-full relative p-0.5 transition-colors focus:outline-none ${
                  swahiliOnly ? "bg-[#4DFFC3]" : "bg-[#1C2640]"
                }`}
              >
                <span className={`block w-4.5 h-4.5 rounded-full bg-[#080B14] transition-all transform ${
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
            className="px-6 py-2.5 bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 text-[#080B14] font-display font-bold text-sm tracking-wide rounded-full transition-all hover:shadow-[0_0_12px_rgba(77,255,195,0.3)]"
          >
            Save preferences
          </button>
        </div>
      </form>

    </div>
  );
}
