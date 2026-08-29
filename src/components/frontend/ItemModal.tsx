"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useSettingStore } from "@/store/useSettingStore";
import { X, Plus, Minus, Check } from "lucide-react";
import { toast } from "sonner";

interface ItemModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemModal({ item, isOpen, onClose }: ItemModalProps) {
  const { addItem } = useCartStore();
  const { formatPrice } = useSettingStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(
    item?.variations && item.variations.length > 0 && item.variations[0].options[0]
      ? item.variations[0].options[0]
      : null
  );
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  if (!isOpen || !item) return null;

  const extraTotal = selectedExtras.reduce((acc, e) => acc + e.price, 0);
  const addonTotal = selectedAddons.reduce((acc, a) => acc + a.price, 0);
  const basePrice = selectedVariation ? selectedVariation.price : item.price;
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

    toast.success(`${item.name} added to cart!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Image */}
        <div className="relative h-48 w-full bg-slate-100">
          <img
            src={item.image || "/images/icons/icon-192x192.png"}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/80 hover:bg-white text-slate-700 p-2 rounded-full shadow transition"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{item.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{item.description}</p>
            <p className="text-lg font-bold text-red-500 mt-2">{formatPrice(basePrice)}</p>
          </div>

          {/* Single / Multi Variations */}
          {item.variations && item.variations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Select Variation
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {item.variations[0].options.map((option: any) => {
                  const isSelected = selectedVariation?.name === option.name;
                  return (
                    <button
                      key={option.name}
                      onClick={() => setSelectedVariation(option)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition ${
                        isSelected
                          ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span>{option.name}</span>
                      <span className="font-semibold">{formatPrice(option.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra Toppings */}
          {item.extras && item.extras.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Extra Toppings
              </h3>
              <div className="space-y-1.5">
                {item.extras.map((extra: any) => {
                  const isChecked = selectedExtras.some((e) => e.name === extra.name);
                  return (
                    <label
                      key={extra.name}
                      onClick={() => toggleExtra(extra)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-sm font-medium transition ${
                        isChecked
                          ? "border-red-500 bg-red-50/50 text-slate-800"
                          : "border-slate-100 hover:border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            isChecked ? "bg-red-500 border-red-500 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span>{extra.name}</span>
                      </div>
                      <span className="text-slate-500">+{formatPrice(extra.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons */}
          {item.addonIds && item.addonIds.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Addons
              </h3>
              <div className="space-y-1.5">
                {item.addonIds.map((addon: any) => {
                  const isChecked = selectedAddons.some((a) => a.name === addon.name);
                  return (
                    <label
                      key={addon._id || addon.name}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-sm font-medium transition ${
                        isChecked
                          ? "border-red-500 bg-red-50/50 text-slate-800"
                          : "border-slate-100 hover:border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            isChecked ? "bg-red-500 border-red-500 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-slate-500">+{formatPrice(addon.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-slate-500 hover:text-red-500 p-1"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-slate-800">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="text-slate-500 hover:text-red-500 p-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 ml-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-5 rounded-xl shadow-md transition flex items-center justify-between"
          >
            <span>Add to Cart</span>
            <span className="font-bold text-white/90">{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
