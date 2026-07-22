"use client";

import React, { useState } from "react";
import { useToast } from "../layout";
import { 
  Package, 
  Plus, 
  Trash2, 
  X, 
  Upload, 
  ChevronDown, 
  ChevronUp, 
  Edit 
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { API_BASE_URL } from "../../../lib/api";

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

export default function ProductCataloguePage() {
  const { showToast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Products list state
  const [products, setProducts] = useState<Product[]>([
    {
      id: "prod-1",
      name: "Cargo Hoodie",
      description: "Premium heavy cotton streetwear hoodie, hand-stitched in Nairobi.",
      price: 2800,
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80",
      sizes: [
        { size: "S", qty: 4, inStock: true },
        { size: "M", qty: 2, inStock: true },
        { size: "L", qty: 5, inStock: true },
        { size: "XL", qty: 0, inStock: false }
      ],
      platforms: ["instagram", "tiktok", "whatsapp"],
      aiReference: true,
      aiInstructions: "Always mention that we offer free gift wrapping for orders over Ksh 5,000."
    },
    {
      id: "prod-2",
      name: "Sleek Streetwear Tee",
      description: "Lightweight oversized graphic print tee.",
      price: 1500,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      sizes: [
        { size: "S", qty: 12, inStock: true },
        { size: "M", qty: 1, inStock: true },
        { size: "L", qty: 0, inStock: false }
      ],
      platforms: ["instagram", "tiktok"],
      aiReference: true
    },
    {
      id: "prod-3",
      name: "Threads Denim Jacket",
      description: "Distressed style denim outerwear with Nairobi crest print on the back.",
      price: 4200,
      image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80",
      sizes: [
        { size: "M", qty: 0, inStock: false },
        { size: "L", qty: 0, inStock: false }
      ],
      platforms: ["instagram", "whatsapp"],
      aiReference: false
    }
  ]);

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

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUserId(data.user?.id || null);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle Toggle AI reference directly in grid
  const handleToggleReference = (id: string, name: string, currentVal: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, aiReference: !currentVal } : p));
    showToast(`AI reference for ${name} ${!currentVal ? "enabled" : "disabled"}.`, "info");
  };

  // Delete product
  const handleDeleteProduct = (id: string, name: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast(`${name} removed from catalogue.`, "error");
  };

  const handlePublishProduct = async (product: Product) => {
    if (!userId) {
      showToast("No active session found.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/zernio/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId: product.id,
          content: `${product.name} is now available for Ksh ${product.price.toLocaleString()}. ${product.aiInstructions || product.description}`,
          platforms: product.platforms,
          publishNow: true,
          mediaItems: product.image ? [{ type: "image", url: product.image, title: product.name, altText: product.description }] : []
        })
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Failed to publish product post");
      }

      showToast(`${product.name} published via Zernio.`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to publish product post", "error");
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

  // Mock image upload
  const handleMockUpload = () => {
    setFormImage("https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80");
  };

  // Save changes
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast("Please fill in required fields", "error");
      return;
    }

    const priceNum = parseFloat(formPrice) || 0;

    try {
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
          aiInstructions: formAiInstructions,
        })
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Failed to save product");
      }

      const payload = await res.json();
      const saved = payload.product;

      const mapped: Product = {
        id: saved.id,
        name: saved.name,
        description: saved.description,
        price: saved.price,
        image: saved.image_url,
        sizes: saved.sizes || [],
        platforms: saved.platforms || [],
        aiReference: true,
        aiInstructions: saved.ai_instructions || ""
      };

      setProducts(prev => isEditing && editingId
        ? prev.map(p => p.id === editingId ? mapped : p)
        : [...prev, mapped]);

      showToast(`${formName} saved successfully!`, "success");
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save product", "error");
    }
  };

  // Stock status calculator helper
  const getStockStatus = (sizes: SizeItem[]) => {
    const totalQty = sizes.reduce((sum, s) => sum + (s.inStock ? s.qty : 0), 0);
    if (totalQty === 0) return { label: "OUT OF STOCK", color: "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30" };
    if (totalQty < 5) return { label: "LOW STOCK", color: "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30" };
    return { label: "IN STOCK", color: "bg-[#4DFFC3]/15 text-[#4DFFC3] border-[#4DFFC3]/30" };
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto pb-16 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1C2640] pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Product Catalogue</h1>
          <p className="text-sm text-[#7A8BAD] mt-1">
            The AI uses this database to answer customer questions about price, sizes, and stock availability.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 text-[#080B14] font-display font-bold text-sm tracking-wide rounded-full transition-all hover:shadow-[0_0_12px_rgba(77,255,195,0.3)] flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
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
              className="bg-[#0F1624] border border-[#1C2640] rounded-xl flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:border-[#4DFFC3] hover:shadow-[0_0_15px_rgba(77,255,195,0.05)]"
            >
              
              {/* Top Section */}
              <div className="relative">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-44 object-cover border-b border-[#1C2640]/50"
                  />
                ) : (
                  <div className="w-full h-44 bg-[#080B14] flex flex-col items-center justify-center text-[#7A8BAD] border-b border-[#1C2640]/50 gap-2">
                    <Package size={32} />
                    <span className="text-xs font-mono">NO PRODUCT PHOTO</span>
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
                  <h3 className="font-display font-bold text-[16px] text-white leading-normal truncate">{product.name}</h3>
                  <p className="text-[#4DFFC3] font-display font-bold text-lg mt-0.5">Ksh {product.price.toLocaleString()}</p>
                </div>

                {/* Sizes Row */}
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((sz, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sz.inStock 
                          ? "bg-[#162033] text-[#F0F4FF] border border-[#1C2640]" 
                          : "bg-[#FF6B6B]/10 text-[#FF6B6B]/60 line-through border border-[#FF6B6B]/15"
                      }`}
                    >
                      {sz.size} {sz.qty > 0 && `×${sz.qty}`}
                    </span>
                  ))}
                </div>

                {/* Platform Dots */}
                <div className="flex gap-2 items-center text-[11px] font-mono text-[#7A8BAD]">
                  <span>Channels:</span>
                  <div className="flex gap-1.5">
                    {product.platforms.map((plat) => (
                      <span
                        key={plat}
                        className={`w-2 h-2 rounded-full`}
                        style={{
                          backgroundColor: plat === "instagram" ? "#E1306C" : plat === "tiktok" ? "#FF0050" : "#25D366"
                        }}
                        title={plat}
                      />
                    ))}
                  </div>
                </div>

                {/* AI reference switch */}
                <div className="pt-3 border-t border-[#1C2640]/55 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">AI catalog check</span>
                    <span className="text-[10px] text-[#7A8BAD]">AI can reference this item</span>
                  </div>
                  <button
                    onClick={() => handleToggleReference(product.id, product.name, product.aiReference)}
                    className={`w-10 h-5.5 rounded-full relative p-0.5 transition-colors focus:outline-none ${
                      product.aiReference ? "bg-[#4DFFC3]" : "bg-[#1C2640]"
                    }`}
                  >
                    <span className={`block w-4.5 h-4.5 rounded-full bg-[#080B14] transition-all transform ${
                      product.aiReference ? "translate-x-4.5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-[#080B14]/40 border-t border-[#1C2640] flex justify-between gap-2">
                <button
                  onClick={() => handleOpenEditModal(product)}
                  className="flex-grow py-2 border border-[#1C2640] hover:border-[#4DFFC3] text-xs font-semibold text-white hover:text-[#4DFFC3] rounded-full flex items-center justify-center gap-1 transition-all"
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handlePublishProduct(product)}
                  className="px-3 py-2 border border-[#1C2640] hover:border-[#4DFFC3] text-xs font-semibold text-[#4DFFC3] rounded-full transition-all"
                >
                  Post
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  className="p-2 border border-[#1C2640] hover:border-[#FF6B6B] text-[#7A8BAD] hover:text-[#FF6B6B] rounded-full transition-all"
                  title="Delete"
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
        <div className="fixed inset-0 z-50 bg-[#080B14]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1624] border border-[#1C2640] rounded-2xl w-full max-w-[520px] shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1C2640] flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-white">
                {isEditing ? `Edit ${formName}` : "Add product"}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-[#7A8BAD] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
              
              {/* Product name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Cargo Hoodie"
                  className="w-full px-4 py-2 bg-[#080B14] border border-[#1C2640] rounded-lg text-sm text-[#F0F4FF] focus:outline-none focus:border-[#4DFFC3]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Streetwear details..."
                  rows={3}
                  className="w-full px-4 py-2 bg-[#080B14] border border-[#1C2640] rounded-lg text-sm text-[#F0F4FF] focus:outline-none focus:border-[#4DFFC3]"
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Price (Ksh)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-xs font-mono text-[#7A8BAD]">Ksh</span>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="2800"
                    className="w-full pl-12 pr-4 py-2 bg-[#080B14] border border-[#1C2640] rounded-lg text-sm text-[#F0F4FF] focus:outline-none focus:border-[#4DFFC3]"
                  />
                </div>
              </div>

              {/* Sizes section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Sizes inventory</label>
                  <button
                    type="button"
                    onClick={handleAddFormSize}
                    className="text-xs text-[#4DFFC3] hover:underline flex items-center gap-1"
                  >
                    + Add size
                  </button>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {formSizes.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#080B14] p-2 rounded-lg border border-[#1C2640]/60">
                      <input
                        type="text"
                        placeholder="Size"
                        required
                        value={row.size}
                        onChange={(e) => handleFormSizeChange(idx, "size", e.target.value)}
                        className="w-16 px-2 py-1 bg-[#0F1624] border border-[#1C2640] text-center rounded text-xs text-[#F0F4FF] focus:outline-none"
                      />
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#7A8BAD] font-mono">QTY:</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={row.qty}
                          onChange={(e) => handleFormSizeChange(idx, "qty", parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 bg-[#0F1624] border border-[#1C2640] text-center rounded text-xs text-[#F0F4FF] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFormSizeChange(idx, "inStock", !row.inStock)}
                        className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors ${
                          row.inStock 
                            ? "bg-[#4DFFC3]/15 text-[#4DFFC3] border-[#4DFFC3]/30" 
                            : "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30"
                        }`}
                      >
                        {row.inStock ? "IN STOCK" : "OUT OF STOCK"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFormSize(idx)}
                        className="p-1 hover:text-[#FF6B6B] transition-colors ml-auto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channels checkboxes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Available on Channels</label>
                <div className="flex gap-4">
                  {["instagram", "tiktok", "whatsapp"].map((plat) => {
                    const isChecked = formPlatforms.includes(plat as "instagram" | "tiktok" | "whatsapp");
                    return (
                      <label key={plat} className="flex items-center gap-2 text-xs text-[#F0F4FF] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFormPlatformChange(plat as "instagram" | "tiktok" | "whatsapp")}
                          className="accent-[#4DFFC3] rounded border-[#1C2640] bg-[#080B14]"
                        />
                        <span className="capitalize">{plat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Image Uploader */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#7A8BAD] uppercase tracking-wider">Product image</label>
                {formImage ? (
                  <div className="relative rounded-lg border border-[#1C2640] overflow-hidden h-28 flex items-center justify-center bg-[#080B14]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formImage} alt="Preview" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/80 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={handleMockUpload}
                    className="border border-dashed border-[#1C2640] hover:border-[#4DFFC3]/50 rounded-lg p-5 text-center cursor-pointer bg-[#080B14] hover:bg-[#080B14]/60 transition-all flex flex-col items-center gap-1"
                  >
                    <Upload size={18} className="text-[#7A8BAD]" />
                    <span className="text-xs text-white">Drop image or click to upload</span>
                    <span className="text-[10px] text-[#7A8BAD]">JPG, PNG UP TO 5MB</span>
                  </div>
                )}
              </div>

              {/* Advanced AI instructions collapsible */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#7B6EF6] hover:underline uppercase tracking-wider"
                >
                  Advanced AI Instructions {advancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {advancedOpen && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-[11px] font-mono text-[#7A8BAD] uppercase">AI product guidelines</label>
                    <textarea
                      value={formAiInstructions}
                      onChange={(e) => setFormAiInstructions(e.target.value)}
                      placeholder="Always mention that we offer free gift wrapping for orders over Ksh 5,000."
                      rows={2}
                      className="w-full px-4 py-2 bg-[#080B14] border border-[#1C2640] rounded-lg text-sm text-[#F0F4FF] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-[#1C2640] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#1C2640] hover:border-[#FF6B6B] hover:text-[#FF6B6B] text-xs font-semibold font-display text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#4DFFC3] hover:bg-[#4DFFC3]/90 text-[#080B14] font-display font-bold text-xs tracking-wide rounded-full transition-all hover:shadow-[0_0_12px_rgba(77,255,195,0.3)]"
                >
                  Save Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
