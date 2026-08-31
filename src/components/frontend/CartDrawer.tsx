"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatPrice } from "@/lib/formatters";
import { X, Plus, Minus, Trash2, ShoppingBag, ChevronRight } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, orderType } = useCartStore();
  const { settings } = useSettingsStore();

  const subtotal = getSubtotal();

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  useEffect(() => {
    if (isOpen && items.length > 0) {
      fetch("/api/frontend/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status && data.data) {
            useCartStore.getState().setItems(data.data);
          }
        })
        .catch((err) => console.error("Cart sync failed:", err));
    }
  }, [isOpen, items]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        id="cart"
        className={`fixed top-0 right-0 z-[60] w-full max-w-md h-screen overflow-y-auto bg-white transition-transform duration-300 shadow-2xl flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#eff0f6]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold capitalize text-[#14142b]">Your Cart</h3>
            {items.length > 0 && (
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-all flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f7f7fc] text-[#6e7191] hover:bg-red-100 hover:text-primary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Order Type Switch */}
        <div className="flex items-center p-3 sm:p-4 gap-3 border-b border-[#eff0f6] bg-[#f7f7fc]">
          <span className="text-xs font-semibold text-[#6e7191]">Order Type:</span>
          <div className="flex items-center gap-2">
            {(["delivery", ...(settings.takeaway_enabled === "Yes" ? ["takeaway"] : [])] as const).map((type) => (
              <button
                key={type}
                onClick={() => useCartStore.getState().setOrderType(type as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  orderType === type
                    ? "bg-[#008BBA] text-white shadow-sm"
                    : "bg-white border border-[#e2e8f0] text-[#6e7191] hover:bg-slate-50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[#fff0f6] flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-primary opacity-40" />
              </div>
              <h4 className="text-base font-semibold text-[#14142b] mb-1">Your cart is empty</h4>
              <p className="text-sm text-[#a0a3bd]">Add items from our menu to get started.</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all shadow-md"
                style={{ backgroundColor: "var(--primary-hex)" }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#eff0f6] shadow-sm hover:border-[#e2e8f0] transition-colors"
              >
                {/* Image */}
                <img
                  src={item.image || "/images/item/thumb.png"}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-[#f7f7fc]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/item/thumb.png";
                  }}
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#14142b] truncate capitalize">{item.name}</h4>
                  {item.variationName && (
                    <p className="text-xs text-primary font-medium mt-0.5">{item.variationName}</p>
                  )}
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-xs text-[#6e7191] mt-0.5">+ {item.extras.map((e) => e.name).join(", ")}</p>
                  )}
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-sm font-bold text-[#14142b]">{formatPrice(item.itemTotal)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-primary hover:text-primary transition-all text-[#6e7191] active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-[#14142b] w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-sm"
                        style={{ backgroundColor: "var(--primary-hex)" }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all ml-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary + Checkout */}
        {items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-[#eff0f6] p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6e7191] font-medium">Subtotal</span>
              <span className="font-bold text-base text-[#14142b]">{formatPrice(subtotal)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md active:scale-[0.99]"
              style={{ backgroundColor: "var(--primary-hex)" }}
            >
              Proceed to Checkout
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
