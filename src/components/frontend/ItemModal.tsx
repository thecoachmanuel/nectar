"use client";

import React, { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useSettingStore } from "@/store/useSettingStore";
import { formatPrice } from "@/lib/formatters";
import { X, Plus, Minus, Check, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ItemModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemModal({ item, isOpen, onClose }: ItemModalProps) {
  const { addItem } = useCartStore();
  const { currencySymbol } = useSettingStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  // Initialize variation selection on item change
  useEffect(() => {
    if (item?.variations && item.variations.length > 0 && item.variations[0].options?.length > 0) {
      setSelectedVariation(item.variations[0].options[0]);
    } else {
      setSelectedVariation(null);
    }
    setSelectedExtras([]);
    setSelectedAddons([]);
    setQuantity(1);
  }, [item, isOpen]);

  // Lock background scroll when modal is open
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

  if (!isOpen || !item) return null;

  const extraTotal = selectedExtras.reduce((acc, e) => acc + (Number(e.price) || 0), 0);
  const addonTotal = selectedAddons.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const basePrice = selectedVariation ? Number(selectedVariation.price) : Number(item.price || 0);
  const unitPrice = basePrice + extraTotal + addonTotal;
  const totalPrice = unitPrice * quantity;

  const toggleExtra = (extra: any) => {
    if (selectedExtras.some((e) => e.name === extra.name)) {
      setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const toggleAddon = (addon: any) => {
    if (selectedAddons.some((a) => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAddToCart = () => {
    addItem({
      itemId: item._id,
      storeId: typeof item.storeId === "object" ? item.storeId._id : item.storeId,
      name: item.name,
      image: item.image,
      price: basePrice,
      quantity,
      variationName: selectedVariation ? selectedVariation.name : undefined,
      extras: selectedExtras,
      addons: selectedAddons,
    });

    toast.success(`Added ${quantity}x ${item.name} to cart!`);
    onClose();
  };

  const symbol = currencySymbol || "₦";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-[#EFF0F6] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image Header */}
        <div className="relative h-44 sm:h-52 w-full bg-[#F7F7FC] shrink-0 overflow-hidden">
          <img
            src={item.image || "/images/item/thumb.png"}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/item/thumb.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 bg-white/90 hover:bg-white text-[#14142B] rounded-full shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {item.isFeatured && (
            <div className="absolute bottom-3 left-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold shadow-sm" style={{ color: "var(--primary-hex)" }}>
              <Sparkles className="w-3.5 h-3.5" />
              Featured Product
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {/* Title & Description */}
          <div className="border-b border-[#EFF0F6] pb-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B] capitalize">
                {item.name}
              </h2>
              <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">
                {formatPrice(basePrice, symbol)}
              </span>
            </div>
            {item.description && (
              <p className="text-xs sm:text-sm text-[#6E7191] mt-1.5 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {/* Single / Multi Variations */}
          {item.variations && item.variations.length > 0 && item.variations[0]?.options?.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6E7191]">
                  Select Variation <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-[#A0A3BD]">Choose 1</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.variations[0].options.map((option: any, idx: number) => {
                  const isSelected = selectedVariation?.name === option.name;
                  return (
                    <button
                      type="button"
                      key={option.name || idx}
                      onClick={() => setSelectedVariation(option)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-[#14142B] shadow-sm ring-1 ring-primary/40"
                          : "border-[#EFF0F6] bg-white hover:bg-[#FAFAFC] text-[#4E4B66]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "border-primary bg-primary" : "border-[#D9DBE9] bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold truncate capitalize">
                          {option.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap shrink-0">
                        {formatPrice(option.price, symbol)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra Toppings */}
          {item.extras && item.extras.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6E7191]">
                  Extra Toppings
                </label>
                <span className="text-[11px] font-medium text-[#A0A3BD]">Optional</span>
              </div>

              <div className="space-y-2">
                {item.extras.map((extra: any, idx: number) => {
                  const isChecked = selectedExtras.some((e) => e.name === extra.name);
                  return (
                    <div
                      key={extra.name || idx}
                      onClick={() => toggleExtra(extra)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 text-[#14142B] shadow-sm"
                          : "border-[#EFF0F6] bg-white hover:bg-[#FAFAFC] text-[#4E4B66]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            isChecked ? "bg-primary border-primary text-white" : "border-[#D9DBE9] bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold truncate capitalize">
                          {extra.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                        +{formatPrice(extra.price, symbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons */}
          {item.addonIds && item.addonIds.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6E7191]">
                  Addons
                </label>
                <span className="text-[11px] font-medium text-[#A0A3BD]">Optional</span>
              </div>

              <div className="space-y-2">
                {item.addonIds.map((addon: any, idx: number) => {
                  const isChecked = selectedAddons.some((a) => a.name === addon.name);
                  return (
                    <div
                      key={addon._id || addon.name || idx}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 text-[#14142B] shadow-sm"
                          : "border-[#EFF0F6] bg-white hover:bg-[#FAFAFC] text-[#4E4B66]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            isChecked ? "bg-primary border-primary text-white" : "border-[#D9DBE9] bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold truncate capitalize">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                        +{formatPrice(addon.price, symbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-[#FAFAFC] border-t border-[#EFF0F6] flex items-center justify-between gap-3 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center space-x-2 bg-white border border-[#EFF0F6] rounded-2xl px-2 py-1 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-xl bg-[#F7F7FC] hover:bg-[#EFF0F6] text-[#4E4B66] flex items-center justify-center transition-colors active:scale-95 disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-bold text-sm text-[#14142B]">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-[#F7F7FC] hover:bg-[#EFF0F6] text-[#4E4B66] flex items-center justify-center transition-colors active:scale-95"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-primary hover:bg-[#e60060] text-white font-semibold h-11 px-4 sm:px-5 rounded-2xl shadow-md shadow-primary/25 transition-all flex items-center justify-between active:scale-[0.98]"
          >
            <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white/95 font-mono">
              {formatPrice(totalPrice, symbol)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
