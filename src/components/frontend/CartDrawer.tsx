"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { X, Plus, Minus, Trash2, ShoppingBag, ChevronRight } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, orderType } = useCartStore();

  const subtotal = getSubtotal();

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-black/60 transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div id="cart"
        className={`fixed top-0 right-0 z-[60] w-full max-w-md h-screen overflow-y-auto bg-white transition-transform duration-300 shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#eff0f6]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#ff006b]" />
            <h3 className="text-lg font-semibold capitalize text-[#14142b]">Your Cart</h3>
            {items.length > 0 && (
              <span className="w-6 h-6 rounded-full bg-[#ff006b] text-white text-xs flex items-center justify-center font-bold">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-all flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f7f7fc] text-[#6e7191] hover:bg-red-100 hover:text-[#ff006b] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Order Type Switch */}
        <div className="flex items-center p-4 gap-3 border-b border-[#eff0f6] bg-[#f7f7fc]">
          <span className="text-xs font-medium text-[#6e7191]">Order Type:</span>
          <div className="flex items-center gap-2">
            {(["delivery", "takeaway"] as const).map((type) => (
              <button key={type}
                onClick={() => useCartStore.getState().setOrderType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${orderType === type ? "bg-[#008BBA] text-white" : "bg-white border border-[#e2e8f0] text-[#6e7191]"}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[#fff0f6] flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-[#ff006b] opacity-40" />
              </div>
              <h4 className="text-base font-semibold text-[#14142b] mb-1">Your cart is empty</h4>
              <p className="text-sm text-[#a0a3bd]">Add items from our menu to get started.</p>
              <button onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: "#ff006b" }}>
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#eff0f6]">
                {/* Image */}
                {item.image && (
                  <img src={item.image} alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#14142b] truncate">{item.name}</h4>
                  {item.variationName && (
                    <p className="text-xs text-[#a0a3bd] mt-0.5">{item.variationName}</p>
                  )}
                  {item.extras?.length > 0 && (
                    <p className="text-xs text-[#6e7191] mt-0.5">+ {item.extras.map(e => e.name).join(", ")}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-[#14142b]">₦{item.itemTotal.toFixed(2)}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-[#ff006b] hover:text-[#ff006b] transition-all text-[#6e7191]">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold text-[#14142b] w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-all"
                        style={{ backgroundColor: "#ff006b" }}>
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(item.id)}
                        className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all ml-1">
                        <Trash2 className="w-3 h-3" />
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
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-[#6e7191]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#14142b]">₦{subtotal.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={handleCheckout}
              className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ backgroundColor: "#ff006b" }}>
              Process to Checkout
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
