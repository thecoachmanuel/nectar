"use client";

import React from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/formatters";
import { ShoppingBag, ArrowRight, Plus, Minus, Trash2, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  return (
    <section className="pt-6 pb-24 sm:pt-10 sm:pb-16 bg-[#f7f7fc] min-h-[80vh]">
      <div className="container mx-auto px-4 sm:px-6 max-w-[800px]">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-xs font-medium inline-flex items-center gap-2 text-primary hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#eff0f6] p-6">
          <div className="flex items-center gap-3 border-b border-[#eff0f6] pb-4 mb-6">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-[#14142B]">Your Shopping Cart</h1>
            <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14142B]">Your cart is empty</h3>
                <p className="text-sm text-[#6E7191] mt-1">Explore our fresh groceries and start adding items to your cart!</p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-6 py-3 rounded-xl transition shadow-sm"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="divide-y divide-[#eff0f6]">
                {items.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#14142B] truncate">{item.name}</h4>
                      {item.variationName && (
                        <p className="text-xs text-[#6E7191] mt-0.5">{item.variationName}</p>
                      )}
                      <p className="text-xs font-bold text-primary mt-1">{formatPrice(item.price)} each</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#eff0f6] rounded-xl overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 hover:bg-white text-slate-600 transition"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#14142B]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 hover:bg-white text-slate-600 transition"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-[#14142B] w-20 text-right">
                        {formatPrice(item.itemTotal)}
                      </span>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#eff0f6] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#6E7191] uppercase tracking-wider block">Subtotal</span>
                  <span className="text-2xl font-black text-[#14142B]">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/"
                    className="flex-1 sm:flex-none text-center px-5 py-3 rounded-xl border border-[#eff0f6] text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                  >
                    Add More Items
                  </Link>
                  <Link
                    href="/checkout"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-7 py-3 rounded-xl transition shadow-md"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
