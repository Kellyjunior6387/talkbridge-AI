"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ArrowRight, 
  AtSign, 
  Camera, 
  Loader2, 
  Music2, 
  Upload, 
  Play, 
  Sparkles,
  Link2,
  ChevronDown
} from "lucide-react";
import { useToast } from "../layout";
import { supabase } from "../../../lib/supabase";
import { API_BASE_URL } from "../../../lib/api";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  platforms: string[];
}

interface ConnectedAccount {
  _id: string;
  platform: "instagram" | "tiktok" | "twitter";
  username?: string;
  displayName?: string;
}

const uploadFileWithSignedUrl = (
  file: File,
  signedUrl: string,
  token: string,
  onProgress: (pct: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("x-signature", token);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText);
          reject(new Error(errResponse.message || "Failed to upload file to storage"));
        } catch {
          reject(new Error(`Storage server returned error code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.send(file);
  });
};

export default function PublishVideoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#7A8BAD]">Loading video publisher...</div>}>
      <PublishVideoContent />
    </Suspense>
  );
}

function PublishVideoContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const queryProductId = searchParams.get("productId");

  const [userId, setUserId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("My Workspace");

  // Options lists loaded from DB
  const [products, setProducts] = useState<Product[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<("instagram" | "tiktok" | "twitter")[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  
  // Progress states
  const [publishing, setPublishing] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Phone preview video control
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load user session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) {
        setUserId(session.user.id);
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "My Workspace");
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch products & connected accounts once userId is loaded
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    setLoadingOptions(true);

    const loadData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch(`${API_BASE_URL}/api/zernio/products/${userId}`);
        const productsData = await productsRes.json();
        
        // Fetch accounts
        const accountsRes = await fetch(`${API_BASE_URL}/api/zernio/accounts`);
        const accountsData = await accountsRes.json();

        if (!mounted) return;

        const resolvedProducts = Array.isArray(productsData) ? productsData : [];
        setProducts(resolvedProducts);

        const resolvedAccounts = Array.isArray(accountsData) ? accountsData : accountsData?.accounts || [];
        setConnectedAccounts(resolvedAccounts);

        // Pre-select product from query parameter if available
        if (queryProductId && resolvedProducts.some((p: Product) => p.id === queryProductId)) {
          setSelectedProductId(queryProductId);
          const matchedProd = resolvedProducts.find((p: Product) => p.id === queryProductId);
          if (matchedProd) {
            setCaption(`${matchedProd.name} is now available for Ksh ${matchedProd.price.toLocaleString()}. ${matchedProd.description}`);
            const matchedPlats = matchedProd.platforms.filter((p: string) => p !== "whatsapp") as ("instagram" | "tiktok" | "twitter")[];
            setSelectedPlatforms(matchedPlats);
          }
        } else if (resolvedProducts.length > 0) {
          // Default to first product in list
          setSelectedProductId(resolvedProducts[0].id);
          setCaption(`${resolvedProducts[0].name} is now available for Ksh ${resolvedProducts[0].price.toLocaleString()}. ${resolvedProducts[0].description}`);
          const matchedPlats = resolvedProducts[0].platforms.filter((p: string) => p !== "whatsapp") as ("instagram" | "tiktok" | "twitter")[];
          setSelectedPlatforms(matchedPlats);
        }
      } catch {
        showToast("Failed to load catalog products or social accounts", "error");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [userId, queryProductId, showToast]);

  // Handle product dropdown changes
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setCaption(`${prod.name} is now available for Ksh ${prod.price.toLocaleString()}. ${prod.description}`);
      const matchedPlats = prod.platforms.filter((p: string) => p !== "whatsapp") as ("instagram" | "tiktok" | "twitter")[];
      setSelectedPlatforms(matchedPlats);
    }
  };

  // Video File Selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        showToast("Please select a valid video file", "error");
        return;
      }
      setVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(objectUrl);
      setIsPlaying(true);
    }
  };

  // Clean up Object URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Toggle Video play/pause in preview
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Submit Social Post
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      showToast("Session missing. Please log in again.", "error");
      return;
    }

    if (!videoFile) {
      showToast("Please select a video file to post.", "error");
      return;
    }

    if (selectedPlatforms.length === 0) {
      showToast("Please select at least one social media account.", "error");
      return;
    }

    setPublishing(true);
    setUploadingMedia(true);

    try {
      // 1. Get signed upload URL from backend
      const signedRes = await fetch(`${API_BASE_URL}/api/zernio/media/supabase-upload-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: videoFile.name }),
      });

      if (!signedRes.ok) {
        const errPayload = await signedRes.json().catch(() => ({}));
        throw new Error(errPayload.error || "Failed to generate storage upload token");
      }

      const { signedUrl, token, publicUrl } = await signedRes.json();

      // 2. Upload video file directly using the signed URL
      setUploadProgress(0);
      await uploadFileWithSignedUrl(
        videoFile,
        signedUrl,
        token,
        (pct) => {
          setUploadProgress(pct);
        }
      );

      setUploadingMedia(false);

      // Map platform names to Zernio account IDs
      const accountIdsMap: Record<string, string> = {};
      connectedAccounts.forEach((acc) => {
        if (selectedPlatforms.includes(acc.platform)) {
          accountIdsMap[acc.platform] = acc._id;
        }
      });

      // 3. Create post via backend
      const postRes = await fetch(`${API_BASE_URL}/api/zernio/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId: selectedProductId,
          content: caption,
          platforms: selectedPlatforms,
          accountIds: accountIdsMap,
          publishNow: true,
          mediaItems: [
            {
              type: "video",
              url: publicUrl,
              title: products.find(p => p.id === selectedProductId)?.name || "Video Post",
            }
          ]
        }),
      });

      if (!postRes.ok) {
        const postErr = await postRes.json().catch(() => ({}));
        throw new Error(postErr.error || "Failed to publish post to social accounts");
      }

      showToast("Video successfully posted and webhook comment listeners subscribed!", "success");
      
      // Reset video selection
      setVideoFile(null);
      setVideoPreviewUrl(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to publish video post", "error");
    } finally {
      setUploadingMedia(false);
      setPublishing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <AtSign size={14} className="text-[#1DA1F2]" />;
      case "instagram":
        return <Camera size={14} className="text-[#E1306C]" />;
      case "tiktok":
        return <Music2 size={14} className="text-[#FF0050]" />;
      default:
        return null;
    }
  };

  const activeProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      {/* Page Title */}
      <div className="border-b border-[#1C2640] pb-6 space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-white font-display">Publish Video Content</h1>
        <p className="text-sm text-[#7A8BAD]">
          Publish product demonstration reels, shorts, or update videos and link them directly to products for AI-enabled automatic comment tracking.
        </p>
      </div>

      {loadingOptions ? (
        <div className="flex items-center justify-center p-20 rounded-3xl border border-[#1C2640] bg-[#0F1624]">
          <Loader2 size={32} className="animate-spin text-[#4DFFC3]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Post Composer Form */}
          <form onSubmit={handlePublishSubmit} className="lg:col-span-7 space-y-6">
            
            {/* Link Product */}
            <div className="space-y-2 p-5 rounded-2xl border border-[#1C2640] bg-[#0F1624]/60">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">
                <Link2 size={13} className="text-[#4DFFC3]" />
                <span>Link Catalog Product</span>
              </label>
              <div className="relative">
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[#080B14] border border-[#1C2640] rounded-xl text-sm text-white focus:outline-none focus:border-[#4DFFC3] appearance-none"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} — Ksh {prod.price.toLocaleString()}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#7A8BAD]">
                  <ChevronDown size={16} />
                </div>
              </div>
              <p className="text-[10px] text-[#7A8BAD]">
                AI comment replies on this video will leverage this product&apos;s price, sizes, and catalog directives.
              </p>
            </div>

            {/* Video File Upload */}
            <div className="space-y-2 p-5 rounded-2xl border border-[#1C2640] bg-[#0F1624]/60">
              <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Upload Video</label>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-[#1C2640] hover:border-[#4DFFC3] hover:bg-[#4DFFC3]/5 text-xs font-semibold text-white bg-[#080B14] cursor-pointer transition-all">
                  <Upload size={15} />
                  <span>Choose Reel/Short file</span>
                  <input
                    type="file"
                    required
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                </label>

                {videoFile ? (
                  <div className="flex-grow flex items-center justify-between p-3 rounded-xl border border-[#1C2640] bg-[#080B14]/40 text-xs text-white min-w-0">
                    <span className="truncate pr-3 font-mono">{videoFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreviewUrl(null);
                      }}
                      className="text-[#FF0050] hover:text-[#FF0050]/80 font-bold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#7A8BAD]">No video selected (Reels/Shorts formatted video recommended)</span>
                )}
              </div>
            </div>

            {/* Caption text */}
            <div className="space-y-2 p-5 rounded-2xl border border-[#1C2640] bg-[#0F1624]/60">
              <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Post Caption</label>
              <textarea
                required
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Compose description or showcase talking points..."
                className="w-full px-4 py-3.5 bg-[#080B14] border border-[#1C2640] rounded-xl text-sm text-[#F0F4FF] focus:outline-none focus:border-[#4DFFC3] placeholder-[#7A8BAD]"
              />
            </div>

            {/* Social Channels selection */}
            <div className="space-y-3 p-5 rounded-2xl border border-[#1C2640] bg-[#0F1624]/60">
              <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Publishing Channels</label>
              
              {connectedAccounts.length === 0 ? (
                <p className="text-xs text-[#FF0050]">No linked accounts found. Please link social accounts in the Integrate dashboard first.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {connectedAccounts.map((acc) => {
                    const isSelected = selectedPlatforms.includes(acc.platform);
                    return (
                      <button
                        key={acc._id}
                        type="button"
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            prev.includes(acc.platform)
                              ? prev.filter(p => p !== acc.platform)
                              : [...prev, acc.platform]
                          );
                        }}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-[#4DFFC3]/10 border-[#4DFFC3] text-white shadow-[0_0_10px_rgba(77,255,195,0.1)]"
                            : "border-[#1C2640] bg-[#080B14] text-[#7A8BAD] hover:border-[#7A8BAD]"
                        }`}
                      >
                        {getPlatformIcon(acc.platform)}
                        <span>{acc.displayName || acc.platform}</span>
                        <span className="text-[10px] text-[#7A8BAD] font-mono">({acc.username ? `@${acc.username}` : "active"})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="submit"
                disabled={publishing || connectedAccounts.length === 0 || !videoFile}
                className="px-8 py-3 bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 text-[#080B14] font-display font-bold text-xs tracking-wider rounded-xl transition-all hover:shadow-[0_0_16px_rgba(77,255,195,0.4)] disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {publishing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{uploadingMedia ? "Uploading Video..." : "Publishing..."}</span>
                  </>
                ) : (
                  <>
                    <span>Publish Video Post</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Interactive Mobile Live Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[280px] h-[560px] rounded-[36px] border-[6px] border-[#1C2640] bg-[#080B14] shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-between shrink-0">
              
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-[#1C2640] rounded-b-xl z-20" />
              
              {/* Video Player */}
              <div className="absolute inset-0 bg-[#000] flex items-center justify-center">
                {videoPreviewUrl ? (
                  <video
                    ref={videoRef}
                    src={videoPreviewUrl}
                    loop
                    muted
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2.5">
                    <div className="w-12 h-12 rounded-full border border-dashed border-[#1C2640] bg-[#0F1624] flex items-center justify-center mx-auto text-[#7A8BAD]">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs text-[#7A8BAD] font-semibold">Video preview will show here</p>
                  </div>
                )}

                {/* Video Play/Pause Overlay trigger */}
                {videoPreviewUrl && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors z-10 group"
                  >
                    {!isPlaying && (
                      <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-[#4DFFC3] shadow-lg group-hover:scale-105 transition-transform">
                        <Play size={24} fill="#4DFFC3" />
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Feed Text Overlays (Social details) */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-10 flex flex-col justify-end space-y-3 pt-12">
                
                {/* Social Handle */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <span className="w-5 h-5 rounded-full bg-[#4DFFC3] text-[#080B14] flex items-center justify-center text-[10px] font-bold">
                    {businessName[0]?.toUpperCase()}
                  </span>
                  <span>{businessName.toLowerCase().replace(/\s+/g, "")}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">Reel</span>
                </div>

                {/* Caption / Description */}
                <p className="text-[11px] text-[#F0F4FF] line-clamp-3 leading-4">
                  {caption || "Compose your caption in the editor on the left. Linked product details will auto-appear."}
                </p>

                {/* Linked Product Badge */}
                {activeProduct && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#4DFFC3]/15 border border-[#4DFFC3]/30 text-[10px] text-[#4DFFC3] font-semibold w-fit">
                    <Sparkles size={10} />
                    <span>Linked: {activeProduct.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {publishing && (
        <div className="fixed inset-0 z-50 bg-[#080B14]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in">
          <div className="bg-[#0F1624] border border-[#1C2640] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <Loader2 size={36} className="animate-spin text-[#4DFFC3] mx-auto" />
            <h3 className="font-display font-bold text-white text-lg">
              {uploadingMedia ? "Uploading Video..." : "Publishing Post..."}
            </h3>
            {uploadingMedia && (
              <div className="space-y-2">
                <div className="w-full bg-[#080B14] rounded-full h-2.5 overflow-hidden border border-[#1C2640]">
                  <div 
                    className="bg-[#4DFFC3] h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-[#7A8BAD]">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
            <p className="text-xs text-[#7A8BAD]">
              Please keep this page open while we link your product catalog and dispatch to the social platforms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
