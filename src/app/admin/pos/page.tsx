"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettingStore } from "@/store/useSettingStore";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  DollarSign,
  ArrowLeft,
  User,
  CheckCircle,
  Store,
} from "lucide-react";
import { toast } from "sonner";

export default function PosRegisterPage() {
  const { formatPrice, activeBranch } = useSettingStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<any[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("+1000000000");
  const [tableNumber, setTableNumber] = useState("Table 1");
  const [paymentMethod, setPaymentMethod] = useState("pos_cash");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, search]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) setCategories(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchItems = async () => {
    try {
      let url = `/api/frontend/items?`;
      if (selectedCategory !== "all") url += `categoryId=${selectedCategory}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.status) setItems(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (item: any) => {
    const existingIndex = cart.findIndex((c) => c.itemId === item._id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].itemTotal = updated[existingIndex].price * updated[existingIndex].quantity;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          itemTotal: item.price,
        },
      ]);
    }
  };

  const updateCartQty = (idx: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== idx));
    } else {
      updated[idx].quantity = newQty;
      updated[idx].itemTotal = updated[idx].price * newQty;
      setCart(updated);
    }
  };

  const subtotal = cart.reduce((acc, c) => acc + c.itemTotal, 0);
  const tax = (subtotal * 5) / 100;
  const total = subtotal + tax;

  const handleCheckoutPOS = async () => {
    if (cart.length === 0) {
      toast.error("POS Cart is empty!");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing POS Order...");

    try {
      const orderPayload = {
        customerName,
        customerPhone,
        orderType,
        branchId: activeBranch?._id || "default_branch",
        items: cart,
        tableNumber: orderType === "dine_in" ? tableNumber : undefined,
        paymentMethod,
        paymentStatus: "paid",
        notes: "POS Order",
      };

      const res = await fetch("/api/frontend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      toast.dismiss();

      if (data.status) {
        toast.success(`POS Order ${data.data.orderSerialNo} created & receipt sent to printer!`);
        window.print(); // Thermal printer trigger
        setCart([]);
      } else {
        toast.error(data.message || "Failed to process POS order.");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error("POS Error: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* POS Top Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/admin/dashboard" className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-extrabold text-base text-white">POS Register Terminal</h1>
          <span className="text-xs text-slate-400 bg-slate-700 px-2.5 py-1 rounded-full">
            {activeBranch ? activeBranch.name : "Main Branch"}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold">
          <button
            onClick={handleCheckoutPOS}
            disabled={isProcessing || cart.length === 0}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Pay & Print Thermal Receipt</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Catalog on Left, Register Cart on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Items Catalog */}
        <div className="flex-1 p-4 flex flex-col space-y-4 overflow-hidden border-r border-slate-800">
          {/* Search & Categories */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === "all" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat._id ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => addToCart(item)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700/70 rounded-xl p-3 cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-white line-clamp-1">{item.name}</h4>
                  <span className="text-[10px] text-slate-400 capitalize">{item.itemType}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-black text-xs text-emerald-400">{formatPrice(item.price)}</span>
                  <div className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Register Order Cart */}
        <div className="w-96 bg-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-white border-b border-slate-700 pb-2">
              Active Register Cart
            </h3>

            {/* Order Type & Table Selection */}
            <div className="grid grid-cols-3 gap-2">
              {["dine_in", "takeaway", "delivery"].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type as any)}
                  className={`py-1.5 px-2 text-[10px] font-bold rounded-lg capitalize border transition ${
                    orderType === type
                      ? "border-red-500 bg-red-500/20 text-red-400"
                      : "border-slate-700 text-slate-400"
                  }`}
                >
                  {type.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
              />
              {orderType === "dine_in" && (
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table No."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              )}
            </div>

            {/* Cart Items Stream */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cart.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 p-2.5 rounded-xl flex items-center justify-between text-xs border border-slate-700/50"
                >
                  <div>
                    <p className="font-bold text-white line-clamp-1">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{formatPrice(c.price)} x {c.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartQty(idx, -1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-white">{c.quantity}</span>
                    <button
                      onClick={() => updateCartQty(idx, 1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method & Total Summary */}
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod("pos_cash")}
                className={`py-1.5 text-[10px] font-bold rounded-lg border ${
                  paymentMethod === "pos_cash"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod("pos_card")}
                className={`py-1.5 text-[10px] font-bold rounded-lg border ${
                  paymentMethod === "pos_card"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setPaymentMethod("paystack")}
                className={`py-1.5 text-[10px] font-bold rounded-lg border ${
                  paymentMethod === "paystack"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                Paystack
              </button>
            </div>

            <div className="space-y-1 text-xs font-semibold text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-700">
                <span>Total Amount</span>
                <span className="text-emerald-400">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutPOS}
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-sm py-3 rounded-xl shadow-lg transition"
            >
              Complete POS Order ({formatPrice(total)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
