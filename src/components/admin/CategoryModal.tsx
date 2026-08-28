import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useApi } from "@/hooks/useApi";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any;
  onSuccess: () => void;
}

export default function CategoryModal({ isOpen, onClose, category, onSuccess }: CategoryModalProps) {
  const { execute, loading } = useApi();
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    status: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        status: category.status ?? true,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        status: true,
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (category) {
        await execute(`/api/admin/item-categories/${category._id}`, {
          method: "PUT",
          body: formData,
          successMessage: "Category updated successfully",
        });
      } else {
        await execute(`/api/admin/item-categories`, {
          method: "POST",
          body: formData,
          successMessage: "Category created successfully",
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
      title={category ? "Edit Category" : "Add New Category"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-[#ff006b] transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Slug (optional)</label>
          <input 
            type="text" 
            value={formData.slug}
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
            placeholder="Auto-generated if left empty"
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-[#ff006b] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="status" 
            checked={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.checked})}
            className="w-4 h-4 text-[#ff006b] rounded focus:ring-[#ff006b]"
          />
          <label htmlFor="status" className="text-sm font-medium text-[#14142B] cursor-pointer">
            Active Status
          </label>
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
            className="px-6 h-11 rounded-xl bg-[#ff006b] text-white font-medium hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20 flex items-center justify-center min-w-[120px] disabled:opacity-70"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
