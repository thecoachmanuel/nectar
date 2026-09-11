import React, { useState, useEffect } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { useApi } from "@/hooks/useApi";
import { normalizeImageUrl } from "@/lib/imageUtils";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSuccess: () => void;
}

export default function ItemModal({ isOpen, onClose, item, onSuccess }: ItemModalProps) {
  const { execute, loading } = useApi();
  const { execute: fetchCategories, data: categories } = useApi();
  const { execute: fetchStores, data: stores } = useApi();
  const { execute: fetchOffers, data: offers } = useApi();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    categoryId: "",
    offerId: "",
    storeId: "0",
    price: 0,
    discountPrice: 0,
    manageStock: false,
    stockQuantity: 0,
    lowStockThreshold: 5,
    isOutOfStock: false,
    requiresMarketOrder: false, // ADMIN ONLY — never shown to customers

    isFeatured: false,
    status: true,
    image: "",
    variations: [] as any[],
    extras: [] as any[],
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories("/api/admin/item-categories");
      fetchStores("/api/admin/stores");
      fetchOffers("/api/admin/offers");
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        slug: item.slug || "",
        categoryId: item.categoryId?._id || item.categoryId || "",
        offerId: item.offerId?._id || item.offerId || "",
        storeId: item.storeId || "0",
        price: item.price || 0,
        discountPrice: item.discountPrice || 0,
        manageStock: item.manageStock ?? false,
        stockQuantity: item.stockQuantity ?? 0,
        lowStockThreshold: item.lowStockThreshold ?? 5,
        isOutOfStock: item.isOutOfStock ?? false,
        requiresMarketOrder: item.requiresMarketOrder ?? false,

        isFeatured: item.isFeatured ?? false,
        status: item.status ?? true,
        image: item.image || "",
        variations: item.variations || [],
        extras: item.extras || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        slug: "",
        categoryId: "",
        offerId: "",
        storeId: "0",
        price: 0,
        discountPrice: 0,
        manageStock: false,
        stockQuantity: 0,
        lowStockThreshold: 5,
        isOutOfStock: false,
        requiresMarketOrder: false,

        isFeatured: false,
        status: true,
        image: "",
        variations: [],
        extras: [],
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (item) {
        await execute(`/api/admin/items/${item._id}`, {
          method: "PUT",
          body: formData,
          successMessage: "Product updated successfully",
        });
      } else {
        await execute(`/api/admin/items`, {
          method: "POST",
          body: formData,
          successMessage: "Product created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      // Error handled by useApi hook (toast)
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={item ? "Edit Product" : "Add New Product"}
      maxWidth="max-w-3xl lg:max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Product Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. Fresh Ripe Tomatoes / Whole Milk 1L"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1.5">
              Product Description
              <span className="ml-1 text-xs font-normal text-[#A0A3BD]">(displayed below product name on cards)</span>
            </label>
            <textarea 
              rows={3}
              placeholder="e.g. Fresh, crisp, organically grown groceries delivered straight to your door..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors resize-none text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Category & Store Grid (2-Column on Tablet/Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select 
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white text-sm font-medium"
            >
              <option value="">Select Category</option>
              {categories?.map((cat: any) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1.5">
              Store Assignment
            </label>
            <select 
              value={formData.storeId}
              onChange={(e) => setFormData({...formData, storeId: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white text-sm font-medium"
            >
              <option value="0">🌐 Global (All Stores / Unassigned)</option>
              {stores?.map((store: any) => (
                <option key={store._id} value={store._id}>🏪 {store.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing & Sale Section */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC] space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-[#14142B]">Product Pricing & Sale Options</h4>
              <p className="text-xs text-[#6E7191]">Set the regular retail price and optionally put this product on sale.</p>
            </div>
            {Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E0FFED] text-[#1AB759] border border-[#1AB759]/20 shadow-sm">
                🔥 On Sale: Save ₦{(Number(formData.price) - Number(formData.discountPrice)).toLocaleString()} (-{Math.round(((Number(formData.price) - Number(formData.discountPrice)) / Number(formData.price)) * 100)}% OFF)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                Regular Price (₦) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price || ""}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-bold text-[#14142B] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                Sale / Discount Price (₦) <span className="text-xs font-normal text-[#A0A3BD]">(Optional)</span>
              </label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="e.g. 800 (Optional)"
                value={formData.discountPrice || ""}
                onChange={(e) => setFormData({...formData, discountPrice: Number(e.target.value)})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-bold text-primary bg-white placeholder:font-normal placeholder:text-xs"
              />
              {Number(formData.discountPrice) >= Number(formData.price) && Number(formData.discountPrice) > 0 && (
                <p className="text-[11px] text-amber-600 font-medium mt-1">
                  ⚠️ Must be lower than regular price to activate discount.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                Special Offer Tag <span className="text-xs font-normal text-[#A0A3BD]">(Optional)</span>
              </label>
              <select 
                value={formData.offerId}
                onChange={(e) => setFormData({...formData, offerId: e.target.value})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white text-sm font-medium"
              >
                <option value="">No Promotional Offer</option>
                {offers?.map((offer: any) => (
                  <option key={offer._id} value={offer._id}>🏷️ {offer.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory & Stock Management */}
        <div className="p-4 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                📦
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#14142B]">Inventory & Stock Control</h4>
                <p className="text-[11px] text-[#6E7191]">
                  Track product quantities and automatically deduct on paid purchases.
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.manageStock}
                onChange={(e) => setFormData({...formData, manageStock: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#D9DBE9] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-2 text-xs font-semibold text-[#14142B]">
                {formData.manageStock ? "Tracking Active" : "Untracked (Unlimited)"}
              </span>
            </label>
          </div>

          {formData.manageStock && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#EFF0F6]">
              <div>
                <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                  Available Quantity in Stock <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  required={formData.manageStock}
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: Math.max(0, parseInt(e.target.value) || 0)})}
                  className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-bold text-[#14142B] bg-white"
                />
                <p className="text-[10px] text-[#6E7191] mt-1">Available units for purchase.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                  Low Stock Warning Level
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({...formData, lowStockThreshold: Math.max(1, parseInt(e.target.value) || 5)})}
                  className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-semibold text-[#14142B] bg-white"
                />
                <p className="text-[10px] text-[#6E7191] mt-1">Triggers low stock alert when count reaches this.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                  Stock Status Override
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, isOutOfStock: !formData.isOutOfStock})}
                  className={`w-full h-11 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    formData.isOutOfStock || formData.stockQuantity <= 0
                      ? "bg-red-50 border-red-200 text-red-700"
                      : formData.stockQuantity <= formData.lowStockThreshold
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                >
                  {formData.isOutOfStock || formData.stockQuantity <= 0
                    ? "🛑 Marked Out of Stock"
                    : formData.stockQuantity <= formData.lowStockThreshold
                    ? `⚠️ Low Stock (${formData.stockQuantity} left)`
                    : `✓ In Stock (${formData.stockQuantity} units)`}
                </button>
                <p className="text-[10px] text-[#6E7191] mt-1 text-center">Click button to toggle manual out of stock.</p>
              </div>
            </div>
          )}
        </div>

        {/* Market Item Toggle — ADMIN ONLY, customers never see this label */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                🛒
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">Market Item (Requires Minimum Order)</h4>
                <p className="text-[11px] text-amber-700">
                  Admin only — customers see a generic minimum order message, not this label.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresMarketOrder}
                onChange={(e) => setFormData({...formData, requiresMarketOrder: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#D9DBE9] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="ml-2 text-xs font-semibold text-amber-900">
                {formData.requiresMarketOrder ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
          {formData.requiresMarketOrder && (
            <p className="text-[11px] text-amber-800 font-medium bg-amber-100 rounded-xl px-3 py-2">
              ⚠️ When enabled: customers must reach the minimum order amount before they can checkout if this item is in their cart.
              The minimum amount is set in <strong>Settings → Order Rules</strong>. Customers see only a standard minimum order notice.
            </p>
          )}
        </div>

        {/* Product Image */}
        <div>
          <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Product Image</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC]">
            {formData.image ? (
              <img 
                src={normalizeImageUrl(formData.image, "/images/item/thumb.png")} 
                alt="Preview" 
                className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-xl border border-[#EFF0F6] shadow-sm shrink-0" 
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[#EFF0F6] flex items-center justify-center text-xs text-[#A0A3BD] shrink-0">
                No Image
              </div>
            )}
            <div className="flex-1 w-full">
              <input 
                type="file" 
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadingImage(true);
                    const file = e.target.files[0];
                    const body = new FormData();
                    body.append("file", file);
                    try {
                      const res = await fetch("/api/admin/upload", { method: "POST", body });
                      const data = await res.json();
                      if (data.url) setFormData({...formData, image: data.url});
                    } catch (err) {
                      console.error("Upload error", err);
                    }
                    setUploadingImage(false);
                  }
                }}
                className="w-full h-11 px-4 py-2 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              <p className="text-[11px] text-[#A0A3BD] mt-1">Recommended format: Square PNG/JPEG/WEBP under 2MB</p>
            </div>
            {uploadingImage && <span className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin shrink-0"></span>}
          </div>
        </div>

        {/* Variations */}
        <div className="pt-4 border-t border-[#EFF0F6]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <label className="block text-sm font-semibold text-[#14142B]">Product Variations (Sizes / Weights)</label>
              <p className="text-xs text-[#6E7191]">Create option groups like Weight (500g, 1kg) or Size (Small, Large)</p>
            </div>
            <button 
              type="button" 
              onClick={() => setFormData({ ...formData, variations: [...formData.variations, { name: "", options: [] }] })} 
              className="text-xs font-semibold text-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variation Group
            </button>
          </div>

          <div className="space-y-4">
            {formData.variations.map((vg, vIdx) => (
              <div key={vIdx} className="p-4 border border-[#EFF0F6] rounded-2xl bg-[#FAFAFC] space-y-3">
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder="Group Name (e.g. Size, Weight, Bundle)" 
                    value={vg.name} 
                    onChange={e => { 
                      const nv = [...formData.variations]; 
                      nv[vIdx].name = e.target.value; 
                      setFormData({ ...formData, variations: nv }); 
                    }} 
                    className="flex-1 h-10 px-3.5 rounded-xl border border-[#EFF0F6] text-sm focus:outline-none focus:border-primary bg-white font-medium" 
                  />
                  <button 
                    type="button" 
                    onClick={() => { 
                      const nv = formData.variations.filter((_, i) => i !== vIdx); 
                      setFormData({ ...formData, variations: nv }); 
                    }} 
                    className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    title="Remove Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options List */}
                <div className="space-y-2.5 sm:pl-4 sm:border-l-2 sm:border-[#EFF0F6]">
                  {vg.options.map((opt: any, oIdx: number) => (
                    <div key={oIdx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input 
                        type="text" 
                        placeholder="Option Name (e.g. 500g / 1kg / Pack of 3)" 
                        value={opt.name} 
                        onChange={e => { 
                          const nv = [...formData.variations]; 
                          nv[vIdx].options[oIdx].name = e.target.value; 
                          setFormData({ ...formData, variations: nv }); 
                        }} 
                        className="flex-1 h-9 px-3 rounded-lg border border-[#EFF0F6] text-xs focus:outline-none focus:border-primary bg-white" 
                      />
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1 sm:w-32">
                          <input 
                            type="number" 
                            placeholder="Price (₦)" 
                            value={opt.price} 
                            onChange={e => { 
                              const nv = [...formData.variations]; 
                              nv[vIdx].options[oIdx].price = Number(e.target.value); 
                              setFormData({ ...formData, variations: nv }); 
                            }} 
                            className="w-full h-9 px-3 rounded-lg border border-[#EFF0F6] text-xs focus:outline-none focus:border-primary bg-white font-semibold" 
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { 
                            const nv = [...formData.variations]; 
                            nv[vIdx].options = nv[vIdx].options.filter((_: any, i: number) => i !== oIdx); 
                            setFormData({ ...formData, variations: nv }); 
                          }} 
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                          title="Delete option"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    onClick={() => { 
                      const nv = [...formData.variations]; 
                      nv[vIdx].options.push({ name: "", price: 0 }); 
                      setFormData({ ...formData, variations: nv }); 
                    }} 
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 pt-1"
                  >
                    <Plus className="w-3 h-3" /> Add Option to {vg.name || "Group"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extras / Add-on Services */}
        <div className="pt-4 border-t border-[#EFF0F6]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <label className="block text-sm font-semibold text-[#14142B]">Extra Add-ons / Prep Options</label>
              <p className="text-xs text-[#6E7191]">Optional add-ons customers can choose (e.g. Sliced, Peeled, Gift Wrapping)</p>
            </div>
            <button 
              type="button" 
              onClick={() => setFormData({ ...formData, extras: [...formData.extras, { name: "", price: 0 }] })} 
              className="text-xs font-semibold text-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Extra
            </button>
          </div>

          <div className="space-y-2.5">
            {formData.extras.map((extra, eIdx) => (
              <div key={eIdx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2.5 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC]">
                <input 
                  type="text" 
                  placeholder="Extra Name (e.g. Cleaned & Pre-Cut)" 
                  value={extra.name} 
                  onChange={e => { 
                    const ne = [...formData.extras]; 
                    ne[eIdx].name = e.target.value; 
                    setFormData({ ...formData, extras: ne }); 
                  }} 
                  className="flex-1 h-9 px-3 rounded-lg border border-[#EFF0F6] text-sm focus:outline-none focus:border-primary bg-white" 
                />
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    placeholder="Extra Price (₦)" 
                    value={extra.price} 
                    onChange={e => { 
                      const ne = [...formData.extras]; 
                      ne[eIdx].price = Number(e.target.value); 
                      setFormData({ ...formData, extras: ne }); 
                    }} 
                    className="w-full sm:w-32 h-9 px-3 rounded-lg border border-[#EFF0F6] text-sm focus:outline-none focus:border-primary bg-white font-semibold" 
                  />
                  <button 
                    type="button" 
                    onClick={() => { 
                      const ne = formData.extras.filter((_, i) => i !== eIdx); 
                      setFormData({ ...formData, extras: ne }); 
                    }} 
                    className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Remove extra"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status and Flags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#EFF0F6]">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] cursor-pointer hover:bg-gray-50 transition-colors">
            <input 
              type="checkbox" 
              id="isFeatured" 
              checked={formData.isFeatured}
              onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
              className="w-4 h-4 text-primary rounded focus:ring-primary accent-primary"
            />
            <div>
              <span className="text-sm font-semibold text-[#14142B] block">Featured Product</span>
              <span className="text-xs text-[#6E7191]">Highlight on homepage & featured grocery collections</span>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] cursor-pointer hover:bg-gray-50 transition-colors">
            <input 
              type="checkbox" 
              id="status" 
              checked={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.checked})}
              className="w-4 h-4 text-primary rounded focus:ring-primary accent-primary"
            />
            <div>
              <span className="text-sm font-semibold text-[#14142B] block">Active Status</span>
              <span className="text-xs text-[#6E7191]">Visible to customers for live shopping and checkout</span>
            </div>
          </label>
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-4 border-t border-[#EFF0F6] flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 h-11 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-semibold text-sm hover:bg-[#F7F7FC] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading || uploadingImage}
            className="px-8 h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center justify-center min-w-[140px] disabled:opacity-70"
          >
            {(loading || uploadingImage) ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : item ? (
              "Update Product"
            ) : (
              "Save Product"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
