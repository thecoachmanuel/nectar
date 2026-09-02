"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  Building,
  RotateCcw,
  FileText
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice } from "@/lib/formatters";

// Haversine formula for exact distance between store and customer coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

  // Delivery state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [useFixedDeliveryFee, setUseFixedDeliveryFee] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Discount state
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<any[]>([]);

  // Payment Modal state (PHP App PaymentComponent.vue inspiration)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [posPaymentMethod, setPosPaymentMethod] = useState<"cash" | "card" | "mobile_banking" | "other">("cash");
  const [posReceivedAmount, setPosReceivedAmount] = useState("");
  const [cardLast4Digits, setCardLast4Digits] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [activeInputTarget, setActiveInputTarget] = useState<"cash" | "card" | "mfs" | "other">("cash");

  // Receipt Modal state (PHP App ReceiptComponent.vue inspiration)
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [receiptFooterSignature, setReceiptFooterSignature] = useState("Powered by Nectar App");
  const [receiptHeaderTagline, setReceiptHeaderTagline] = useState("");

  // 1. Load Stores, Categories, and Receipt Settings on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, storeRes, settingsRes] = await Promise.all([
          fetch("/api/frontend/categories").catch(() => null),
          fetch("/api/admin/stores").catch(() => null),
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

        if (settingsRes && settingsRes.ok) {
          const sData = await settingsRes.json();
          const items = sData.data || [];
          const footerSig = items.find((s: any) => s.key === "receipt_footer_signature");
          const tagline = items.find((s: any) => s.key === "receipt_header_tagline");
          if (footerSig && footerSig.payload) setReceiptFooterSignature(footerSig.payload);
          if (tagline && tagline.payload) setReceiptHeaderTagline(tagline.payload);
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
      
      // Update default delivery fee for store
      const store = branches.find(b => b._id === selectedBranch);
      if (store) {
        const storeFixed = store.fixedDeliveryFee || store.deliveryFee || 0;
        if (storeFixed > 0 && useFixedDeliveryFee) {
          setDeliveryFee(storeFixed);
        }
      }
    }
  }, [selectedBranch, branches, useFixedDeliveryFee, fetchProductsForStore]);

  // Handle store change from dropdown
  const handleStoreChange = (newStoreId: string) => {
    setSelectedBranch(newStoreId);
    setActiveAdminStoreId(newStoreId);
    toast.info(`Switched store context`);
  };

  // Get selected store object
  const currentStore = branches.find(b => b._id === selectedBranch) || branches[0] || null;

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
  const activeDeliveryCharge = orderType === "delivery" ? deliveryFee : 0;
  
  // Calculate discount
  const calculateDiscount = () => {
    if (appliedDiscount > 0) {
      return Math.min(appliedDiscount, subtotal);
    }
    return 0;
  };

  const currentDiscount = calculateDiscount();
  const total = Math.max(0, subtotal - currentDiscount + activeDeliveryCharge);

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

  // ── Delivery Location Autocomplete & Distance Calculation ──────────────────
  const handleAddressSearchChange = (query: string) => {
    setAddressSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=ng`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          setAddressSuggestions(data || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn("Location search error:", err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (item: any) => {
    const fullAddress = item.display_name;
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    setDeliveryAddress(fullAddress);
    setAddressSearch(fullAddress);
    setCustomerLat(lat);
    setCustomerLng(lon);
    setShowSuggestions(false);

    // Compute distance from selected store
    if (currentStore && currentStore.latitude && currentStore.longitude && !isNaN(lat) && !isNaN(lon)) {
      const dist = haversineDistance(lat, lon, currentStore.latitude, currentStore.longitude);
      const roundedDist = Number(dist.toFixed(1));
      setDeliveryDistance(roundedDist);

      // Distance fee calculation based on store rates
      const baseFee = currentStore.baseDeliveryFee && currentStore.baseDeliveryFee > 0 ? currentStore.baseDeliveryFee : 1500;
      const feePerKm = currentStore.feePerKm && currentStore.feePerKm > 0 ? currentStore.feePerKm : 100;
      const distFee = Math.round(baseFee + dist * feePerKm);

      if (!useFixedDeliveryFee) {
        setDeliveryFee(distFee);
      }
      toast.success(`Distance: ${roundedDist} km • Delivery Fee: ₦${(useFixedDeliveryFee ? deliveryFee : distFee).toLocaleString()}`);
    } else {
      const fallbackFee = currentStore?.fixedDeliveryFee || currentStore?.deliveryFee || 1500;
      setDeliveryFee(fallbackFee);
    }
  };

  const handleToggleFixedFee = () => {
    const storeFixed = currentStore?.fixedDeliveryFee || currentStore?.deliveryFee || 1500;
    if (!useFixedDeliveryFee) {
      setUseFixedDeliveryFee(true);
      setDeliveryFee(storeFixed);
      toast.info(`Using Store Fixed Delivery Fee: ₦${storeFixed.toLocaleString()}`);
    } else {
      setUseFixedDeliveryFee(false);
      if (customerLat && customerLng && currentStore?.latitude && currentStore?.longitude) {
        const dist = haversineDistance(customerLat, customerLng, currentStore.latitude, currentStore.longitude);
        const baseFee = currentStore.baseDeliveryFee && currentStore.baseDeliveryFee > 0 ? currentStore.baseDeliveryFee : 1500;
        const feePerKm = currentStore.feePerKm && currentStore.feePerKm > 0 ? currentStore.feePerKm : 100;
        const distFee = Math.round(baseFee + dist * feePerKm);
        setDeliveryFee(distFee);
        toast.info(`Switched to Distance Fee: ₦${distFee.toLocaleString()}`);
      }
    }
  };

  // ── Open Order Payment Modal ───────────────────────────────────────────────
  const openPaymentModal = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!selectedBranch || selectedBranch === "0") {
      return toast.error("Please select a specific store for this POS order.");
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      return toast.error("Please search and select a customer delivery address.");
    }

    // Default cash received to exact total for fast 1-click checkout
    setPosReceivedAmount(String(total));
    setPosPaymentMethod("cash");
    setActiveInputTarget("cash");
    setCardLast4Digits("");
    setTransactionId("");
    setPaymentNote("");
    setPaymentModalOpen(true);
  };

  // ── Numeric Keypad Handlers (PHP App PaymentComponent style) ───────────────
  const handleKeypadPress = (digit: string) => {
    if (activeInputTarget === "cash") {
      setPosReceivedAmount(prev => prev + digit);
    } else if (activeInputTarget === "card") {
      if (cardLast4Digits.length < 8) setCardLast4Digits(prev => prev + digit);
    } else if (activeInputTarget === "mfs") {
      setTransactionId(prev => prev + digit);
    } else if (activeInputTarget === "other") {
      setPaymentNote(prev => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    if (activeInputTarget === "cash") {
      setPosReceivedAmount(prev => prev.slice(0, -1));
    } else if (activeInputTarget === "card") {
      setCardLast4Digits(prev => prev.slice(0, -1));
    } else if (activeInputTarget === "mfs") {
      setTransactionId(prev => prev.slice(0, -1));
    } else if (activeInputTarget === "other") {
      setPaymentNote(prev => prev.slice(0, -1));
    }
  };

  const handleKeypadClear = () => {
    if (activeInputTarget === "cash") {
      setPosReceivedAmount("");
    } else if (activeInputTarget === "card") {
      setCardLast4Digits("");
    } else if (activeInputTarget === "mfs") {
      setTransactionId("");
    } else if (activeInputTarget === "other") {
      setPaymentNote("");
    }
  };

  // Calculate live change for Cash payment
  const cashReceivedNum = parseFloat(posReceivedAmount) || 0;
  const changeDue = Math.max(0, cashReceivedNum - total);

  // ── Confirm & Place Order ──────────────────────────────────────────────────
  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const finalReceived = posPaymentMethod === "cash" 
        ? (cashReceivedNum > 0 ? cashReceivedNum : total) 
        : undefined;
      const finalChange = posPaymentMethod === "cash" ? changeDue : 0;
      const finalPaymentNote = posPaymentMethod === "card" 
        ? cardLast4Digits 
        : posPaymentMethod === "mobile_banking" 
        ? transactionId 
        : paymentNote;

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
          deliveryCharge: activeDeliveryCharge,
          totalAmount: total,
          paymentMethod: posPaymentMethod,
          posPaymentMethod,
          posReceivedAmount: finalReceived,
          cashBackAmount: finalChange,
          posPaymentNote: finalPaymentNote,
          orderStatus: "accepted",
          deliveryAddress: orderType === "delivery" ? deliveryAddress : "POS Walk-in Store Pickup",
          notes: tokenNo ? `Token No: ${tokenNo}` : undefined,
          isPos: true
        })
      });

      const data = await res.json();
      if (data.status) {
        toast.success(`POS Order #${data.orderSerialNo || "Created"} Placed Successfully!`);
        
        // Prepare thermal receipt data (matching PHP ReceiptComponent.vue)
        setReceiptOrder({
          orderSerialNo: data.orderSerialNo || "N/A",
          id: data.orderId || data.data?._id || "",
          orderDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          orderTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          storeName: currentStore?.name || "Nectar Groceries",
          storeAddress: currentStore?.address || "",
          storePhone: currentStore?.phone || "",
          customerName: customerName.trim() || "Walk-in Customer",
          customerPhone: customerPhone.trim() || "",
          orderType,
          deliveryAddress: orderType === "delivery" ? deliveryAddress : "",
          items: [...cart],
          subtotal,
          discountAmount: currentDiscount,
          deliveryCharge: activeDeliveryCharge,
          totalAmount: total,
          posPaymentMethod,
          posReceivedAmount: finalReceived,
          cashBackAmount: finalChange,
          posPaymentNote: finalPaymentNote,
          token: tokenNo
        });

        // Reset cart and checkout states
        setCart([]);
        setAppliedDiscount(0);
        setDiscountInput("");
        setTokenNo("");
        setDeliveryAddress("");
        setAddressSearch("");
        setCustomerLat(null);
        setCustomerLng(null);
        setDeliveryDistance(null);
        setDeliveryFee(0);
        setPaymentModalOpen(false);
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

  // Print thermal receipt
  const handlePrintReceipt = () => {
    window.print();
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
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg text-[#14142B] tracking-tight">POS Terminal</span>
            <span className="hidden sm:inline-block text-xs text-[#A0A3BD] font-medium">|</span>
            
            {/* Store Context Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => handleStoreChange(e.target.value)}
                disabled={loading}
                className="h-10 pl-9 pr-8 rounded-xl bg-[#F7F7FC] border border-[#EFF0F6] text-xs font-bold text-[#14142B] focus:outline-none focus:border-primary cursor-pointer appearance-none transition-colors max-w-[200px] sm:max-w-[260px] truncate"
              >
                {branches.length === 0 ? (
                  <option value="0">Loading stores...</option>
                ) : (
                  branches.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      🏪 {branch.name}
                    </option>
                  ))
                )}
              </select>
              <Store className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-[#6E7191] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => selectedBranch && fetchProductsForStore(selectedBranch)}
            className="w-10 h-10 rounded-xl bg-[#F7F7FC] text-[#6E7191] flex items-center justify-center hover:bg-[#EFF0F6] hover:text-[#14142B] transition-colors"
            title="Reload Products"
          >
            <RefreshCw className={`w-4 h-4 ${loadingProducts ? "animate-spin text-primary" : ""}`} />
          </button>

          <button 
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-[#F7F7FC] text-[#6E7191] hidden sm:flex items-center justify-center hover:bg-[#EFF0F6] hover:text-[#14142B] transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Mobile Cart Toggle Badge */}
          <button 
            onClick={() => setCartOpen(!cartOpen)}
            className="lg:hidden relative w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#14142B] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: Catalog (Flex-1) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F7F7FC] overflow-hidden">
          
          {/* Top Search & Category Filter Bar */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#EFF0F6] shrink-0 space-y-3 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search products by title or scan barcode..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm text-[#14142B] placeholder-[#A0A3BD] focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              <Search className="w-5 h-5 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A0A3BD] hover:text-[#14142B]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <button
                onClick={() => setActiveCategory("All")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === "All" 
                    ? "bg-primary text-white shadow-sm shadow-primary/20" 
                    : "bg-[#F7F7FC] text-[#6E7191] hover:bg-[#EFF0F6] hover:text-[#14142B]"
                }`}
              >
                All Groceries ({products.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat._id 
                      ? "bg-primary text-white shadow-sm shadow-primary/20" 
                      : "bg-[#F7F7FC] text-[#6E7191] hover:bg-[#EFF0F6] hover:text-[#14142B]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid (Independently Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {loading || loadingProducts ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#6E7191] gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-semibold">Loading store inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#A0A3BD] gap-2">
                <ShoppingBag className="w-12 h-12 text-[#D9DBE9]" />
                <p className="text-sm font-bold text-[#14142B]">No products found</p>
                <p className="text-xs text-[#6E7191]">Try adjusting your search keyword or selected category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map(product => {
                  const hasDiscount = product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price);
                  const effectivePrice = hasDiscount ? Number(product.discountPrice) : Number(product.price);
                  const cartItem = cart.find(i => i.itemId === product._id);

                  return (
                    <div 
                      key={product._id} 
                      onClick={() => addToCart(product)}
                      className="group bg-white rounded-2xl border border-[#EFF0F6] hover:border-primary hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden relative"
                    >
                      {/* Image Frame */}
                      <div className="aspect-square w-full bg-[#FAFAFC] relative overflow-hidden flex items-center justify-center p-3">
                        <img 
                          src={product.image || "/images/default/item.png"} 
                          alt={product.name} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        {hasDiscount && (
                          <span className="absolute top-2 left-2 bg-[#FB4E4E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            SALE
                          </span>
                        )}
                        {cartItem && (
                          <span className="absolute top-2 right-2 bg-primary text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                            {cartItem.quantity}
                          </span>
                        )}
                      </div>

                      {/* Info Frame */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-xs sm:text-sm text-[#14142B] line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#FAFAFC]">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs sm:text-sm text-primary">
                              {formatPrice(effectivePrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-[#A0A3BD] line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          
                          <div className="w-7 h-7 rounded-lg bg-[#F7F7FC] group-hover:bg-primary group-hover:text-white text-[#6E7191] flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Full Viewport Height Cart & Checkout Sidebar */}
        <aside 
          className={`
            fixed inset-y-0 right-0 z-30 w-full sm:w-[420px] lg:w-[400px] xl:w-[440px] bg-white border-l border-[#EFF0F6] flex flex-col h-full shadow-2xl lg:shadow-none lg:static lg:h-full transition-transform duration-300
            ${cartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Top Cart Header (shrink-0) */}
          <div className="p-4 border-b border-[#EFF0F6] bg-white shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-[#14142B]">Current Order</h3>
                <span className="text-xs bg-[#EFF0F6] text-[#6E7191] font-bold px-2 py-0.5 rounded-full">
                  {cart.length} items
                </span>
              </div>

              <button 
                onClick={() => setCartOpen(false)}
                className="lg:hidden p-1.5 text-[#6E7191] hover:text-[#14142B] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Inputs */}
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
                onClick={() => { setOrderType("takeaway"); setDeliveryFee(0); }}
                className={`h-8 rounded-lg font-bold text-xs transition-all ${
                  orderType === "takeaway" 
                    ? "bg-white text-[#14142B] shadow-xs" 
                    : "text-[#6E7191] hover:text-[#14142B]"
                }`}
              >
                In-Store / Takeaway
              </button>
              <button 
                onClick={() => {
                  setOrderType("delivery");
                  if (currentStore) {
                    const fallbackFee = currentStore.fixedDeliveryFee || currentStore.deliveryFee || 1500;
                    setDeliveryFee(fallbackFee);
                  }
                }}
                className={`h-8 rounded-lg font-bold text-xs transition-all ${
                  orderType === "delivery" 
                    ? "bg-white text-[#14142B] shadow-xs" 
                    : "text-[#6E7191] hover:text-[#14142B]"
                }`}
              >
                Local Delivery
              </button>
            </div>

            {/* Delivery Location Section vs Token Input */}
            {orderType === "delivery" ? (
              <div className="space-y-2 relative">
                {/* Autocomplete Location Input */}
                <div className="relative">
                  <input 
                    type="text" 
                    value={addressSearch}
                    onChange={(e) => handleAddressSearchChange(e.target.value)}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Search delivery address / landmark..." 
                    className="w-full h-9 pl-8 pr-8 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-xs font-medium text-[#14142B] focus:outline-none focus:border-primary focus:bg-white transition-all truncate"
                  />
                  <MapPin className="w-3.5 h-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {isSearchingAddress ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A0A3BD] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  ) : addressSearch ? (
                    <button 
                      onClick={() => { setAddressSearch(""); setDeliveryAddress(""); setAddressSuggestions([]); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Autocomplete Dropdown Suggestions */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute top-10 left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-[#EFF0F6] max-h-48 overflow-y-auto custom-scrollbar">
                    {addressSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left p-2.5 hover:bg-[#F7F7FC] text-xs text-[#14142B] border-b border-[#F7F7FC] last:border-none flex items-start gap-2 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Delivery Distance & Store Fee Badge */}
                {deliveryAddress && (
                  <div className="p-2 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                      <span className="font-bold text-[#166534]">
                        {deliveryDistance !== null ? `📍 ${deliveryDistance} km` : "📍 Address Set"}
                      </span>
                      <span className="text-[#15803d] truncate font-medium text-[10px]">
                        (Fee: ₦{deliveryFee.toLocaleString()})
                      </span>
                    </div>

                    {/* Store Fixed Delivery Fee Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleFixedFee}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#16A34A] text-white hover:bg-[#15803d] transition-colors shrink-0"
                      title="Toggle Store Fixed Delivery Fee"
                    >
                      {useFixedDeliveryFee ? "Using Fixed" : "Use Fixed Fee"}
                    </button>
                  </div>
                )}
              </div>
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
                <div className="flex justify-between text-xs text-[#1AB759] font-semibold">
                  <span>Discount</span>
                  <span>-{formatPrice(currentDiscount)}</span>
                </div>
              )}

              {orderType === "delivery" && (
                <div className="flex justify-between text-xs text-[#008BBA] font-semibold">
                  <span>Delivery Charge</span>
                  <span>+{formatPrice(activeDeliveryCharge)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-[#14142B] pt-2 border-t border-dashed border-[#EFF0F6]">
                <span>Total Payable</span>
                <span className="text-primary text-base font-black">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Buttons: Clear Cart & Charge / Open Payment Modal */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => {
                  setCart([]);
                  setAppliedDiscount(0);
                  setDiscountInput("");
                  setTokenNo("");
                  setDeliveryAddress("");
                  setAddressSearch("");
                  setDeliveryFee(0);
                  toast.info("Cart cleared");
                }} 
                disabled={cart.length === 0}
                className="h-11 rounded-xl bg-white border border-[#EFF0F6] text-[#FB4E4E] hover:bg-red-50 font-bold text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>

              <button 
                onClick={openPaymentModal} 
                disabled={cart.length === 0}
                className="col-span-2 h-11 rounded-xl bg-[#1AB759] hover:bg-[#159a4a] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#1AB759]/20 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Charge {formatPrice(total)}</span>
              </button>
            </div>
          </div>

        </aside>
      </div>

      {/* ── ORDER PAYMENT MODAL (Inspired by PHP App PaymentComponent.vue) ──── */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-[428px] w-full shadow-2xl border border-[#EFF0F6] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFF0F6] mb-4">
              <h3 className="font-bold text-base text-[#14142B]">Order Payment</h3>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Amount Card */}
            <div className="flex justify-between items-center h-12 w-full rounded-xl py-1.5 px-4 bg-[#F7F7FC] mb-4">
              <span className="text-xs font-semibold text-[#6E7191]">Total Amount</span>
              <span className="text-primary text-base font-black">{formatPrice(total)}</span>
            </div>

            {/* Select Payment Method Tabs (Exact PHP App Enum Layout) */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-[#14142B] mb-2">Select Payment Method</h4>
              <nav className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setPosPaymentMethod("cash"); setActiveInputTarget("cash"); }}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 border transition-all ${
                    posPaymentMethod === "cash" 
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" 
                      : "border-[#EFF0F6] bg-[#F7F7FC] text-[#6E7191] hover:bg-gray-100"
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-[11px]">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPosPaymentMethod("card"); setActiveInputTarget("card"); }}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 border transition-all ${
                    posPaymentMethod === "card" 
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" 
                      : "border-[#EFF0F6] bg-[#F7F7FC] text-[#6E7191] hover:bg-gray-100"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[11px]">Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPosPaymentMethod("mobile_banking"); setActiveInputTarget("mfs"); }}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 border transition-all ${
                    posPaymentMethod === "mobile_banking" 
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" 
                      : "border-[#EFF0F6] bg-[#F7F7FC] text-[#6E7191] hover:bg-gray-100"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-[11px]">Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPosPaymentMethod("other"); setActiveInputTarget("other"); }}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 border transition-all ${
                    posPaymentMethod === "other" 
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" 
                      : "border-[#EFF0F6] bg-[#F7F7FC] text-[#6E7191] hover:bg-gray-100"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-[11px]">Other</span>
                </button>
              </nav>
            </div>

            {/* Dynamic Input depending on selected payment method */}
            {posPaymentMethod === "cash" && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-[#14142B]">Received Amount (₦)</span>
                  {changeDue > 0 ? (
                    <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-md">
                      Change: ₦{changeDue.toLocaleString()}
                    </span>
                  ) : cashReceivedNum > 0 && cashReceivedNum < total ? (
                    <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-md">
                      Due: ₦{(total - cashReceivedNum).toLocaleString()}
                    </span>
                  ) : null}
                </div>
                <input 
                  type="number"
                  step="any"
                  value={posReceivedAmount}
                  onChange={(e) => setPosReceivedAmount(e.target.value)}
                  onFocus={() => setActiveInputTarget("cash")}
                  placeholder={`Exact Amount: ${total}`}
                  className="h-11 w-full rounded-xl border border-[#D9DBE9] px-4 text-base font-bold text-[#14142B] focus:outline-none focus:border-primary bg-white"
                />
              </div>
            )}

            {posPaymentMethod === "card" && (
              <div className="mb-4">
                <span className="block text-xs font-bold text-[#14142B] mb-1.5">Enter Card Last 4 Digits / Machine Ref</span>
                <input 
                  type="text"
                  value={cardLast4Digits}
                  onChange={(e) => setCardLast4Digits(e.target.value)}
                  onFocus={() => setActiveInputTarget("card")}
                  placeholder="e.g. 4242 or POS-01"
                  className="h-11 w-full rounded-xl border border-[#D9DBE9] px-4 text-sm font-semibold text-[#14142B] focus:outline-none focus:border-primary bg-white"
                />
              </div>
            )}

            {posPaymentMethod === "mobile_banking" && (
              <div className="mb-4">
                <span className="block text-xs font-bold text-[#14142B] mb-1.5">Enter Transaction ID / Reference</span>
                <input 
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  onFocus={() => setActiveInputTarget("mfs")}
                  placeholder="e.g. TXN-9283719"
                  className="h-11 w-full rounded-xl border border-[#D9DBE9] px-4 text-sm font-semibold text-[#14142B] focus:outline-none focus:border-primary bg-white"
                />
              </div>
            )}

            {posPaymentMethod === "other" && (
              <div className="mb-4">
                <span className="block text-xs font-bold text-[#14142B] mb-1.5">Enter Payment Note</span>
                <input 
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  onFocus={() => setActiveInputTarget("other")}
                  placeholder="e.g. Store credit or split cash"
                  className="h-11 w-full rounded-xl border border-[#D9DBE9] px-4 text-sm font-semibold text-[#14142B] focus:outline-none focus:border-primary bg-white"
                />
              </div>
            )}

            {/* Virtual Numeric Touchscreen Keypad (PHP PaymentComponent.vue exact layout) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mb-5">
              <button 
                type="button" 
                onClick={() => handleKeypadPress("1")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                1
              </button>
              <button 
                type="button" 
                onClick={() => handleKeypadPress("2")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                2
              </button>
              <button 
                type="button" 
                onClick={() => handleKeypadPress("3")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                3
              </button>
              <button 
                type="button" 
                onClick={handleKeypadBackspace} 
                className="bg-[#F7F7FC] hover:bg-red-50 hover:text-red-600 active:bg-red-100 rounded-xl flex items-center justify-center text-[#1F1F39] transition-colors row-span-2" 
                title="Backspace"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                  <line x1="18" y1="9" x2="12" y2="15"></line>
                  <line x1="12" y1="9" x2="18" y2="15"></line>
                </svg>
              </button>

              <button 
                type="button" 
                onClick={() => handleKeypadPress("4")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                4
              </button>
              <button 
                type="button" 
                onClick={() => handleKeypadPress("5")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                5
              </button>
              <button 
                type="button" 
                onClick={() => handleKeypadPress("6")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                6
              </button>

              <button 
                type="button" 
                onClick={() => handleKeypadPress("7")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                7
              </button>
              <button 
                type="button" 
                onClick={() => handleKeypadPress("8")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                8
              </button>
              <button 
                type="button" 
                onClick={() => handleKeypadPress("9")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                9
              </button>

              <button 
                type="button" 
                onClick={handleKeypadClear} 
                className="bg-[#F7F7FC] hover:bg-red-50 hover:text-[#FB4E4E] active:bg-red-100 rounded-xl flex items-center justify-center text-xs font-bold text-[#FB4E4E] transition-colors row-span-2"
              >
                Clear
              </button>

              <button 
                type="button" 
                onClick={() => handleKeypadPress("00")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                00
              </button>
              <button 
                type="button" 
                onClick={() => handleKeypadPress("0")} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                0
              </button>
              <button 
                type="button" 
                onClick={() => posPaymentMethod === "cash" ? handleKeypadPress(".") : null} 
                className="h-11 bg-[#F7F7FC] hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-base font-bold text-[#1F1F39] transition-colors"
              >
                .
              </button>
            </div>

            {/* Confirm and Print Button */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="rounded-3xl text-sm py-3 px-4 font-bold w-full text-white bg-primary hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Print</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── 80MM THERMAL RECEIPT MODAL (Matching PHP ReceiptComponent.vue) ──── */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[380px] w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Receipt Action Bar (Hidden during window.print) */}
            <div className="p-3 bg-[#F7F7FC] border-b border-[#EFF0F6] flex items-center justify-between hidden-print">
              <button 
                onClick={() => setReceiptOrder(null)} 
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#FB4E4E] hover:bg-red-600 text-white text-xs font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
              <button 
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 py-2 px-5 rounded-xl bg-[#1AB759] hover:bg-green-600 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>

            {/* 80mm Thermal Printable Container */}
            <div id="thermal-receipt" className="p-5 font-mono text-black text-xs leading-relaxed select-text bg-white">
              
              {/* Store Header: Store Name on Top */}
              <div className="text-center pb-3 border-b border-dashed border-gray-400">
                <h2 className="text-lg font-extrabold uppercase text-black tracking-tight">{receiptOrder.storeName || "Nectar Groceries"}</h2>
                {receiptOrder.storeAddress && <p className="text-[11px] text-gray-700 leading-tight mt-0.5">{receiptOrder.storeAddress}</p>}
                {receiptOrder.storePhone && <p className="text-[11px] text-gray-700 leading-tight">Tel: {receiptOrder.storePhone}</p>}
                {receiptHeaderTagline && <p className="text-[10px] text-gray-500 italic mt-0.5">{receiptHeaderTagline}</p>}
              </div>

              {/* Order Meta */}
              <table className="w-full my-2 text-[11px]">
                <tbody>
                  <tr>
                    <td className="text-left py-0.5 font-bold">ORDER #{receiptOrder.orderSerialNo}</td>
                    <td className="text-right py-0.5">{receiptOrder.orderTime}</td>
                  </tr>
                  <tr>
                    <td className="text-left py-0.5 text-gray-600">{receiptOrder.orderDate}</td>
                    <td className="text-right py-0.5 text-gray-600">Cashier: Admin</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-left py-0.5 text-gray-800 font-medium">Customer: {receiptOrder.customerName}</td>
                  </tr>
                  {receiptOrder.orderType === "delivery" && receiptOrder.deliveryAddress && (
                    <tr>
                      <td colSpan={2} className="text-left py-0.5 text-gray-700">Delivery: {receiptOrder.deliveryAddress}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Items Table */}
              <table className="w-full border-t border-b border-dashed border-gray-400 my-2">
                <thead>
                  <tr className="border-b border-dashed border-gray-400">
                    <th className="py-1 text-left font-bold text-[10px] uppercase w-7">QTY</th>
                    <th className="py-1 text-left font-bold text-[10px] uppercase">ITEM DESCRIPTION</th>
                    <th className="py-1 text-right font-bold text-[10px] uppercase">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptOrder.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="align-top border-b border-gray-100 last:border-none">
                      <td className="py-1 text-left font-bold">{item.quantity}</td>
                      <td className="py-1 text-left capitalize">
                        <div>{item.name}</div>
                        {item.variationName && <div className="text-[10px] text-gray-500">{item.variationName}</div>}
                      </td>
                      <td className="py-1 text-right font-bold">₦{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="py-1 pl-6">
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="text-left py-0.5 uppercase">Subtotal:</td>
                      <td className="text-right py-0.5">₦{Number(receiptOrder.subtotal || 0).toLocaleString()}</td>
                    </tr>
                    {receiptOrder.discountAmount > 0 && (
                      <tr>
                        <td className="text-left py-0.5 uppercase text-green-700">Discount:</td>
                        <td className="text-right py-0.5 text-green-700">-₦{Number(receiptOrder.discountAmount).toLocaleString()}</td>
                      </tr>
                    )}
                    {receiptOrder.orderType === "delivery" && (
                      <tr>
                        <td className="text-left py-0.5 uppercase">Delivery Charge:</td>
                        <td className="text-right py-0.5">₦{Number(receiptOrder.deliveryCharge || 0).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="border-t border-dashed border-gray-400 font-extrabold text-xs">
                      <td className="text-left py-1 uppercase">TOTAL:</td>
                      <td className="text-right py-1">₦{Number(receiptOrder.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment & Order Type Details */}
              <div className="border-t border-b border-dashed border-gray-400 py-2 my-1 text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span>ORDER TYPE:</span>
                  <span className="font-bold">{receiptOrder.orderType === "delivery" ? "DELIVERY" : "TAKEAWAY / PICKUP"}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>PAYMENT TYPE:</span>
                  <span className="font-bold uppercase">
                    {receiptOrder.posPaymentMethod === "mobile_banking" ? "TRANSFER" : (receiptOrder.posPaymentMethod || "CASH")}
                  </span>
                </div>
                {receiptOrder.posPaymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between py-0.5">
                      <span>CASH RECEIVED:</span>
                      <span>₦{Number(receiptOrder.posReceivedAmount || receiptOrder.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-0.5 font-bold">
                      <span>CHANGE:</span>
                      <span>₦{Number(receiptOrder.cashBackAmount || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {receiptOrder.posPaymentMethod === "card" && receiptOrder.posPaymentNote && (
                  <div className="flex justify-between py-0.5">
                    <span>CARD REF / LAST 4:</span>
                    <span className="font-bold">{receiptOrder.posPaymentNote}</span>
                  </div>
                )}
                {receiptOrder.posPaymentMethod === "mobile_banking" && receiptOrder.posPaymentNote && (
                  <div className="flex justify-between py-0.5">
                    <span>TRANSACTION REF:</span>
                    <span className="font-bold">{receiptOrder.posPaymentNote}</span>
                  </div>
                )}
              </div>

              {/* Thank you note */}
              <div className="text-center pt-2.5 pb-2 text-[11px] text-gray-700">
                <p className="font-semibold">Thank you for your patronage!</p>
                <p>Please come again.</p>
              </div>

              {/* Footer Signature: Editable by Super Admin */}
              <div className="pt-2 text-center border-t border-dashed border-gray-300">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {receiptFooterSignature || "Powered by Nectar App"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for standard 80mm thermal receipt printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible !important;
          }
          #thermal-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 5mm 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .hidden-print {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
