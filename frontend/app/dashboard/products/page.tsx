"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../layout";
import { API_BASE_URL } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import { 
  Package, 
  Plus, 
  Trash2, 
  X, 
  Upload, 
  ChevronDown, 
  ChevronUp, 
  Edit,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SizeItem {
  size: string;
  qty: number;
  inStock: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  sizes: SizeItem[];
  platforms: ("instagram" | "tiktok" | "whatsapp")[];
  aiReference: boolean;
  aiInstructions?: string;
}

interface BackendProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string | null;
  sizes?: SizeItem[];
  platforms?: string[];
  ai_reference?: boolean;
  ai_instructions?: string | null;
}

export default function ProductCataloguePage() {
  const { showToast } = useToast();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/zernio/products/${uid}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((p: BackendProduct) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: p.price,
          image: p.image_url,
          sizes: p.sizes || [],
          platforms: p.platforms || [],
          aiReference: p.ai_reference !== false,
          aiInstructions: p.ai_instructions || ""
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchProducts(session.user.id);
      }
    });
  }, [fetchProducts]);

  // Modal control state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formSizes, setFormSizes] = useState<SizeItem[]>([]);
  const [formPlatforms, setFormPlatforms] = useState<("instagram" | "tiktok" | "whatsapp")[]>([]);
  const [formAiInstructions, setFormAiInstructions] = useState("");

  const [advancedOpen, setAdvancedOpen] = useState(false);

  // File input ref for image uploading
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Image Uploading
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  // States for Product Saving Loader
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");

  // States for Quick Stock Edit
  const [quickStockOpen, setQuickStockOpen] = useState(false);
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockIndex, setQuickStockIndex] = useState<number>(-1);
  const [quickStockQty, setQuickStockQty] = useState<number>(0);
  const [quickStockInStock, setQuickStockInStock] = useState<boolean>(true);
  const [quickStockSaving, setQuickStockSaving] = useState(false);

  const handleOpenPostModal = (product: Product) => {
    router.push(`/dashboard/publish?productId=${product.id}`);
  };

  // Handle Toggle AI reference directly in grid
  const handleToggleReference = async (id: string, name: string, currentVal: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ ai_reference: !currentVal })
        .eq("id", id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, aiReference: !currentVal } : p));
      showToast(`AI reference for ${name} ${!currentVal ? "enabled" : "disabled"}.`, "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to update AI reference configuration.", "error");
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(`${name} removed from catalogue.`, "error");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete product from database.", "error");
    }
  };

  // Open modal for new product
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormImage(null);
    setFormSizes([{ size: "M", qty: 5, inStock: true }]);
    setFormPlatforms(["instagram", "tiktok"]);
    setFormAiInstructions("");
    setAdvancedOpen(false);
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (prod: Product) => {
    setIsEditing(true);
    setEditingId(prod.id);
    setFormName(prod.name);
    setFormDesc(prod.description);
    setFormPrice(prod.price.toString());
    setFormImage(prod.image);
    setFormSizes([...prod.sizes]);
    setFormPlatforms([...prod.platforms]);
    setFormAiInstructions(prod.aiInstructions || "");
    setAdvancedOpen(!!prod.aiInstructions);
    setModalOpen(true);
  };

  // Form Sizes changes
  const handleAddFormSize = () => {
    setFormSizes(prev => [...prev, { size: "L", qty: 10, inStock: true }]);
  };

  const handleDeleteFormSize = (index: number) => {
    setFormSizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSizeChange = (index: number, field: keyof SizeItem, value: string | number | boolean) => {
    setFormSizes(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  // Form platforms change
  const handleFormPlatformChange = (plat: "instagram" | "tiktok" | "whatsapp") => {
    setFormPlatforms(prev => 
      prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
    );
  };

  // Handle Real Image Upload to Supabase Storage
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB", "error");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadProgress(10);
    try {
      // Step 1: Request signed upload url
      const res = await fetch(`${API_BASE_URL}/api/zernio/media/supabase-upload-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, folder: "products" })
      });

      if (!res.ok) {
        throw new Error("Failed to get signed upload URL");
      }

      const { signedUrl, publicUrl } = await res.json();
      setImageUploadProgress(30);

      // Step 2: Upload using XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          // Scale from 30% to 90%
          setImageUploadProgress(30 + Math.round(percentComplete * 0.6));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setImageUploadProgress(100);
      setFormImage(publicUrl);
      showToast("Product image uploaded successfully!", "success");
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast(`Upload failed: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setIsUploadingImage(false);
      setImageUploadProgress(0);
      // Reset input value to allow selecting same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Quick stock edit triggering
  const handleQuickEditStock = (product: Product, sizeIdx: number) => {
    const sizeItem = product.sizes[sizeIdx];
    if (!sizeItem) return;
    setQuickStockProduct(product);
    setQuickStockIndex(sizeIdx);
    setQuickStockQty(sizeItem.qty);
    setQuickStockInStock(sizeItem.inStock);
    setQuickStockOpen(true);
  };

  // Save quick stock changes directly to database and update state
  const handleSaveQuickStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStockProduct || quickStockIndex === -1) return;

    setQuickStockSaving(true);
    try {
      const updatedSizes = quickStockProduct.sizes.map((s, i) => 
        i === quickStockIndex ? { ...s, qty: quickStockQty, inStock: quickStockInStock } : s
      );

      const { error } = await supabase
        .from("products")
        .update({ sizes: updatedSizes })
        .eq("id", quickStockProduct.id);

      if (error) throw error;

      // Update local state instantly for optimal UX
      setProducts(prev => prev.map(p => 
        p.id === quickStockProduct.id ? { ...p, sizes: updatedSizes } : p
      ));

      showToast(`Stock for size ${quickStockProduct.sizes[quickStockIndex].size} updated successfully!`, "success");
      setQuickStockOpen(false);
    } catch (err) {
      console.error("Failed to update stock:", err);
      showToast(`Failed to update stock: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setQuickStockSaving(false);
    }
  };

  // Save changes via backend API (with loaders and progress notification)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }
    if (!formName || !formPrice) {
      showToast("Please fill in required fields", "error");
      return;
    }

    setIsSaving(true);
    setSavingStatus(isEditing ? "Updating product details..." : "Generating product instructions via AI...");
    const priceNum = parseFloat(formPrice) || 0;
    try {
      if (isEditing && editingId) {
        // Direct Supabase update for editing
        const { error } = await supabase
          .from("products")
          .update({
            name: formName,
            description: formDesc,
            price: priceNum,
            sizes: formSizes,
            platforms: formPlatforms,
            image_url: formImage,
            ai_instructions: formAiInstructions
          })
          .eq("id", editingId);
        if (error) throw error;
        showToast(`${formName} updated successfully in catalogue!`, "success");
      } else {
        // Create new product via Zernio endpoint
        const res = await fetch(`${API_BASE_URL}/api/zernio/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: formName,
            description: formDesc,
            price: priceNum,
            sizes: formSizes,
            platforms: formPlatforms,
            imageUrl: formImage,
            aiInstructions: formAiInstructions
          })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create product");
        }
        showToast(`${formName} saved successfully to catalogue!`, "success");
      }
      setModalOpen(false);
      fetchProducts(userId);
    } catch (err) {
      console.error(err);
      showToast(`Error saving product: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setIsSaving(false);
      setSavingStatus("");
    }
  };

  // Stock status calculator helper
  const getStockStatus = (sizes: SizeItem[]) => {
    const totalQty = sizes.reduce((sum, s) => sum + (s.inStock ? s.qty : 0), 0);
    if (totalQty === 0) return { label: "OUT OF STOCK", color: "bg-red-55 text-red-600 border-red-200" };
    if (totalQty < 5) return { label: "LOW STOCK", color: "bg-orange-50 text-orange-600 border-orange-200" };
    return { label: "IN STOCK", color: "bg-blue-50 text-blue-600 border-blue-200" };
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-16 relative text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">Product Catalogue</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            The AI references this catalog to automatically reply to comments about prices, sizing options, and channel stock.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm tracking-wide rounded-full transition-all hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const stock = getStockStatus(product.sizes);
          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5"
            >
              
              {/* Top Section */}
              <div className="relative">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-44 object-cover border-b border-slate-100"
                  />
                ) : (
                  <div className="w-full h-44 bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-b border-slate-100 gap-2">
                    <Package size={32} />
                    <span className="text-xs font-mono font-bold">NO PRODUCT PHOTO</span>
                  </div>
                )}
                
                {/* Stock Level Badge */}
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${stock.color}`}>
                  {stock.label}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 flex-grow space-y-4">
                <div>
                  <h3 className="font-display font-bold text-[16px] text-slate-900 leading-normal truncate">{product.name}</h3>
                  <p className="text-blue-600 font-display font-bold text-lg mt-0.5">Ksh {product.price.toLocaleString()}</p>
                </div>

                {/* Sizes Row */}
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((sz, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickEditStock(product, idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all hover:scale-105 border ${
                        sz.inStock 
                          ? "bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-300" 
                          : "bg-red-50 hover:bg-red-100 text-red-550/80 hover:text-red-650 line-through border-red-100 hover:border-red-200"
                      }`}
                      title="Click to quick update stock"
                    >
                      {sz.size} {sz.qty > 0 && `×${sz.qty}`}
                    </button>
                  ))}
                </div>

                {/* Platform Dots */}
                <div className="flex gap-2 items-center text-[11px] font-mono text-slate-500 font-bold">
                  <span>Channels:</span>
                  <div className="flex gap-1.5">
                    {product.platforms.map((plat) => (
                      <span
                        key={plat}
                        className={`w-2.5 h-2.5 rounded-full`}
                        style={{
                          backgroundColor: plat === "instagram" ? "#E1306C" : plat === "tiktok" ? "#FF0050" : "#25D366"
                        }}
                        title={plat}
                      />
                    ))}
                  </div>
                </div>

                {/* AI reference switch */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800">AI catalog reference</span>
                    <span className="text-[10px] text-slate-400 font-semibold">AI auto-replies reference this item</span>
                  </div>
                  <button
                    onClick={() => handleToggleReference(product.id, product.name, product.aiReference)}
                    className={`w-10 h-5.5 rounded-full relative p-0.5 transition-colors focus:outline-none ${
                      product.aiReference ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span className={`block w-4.5 h-4.5 rounded-full bg-white transition-all transform ${
                      product.aiReference ? "translate-x-4.5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between gap-2">
                <button
                  onClick={() => handleOpenEditModal(product)}
                  className="flex-grow py-2 border border-slate-200 hover:border-blue-600 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white rounded-full flex items-center justify-center gap-1 transition-all"
                >
                  <Edit size={12} /> Edit Item
                </button>
                <button
                  onClick={() => handleOpenPostModal(product)}
                  className="px-4 py-2 border border-blue-200 text-blue-650 hover:bg-blue-50 text-xs font-semibold rounded-full transition-all"
                >
                  Post Reel
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  className="p-2 border border-slate-200 hover:border-red-500 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="Delete product"
                >
                  <Trash2 size={13} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-[520px] shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-display font-bold text-lg text-slate-900">
                {isEditing ? `Edit ${formName}` : "Add New Product"}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
              
              {/* Product name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Cargo Hoodie"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Streetwear details..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (Ksh)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-xs font-mono text-slate-455 font-bold">Ksh</span>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="2800"
                    className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {/* Sizes section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Sizes inventory</label>
                  <button
                    type="button"
                    onClick={handleAddFormSize}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    + Add size
                  </button>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {formSizes.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Size"
                        required
                        value={row.size}
                        onChange={(e) => handleFormSizeChange(idx, "size", e.target.value)}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 text-center rounded text-xs text-slate-850 font-bold focus:outline-none"
                      />
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-455 font-mono font-bold">QTY:</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={row.qty}
                          onChange={(e) => handleFormSizeChange(idx, "qty", parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 bg-white border border-slate-200 text-center rounded text-xs text-slate-850 font-bold focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFormSizeChange(idx, "inStock", !row.inStock)}
                        className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors ${
                          row.inStock 
                            ? "bg-blue-50 text-blue-600 border-blue-200" 
                            : "bg-red-50 text-red-500 border-red-200"
                        }`}
                      >
                        {row.inStock ? "IN STOCK" : "OUT OF STOCK"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFormSize(idx)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-auto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channels checkboxes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Available on Channels</label>
                <div className="flex gap-4">
                  {["instagram", "tiktok", "whatsapp"].map((plat) => {
                    const isChecked = formPlatforms.includes(plat as "instagram" | "tiktok" | "whatsapp");
                    return (
                      <label key={plat} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFormPlatformChange(plat as "instagram" | "tiktok" | "whatsapp")}
                          className="accent-blue-600 rounded border-slate-200"
                        />
                        <span className="capitalize">{plat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Image Uploader */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Product image</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                {isUploadingImage ? (
                  <div className="border border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center gap-2 bg-slate-50">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">Uploading image... {imageUploadProgress}%</span>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${imageUploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : formImage ? (
                  <div className="relative rounded-lg border border-slate-200 overflow-hidden h-28 flex items-center justify-center bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formImage} alt="Preview" className="h-full object-contain" />
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setFormImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={handleImageClick}
                    className="border border-dashed border-slate-200 hover:border-blue-600/50 rounded-lg p-5 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col items-center gap-1"
                  >
                    <Upload size={18} className="text-slate-455" />
                    <span className="text-xs text-slate-800 font-bold">Drop image or click to upload</span>
                    <span className="text-[10px] text-slate-500">JPG, PNG UP TO 5MB</span>
                  </div>
                )}
              </div>

              {/* Advanced AI instructions collapsible */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex items-center gap-1.5 text-xs font-mono text-indigo-650 hover:underline uppercase tracking-wider font-bold"
                >
                  Advanced AI Instructions {advancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {advancedOpen && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-[11px] font-mono text-slate-455 font-bold uppercase">AI product guidelines</label>
                    <textarea
                      value={formAiInstructions}
                      onChange={(e) => setFormAiInstructions(e.target.value)}
                      placeholder="Always mention that we offer free gift wrapping for orders over Ksh 5,000."
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Buttons / Loader */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-semibold">{savingStatus || "Processing..."}</span>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3 w-full">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs tracking-wide rounded-full transition-all hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                    >
                      {isEditing ? "Save Changes" : "Save Product"}
                    </button>
                  </div>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK EDIT MODAL */}
      {quickStockOpen && quickStockProduct && quickStockIndex !== -1 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-[360px] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-display font-bold text-sm text-slate-900">
                Update Stock: {quickStockProduct.name}
              </h2>
              <button 
                onClick={() => setQuickStockOpen(false)}
                className="text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveQuickStock} className="p-5 space-y-4">
              <div className="text-xs text-slate-500 font-medium">
                Adjusting inventory for size: <span className="font-bold text-slate-800">{quickStockProduct.sizes[quickStockIndex].size}</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={quickStockQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setQuickStockQty(val);
                    if (val === 0) {
                      setQuickStockInStock(false);
                    } else {
                      setQuickStockInStock(true);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-700">Availability Status</span>
                <button
                  type="button"
                  onClick={() => setQuickStockInStock(!quickStockInStock)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                    quickStockInStock 
                      ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" 
                      : "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
                  }`}
                >
                  {quickStockInStock ? "IN STOCK" : "OUT OF STOCK"}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={quickStockSaving}
                  onClick={() => setQuickStockOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickStockSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs tracking-wide rounded-lg transition-all hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {quickStockSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Stock"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
