import React, { useState, useEffect } from "react";
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
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: "",
    storeId: "0",
    price: 0,

    isFeatured: false,
    status: true,
    image: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories("/api/admin/item-categories");
      fetchStores("/api/admin/stores");
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        slug: item.slug || "",
        categoryId: item.categoryId?._id || item.categoryId || "",
        storeId: item.storeId || "0",
        price: item.price || 0,

        isFeatured: item.isFeatured ?? false,
        status: item.status ?? true,
        image: item.image || "",
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        categoryId: "",
        storeId: "0",
        price: 0,

        isFeatured: false,
        status: true,
        image: "",
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
          successMessage: "Item updated successfully",
        });
      } else {
        await execute(`/api/admin/items`, {
          method: "POST",
          body: formData,
          successMessage: "Item created successfully",
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
      title={item ? "Edit Item" : "Add New Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
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

        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isFeatured" 
              checked={formData.isFeatured}
              onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
              className="w-4 h-4 text-primary rounded focus:ring-[#ff006b]"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-[#14142B] cursor-pointer">
              Featured Item
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
