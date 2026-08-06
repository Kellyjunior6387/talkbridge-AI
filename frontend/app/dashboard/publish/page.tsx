"use client";

import React, { useEffect, useState, useRef, Suspense, useCallback } from "react";
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
  ChevronDown,
  Video,
  ExternalLink
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
  id?: string;
  platform: "instagram" | "tiktok" | "twitter";
  username?: string;
  displayName?: string;
}

interface PublishedPost {
  id: string;
  content: string;
  media_items?: Array<{ type: string; url: string; title?: string }>;
  status: string;
  created_at: string;
  metadata?: {
    productId?: string;
    productName?: string;
  };
}

function PublishContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  // Sub Navigation Tabs: "create" (New Post Form) or "history" (Published Posts)
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  const [products, setProducts] = useState<Product[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);

  // Post Creator States
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "tiktok"]);
  const [caption, setCaption] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [businessName, setBusinessName] = useState("Threads Kenya");

  const fetchOptionsAndAccounts = useCallback(async (uid: string) => {
    setLoadingOptions(true);
    try {
      const prodRes = await fetch(`${API_BASE_URL}/api/zernio/products/${uid}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const mappedProds = prodData.map((p: { id: string; name: string; description?: string; price: number; image_url?: string | null; platforms?: string[] }) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: p.price,
          image: p.image_url,
          platforms: p.platforms || []
        }));
        setProducts(mappedProds);
        
        if (mappedProds.length > 0) {
          const queryProductId = searchParams.get("productId");
          if (queryProductId && mappedProds.some((p: Product) => p.id === queryProductId)) {
            setSelectedProductId(queryProductId);
            const activeProd = mappedProds.find((p: Product) => p.id === queryProductId);
            if (activeProd) {
              setCaption(`🔥 Back in Stock! Check out the brand new ${activeProd.name}.\n\n💰 Price: Ksh ${activeProd.price.toLocaleString()}\n📏 Available in standard sizes.\n\nDM us directly or comment below to order yours instantly! 🚀`);
            }
          } else {
            setSelectedProductId(mappedProds[0].id);
            setCaption(`🔥 Back in Stock! Check out the brand new ${mappedProds[0].name}.\n\n💰 Price: Ksh ${mappedProds[0].price.toLocaleString()}\n📏 Available in standard sizes.\n\nDM us directly or comment below to order yours instantly! 🚀`);
          }
        }
      }

      const accRes = await fetch(`${API_BASE_URL}/api/zernio/accounts`);
      if (accRes.ok) {
        const accData = await accRes.json();
        const list = Array.isArray(accData) ? accData : accData.accounts || [];
        setConnectedAccounts(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOptions(false);
    }
  }, [searchParams]);

  const fetchHistory = useCallback(async (uid: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/zernio/posts/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setPublishedPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");
        fetchOptionsAndAccounts(session.user.id);
        fetchHistory(session.user.id);
      }
    });
  }, [fetchOptionsAndAccounts, fetchHistory]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const activeProduct = products.find(p => p.id === prodId);
    if (activeProduct) {
      setCaption(`🔥 Back in Stock! Check out the brand new ${activeProduct.name}.\n\n💰 Price: Ksh ${activeProduct.price.toLocaleString()}\n\nDM us directly or comment below to order yours instantly! 🚀`);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setIsPlaying(true);
    }
  };

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

  // Real upload publisher
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !selectedProductId || selectedPlatforms.length === 0) {
      showToast("Please ensure a video file, linked product, and target platforms are selected.", "error");
      return;
    }
    if (!userId) {
      showToast("User not authenticated.", "error");
      return;
    }

    setPublishing(true);
    setUploadingMedia(true);
    setUploadProgress(10);

    try {
      // Step 1: Get signed upload credentials
      const uploadLinkRes = await fetch(`${API_BASE_URL}/api/zernio/media/supabase-upload-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: videoFile.name })
      });
      if (!uploadLinkRes.ok) {
        throw new Error("Failed to generate secure upload path.");
      }
      const { signedUrl, publicUrl } = await uploadLinkRes.json();
      setUploadProgress(40);

      // Step 2: Upload to Supabase Storage Bucket
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": videoFile.type
        },
        body: videoFile
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload media content.");
      }
      setUploadProgress(80);
      setUploadingMedia(false);

      // Step 3: Create post record
      const res = await fetch(`${API_BASE_URL}/api/zernio/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId: selectedProductId,
          content: caption,
          platforms: selectedPlatforms,
          mediaItems: [
            {
              type: "video",
              url: publicUrl
            }
          ],
          accountIds: connectedAccounts.reduce((acc, curr) => {
            acc[curr.platform] = curr._id || curr.id || "";
            return acc;
          }, {} as Record<string, string>)
        })
      });

      if (res.ok) {
        showToast("Video reel successfully posted and webhook comment listeners subscribed!", "success");
        setVideoFile(null);
        setVideoPreviewUrl(null);
        setActiveTab("history");
        fetchHistory(userId);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to publish post through channels.");
      }
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Error publishing post.", "error");
    } finally {
      setPublishing(false);
      setUploadingMedia(false);
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Social Posts Composer</h1>
          <p className="text-sm text-slate-500">
            Publish demonstration reels, link products for automatic AI replying, and review published feeds.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "create"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Create New Post
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Published History ({publishedPosts.length})
        </button>
      </div>

      {/* CREATE POST CONTENT */}
      {activeTab === "create" && (
        <>
          {loadingOptions ? (
            <div className="flex items-center justify-center p-20 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Post Composer Form */}
              <form onSubmit={handlePublishSubmit} className="lg:col-span-7 space-y-6">
                
                {/* Link Product */}
                <div className="space-y-2 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Link2 size={13} className="text-blue-600" />
                    <span>Link Catalog Product</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 appearance-none font-medium"
                    >
                      <option value="" disabled>Select a catalog item...</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} — Ksh {prod.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-550 leading-relaxed">
                    AI comment replies on this post will reference this product&apos;s prices, sizing details, and directives.
                  </p>
                </div>

                {/* Video File Upload */}
                <div className="space-y-2 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Video</label>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer transition-all">
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
                      <div className="flex-grow flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 min-w-0 font-mono">
                        <span className="truncate pr-3">{videoFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoFile(null);
                            setVideoPreviewUrl(null);
                          }}
                          className="text-red-500 hover:text-red-650 font-bold transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No video selected</span>
                    )}
                  </div>
                </div>

                {/* Caption text */}
                <div className="space-y-2 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Post Caption</label>
                  <textarea
                    required
                    rows={5}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Compose description or showcase talking points..."
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600 placeholder:text-slate-400 font-medium"
                  />
                </div>

                {/* Social Channels selection */}
                <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Publishing Channels</label>
                  
                  {connectedAccounts.length === 0 ? (
                    <p className="text-xs text-red-500">No linked accounts found. Please link social accounts in the Integrate dashboard first.</p>
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
                                ? "bg-blue-50 border-blue-600 text-blue-650 shadow-sm"
                                : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400 hover:text-slate-800"
                            }`}
                          >
                            {getPlatformIcon(acc.platform)}
                            <span>{acc.displayName || acc.platform}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({acc.username ? `@${acc.username}` : "active"})</span>
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
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs tracking-wider rounded-xl transition-all hover:shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-50 flex items-center gap-2 shrink-0"
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
                <div className="w-[280px] h-[560px] rounded-[36px] border-[6px] border-slate-800 bg-black shadow-xl relative overflow-hidden flex flex-col justify-between shrink-0">
                  
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-slate-800 rounded-b-xl z-20" />
                  
                  {/* Video Player */}
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
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
                        <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                          <Upload size={18} />
                        </div>
                        <p className="text-xs text-slate-500 font-semibold">Video preview</p>
                      </div>
                    )}

                    {/* Play/Pause Overlay */}
                    {videoPreviewUrl && (
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors z-10 group"
                      >
                        {!isPlaying && (
                          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-blue-500 shadow-lg group-hover:scale-105 transition-transform">
                            <Play size={24} fill="#3B82F6" className="text-blue-500" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Feed Text Overlays */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-10 flex flex-col justify-end space-y-3 pt-12">
                    
                    {/* Social Handle */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {businessName[0]?.toUpperCase()}
                      </span>
                      <span>{businessName.toLowerCase().replace(/\s+/g, "")}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">Reel</span>
                    </div>

                    {/* Caption */}
                    <p className="text-[11px] text-slate-200 line-clamp-3 leading-4 font-medium">
                      {caption || "Compose your caption in the editor on the left. Linked product details will auto-appear."}
                    </p>

                    {/* Linked Product Badge */}
                    {activeProduct && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-400 font-semibold w-fit">
                        <Sparkles size={10} />
                        <span>Linked: {activeProduct.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* PUBLISHED HISTORY CONTENT */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 font-mono text-sm">
              <span className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>Loading published posts history...</span>
            </div>
          ) : publishedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white border border-dashed border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Video size={30} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-slate-900">No posts published yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Switch to the &quot;Create New Post&quot; tab to compose and publish your first video demonstration reel!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {publishedPosts.map((post) => {
                const mediaItem = post.media_items?.[0];
                return (
                  <div 
                    key={post.id} 
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      {/* Video Thumbnail / Preview */}
                      <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden flex items-center justify-center group">
                        {mediaItem?.url ? (
                          <video 
                            src={mediaItem.url} 
                            preload="metadata"
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-500 flex flex-col items-center gap-1">
                            <Video size={24} />
                            <span className="text-[10px] font-mono">No Media Preview</span>
                          </div>
                        )}
                        {/* Status badge */}
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono uppercase tracking-wider font-bold">
                          {post.status}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs text-slate-500 font-mono font-bold">
                          {new Date(post.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-sm text-slate-800 line-clamp-3 leading-relaxed font-semibold">
                          {post.content}
                        </p>
                      </div>
                    </div>

                    {/* Linked Catalog Product Footer */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                      {post.metadata?.productName ? (
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                          <Sparkles size={12} className="text-blue-500" />
                          <span className="truncate max-w-[150px]">Linked: {post.metadata.productName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium">Unlinked Post</span>
                      )}
                      
                      {mediaItem?.url && (
                        <a 
                          href={mediaItem.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-semibold"
                        >
                          View Media <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PUBLISHING MODAL OVERLAY */}
      {publishing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
            <h3 className="font-display font-bold text-slate-900 text-lg">
              {uploadingMedia ? "Uploading Video..." : "Publishing Post..."}
            </h3>
            {uploadingMedia && (
              <div className="space-y-2">
                <div className="w-full bg-slate-150 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-slate-500 font-bold">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
            <p className="text-xs text-slate-400 font-semibold">
              Please keep this page open while we catalog your assets and dispatch to the social platforms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublishVideoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500 font-mono">
        Loading Posts Composer...
      </div>
    }>
      <PublishContent />
    </Suspense>
  );
}
