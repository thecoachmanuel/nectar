"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Send, CheckCircle2, Upload, Loader2, Phone, User, PackageSearch } from "lucide-react";
import { toast } from "sonner";

interface ProductRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
}

export default function ProductRequestModal({
  isOpen,
  onClose,
  initialProductName = "",
}: ProductRequestModalProps) {
  const [productName, setProductName] = useState("");
  const [categoryOrBrand, setCategoryOrBrand] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProductName(initialProductName);
      setIsSuccess(false);
    }
  }, [isOpen, initialProductName]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
    document.body.style.overflow = "unset";
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("Please enter the product name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/frontend/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          categoryOrBrand,
          customerName,
          customerPhone,
          customerEmail,
          notes,
          image,
        }),
      });

      const data = await res.json();
      if (data.status) {
        setIsSuccess(true);
        toast.success("Request received! We'll notify you as soon as it's available.");
      } else {
        toast.error(data.message || "Failed to submit request");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingImage(true);
      const file = e.target.files[0];
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (data.url) setImage(data.url);
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with decorative background */}
        <div className="relative p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-white border-b border-[#EFF0F6] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0"
              style={{ backgroundColor: "var(--primary-hex)" }}
            >
              <PackageSearch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Request a Product
              </h2>
              <p className="text-xs text-[#6E7191] mt-0.5">
                Can&apos;t find an item or brand? Tell us and we&apos;ll stock it for you!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white hover:bg-gray-100 text-[#14142B] rounded-full shadow-sm flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-[#E0FFED] text-[#1AB759] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14142B]">
                  Product Request Submitted!
                </h3>
                <p className="text-xs sm:text-sm text-[#6E7191] max-w-sm mx-auto mt-1.5 leading-relaxed">
                  We&apos;ve added <span className="font-semibold text-[#14142B]">&ldquo;{productName}&rdquo;</span> to our procurement list. We&apos;ll notify you via WhatsApp / Phone as soon as it arrives!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                  Product Name / Item Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kerrygold Pure Irish Butter, Organic Chia Seeds 500g"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-medium bg-white"
                />
              </div>

              {/* Brand or Category */}
              <div>
                <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                  Preferred Brand or Category <span className="text-xs font-normal text-[#A0A3BD]">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nestle, Kellogg's, Dairy, Gluten-Free"
                  value={categoryOrBrand}
                  onChange={(e) => setCategoryOrBrand(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm bg-white"
                />
              </div>

              {/* Customer Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                    Your Name <span className="text-xs font-normal text-[#A0A3BD]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                    WhatsApp / Phone <span className="text-xs font-normal text-[#A0A3BD]">(For Notification)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="e.g. 08012345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                  Additional Details / Pack Size <span className="text-xs font-normal text-[#A0A3BD]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Need the 1kg family pack, or 6-can bundle if available..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors resize-none text-xs leading-relaxed bg-white"
                />
              </div>

              {/* Optional Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                  Reference Photo <span className="text-xs font-normal text-[#A0A3BD]">(Optional)</span>
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC]">
                  {image ? (
                    <img
                      src={image}
                      alt="Product Reference"
                      className="w-12 h-12 rounded-lg object-cover border border-[#EFF0F6] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg border-2 border-dashed border-[#D9DBE9] flex items-center justify-center text-[#A0A3BD] shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                  {uploadingImage && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
                </div>
              </div>

              {/* Footer Submit */}
              <div className="pt-3 border-t border-[#EFF0F6] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 h-10 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-semibold text-xs hover:bg-[#F7F7FC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage || !productName.trim()}
                  className="px-6 h-10 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
