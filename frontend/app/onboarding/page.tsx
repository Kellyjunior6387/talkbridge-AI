"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Plus, 
  Upload, 
  ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { API_BASE_URL } from "../../lib/api";

interface SizeRow {
  size: string;
  qty: number;
  inStock: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // STEP 1 STATE: Connections
  const [connections, setConnections] = useState({
    instagram: false,
    tiktok: false,
    whatsapp: false,
    zernio: false
  });

  const handleConnect = async (platform: "instagram" | "tiktok" | "whatsapp" | "zernio") => {
    setConnections(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));

    if (platform === "zernio" && userId) {
      await fetch(`${API_BASE_URL}/api/zernio/profiles/${userId}`);
    }
  };

  // STEP 2 STATE: Brand Voice
  const [selectedTone, setSelectedTone] = useState<"friendly" | "professional" | "genz" | "custom">("friendly");
  const [customInstructions, setCustomInstructions] = useState("");
  const [shengSupport, setShengSupport] = useState(true);

  // Dynamic replies previews based on selected voice
  const getPreviewReply = () => {
    switch (selectedTone) {
      case "friendly":
        return "Sema! Cargo Hoodie yetu ni Ksh 2,800 pekee na iko kwa stock. Unaweza kuagiza hapa na tunadeliver Nairobi nzima leo 😊";
      case "professional":
        return "Habari. Cargo Hoodie yetu inagharimu Ksh 2,800 na inapatikana kwa ukubwa tofauti. Tutafurahi kusafirisha bidhaa hii hadi kwako leo.";
      case "genz":
        return "Wazi msee! Hoodie ni mzinga wa Ksh 2,800 pekee. Si upige order nikuongeze swag chapchap 🔥";
      case "custom":
        return customInstructions.trim() 
          ? `[Custom AI Draft]: ${customInstructions.slice(0, 100)}...`
          : "Sema! Bei ya Hoodie yetu ni Ksh 2,800 na tuna sizes zote.";
    }
  };

  // STEP 3 STATE: Add Product
  const [productName, setProductName] = useState("Cargo Hoodie");
  const [description, setDescription] = useState("Premium heavy cotton streetwear hoodie, hand-stitched in Nairobi.");
  const [price, setPrice] = useState("2800");
  const [sizes, setSizes] = useState<SizeRow[]>([
    { size: "M", qty: 12, inStock: true },
    { size: "L", qty: 8, inStock: true }
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "tiktok"]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleAddSizeRow = () => {
    setSizes(prev => [...prev, { size: "XL", qty: 5, inStock: true }]);
  };

  const handleDeleteSizeRow = (index: number) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSizeRowChange = (index: number, field: keyof SizeRow, value: string | number | boolean) => {
    setSizes(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleTogglePlatform = (plat: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
    );
  };

  const handleMockUpload = () => {
    setUploadedImage("https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80");
  };

  // Check if at least one platform is connected to continue step 1
  const canContinueStep1 = connections.instagram || connections.tiktok || connections.whatsapp;

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setUserId(data.user?.id || null);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F0F4FF] font-body py-12 px-6 flex flex-col items-center">
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-xl text-center space-y-6 mb-10">
        <div className="flex items-center justify-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 17c4-5 16-5 20 0" />
            <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" />
            <path d="M2 12c3-1 17-1 20 0" />
            <path d="M6 12v2" />
            <path d="M12 11v4" />
            <path d="M18 12v2" />
          </svg>
          <span className="font-display font-bold text-xl text-[#F0F4FF]">
            TalkBridge<span className="text-[#3B82F6]">AI</span>
          </span>
        </div>

        {/* PROGRESS INDICATOR */}
        <div className="relative pt-4">
          <div className="absolute top-[35px] left-8 right-8 h-[2px] bg-[#1C2640] -z-10" />
          <div 
            className="absolute top-[35px] left-8 h-[2px] bg-[#3B82F6] -z-10 transition-all duration-300"
            style={{ width: `${step === 1 ? "0%" : step === 2 ? "50%" : "100%"}` }}
          />

          <div className="flex justify-between items-start">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center w-20">
              <div 
                onClick={() => step > 1 && setStep(1)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  step >= 1 
                    ? "bg-[#3B82F6] border-[#3B82F6] text-[#080B14] shadow-[0_0_15px_rgba(59, 130, 246,0.3)]" 
                    : "bg-[#0F1624] border-[#1C2640] text-[#7A8BAD]"
                }`}
              >
                <span className="font-mono text-xs font-bold">1</span>
              </div>
              <span className="text-[11px] font-mono text-[#7A8BAD] mt-2">Connect</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center w-20">
              <div 
                onClick={() => step > 2 && setStep(2)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  step >= 2 
                    ? "bg-[#3B82F6] border-[#3B82F6] text-[#080B14] shadow-[0_0_15px_rgba(59, 130, 246,0.3)]" 
                    : "bg-[#0F1624] border-[#1C2640] text-[#7A8BAD]"
                } ${step > 1 ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                <span className="font-mono text-xs font-bold">2</span>
              </div>
              <span className="text-[11px] font-mono text-[#7A8BAD] mt-2">Voice</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center w-20">
              <div 
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  step >= 3 
                    ? "bg-[#3B82F6] border-[#3B82F6] text-[#080B14] shadow-[0_0_15px_rgba(59, 130, 246,0.3)]" 
                    : "bg-[#0F1624] border-[#1C2640] text-[#7A8BAD]"
                }`}
              >
                <span className="font-mono text-xs font-bold">3</span>
              </div>
              <span className="text-[11px] font-mono text-[#7A8BAD] mt-2">Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE CONTAINER */}
      <div className="w-full max-w-xl bg-[#0F1624] border border-[#1C2640] rounded-2xl p-8 shadow-xl space-y-8">
        
        {/* STEP 1 SCREEN */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1.5">
              <h2 className="font-display font-bold text-2xl text-[#F0F4FF]">Connect your social accounts</h2>
              <p className="text-sm text-[#7A8BAD]">TalkBridge monitors these for new messages and comments.</p>
            </div>

            {/* Channels List */}
            <div className="space-y-3">
              {/* Instagram Card */}
              <div className={`p-4 rounded-xl border bg-[#080B14] flex items-center justify-between transition-all duration-300 ${
                connections.instagram ? "border-[#3B82F6] shadow-[0_0_15px_rgba(59, 130, 246,0.1)]" : "border-[#1C2640]"
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C]">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Instagram</p>
                    <p className="text-xs text-[#7A8BAD] font-mono">
                      {connections.instagram ? "@threads_kenya" : "Not connected"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect("instagram")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    connections.instagram 
                      ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]"
                      : "bg-[#3B82F6] text-[#080B14] hover:bg-[#3B82F6]/90"
                  }`}
                >
                  {connections.instagram ? "Connected ✓" : "Connect"}
                </button>
              </div>

              {/* TikTok Card */}
              <div className={`p-4 rounded-xl border bg-[#080B14] flex items-center justify-between transition-all duration-300 ${
                connections.tiktok ? "border-[#3B82F6] shadow-[0_0_15px_rgba(59, 130, 246,0.1)]" : "border-[#1C2640]"
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF0050]/10 flex items-center justify-center text-[#FF0050]">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.6-.67-.02 3.28-.01 6.56-.02 9.84-.04 2.11-.6 4.31-2.07 5.9-1.64 1.84-4.22 2.77-6.66 2.58-2.44-.13-4.88-1.42-6.07-3.6-1.53-2.62-1.25-6.19.74-8.5 1.57-1.87 4.15-2.73 6.55-2.29v4.06c-1.3-.4-2.8-.08-3.71.93-.93.97-1.12 2.51-.48 3.73.61 1.22 1.98 1.99 3.35 1.91 1.48-.04 2.82-1.14 2.94-2.61.07-2.4.03-17.39.03-17.39z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">TikTok</p>
                    <p className="text-xs text-[#7A8BAD] font-mono">
                      {connections.tiktok ? "@threads_kenya" : "Not connected"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect("tiktok")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    connections.tiktok 
                      ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]"
                      : "bg-[#3B82F6] text-[#080B14] hover:bg-[#3B82F6]/90"
                  }`}
                >
                  {connections.tiktok ? "Connected ✓" : "Connect"}
                </button>
              </div>

              {/* WhatsApp Card */}
              <div className={`p-4 rounded-xl border bg-[#080B14] flex items-center justify-between transition-all duration-300 ${
                connections.whatsapp ? "border-[#3B82F6] shadow-[0_0_15px_rgba(59, 130, 246,0.1)]" : "border-[#1C2640]"
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.908-6.995-1.878-1.88-4.357-2.912-6.997-2.914-5.443 0-9.865 4.421-9.87 9.867-.002 1.734.457 3.424 1.332 4.919l-.982 3.595 3.684-.967zm12.189-7.142c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">WhatsApp</p>
                    <p className="text-xs text-[#7A8BAD] font-mono">
                      {connections.whatsapp ? "+254 792 109 008" : "Not connected"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect("whatsapp")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    connections.whatsapp 
                      ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]"
                      : "bg-[#3B82F6] text-[#080B14] hover:bg-[#3B82F6]/90"
                  }`}
                >
                  {connections.whatsapp ? "Connected ✓" : "Connect"}
                </button>
              </div>
            </div>

            {/* Zernio Box */}
            <div className={`p-4 rounded-xl border bg-[#080B14]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
              connections.zernio ? "border-[#F5A623]" : "border-[#1C2640]"
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20">
                    REQUIRED FOR AUTO-REPLY
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">Zernio Publishing</h3>
                <p className="text-xs text-[#7A8BAD]">TalkBridge uses Zernio to post replies to your accounts.</p>
              </div>
              <button
                onClick={() => handleConnect("zernio")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all self-stretch sm:self-auto text-center ${
                  connections.zernio 
                    ? "bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]"
                    : "bg-[#F5A623] text-[#080B14] hover:bg-[#F5A623]/90"
                }`}
              >
                {connections.zernio ? "Connected ✓" : "Connect Zernio"}
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#1C2640] flex items-center justify-between">
              <button 
                onClick={() => setStep(2)}
                className="text-xs text-[#7A8BAD] hover:text-white transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                className="px-6 py-2.5 rounded-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:bg-[#3B82F6]/30 disabled:text-[#080B14]/50 disabled:cursor-not-allowed text-[#080B14] font-display font-bold text-sm tracking-wide flex items-center gap-1 transition-all"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2 SCREEN */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1.5">
              <h2 className="font-display font-bold text-2xl text-[#F0F4FF]">Set your brand voice</h2>
              <p className="text-sm text-[#7A8BAD]">The AI will reply in this tone on your behalf.</p>
            </div>

            {/* Tone Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Select tone</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "friendly", label: "Friendly 😊" },
                  { id: "professional", label: "Professional 💼" },
                  { id: "genz", label: "Gen-Z 🔥" },
                  { id: "custom", label: "Custom ⚙️" }
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedTone(tone.id as "friendly" | "professional" | "genz" | "custom")}
                    className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                      selectedTone === tone.id
                        ? "bg-[#3B82F6] border-[#3B82F6] text-[#080B14]"
                        : "bg-[#080B14] border-[#1C2640] text-[#7A8BAD] hover:border-[#3B82F6]/50"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom rules textarea */}
            {selectedTone === "custom" && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex justify-between items-center text-xs text-[#7A8BAD]">
                  <label className="font-semibold uppercase tracking-wider">Custom instructions</label>
                  <span>{customInstructions.length} / 250</span>
                </div>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value.slice(0, 250))}
                  placeholder="Always reply in Swahili and English. Use 'sema' instead of 'say'. Keep replies under 100 words."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#080B14] border border-[#1C2640] text-[#F0F4FF] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            )}

            {/* Sheng Toggle Row */}
            <div className="p-4 bg-[#080B14] rounded-xl border border-[#1C2640] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Enable Sheng support</h4>
                <p className="text-xs text-[#7A8BAD] mt-0.5">AI will understand and reply in Sheng when customers use it.</p>
              </div>
              <button
                onClick={() => setShengSupport(!shengSupport)}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors focus:outline-none ${
                  shengSupport ? "bg-[#3B82F6]" : "bg-[#1C2640]"
                }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-[#080B14] transition-all transform ${
                  shengSupport ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Preview Box */}
            <div className="border border-[#1C2640] rounded-xl p-4 bg-[#080B14] space-y-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#3B82F6] tracking-widest uppercase font-semibold">
                <span>PREVIEW REPLY</span>
              </div>
              
              <div className="space-y-3">
                <div className="text-xs p-2 bg-[#0F1624] border border-[#1C2640] rounded-lg self-start max-w-[85%]">
                  <span className="font-mono text-[#7A8BAD] block text-[9px] mb-0.5">CUSTOMER COMMENT</span>
                  <p className="text-[#F0F4FF]">niambie bei ya hoodie mtu</p>
                </div>
                
                <div className="text-xs p-2.5 bg-[#162033] border-l-2 border-[#7B6EF6] rounded-lg self-end ml-auto max-w-[85%] relative">
                  <span className="font-mono text-[#7B6EF6] block text-[9px] mb-0.5">AI AUTOMATED REPLY</span>
                  <p className="text-[#F0F4FF] italic">&ldquo;{getPreviewReply()}&rdquo;</p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#1C2640] flex items-center justify-between">
              <button 
                onClick={() => setStep(1)}
                className="text-xs text-[#7A8BAD] hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-[#080B14] font-display font-bold text-sm tracking-wide flex items-center gap-1 transition-all"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>

          </div>
        )}

        {/* STEP 3 SCREEN */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1.5">
              <h2 className="font-display font-bold text-2xl text-[#F0F4FF]">Add a product</h2>
              <p className="text-sm text-[#7A8BAD]">The AI will use this to answer customer questions about price, size, and availability.</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Cargo Hoodie"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#080B14] border border-[#1C2640] text-[#F0F4FF] text-sm focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description for AI..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#080B14] border border-[#1C2640] text-[#F0F4FF] text-sm focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Price (Ksh)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-xs font-mono text-[#7A8BAD]">Ksh</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2800"
                    className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-[#080B14] border border-[#1C2640] text-[#F0F4FF] text-sm focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Sizes and Availability */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Sizes & Quantity</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {sizes.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#080B14] p-2.5 rounded-lg border border-[#1C2640]">
                      <input
                        type="text"
                        placeholder="Size"
                        value={row.size}
                        onChange={(e) => handleSizeRowChange(idx, "size", e.target.value)}
                        className="w-16 px-2 py-1 bg-[#0F1624] border border-[#1C2640] text-center rounded text-xs text-[#F0F4FF] focus:outline-none"
                      />
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#7A8BAD] font-mono">QTY:</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={row.qty}
                          onChange={(e) => handleSizeRowChange(idx, "qty", parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-[#0F1624] border border-[#1C2640] text-center rounded text-xs text-[#F0F4FF] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSizeRowChange(idx, "inStock", !row.inStock)}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                          row.inStock 
                            ? "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30" 
                            : "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30"
                        }`}
                      >
                        {row.inStock ? "IN STOCK" : "OUT OF STOCK"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSizeRow(idx)}
                        className="p-1 hover:text-[#FF6B6B] transition-colors ml-auto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddSizeRow}
                  className="px-4 py-1.5 rounded-full border border-dashed border-[#1C2640] hover:border-[#3B82F6] hover:text-[#3B82F6] text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus size={12} /> Add size row
                </button>
              </div>

              {/* Platform tags */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Use for channels</label>
                <div className="flex gap-2">
                  {["instagram", "tiktok", "whatsapp"].map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => handleTogglePlatform(plat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all ${
                        selectedPlatforms.includes(plat)
                          ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]"
                          : "bg-[#080B14] border-[#1C2640] text-[#7A8BAD]"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload Zone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Product Photo</label>
                {uploadedImage ? (
                  <div className="relative rounded-lg border border-[#1C2640] overflow-hidden h-28 flex items-center justify-center bg-[#080B14]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage} alt="Uploaded" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/80 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={handleMockUpload}
                    className="border border-dashed border-[#1C2640] hover:border-[#3B82F6]/50 rounded-lg p-6 text-center cursor-pointer bg-[#080B14] hover:bg-[#080B14]/60 transition-all flex flex-col items-center gap-1.5"
                  >
                    <Upload size={20} className="text-[#7A8BAD]" />
                    <span className="text-xs text-white font-medium">Drop image or click to upload</span>
                    <span className="text-[10px] text-[#7A8BAD] font-mono uppercase">JPG, PNG UP TO 5MB</span>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#1C2640] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button 
                onClick={() => router.push("/dashboard/urgent")}
                className="text-xs text-[#7A8BAD] hover:text-white transition-colors"
              >
                Go to Dashboard (skip)
              </button>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    // Reset fields for another item
                    setProductName("");
                    setDescription("");
                    setPrice("");
                    setSizes([{ size: "M", qty: 5, inStock: true }]);
                    setUploadedImage(null);
                  }}
                  className="px-4 py-2.5 rounded-full border border-[#1C2640] hover:border-[#3B82F6] hover:text-[#3B82F6] text-xs font-semibold w-full sm:w-auto text-center transition-all"
                >
                  Add another
                </button>
                <button
                  onClick={() => router.push("/dashboard/urgent")}
                  className="px-6 py-2.5 rounded-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-[#080B14] font-display font-bold text-sm tracking-wide text-center w-full sm:w-auto transition-all hover:shadow-[0_0_15px_rgba(59, 130, 246,0.4)]"
                >
                  Save & Go to Dashboard
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
