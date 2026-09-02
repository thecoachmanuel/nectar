"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Loader2,
  Store,
  Tag,
  Printer,
  CheckCircle,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Phone,
  User,
  ShoppingBag,
  Percent,
  DollarSign
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice } from "@/lib/formatters";

export default function POSPage() {
  const { activeAdminStoreId, setActiveAdminStoreId } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(activeAdminStoreId || "0");

  const [orderType, setOrderType] = useState<"takeaway" | "delivery">("takeaway");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tokenNo, setTokenNo] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Discount state
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // 1. Load Stores and Categories on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, storeRes] = await Promise.all([
          fetch("/api/frontend/categories").catch(() => null),
          fetch("/api/admin/stores").catch(() => null)
        ]);

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (catData.status) setCategories(catData.data || []);
        }

        if (storeRes && storeRes.ok) {
          const storeData = await storeRes.json();
          const storeList = storeData.data || storeData.stores || [];
          if (Array.isArray(storeList)) {
            setBranches(storeList);
            // If no branch is selected yet or activeAdminStoreId was 0, pick the first active store
            if ((!activeAdminStoreId || activeAdminStoreId === "0") && storeList.length > 0) {
              const defaultStoreId = storeList[0]._id.toString();
              setSelectedBranch(defaultStoreId);
              setActiveAdminStoreId(defaultStoreId);
            }
          }
        }
      } catch (err) {
        console.error("POS initial data error:", err);
        toast.error("Failed to load POS settings");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [activeAdminStoreId, setActiveAdminStoreId]);

  // 2. Fetch products whenever selectedBranch changes
  const fetchProductsForStore = useCallback(async (storeId: string) => {
    setLoadingProducts(true);
    try {
      const url = storeId && storeId !== "0" 
        ? `/api/frontend/items?storeId=${storeId}` 
        : `/api/frontend/items`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setProducts(data.data || []);
        }
      }
    } catch (err) {
      console.error("Error loading products for store:", err);
      toast.error("Failed to load store products");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchProductsForStore(selectedBranch);
    }
  }, [selectedBranch, fetchProductsForStore]);

  // Handle store change from dropdown
  const handleStoreChange = (newStoreId: string) => {
    setSelectedBranch(newStoreId);
    setActiveAdminStoreId(newStoreId);
    toast.info(`Switched store context`);
  };

  // Cart operations
  const addToCart = (product: any) => {
    const hasDiscount = product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price);
    const effectivePrice = hasDiscount ? Number(product.discountPrice) : Number(product.price);

    setCart(prev => {
      const existing = prev.find(item => item.itemId === product._id);
      if (existing) {
        return prev.map(item => item.itemId === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        itemId: product._id, 
        name: product.name, 
        price: effectivePrice, 
        quantity: 1,
        image: product.image,
        storeId: selectedBranch || product.storeId || undefined
      }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.itemId !== itemId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = orderType === "delivery" ? 500 : 0;
  
  // Calculate discount
  const calculateDiscount = () => {
    if (appliedDiscount > 0) {
      return Math.min(appliedDiscount, subtotal);
    }
    return 0;
  };

  const currentDiscount = calculateDiscount();
  const total = Math.max(0, subtotal - currentDiscount + deliveryCharge);

  // Apply discount button
  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    if (discountType === "percent") {
      if (val > 100) {
        toast.error("Percentage discount cannot exceed 100%");
        return;
      }
      const calculated = Math.round((subtotal * val) / 100);
      setAppliedDiscount(calculated);
      toast.success(`Applied ${val}% discount (-${formatPrice(calculated)})`);
    } else {
      if (val > subtotal) {
        toast.error("Discount cannot be greater than subtotal");
        return;
      }
      setAppliedDiscount(val);
      toast.success(`Applied ${formatPrice(val)} discount`);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(0);
    setDiscountInput("");
    toast.info("Discount removed");
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle order submission
  const handleOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!selectedBranch || selectedBranch === "0") {
      return toast.error("Please select a specific store for this POS order.");
    }

    if (orderType === "delivery" && !deliveryAddress.trim()) {
      return toast.error("Please enter a delivery address for delivery orders.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/frontend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || "Walk-in Customer",
          customerPhone: customerPhone.trim() || undefined,
          orderType,
          branchId: selectedBranch,
          storeId: selectedBranch,
          items: cart.map(item => ({
            ...item,
            storeId: selectedBranch
          })),
          subtotal,
          discountAmount: currentDiscount,
          couponDiscount: currentDiscount,
          couponCode: appliedDiscount > 0 ? (discountType === "percent" ? `${discountInput}% POS` : "POS DISCOUNT") : undefined,
          deliveryCharge,
          totalAmount: total,
          paymentMethod: "cash_on_delivery",
          orderStatus: "accepted",
          deliveryAddress: orderType === "delivery" ? deliveryAddress : "POS Walk-in Store Pickup",
          notes: tokenNo ? `Token No: ${tokenNo}` : undefined,
          isPos: true
        })
      });

      const data = await res.json();
      if (data.status) {
        toast.success(`POS Order Created: ${data.orderSerialNo || "Success"}`);
        setCompletedOrder({
          orderSerialNo: data.orderSerialNo || "N/A",
          id: data.orderId || data.data?._id || "",
          total: total,
          itemsCount: cart.length,
          discount: currentDiscount,
          customer: customerName
        });
        setCart([]);
        setAppliedDiscount(0);
        setDiscountInput("");
        setTokenNo("");
        setDeliveryAddress("");
        setCartOpen(false);
      } else {
        toast.error(data.message || "Failed to place order");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Checkout failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "All" || 
      p.categoryId?._id === activeCategory || 
      p.categoryId?.name === activeCategory ||
      p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F7F7FC] flex flex-col font-sans select-none">
      
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-[#EFF0F6] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-xs">
        
        {/* Left: Back & Store Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link 
            href="/admin/dashboard" 
            className="w-10 h-10 rounded-xl bg-[#F7F7FC] text-[#6E7191] flex items-center justify-center hover:bg-[#EFF0F6] transition-colors shrink-0"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="hidden md:block">
            <h1 className="font-bold text-lg text-[#14142B] leading-tight">Point of Sale</h1>
            <p className="text-[11px] text-[#A0A3BD] font-medium">Grocery Checkout Terminal</p>
          </div>

          {/* Store Switcher Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center bg-[#F7F7FC] hover:bg-[#EFF0F6] border border-[#EFF0F6] rounded-xl px-3 py-1.5 transition-colors">
              <Store className="w-4 h-4 text-primary mr-2 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-[#14142B] focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                {branches.length === 0 && (
                  <option value="0">Loading Stores...</option>
                )}
                {branches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6E7191] pointer-events-none -ml-3" />
            </div>
            {loadingProducts && (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin ml-2" />
            )}
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-3 sm:mx-6">
          <div className="relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search groceries by name..." 
              className="w-full h-10 pl-10 pr-8 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary transition-colors text-[#14142B]"
            />
            <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProductsForStore(selectedBranch)}
            title="Refresh Catalog"
            className="w-10 h-10 rounded-xl bg-[#F7F7FC] text-[#6E7191] hover:bg-[#EFF0F6] flex items-center justify-center transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loadingProducts ? "animate-spin text-primary" : ""}`} />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen POS"}
            className="hidden sm:flex w-10 h-10 rounded-xl bg-[#F7F7FC] text-[#6E7191] hover:bg-[#EFF0F6] items-center justify-center transition-colors shrink-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Mobile Cart Trigger Button */}
          <button 
            onClick={() => setCartOpen(true)}
            className="lg:hidden h-10 px-3.5 rounded-xl bg-primary text-white flex items-center gap-2 relative shadow-md shadow-primary/20 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs font-bold">{cart.length}</span>
            <span className="font-bold text-xs">{formatPrice(total)}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN BODY (FLEX-1 VIEWPORT) ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT CATALOG SECTION */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F7FC]">
          
          {/* Categories Horizontal Slider */}
          <div className="bg-white border-b border-[#EFF0F6] px-4 py-3 shrink-0 overflow-x-auto custom-scrollbar flex items-center gap-2">
            <button 
              onClick={() => setActiveCategory("All")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === "All" 
                  ? "bg-primary text-white shadow-sm shadow-primary/30" 
                  : "bg-[#F7F7FC] text-[#6E7191] hover:bg-[#EFF0F6]"
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map(cat => (
              <button 
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat._id 
                    ? "bg-primary text-white shadow-sm shadow-primary/30" 
                    : "bg-[#F7F7FC] text-[#6E7191] hover:bg-[#EFF0F6]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {loading || loadingProducts ? (
              <div className="h-full flex flex-col items-center justify-center text-[#6E7191] gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Loading store inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#A0A3BD] gap-3">
                <ShoppingBag className="w-12 h-12 text-[#D9DBE9]" />
                <p className="text-base font-semibold text-[#14142B]">No products found</p>
                <p className="text-xs text-[#6E7191]">
                  {searchTerm ? `No matches for "${searchTerm}"` : "This store does not have active products yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                {filteredProducts.map(product => {
                  const cartItem = cart.find(item => item.itemId === product._id);
                  const inCartQty = cartItem?.quantity || 0;
                  const hasDiscount = product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price);

                  return (
                    <div 
                      key={product._id} 
                      onClick={() => addToCart(product)} 
                      className={`bg-white rounded-2xl border transition-all cursor-pointer group flex flex-col overflow-hidden relative ${
                        inCartQty > 0 
                          ? "border-primary/40 shadow-sm ring-2 ring-primary/10" 
                          : "border-[#EFF0F6] hover:border-primary/40 hover:shadow-md"
                      }`}
                    >
                      {/* In-cart indicator badge */}
                      {inCartQty > 0 && (
                        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md">
                          {inCartQty}
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="aspect-square bg-[#F7F7FC] relative overflow-hidden flex items-center justify-center">
                        <img 
                          src={product.image || "/images/default/item.png"} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>

                      {/* Product Details */}
                      <div className="p-3 flex-1 flex flex-col justify-between text-left">
                        <h3 className="font-semibold text-xs sm:text-sm text-[#14142B] line-clamp-2 leading-snug mb-1">
                          {product.name}
                        </h3>
                        
                        <div className="mt-auto pt-1">
                          {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-bold text-primary text-sm">
                                {formatPrice(product.discountPrice)}
                              </span>
                              <span className="text-[10px] text-[#A0A3BD] line-through">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-primary text-sm">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT CART SIDEBAR (LOCKED TO VIEWPORT HEIGHT) ───────────────── */}
        {cartOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs" 
            onClick={() => setCartOpen(false)} 
          />
        )}
        
        <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-[360px] sm:w-[400px] lg:w-[420px] bg-white border-l border-[#EFF0F6] shadow-2xl lg:shadow-none flex flex-col h-full transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}>
          
          {/* Top Section: Customer, Store & Order Type (shrink-0) */}
          <div className="p-4 border-b border-[#EFF0F6] shrink-0 bg-white space-y-2.5">
            
            {/* Mobile close header */}
            <div className="flex items-center justify-between lg:hidden pb-1">
              <h3 className="font-bold text-sm text-[#14142B]">Current Order</h3>
              <button onClick={() => setCartOpen(false)} className="text-[#6E7191] hover:text-[#14142B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Name & Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full h-9 pl-7 pr-2 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-xs font-semibold text-[#14142B] focus:outline-none focus:border-primary"
                />
                <User className="w-3.5 h-3.5 text-[#A0A3BD] absolute left-2 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full h-9 pl-7 pr-2 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-xs font-semibold text-[#14142B] focus:outline-none focus:border-primary"
                />
                <Phone className="w-3.5 h-3.5 text-[#A0A3BD] absolute left-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Order Type Selector */}
            <div className="grid grid-cols-2 bg-[#F7F7FC] rounded-xl p-1">
              <button 
                onClick={() => setOrderType("takeaway")}
                className={`h-8 rounded-lg font-bold text-xs transition-all ${
                  orderType === "takeaway" 
                    ? "bg-white text-[#14142B] shadow-xs" 
                    : "text-[#6E7191] hover:text-[#14142B]"
                }`}
              >
                In-Store / Takeaway
              </button>
              <button 
                onClick={() => setOrderType("delivery")}
                className={`h-8 rounded-lg font-bold text-xs transition-all ${
                  orderType === "delivery" 
                    ? "bg-white text-[#14142B] shadow-xs" 
                    : "text-[#6E7191] hover:text-[#14142B]"
                }`}
              >
                Local Delivery
              </button>
            </div>

            {/* Token or Delivery Address */}
            {orderType === "delivery" ? (
              <input 
                type="text" 
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Delivery Address (Required)" 
                className="w-full h-9 px-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-xs font-medium text-[#14142B] focus:outline-none focus:border-primary"
              />
            ) : (
              <input 
                type="text" 
                value={tokenNo}
                onChange={(e) => setTokenNo(e.target.value)}
                placeholder="Token / Bill Ref. (Optional)" 
                className="w-full h-9 px-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-xs font-medium text-[#14142B] focus:outline-none focus:border-primary"
              />
            )}
          </div>

          {/* Middle Section: Scrollable Cart Items (flex-1 overflow-y-auto) */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0 bg-white">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#A0A3BD] py-12">
                <ShoppingCart className="w-10 h-10 text-[#D9DBE9] mb-2" />
                <p className="text-sm font-semibold text-[#14142B]">Cart is empty</p>
                <p className="text-xs text-[#6E7191] text-center mt-1">
                  Click any product from the catalog on the left to add it to this order.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {cart.map(item => (
                  <li 
                    key={item.itemId} 
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] hover:border-primary/20 transition-colors"
                  >
                    {/* Item Image */}
                    <div className="w-11 h-11 rounded-lg bg-white overflow-hidden shrink-0 border border-[#EFF0F6]">
                      <img 
                        src={item.image || "/images/default/item.png"} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Name & Unit Price */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-[#14142B] truncate leading-tight mb-0.5">
                        {item.name}
                      </h4>
                      <p className="font-bold text-xs text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 bg-white rounded-lg p-0.5 border border-[#EFF0F6] shrink-0">
                      <button 
                        onClick={() => updateQty(item.itemId, -1)} 
                        className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-[#6E7191] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-[#14142B]">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQty(item.itemId, 1)} 
                        className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove button */}
                    <button 
                      onClick={() => removeFromCart(item.itemId)} 
                      className="text-[#A0A3BD] hover:text-[#FB4E4E] p-1 transition-colors shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bottom Section: Pinned Totals, Discount & Checkout (shrink-0) */}
          <div className="p-4 border-t border-[#EFF0F6] bg-[#FAFAFC] shrink-0 space-y-3 shadow-inner">
            
            {/* Discount Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6E7191] flex items-center gap-1">
                  <Tag className="w-3 h-3 text-primary" />
                  Apply Discount
                </span>
                {currentDiscount > 0 && (
                  <button 
                    onClick={handleRemoveDiscount}
                    className="text-[11px] font-semibold text-[#FB4E4E] hover:underline"
                  >
                    Remove Discount
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Discount Type Toggle (Fixed vs Percent) */}
                <div className="flex bg-white rounded-xl border border-[#EFF0F6] p-0.5 shrink-0">
                  <button
                    onClick={() => { setDiscountType("fixed"); setAppliedDiscount(0); }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      discountType === "fixed" ? "bg-primary text-white" : "text-[#6E7191]"
                    }`}
                    title="Fixed Amount Discount"
                  >
                    ₦ Fix
                  </button>
                  <button
                    onClick={() => { setDiscountType("percent"); setAppliedDiscount(0); }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      discountType === "percent" ? "bg-primary text-white" : "text-[#6E7191]"
                    }`}
                    title="Percentage Discount"
                  >
                    % Pct
                  </button>
                </div>

                {/* Input */}
                <input 
                  type="number" 
                  min="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder={discountType === "percent" ? "e.g. 10%" : "e.g. 500"} 
                  className="flex-1 h-9 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs font-semibold text-[#14142B] focus:outline-none focus:border-primary"
                />

                {/* Apply Button */}
                <button 
                  onClick={handleApplyDiscount}
                  className="px-3.5 h-9 rounded-xl bg-[#008BBA] text-white text-xs font-bold hover:bg-[#00749b] transition-colors shrink-0 shadow-xs"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Order Price Breakdown */}
            <div className="bg-white rounded-xl p-3 border border-[#EFF0F6] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#6E7191]">Subtotal</span>
                <span className="font-semibold text-[#14142B]">{formatPrice(subtotal)}</span>
              </div>
              
              {currentDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#1AB759] font-medium flex items-center gap-1">
                    Discount ({discountType === "percent" ? `${discountInput}%` : "Manual"})
                  </span>
                  <span className="font-bold text-[#1AB759]">-{formatPrice(currentDiscount)}</span>
                </div>
              )}

              {orderType === "delivery" && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#6E7191]">Delivery Fee</span>
                  <span className="font-semibold text-[#14142B]">{formatPrice(deliveryCharge)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm pt-2 border-t border-dashed border-[#EFF0F6]">
                <span className="font-bold text-[#14142B]">Total Due</span>
                <span className="font-extrabold text-primary text-base">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button 
                onClick={() => {
                  if (cart.length > 0 && confirm("Are you sure you want to clear the cart?")) {
                    setCart([]);
                    setAppliedDiscount(0);
                    setDiscountInput("");
                  }
                }} 
                disabled={cart.length === 0}
                className="h-11 rounded-xl bg-white border border-[#EFF0F6] text-[#FB4E4E] hover:bg-red-50 font-bold text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>

              <button 
                onClick={handleOrder} 
                disabled={isSubmitting || cart.length === 0}
                className="col-span-2 h-11 rounded-xl bg-[#1AB759] hover:bg-[#159a4a] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#1AB759]/20 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Charge {formatPrice(total)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </aside>
      </div>

      {/* ── ORDER SUCCESS MODAL ─────────────────────────────────────────────── */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-[#EFF0F6] animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-[#E0FFED] text-[#1AB759] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h3 className="font-extrabold text-xl text-[#14142B] mb-1">Order Placed!</h3>
            <p className="text-xs text-[#6E7191] mb-4">
              Receipt No: <strong className="text-primary font-mono">{completedOrder.orderSerialNo}</strong>
            </p>

            <div className="bg-[#FAFAFC] rounded-2xl p-4 border border-[#EFF0F6] space-y-2 mb-6 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-[#6E7191]">Customer</span>
                <span className="font-semibold text-[#14142B]">{completedOrder.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E7191]">Items Count</span>
                <span className="font-semibold text-[#14142B]">{completedOrder.itemsCount} products</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between text-[#1AB759]">
                  <span>Discount Given</span>
                  <span className="font-bold">-{formatPrice(completedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-dashed border-[#EFF0F6]">
                <span className="text-[#14142B]">Total Paid</span>
                <span className="text-primary">{formatPrice(completedOrder.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={() => {
                  if (completedOrder.id) {
                    window.open(`/order/${completedOrder.id}?print=true`, "_blank");
                  }
                }}
                className="h-11 rounded-xl bg-white border border-[#EFF0F6] hover:bg-gray-50 text-[#14142B] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-[#6E7191]" />
                Print Receipt
              </button>

              <button 
                onClick={() => setCompletedOrder(null)}
                className="h-11 rounded-xl bg-primary hover:bg-[#e60060] text-white font-bold text-xs shadow-md shadow-primary/20 transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
