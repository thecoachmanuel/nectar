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
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Product Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">
            Product Description
            <span className="ml-1 text-[11px] font-normal text-[#A0A3BD]">(displayed below product name on cards)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Fresh organic tomatoes, hand-picked daily from local farms..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors resize-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Category <span className="text-red-500">*</span></label>
          <select 
            required
            value={formData.categoryId}
            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white"
          >
            <option value="">Select Category</option>
            {categories?.map((cat: any) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Store</label>
          <select 
            value={formData.storeId}
            onChange={(e) => setFormData({...formData, storeId: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white"
          >
            <option value="0">Global (All Stores)</option>
            {stores?.map((store: any) => (
              <option key={store._id} value={store._id}>{store.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Offer (Optional)</label>
          <select 
            value={formData.offerId}
            onChange={(e) => setFormData({...formData, offerId: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white"
          >
            <option value="">No Offer</option>
            {offers?.map((offer: any) => (
              <option key={offer._id} value={offer._id}>{offer.title}</option>
            ))}
          </select>
        </div>

          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Price (₦) <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Image</label>
          <div className="flex items-center gap-4">
            {formData.image && (
              <img src={formData.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-[#EFF0F6]" />
            )}
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
              className="w-full h-11 px-4 py-2 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {uploadingImage && <span className="w-5 h-5 border-2 border-primary/40 border-t-[#ff006b] rounded-full animate-spin"></span>}
          </div>
        </div>

        {/* Variations */}
        <div className="pt-4 border-t border-[#EFF0F6]">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-[#14142B]">Variations (Options)</label>
            <button type="button" onClick={() => setFormData({ ...formData, variations: [...formData.variations, { name: "", options: [] }] })} className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> Add Variation Group
            </button>
          </div>
          <div className="space-y-4">
            {formData.variations.map((vg, vIdx) => (
              <div key={vIdx} className="p-3 border border-[#EFF0F6] rounded-xl bg-[#FAFAFC]">
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Group Name (e.g. Size)" value={vg.name} onChange={e => { const nv = [...formData.variations]; nv[vIdx].name = e.target.value; setFormData({ ...formData, variations: nv }) }} className="flex-1 h-9 px-3 rounded-lg border border-[#EFF0F6] text-sm focus:outline-none focus:border-primary" />
                  <button type="button" onClick={() => { const nv = formData.variations.filter((_, i) => i !== vIdx); setFormData({ ...formData, variations: nv }) }} className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-[#EFF0F6] ml-2">
                  {vg.options.map((opt: any, oIdx: number) => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <input type="text" placeholder="Option (e.g. 250g)" value={opt.name} onChange={e => { const nv = [...formData.variations]; nv[vIdx].options[oIdx].name = e.target.value; setFormData({ ...formData, variations: nv }) }} className="flex-1 h-8 px-2 rounded border border-[#EFF0F6] text-xs focus:outline-none focus:border-primary" />
                      <input type="number" placeholder="Price (₦)" value={opt.price} onChange={e => { const nv = [...formData.variations]; nv[vIdx].options[oIdx].price = Number(e.target.value); setFormData({ ...formData, variations: nv }) }} className="w-24 h-8 px-2 rounded border border-[#EFF0F6] text-xs focus:outline-none focus:border-primary" />
                      <button type="button" onClick={() => { const nv = [...formData.variations]; nv[vIdx].options = nv[vIdx].options.filter((_: any, i: number) => i !== oIdx); setFormData({ ...formData, variations: nv }) }} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => { const nv = [...formData.variations]; nv[vIdx].options.push({ name: "", price: 0 }); setFormData({ ...formData, variations: nv }) }} className="text-xs font-medium text-slate-500 hover:text-primary flex items-center gap-1 mt-1">
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div className="pt-4 border-t border-[#EFF0F6]">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-[#14142B]">Extra Services</label>
            <button type="button" onClick={() => setFormData({ ...formData, extras: [...formData.extras, { name: "", price: 0 }] })} className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> Add Extra
            </button>
          </div>
          <div className="space-y-2">
            {formData.extras.map((extra, eIdx) => (
              <div key={eIdx} className="flex gap-2 items-center">
                <input type="text" placeholder="Extra Name (e.g. Extra Cheese)" value={extra.name} onChange={e => { const ne = [...formData.extras]; ne[eIdx].name = e.target.value; setFormData({ ...formData, extras: ne }) }} className="flex-1 h-9 px-3 rounded-lg border border-[#EFF0F6] text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Price (₦)" value={extra.price} onChange={e => { const ne = [...formData.extras]; ne[eIdx].price = Number(e.target.value); setFormData({ ...formData, extras: ne }) }} className="w-28 h-9 px-3 rounded-lg border border-[#EFF0F6] text-sm focus:outline-none focus:border-primary" />
                <button type="button" onClick={() => { const ne = formData.extras.filter((_, i) => i !== eIdx); setFormData({ ...formData, extras: ne }) }} className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2 border-t border-[#EFF0F6]">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isFeatured" 
              checked={formData.isFeatured}
              onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
              className="w-4 h-4 text-primary rounded focus:ring-[#ff006b]"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-[#14142B] cursor-pointer">
              Featured Product
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="status" 
              checked={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.checked})}
              className="w-4 h-4 text-primary rounded focus:ring-[#ff006b]"
            />
            <label htmlFor="status" className="text-sm font-medium text-[#14142B] cursor-pointer">
              Active Status
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-[#EFF0F6] flex justify-end gap-3 mt-6">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 h-11 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-medium hover:bg-[#F7F7FC] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 h-11 rounded-xl bg-primary text-white font-medium hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center min-w-[120px] disabled:opacity-70"
          >
            {(loading || uploadingImage) ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
