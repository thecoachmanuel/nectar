"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Printer,
  X,
  Maximize2,
  Minimize2,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Delete,
  CornerDownLeft
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice } from "@/lib/formatters";

export default function POSPage() {
  const { activeAdminStoreId, setActiveAdminStoreId } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Settings and Master Data
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(activeAdminStoreId || "0");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Store delivery & company settings
  const [adminDeliveryFee, setAdminDeliveryFee] = useState<number>(1500);
  const [companyName, setCompanyName] = useState<string>("Nectar");
  const [receiptPoweredBy, setReceiptPoweredBy] = useState<string>("Powered by Nectar");

  // Order Details Form
  const [orderType, setOrderType] = useState<"takeaway" | "delivery">("takeaway");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tokenNo, setTokenNo] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Discount state
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile_banking" | "other">("cash");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [cardDigitsInput, setCardDigitsInput] = useState<string>("");
  const [transferRefInput, setTransferRefInput] = useState<string>("");
  const [otherNoteInput, setOtherNoteInput] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // 1. Load Stores, Categories, Customers & Settings on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, storeRes, custRes, settingsRes] = await Promise.all([
          fetch("/api/frontend/categories").catch(() => null),
          fetch("/api/admin/stores").catch(() => null),
          fetch("/api/admin/users?role=customer").catch(() => null),
          fetch("/api/settings").catch(() => null)
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
            if ((!activeAdminStoreId || activeAdminStoreId === "0") && storeList.length > 0) {
              const defaultStoreId = storeList[0]._id.toString();
              setSelectedBranch(defaultStoreId);
              setActiveAdminStoreId(defaultStoreId);
            }
          }
        }

        if (custRes && custRes.ok) {
          const custData = await custRes.json();
          if (custData.status) setCustomers(custData.data || []);
        }

        if (settingsRes && settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.data && Array.isArray(sData.data)) {
            const baseFeeSetting = sData.data.find((s: any) => s.key === "baseDeliveryFee" || s.key === "order_setup_basic_delivery_charge");
            if (baseFeeSetting?.payload) setAdminDeliveryFee(Number(baseFeeSetting.payload) || 1500);

            const compSetting = sData.data.find((s: any) => s.key === "company_name");
            if (compSetting?.payload) setCompanyName(compSetting.payload);

            const pBySetting = sData.data.find((s: any) => s.key === "receipt_powered_by");
            if (pBySetting !== undefined) setReceiptPoweredBy(pBySetting.payload ?? "");
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

  // Current active store details
  const currentStore = useMemo(() => {
    return branches.find(b => String(b._id) === String(selectedBranch)) || null;
  }, [branches, selectedBranch]);

  // Delivery fee resolution: Store deliveryFee strictly overrides Admin baseDeliveryFee
  const effectiveDeliveryFee = useMemo(() => {
    if (orderType !== "delivery") return 0;
    if (currentStore && currentStore.deliveryFee !== undefined && currentStore.deliveryFee !== null && Number(currentStore.deliveryFee) > 0) {
      return Number(currentStore.deliveryFee);
    }
    return adminDeliveryFee || 1500;
  }, [orderType, currentStore, adminDeliveryFee]);

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

  // Handle customer dropdown selection
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomerName("Walk-in Customer");
      setCustomerPhone("");
      return;
    }
    const found = customers.find(c => String(c._id) === String(customerId));
    if (found) {
      setCustomerName(found.name || "Customer");
      setCustomerPhone(found.phone || "");
      if (found.addresses && Array.isArray(found.addresses) && found.addresses.length > 0) {
        setDeliveryAddress(found.addresses[0].address || "");
      }
    }
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

  const setExactQty = (itemId: string, qty: number) => {
    if (isNaN(qty) || qty < 1) return;
    setCart(prev => prev.map(item => item.itemId === itemId ? { ...item, quantity: qty } : item));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.itemId !== itemId));
  };

  const resetCart = () => {
    setCart([]);
    setAppliedDiscount(0);
    setDiscountInput("");
    setTokenNo("");
    setDeliveryAddress("");
    toast.info("Cart cleared");
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Calculate discount
  const currentDiscount = useMemo(() => {
    if (appliedDiscount > 0) {
      return Math.min(appliedDiscount, subtotal);
    }
    return 0;
  }, [appliedDiscount, subtotal]);

  const total = Math.max(0, subtotal - currentDiscount + effectiveDeliveryFee);

  // Apply discount button
  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    if (discountType === "percentage") {
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

  // Open Payment Modal
  const handleOpenPaymentModal = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!selectedBranch || selectedBranch === "0") {
      return toast.error("Please select a specific store for this POS order.");
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      return toast.error("Please enter a delivery address for delivery orders.");
    }
    // Set default cash received to exact total
    setCashReceivedInput(String(total));
    setCardDigitsInput("");
    setTransferRefInput("");
    setOtherNoteInput("");
    setIsPaymentModalOpen(true);
  };

  // Interactive Numpad handler for cash / card input
  const handleNumpadPress = (val: string) => {
    if (paymentMethod === "cash") {
      if (val === "clear") {
        setCashReceivedInput("");
      } else if (val === "back") {
        setCashReceivedInput(prev => prev.slice(0, -1));
      } else if (val === ".") {
        if (!cashReceivedInput.includes(".")) {
          setCashReceivedInput(prev => prev + ".");
        }
      } else {
        setCashReceivedInput(prev => prev + val);
      }
    } else if (paymentMethod === "card") {
      if (val === "clear") {
        setCardDigitsInput("");
      } else if (val === "back") {
        setCardDigitsInput(prev => prev.slice(0, -1));
      } else if (val !== ".") {
        if (cardDigitsInput.length < 4) {
          setCardDigitsInput(prev => prev + val);
        }
      }
    }
  };

  // Calculate live change for cash payments
  const cashReceivedAmount = parseFloat(cashReceivedInput) || 0;
  const cashChangeAmount = Math.max(0, cashReceivedAmount - total);
  const cashShortageAmount = Math.max(0, total - cashReceivedAmount);

  // Submit and confirm order
  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      let paymentRef = "";
      if (paymentMethod === "card") paymentRef = cardDigitsInput ? `Card last 4: ${cardDigitsInput}` : "POS Card Terminal";
      else if (paymentMethod === "mobile_banking") paymentRef = transferRefInput ? `Transfer Ref: ${transferRefInput}` : "Mobile Transfer";
      else if (paymentMethod === "other") paymentRef = otherNoteInput || "Other Payment";

      const orderPayload = {
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
        couponCode: appliedDiscount > 0 ? (discountType === "percentage" ? `${discountInput}% POS` : "POS DISCOUNT") : undefined,
        deliveryCharge: effectiveDeliveryFee,
        totalAmount: total,
        paymentMethod,
        paymentStatus: "paid", // POS orders are collected on the spot
        paymentReference: paymentRef || undefined,
        posReceivedAmount: paymentMethod === "cash" ? cashReceivedAmount : total,
        posChangeAmount: paymentMethod === "cash" ? cashChangeAmount : 0,
        orderStatus: "accepted",
        deliveryAddress: orderType === "delivery" ? deliveryAddress : "POS Store Takeaway / Pickup",
        notes: tokenNo ? `Token: ${tokenNo}` : undefined,
        isPos: true
      };

      const res = await fetch("/api/frontend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (data.status) {
        toast.success(`POS Order #${data.orderSerialNo || "Created"} Confirmed!`);
        setCompletedOrder({
          orderSerialNo: data.orderSerialNo || "N/A",
          id: data.orderId || data.data?._id || "",
          total: total,
          subtotal: subtotal,
          discount: currentDiscount,
          deliveryFee: effectiveDeliveryFee,
          paymentMethod: paymentMethod,
          paymentReference: paymentRef,
          posReceivedAmount: paymentMethod === "cash" ? cashReceivedAmount : total,
          posChangeAmount: paymentMethod === "cash" ? cashChangeAmount : 0,
          customer: customerName,
          phone: customerPhone,
          address: orderType === "delivery" ? deliveryAddress : null,
          token: tokenNo,
          orderType: orderType,
          date: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }),
          time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
          items: [...cart],
          storeName: currentStore?.name || companyName,
          storeAddress: currentStore?.address || "Main Store",
          storePhone: currentStore?.phone || ""
        });

        // Clear active cart & inputs
        setCart([]);
        setAppliedDiscount(0);
        setDiscountInput("");
        setTokenNo("");
        setDeliveryAddress("");
        setCartOpen(false);
        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(true);
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
      p.category === activeCategory || 
      p.itemCategory === activeCategory ||
      (typeof p.category === "object" && p.category?._id === activeCategory);

    const matchesSearch = !searchTerm.trim() || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F7F7FC] font-rubik text-[#2E2F38] select-none">
      
      {/* ── TOP POS NAVBAR ─────────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-[#EFF0F6] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EFF0F6] text-xs font-medium text-[#6E7191] hover:bg-[#F7F7FC] hover:text-[#14142B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#14142B] tracking-tight">Point of Sale</h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Terminal Live
            </span>
          </div>
        </div>

        {/* Store Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F7F7FC] border border-[#D9DBE9] rounded-lg px-3 py-1.5">
            <Store className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-[#6E7191] hidden sm:inline">Store:</span>
            <select
              value={selectedBranch}
              onChange={(e) => handleStoreChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#14142B] focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
            >
              {branches.map(b => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setCartOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-bold">{cart.length}</span>
            <span>{formatPrice(total)}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN BODY VIEWPORT ──────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT CATALOG SECTION */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F7FC] p-4 sm:p-5">
          
          {/* PHP App Style Search Bar */}
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center w-full h-[38px] leading-[38px] mb-4 rounded-lg bg-white border border-[#EFF0F6] shrink-0"
          >
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by menu item..."
              className="w-full px-4 rounded-l-lg text-xs placeholder:text-xs placeholder:font-rubik placeholder:text-[#A0A3BD] text-[#2E2F38] focus:outline-none"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm("")}
                className="text-xs text-red-500 px-2 hover:opacity-75"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button 
              type="submit"
              className="flex-shrink-0 w-[38px] h-full flex items-center justify-center rounded-r-lg bg-primary text-white hover:opacity-90"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </form>

          {/* PHP App Style Category Slides */}
          <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-4 custom-scrollbar shrink-0">
            <button 
              onClick={() => setActiveCategory("All")}
              className={`w-24 sm:w-28 shrink-0 flex flex-col items-center text-center gap-2 py-3 px-2 rounded-lg border-b-2 transition bg-white ${
                activeCategory === "All" 
                  ? "border-primary bg-primary-light text-primary shadow-xs font-semibold" 
                  : "border-transparent hover:bg-primary-light hover:border-primary text-heading"
              }`}
            >
              <span className="text-xl">📦</span>
              <h3 className="text-xs leading-4 font-medium font-rubik">All Items</h3>
            </button>
            {categories.map((category) => (
              <button 
                key={category._id}
                onClick={() => setActiveCategory(category._id)}
                className={`w-24 sm:w-28 shrink-0 flex flex-col items-center text-center gap-2 py-3 px-2 rounded-lg border-b-2 transition bg-white ${
                  activeCategory === category._id 
                    ? "border-primary bg-primary-light text-primary shadow-xs font-semibold" 
                    : "border-transparent hover:bg-primary-light hover:border-primary text-heading"
                }`}
              >
                {category.thumb || category.image ? (
                  <img src={category.thumb || category.image} alt={category.name} className="h-6 w-6 object-contain" />
                ) : (
                  <span className="text-xl">🥦</span>
                )}
                <h3 className="text-xs leading-4 font-medium font-rubik truncate w-full px-1">{category.name}</h3>
              </button>
            ))}
          </div>

          {/* PHP App Style Product Cards Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading || loadingProducts ? (
              <div className="h-full flex flex-col items-center justify-center text-[#6E7191] gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-medium font-rubik">Loading store inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#A0A3BD] gap-3">
                <ShoppingBag className="w-12 h-12 text-[#D9DBE9]" />
                <p className="text-sm font-semibold text-[#14142B]">No items available</p>
                <p className="text-xs text-[#6E7191]">
                  {searchTerm ? `No matches for "${searchTerm}"` : "This store has no active products."}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-[18px] grid-cols-[repeat(auto-fill,_minmax(140px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(175px,_1fr))]">
                {filteredProducts.map(item => {
                  const cartItem = cart.find(c => c.itemId === item._id);
                  const inCartQty = cartItem?.quantity || 0;
                  const hasDiscount = item.discountPrice && Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price);
                  const displayPrice = hasDiscount ? item.discountPrice : item.price;

                  return (
                    <div 
                      key={item._id}
                      className="rounded-2xl border transition border-[#EFF0F6] bg-white hover:shadow-xs overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative">
                        <img 
                          className="h-[135px] sm:h-[150px] w-full object-cover rounded-t-2xl" 
                          src={item.image || "/images/default/item.png"} 
                          alt={item.name} 
                        />
                        {inCartQty > 0 && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                            {inCartQty}
                          </span>
                        )}
                      </div>
                      <div className="py-3 px-3 rounded-b-2xl flex-1 flex flex-col justify-between">
                        <h3 className="text-xs mb-2 font-medium font-rubik capitalize text-heading line-clamp-2 leading-tight">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                          <h4 className="font-rubik text-xs font-semibold text-heading">
                            {formatPrice(displayPrice)}
                          </h4>
                          <button 
                            type="button"
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-1.5 rounded-3xl capitalize text-xs font-medium font-rubik py-1 px-3 shadow-cardCart transition bg-white border border-[#EFF0F6] text-primary hover:bg-primary hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT CART SIDEBAR (LOCKED VIEWPORT HEIGHT) ───────────────────── */}
        {cartOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs" 
            onClick={() => setCartOpen(false)} 
          />
        )}

        <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-[330px] sm:w-[350px] lg:w-[360px] xl:w-[380px] bg-white border-l border-[#EFF0F6] flex flex-col h-full transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}>
          
          {/* Top Form Controls: Customer, Token, Order Type */}
          <div className="p-4 border-b border-[#EFF0F6] shrink-0 space-y-3">
            
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between lg:hidden pb-1">
              <h3 className="font-semibold text-sm text-[#14142B]">Active Cart</h3>
              <button onClick={() => setCartOpen(false)} className="text-[#6E7191] hover:text-[#14142B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Selection Row */}
            <div className="flex items-center w-full gap-2">
              <div className="flex-1">
                <select 
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg appearance-none text-heading border border-[#D9DBE9] bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const custom = prompt("Enter customer name:");
                  if (custom) setCustomerName(custom);
                }}
                className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Custom Customer Name"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Token Number Input */}
            <input 
              type="text"
              value={tokenNo}
              onChange={(e) => setTokenNo(e.target.value)}
              placeholder="Token / Order Reference No"
              className="w-full h-10 text-xs rounded-lg border border-[#D9DBE9] px-3 text-heading focus:outline-none focus:border-primary placeholder:text-[#A0A3BD]"
            />

            {/* PHP App Style Order Type Radio Box */}
            <div className="p-3 pt-2 rounded-lg border border-[#D9DBE9]">
              <h4 className="text-xs font-medium mb-2 font-rubik text-heading">Select Order Type</h4>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("takeaway")}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium font-rubik flex items-center justify-center gap-2 transition ${
                    orderType === "takeaway" 
                      ? "border-primary bg-primary text-white" 
                      : "border-[#EFF0F6] bg-[#F7F7FC] text-[#6E7191] hover:bg-gray-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full border border-current"></span>
                  Takeaway
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType("delivery")}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium font-rubik flex items-center justify-center gap-2 transition ${
                    orderType === "delivery" 
                      ? "border-primary bg-primary text-white" 
                      : "border-[#EFF0F6] bg-[#F7F7FC] text-[#6E7191] hover:bg-gray-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full border border-current"></span>
                  Delivery
                </button>
              </div>

              {/* Delivery Info & Override Conditions */}
              {orderType === "delivery" && (
                <div className="mt-3 space-y-2 pt-2 border-t border-[#EFF0F6]">
                  {/* Fulfillment Store Address */}
                  <div className="p-2 rounded-lg bg-[#F7F7FC] border border-[#EFF0F6] text-[11px] text-[#6E7191] flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-heading block">Fulfilling from Store:</span>
                      <span className="text-[#14142B] font-medium">{currentStore?.name}</span>
                      <p className="text-[10px] text-[#6E7191]">{currentStore?.address || "Store Address Available"}</p>
                    </div>
                  </div>

                  {/* Delivery Fee Notice (Store rate vs Admin rate) */}
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-[#6E7191]">Store Delivery Fee:</span>
                    <span className="font-bold text-emerald-600">
                      {formatPrice(effectiveDeliveryFee)}
                      {currentStore?.deliveryFee && Number(currentStore.deliveryFee) > 0 ? (
                        <span className="text-[9px] text-[#A0A3BD] font-normal ml-1">(Store Set)</span>
                      ) : (
                        <span className="text-[9px] text-[#A0A3BD] font-normal ml-1">(Admin Rate)</span>
                      )}
                    </span>
                  </div>

                  {/* Customer Delivery Address Input */}
                  <input 
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter customer delivery address..."
                    className="w-full h-9 text-xs rounded-lg border border-[#D9DBE9] px-3 text-heading focus:outline-none focus:border-primary placeholder:text-[#A0A3BD]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* PHP App Style Cart Items Table (Scrollable flex-1) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#A0A3BD] p-6 text-center">
                <ShoppingCart className="w-10 h-10 text-[#D9DBE9] mb-2" />
                <p className="text-xs font-semibold text-[#14142B]">Your cart is empty</p>
                <p className="text-[10px] text-[#6E7191] mt-0.5">Click on items to add them to the order.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-light sticky top-0 z-10">
                  <tr className="h-8">
                    <th className="w-7 pl-3 text-left"></th>
                    <th className="text-left px-2 text-[11px] font-rubik font-medium text-heading">Item</th>
                    <th className="text-center px-2 text-[11px] font-rubik font-medium text-heading">Qty</th>
                    <th className="text-right pr-3 text-[11px] font-rubik font-medium text-heading">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF0F6]">
                  {cart.map((item) => (
                    <tr key={item.itemId} className="hover:bg-[#FAFAFC] transition-colors">
                      <td className="pl-3 py-2.5 align-middle">
                        <button 
                          onClick={() => removeFromCart(item.itemId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="px-2 py-2.5 align-middle">
                        <h4 className="text-xs font-medium font-rubik text-heading line-clamp-1">{item.name}</h4>
                        <span className="text-[10px] text-[#6E7191]">{formatPrice(item.price)} each</span>
                      </td>
                      <td className="px-2 py-2.5 align-middle">
                        {/* PHP App Style indec-group */}
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            type="button"
                            onClick={() => updateQty(item.itemId, -1)}
                            className="w-[18px] h-[18px] rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition text-[10px]"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => setExactQty(item.itemId, parseInt(e.target.value, 10))}
                            className="w-7 text-center text-xs font-semibold text-heading focus:outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => updateQty(item.itemId, 1)}
                            className="w-[18px] h-[18px] rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition text-[10px]"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                      <td className="pr-3 py-2.5 text-right font-rubik text-xs font-semibold text-heading align-middle">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PHP App Style Bottom Billing Section (Shrink-0) */}
          <div className="p-4 border-t border-[#EFF0F6] shrink-0 bg-white space-y-3">
            
            {/* PHP App Style Discount Bar */}
            {cart.length > 0 && (
              <div className="flex h-[38px]">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDiscountDropdownOpen(!isDiscountDropdownOpen)}
                    className="flex items-center justify-between w-[110px] h-full text-xs font-rubik rounded-l border border-[#EFF0F6] bg-white px-2.5 text-heading"
                  >
                    <span>{discountType === "percentage" ? "Percent (%)" : "Fixed (₦)"}</span>
                    <ChevronDown className="w-3 h-3 text-[#6E7191]" />
                  </button>

                  {isDiscountDropdownOpen && (
                    <div className="absolute bottom-10 left-0 z-20 w-32 bg-white rounded-lg shadow-xl border border-[#EFF0F6] py-1 text-xs">
                      <button
                        type="button"
                        onClick={() => { setDiscountType("percentage"); setIsDiscountDropdownOpen(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#F7F7FC] text-heading"
                      >
                        Percent (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDiscountType("fixed"); setIsDiscountDropdownOpen(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#F7F7FC] text-heading"
                      >
                        Fixed (₦)
                      </button>
                    </div>
                  )}
                </div>

                <input 
                  type="number"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="Add discount..."
                  className="flex-1 h-full border-t border-b border-[#EFF0F6] px-3 text-xs font-rubik text-heading focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="w-16 h-full text-xs font-medium font-rubik capitalize rounded-r text-white bg-[#008BBA] hover:bg-[#00749B] transition"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Totals Breakdown List */}
            <ul className="flex flex-col gap-1.5 text-xs font-rubik pt-1">
              <li className="flex items-center justify-between text-[#6E7191]">
                <span>Subtotal</span>
                <span className="text-heading font-medium">{formatPrice(subtotal)}</span>
              </li>
              
              {currentDiscount > 0 && (
                <li className="flex items-center justify-between text-rose-500 font-medium">
                  <span>Discount</span>
                  <span>-{formatPrice(currentDiscount)}</span>
                </li>
              )}

              {orderType === "delivery" && (
                <li className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Delivery Charge</span>
                  <span>+{formatPrice(effectiveDeliveryFee)}</span>
                </li>
              )}

              <li className="flex items-center justify-between text-sm font-bold text-heading pt-1 border-t border-[#EFF0F6]">
                <span>Total</span>
                <span className="text-primary text-base font-bold">{formatPrice(total)}</span>
              </li>
            </ul>

            {/* PHP App Style Cancel & Order Action Buttons */}
            {cart.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetCart}
                  className="capitalize text-xs font-medium font-rubik w-full text-center rounded-3xl py-2.5 text-white bg-[#FB4E4E] hover:bg-red-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOpenPaymentModal}
                  className="capitalize text-xs font-medium font-rubik w-full text-center rounded-3xl py-2.5 text-white bg-[#1AB759] hover:bg-emerald-600 transition"
                >
                  Order
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── POS ORDER PAYMENT MODAL (Matching PHP PaymentComponent.vue) ───────── */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-rubik">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[430px] overflow-hidden border border-[#D9DBE9] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9DBE9]">
              <h3 className="capitalize font-medium text-base text-[#1F1F39]">Order Payment</h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-[#6E7191] hover:text-[#1F1F39] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Total Amount Banner */}
              <div className="flex justify-between items-center h-12 w-full rounded-lg px-4 bg-[#F7F7FC] border border-[#EFF0F6]">
                <span className="text-sm font-normal text-[#2E2F38]">Total Amount</span>
                <span className="text-primary text-lg font-bold">{formatPrice(total)}</span>
              </div>

              {/* Payment Method Selector Tabs */}
              <div>
                <h4 className="capitalize font-medium text-xs text-[#2E2F38] mb-2">Select Payment Method</h4>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-medium transition ${
                      paymentMethod === "cash" 
                        ? "border-primary bg-primary-light text-primary" 
                        : "border-[#F7F7FC] bg-[#F7F7FC] text-[#6E7191] hover:border-gray-300"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-[11px]">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-medium transition ${
                      paymentMethod === "card" 
                        ? "border-primary bg-primary-light text-primary" 
                        : "border-[#F7F7FC] bg-[#F7F7FC] text-[#6E7191] hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[11px]">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mobile_banking")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-medium transition ${
                      paymentMethod === "mobile_banking" 
                        ? "border-primary bg-primary-light text-primary" 
                        : "border-[#F7F7FC] bg-[#F7F7FC] text-[#6E7191] hover:border-gray-300"
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-[11px]">Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("other")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-medium transition ${
                      paymentMethod === "other" 
                        ? "border-primary bg-primary-light text-primary" 
                        : "border-[#F7F7FC] bg-[#F7F7FC] text-[#6E7191] hover:border-gray-300"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-[11px]">Other</span>
                  </button>
                </div>
              </div>

              {/* Active Payment Tab Details */}
              {paymentMethod === "cash" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-[#2E2F38]">Received Amount</label>
                      {cashChangeAmount > 0 ? (
                        <span className="text-xs font-bold text-emerald-600">Change: {formatPrice(cashChangeAmount)}</span>
                      ) : cashShortageAmount > 0 ? (
                        <span className="text-xs font-semibold text-rose-500">Shortage: {formatPrice(cashShortageAmount)}</span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Exact Amount</span>
                      )}
                    </div>
                    <input 
                      type="text"
                      value={cashReceivedInput}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      placeholder="Enter amount given by customer..."
                      className="h-11 w-full rounded-lg border py-1.5 px-4 border-[#D9DBE9] text-base font-semibold text-black focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* PHP App Interactive Numpad */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {["1", "2", "3"].map(n => (
                      <button key={n} type="button" onClick={() => handleNumpadPress(n)} className="bg-[#F7F7FC] rounded-lg h-10 flex items-center justify-center text-sm font-semibold text-[#1F1F39] hover:bg-gray-200">{n}</button>
                    ))}
                    <button type="button" onClick={() => handleNumpadPress("back")} className="bg-[#F7F7FC] rounded-lg h-10 flex items-center justify-center text-sm font-semibold text-[#1F1F39] hover:bg-gray-200">
                      <Delete className="w-4 h-4" />
                    </button>

                    {["4", "5", "6"].map(n => (
                      <button key={n} type="button" onClick={() => handleNumpadPress(n)} className="bg-[#F7F7FC] rounded-lg h-10 flex items-center justify-center text-sm font-semibold text-[#1F1F39] hover:bg-gray-200">{n}</button>
                    ))}
                    <button type="button" onClick={() => handleNumpadPress("clear")} className="bg-[#F7F7FC] rounded-lg h-10 flex items-center justify-center text-xs font-bold text-[#1F1F39] hover:bg-gray-200">
                      Clear
                    </button>

                    {["7", "8", "9"].map(n => (
                      <button key={n} type="button" onClick={() => handleNumpadPress(n)} className="bg-[#F7F7FC] rounded-lg h-10 flex items-center justify-center text-sm font-semibold text-[#1F1F39] hover:bg-gray-200">{n}</button>
                    ))}
                    <button type="button" onClick={() => handleNumpadPress(".")} className="bg-[#F7F7FC] rounded-lg h-10 flex items-center justify-center text-sm font-semibold text-[#1F1F39] hover:bg-gray-200">.</button>

                    {["00", "0"].map(n => (
                      <button key={n} type="button" onClick={() => handleNumpadPress(n)} className="bg-[#F7F7FC] rounded-lg h-10 flex items-center justify-center text-sm font-semibold text-[#1F1F39] hover:bg-gray-200">{n}</button>
                    ))}
                    <button type="button" onClick={() => setCashReceivedInput(String(total))} className="col-span-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg h-10 flex items-center justify-center text-xs font-bold hover:bg-emerald-100">
                      Exact ({formatPrice(total)})
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#2E2F38] block mb-1">Enter Card Last 4 Digits / Reference</label>
                    <input 
                      type="text"
                      value={cardDigitsInput}
                      onChange={(e) => setCardDigitsInput(e.target.value)}
                      placeholder="e.g. 4023"
                      maxLength={12}
                      className="h-11 w-full rounded-lg border py-1.5 px-4 border-[#D9DBE9] text-base font-semibold text-black focus:outline-none focus:border-primary"
                    />
                  </div>
                  {/* Mini Numpad for card */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0"].map(n => (
                      <button key={n} type="button" onClick={() => handleNumpadPress(n)} className="bg-[#F7F7FC] rounded-lg h-9 flex items-center justify-center text-xs font-semibold text-[#1F1F39] hover:bg-gray-200">{n}</button>
                    ))}
                    <button type="button" onClick={() => handleNumpadPress("clear")} className="bg-[#F7F7FC] rounded-lg h-9 flex items-center justify-center text-xs font-bold text-[#1F1F39] hover:bg-gray-200">Clear</button>
                  </div>
                </div>
              )}

              {paymentMethod === "mobile_banking" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#2E2F38] block">Enter Transaction ID / Transfer Reference</label>
                  <input 
                    type="text"
                    value={transferRefInput}
                    onChange={(e) => setTransferRefInput(e.target.value)}
                    placeholder="e.g. TXN-948275918"
                    className="h-11 w-full rounded-lg border py-1.5 px-4 border-[#D9DBE9] text-sm text-black focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-[#6E7191]">Verify payment alert on store account before confirming.</p>
                </div>
              )}

              {paymentMethod === "other" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#2E2F38] block">Payment Note</label>
                  <input 
                    type="text"
                    value={otherNoteInput}
                    onChange={(e) => setOtherNoteInput(e.target.value)}
                    placeholder="e.g. Cheque, Store Voucher, Split payment note..."
                    className="h-11 w-full rounded-lg border py-1.5 px-4 border-[#D9DBE9] text-sm text-black focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Action Button: Confirm & Print */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmOrder}
                  className="rounded-3xl text-sm py-3 px-3 font-medium w-full text-white bg-primary hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>Confirm & Print Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── THERMAL RECEIPT MODAL (Matching PHP ReceiptComponent.vue) ────────── */}
      {isReceiptModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-rubik">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[380px] overflow-hidden border border-[#D9DBE9] flex flex-col max-h-[90vh]">
            
            {/* Receipt Modal Controls */}
            <div className="p-3 border-b border-[#EFF0F6] flex items-center justify-between gap-3 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded bg-[#FB4E4E] hover:bg-red-600 text-white text-xs font-medium transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded bg-[#1AB759] hover:bg-emerald-600 text-white text-xs font-medium transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div className="p-5 overflow-y-auto custom-scrollbar font-mono text-xs text-[#14142B] bg-white space-y-3">
              
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-gray-400">
                <h2 className="text-lg font-bold text-[#14142B] uppercase tracking-wide">
                  {completedOrder.storeName}
                </h2>
                <p className="text-[11px] text-[#6E7191]">{completedOrder.storeAddress}</p>
                {completedOrder.storePhone && (
                  <p className="text-[11px] text-[#6E7191]">Tel: {completedOrder.storePhone}</p>
                )}
              </div>

              {/* Order Info */}
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>ORDER #{completedOrder.orderSerialNo}</span>
                  <span className="uppercase text-emerald-700 bg-emerald-50 px-1.5 rounded">{completedOrder.orderType}</span>
                </div>
                <div className="flex justify-between text-[#6E7191]">
                  <span>Date: {completedOrder.date}</span>
                  <span>Time: {completedOrder.time}</span>
                </div>
                <div className="flex justify-between text-[#6E7191]">
                  <span>Customer: {completedOrder.customer}</span>
                  {completedOrder.phone && <span>{completedOrder.phone}</span>}
                </div>
                {completedOrder.address && (
                  <div className="text-[10px] text-[#6E7191] border-t border-dashed border-gray-200 pt-1">
                    <span>Delivery: {completedOrder.address}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-gray-400 py-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-dashed border-gray-300 text-[#6E7191]">
                      <th className="py-1 text-left w-6">Qty</th>
                      <th className="py-1 text-left">Item Description</th>
                      <th className="py-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-gray-200">
                    {completedOrder.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-1 align-top">{item.quantity}</td>
                        <td className="py-1 pr-1">
                          <span className="font-semibold block">{item.name}</span>
                        </td>
                        <td className="py-1 text-right font-medium align-top">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(completedOrder.subtotal)}</span>
                </div>

                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(completedOrder.discount)}</span>
                  </div>
                )}

                {completedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Delivery Fee:</span>
                    <span>+{formatPrice(completedOrder.deliveryFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-400 pt-1.5 text-[#14142B]">
                  <span>TOTAL PAYABLE:</span>
                  <span>{formatPrice(completedOrder.total)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-dashed border-gray-400 pt-2 text-[11px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>PAYMENT METHOD:</span>
                  <span className="uppercase text-primary">{completedOrder.paymentMethod}</span>
                </div>
                {completedOrder.paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between text-[#6E7191]">
                      <span>Cash Received:</span>
                      <span>{formatPrice(completedOrder.posReceivedAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-700">
                      <span>Change Returned:</span>
                      <span>{formatPrice(completedOrder.posChangeAmount)}</span>
                    </div>
                  </>
                )}
                {completedOrder.paymentReference && (
                  <div className="text-[10px] text-[#6E7191]">
                    <span>Reference: {completedOrder.paymentReference}</span>
                  </div>
                )}
              </div>

              {/* Configurable Powered by Nectar Signature */}
              <div className="text-center pt-3 border-t border-dashed border-gray-400 space-y-1">
                <p className="text-[10px] text-[#6E7191]">Thank you for your patronage!</p>
                {receiptPoweredBy && receiptPoweredBy.trim() !== "" && (
                  <p className="text-[9px] font-semibold text-[#A0A3BD] tracking-wider uppercase">
                    {receiptPoweredBy}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
