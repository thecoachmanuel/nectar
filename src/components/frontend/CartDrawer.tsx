"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatPrice } from "@/lib/formatters";
import { X, Plus, Minus, Trash2, ShoppingBag, ChevronRight } from "lucide-react";

import { toast } from "sonner";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, orderType } = useCartStore();
  const { settings } = useSettingsStore();

  const subtotal = getSubtotal();

  const handleCheckout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
    router.push("/checkout");
  };

  const handleClear = () => {
    clearCart();
    toast.success("Cart cleared");
  };

  // Lock body scroll when cart drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Sync latest product prices ONCE per drawer opening (does not trigger on + / - clicks)
  useEffect(() => {
    if (!isOpen) return;

    const currentItems = useCartStore.getState().items;
    if (currentItems.length === 0) return;

    let isMounted = true;
    fetch("/api/frontend/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: currentItems }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.status && Array.isArray(data.data)) {
          const activeItems = useCartStore.getState().items;
          if (activeItems.length === 0) return; // Do not revive cleared cart

          // Merge updated prices while preserving current active quantities
          const merged = data.data.map((syncedItem: any) => {
            const active = activeItems.find((i) => i.id === syncedItem.id);
            const qty = active ? active.quantity : syncedItem.quantity;
            const extraTotal = syncedItem.extras?.reduce((acc: number, e: any) => acc + (Number(e.price) || 0), 0) || 0;
            const addonTotal = syncedItem.addons?.reduce((acc: number, a: any) => acc + (Number(a.price) || 0), 0) || 0;
            const unitPrice = (Number(syncedItem.price) || 0) + extraTotal + addonTotal;

            return {
              ...syncedItem,
              quantity: qty,
              itemTotal: unitPrice * qty,
            };
          });

          useCartStore.getState().setItems(merged);
        }
      })
      .catch((err) => console.error("Cart sync failed:", err));

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[998] bg-black/60 backdrop-blur-xs transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        id="cart"
        className={`fixed inset-y-0 right-0 z-[999] w-full max-w-md h-[100dvh] max-h-[100dvh] bg-white transition-transform duration-300 shadow-2xl flex flex-col overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-[#eff0f6] bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold capitalize text-[#14142b]">Your Cart</h3>
            {items.length > 0 && (
              <span 
                className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold shadow-xs"
                style={{ backgroundColor: "var(--accent-hex)" }}
              >
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-all flex items-center gap-1 font-medium active:scale-95"
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
        <div className="shrink-0 flex items-center p-3 sm:p-4 gap-3 border-b border-[#eff0f6] bg-[#f7f7fc]">
          <span className="text-xs font-semibold text-[#6e7191]">Order Type:</span>
          <div className="flex items-center gap-2">
            {(["delivery", ...(settings.takeaway_enabled === "Yes" ? ["takeaway"] : [])] as const).map((type) => (
              <button
                key={type}
                onClick={() => useCartStore.getState().setOrderType(type as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                  orderType === type
                    ? "text-white shadow-sm"
                    : "bg-white border border-[#e2e8f0] text-[#6e7191] hover:bg-slate-50"
                }`}
                style={{
                  backgroundColor: orderType === type ? "var(--footer-hex)" : undefined
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-primary opacity-40" />
              </div>
              <h4 className="text-base font-semibold text-[#14142b] mb-1">Your cart is empty</h4>
              <p className="text-sm text-[#a0a3bd]">Add items from our menu to get started.</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md cursor-pointer"
                style={{ backgroundColor: "var(--footer-hex)" }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => {
              const totalInCartForThisItem = items
                .filter((i) => i.itemId === item.itemId)
                .reduce((s, i) => s + i.quantity, 0);
              const maxStock = Math.max(0, Number(item.stockQuantity ?? 0));
              const isAtMaxStock = Boolean(item.manageStock) && totalInCartForThisItem >= maxStock;

              return (
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
                    {item.manageStock && (
                      <div className="mt-1">
                        {isAtMaxStock ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            Max stock reached ({maxStock})
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#6e7191] font-medium">
                            Stock: {maxStock} available
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-sm font-bold text-[#14142b]">{formatPrice(item.itemTotal)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-primary hover:text-primary transition-all text-[#6e7191] active:scale-95 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-[#14142b] w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={isAtMaxStock}
                          title={isAtMaxStock ? `Max available stock reached (${maxStock})` : "Increase quantity"}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isAtMaxStock
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                              : "text-white active:scale-95 shadow-sm hover:opacity-90 cursor-pointer"
                          }`}
                          style={{ backgroundColor: isAtMaxStock ? undefined : "var(--primary-hex)" }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all ml-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary + Checkout */}
        {items.length > 0 && (
          <div className="shrink-0 bg-white border-t border-[#eff0f6] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6e7191] font-medium">Subtotal</span>
              <span className="font-bold text-base text-[#14142b]">{formatPrice(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md active:scale-[0.99] cursor-pointer touch-manipulation select-none"
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
