import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { toast } from "sonner";
import { ImageIcon, Eye, EyeOff, Link2, Upload, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner?: any;
  onSuccess: () => void;
}

export default function BannerModal({ isOpen, onClose, banner, onSuccess }: BannerModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    order: 0,
    status: true,
    showText: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        image: banner.image || "",
        link: banner.link || "",
        order: banner.order ?? 0,
        status: banner.status ?? true,
        showText: banner.showText ?? true,
      });
    } else {
      setFormData({
        title: "",
        subtitle: "",
        image: "",
        link: "",
        order: 0,
        status: true,
        showText: true,
      });
    }
  }, [banner, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploadingImage(true);
    const file = e.target.files[0];
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, image: data.url }));
        toast.success("Image uploaded!");
      } else {
        toast.error("Image upload failed");
      }
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) {
      toast.error("Please upload a banner image first");
      return;
    }

    setLoading(true);
    try {
      const url = banner ? `/api/admin/banners/${banner._id}` : `/api/admin/banners`;
      const method = banner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok || !result.status) {
        toast.error(result.message || "Failed to save banner");
        return;
      }

      toast.success(banner ? "Banner updated successfully!" : "Banner created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save banner");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBusy = loading || uploadingImage;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={banner ? "Edit Banner" : "Add New Banner"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Banner Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-[#14142B] mb-2">
            Banner Image <span className="text-red-500">*</span>
          </label>

          {formData.image ? (
            <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border-2 border-[#EFF0F6] bg-[#FAFAFC] mb-3 group">
              <img src={formData.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              {/* Overlay hint */}
              {formData.showText && (formData.title || formData.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none flex items-center pl-4">
                  <div>
                    {formData.title && <p className="text-white font-bold text-sm drop-shadow">{formData.title}</p>}
                    {formData.subtitle && <p className="text-white/80 text-xs mt-0.5 drop-shadow">{formData.subtitle}</p>}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer flex items-center gap-2 bg-white text-[#14142B] px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  Change Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          ) : (
            <label className="block w-full aspect-[21/9] rounded-xl border-2 border-dashed border-[#EFF0F6] bg-[#FAFAFC] hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#EFF0F6] flex items-center justify-center">
                {uploadingImage
                  ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  : <ImageIcon className="w-5 h-5 text-[#A0A3BD]" />
                }
              </div>
              <p className="text-sm font-medium text-[#6E7191]">
                {uploadingImage ? "Uploading..." : "Click to upload banner image"}
              </p>
              <p className="text-xs text-[#A0A3BD]">Recommended: 1200×400px or wider</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>

        {/* Show Text Overlay Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC]">
          <div className="flex items-center gap-2">
            {formData.showText ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-[#A0A3BD]" />}
            <div>
              <p className="text-sm font-semibold text-[#14142B]">Show Text Overlay</p>
              <p className="text-xs text-[#6E7191]">
                {formData.showText ? "Title & subtitle will show on banner" : "Image only — no text shown"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, showText: !prev.showText }))}
            className="text-2xl"
          >
            {formData.showText
              ? <ToggleRight className="w-8 h-8 text-primary" />
              : <ToggleLeft className="w-8 h-8 text-[#A0A3BD]" />
            }
          </button>
        </div>

        {/* Title & Subtitle — only shown if showText is enabled */}
        {formData.showText && (
          <div className="space-y-4 p-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC]">
            <p className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Text Overlay</p>
            <div>
              <label className="block text-sm font-medium text-[#14142B] mb-1">Title (Optional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Weekend Special Deal"
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#14142B] mb-1">Subtitle (Optional)</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g. Up to 30% off on all items"
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white"
              />
            </div>
          </div>
        )}

        {/* Link URL */}
        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-[#6E7191]" /> Tap Link URL (Optional)
          </label>
          <input
            type="text"
            value={formData.link}
            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
            placeholder="e.g. /offers/summer-sale or /menu"
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-[#A0A3BD] mt-1">When set, tapping the banner will navigate to this URL.</p>
        </div>

        {/* Order & Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Display Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked }))}
                className="w-4 h-4 accent-[#ff006b] rounded"
              />
              <span className="text-sm font-medium text-[#14142B]">Active</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#EFF0F6] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-6 h-11 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-medium hover:bg-[#F7F7FC] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy || !formData.image}
            className="px-6 h-11 rounded-xl bg-primary text-white font-medium hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center min-w-[120px] disabled:opacity-60"
          >
            {isBusy
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : (banner ? "Update Banner" : "Save Banner")
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
