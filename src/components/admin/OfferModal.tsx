import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useApi } from "@/hooks/useApi";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer?: any;
  onSuccess: () => void;
}

export default function OfferModal({ isOpen, onClose, offer, onSuccess }: OfferModalProps) {
  const { execute, loading } = useApi();
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    status: true,
    image: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title || "",
        slug: offer.slug || "",
        status: offer.status ?? true,
        image: offer.image || "",
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        status: true,
        image: "",
      });
    }
  }, [offer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (offer) {
        await execute(`/api/admin/offers/${offer._id}`, {
          method: "PUT",
          body: formData,
          successMessage: "Offer updated successfully",
        });
      } else {
        await execute(`/api/admin/offers`, {
          method: "POST",
          body: formData,
          successMessage: "Offer created successfully",
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
      title={offer ? "Edit Offer" : "Add New Offer"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Title <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
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

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Banner Image</label>
          <div className="flex items-center gap-4">
            {formData.image && (
              <img src={formData.image} alt="Preview" className="w-24 h-12 object-cover rounded-lg border border-[#EFF0F6]" />
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
              className="w-full h-11 px-4 py-2 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-[#ff006b] transition-colors bg-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#ff006b]/10 file:text-[#ff006b] hover:file:bg-[#ff006b]/20"
            />
            {uploadingImage && <span className="w-5 h-5 border-2 border-[#ff006b]/40 border-t-[#ff006b] rounded-full animate-spin"></span>}
          </div>
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
            {(loading || uploadingImage) ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
