import React, { useState, useEffect } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { useApi } from "@/hooks/useApi";

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

        {/* Price & Offer Grid (2-Column on Tablet/Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1.5">
              Price (₦) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-bold text-[#14142B]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1.5">
              Special Offer / Promo Tag <span className="text-xs font-normal text-[#A0A3BD]">(Optional)</span>
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

        {/* Product Image */}
        <div>
          <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Product Image</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC]">
            {formData.image ? (
              <img 
                src={formData.image} 
                alt="Preview" 
                className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-xl border border-[#EFF0F6] shadow-sm shrink-0" 
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
            {uploadingImage && <span className="w-5 h-5 border-2 border-primary/40 border-t-[#ff006b] rounded-full animate-spin shrink-0"></span>}
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
              className="w-4 h-4 text-primary rounded focus:ring-[#ff006b] accent-[#ff006b]"
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
              className="w-4 h-4 text-primary rounded focus:ring-[#ff006b] accent-[#ff006b]"
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
            className="px-8 h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center min-w-[140px] disabled:opacity-70"
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
