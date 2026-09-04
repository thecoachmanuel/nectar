"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Store as StoreIcon, 
  Flame, 
  RefreshCw, 
  Tv, 
  Sparkles,
  ShoppingBag,
  Bell
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { orderSoundAlert } from "@/utils/audioAlert";
import { formatPrice } from "@/lib/formatters";
import { toast } from "sonner";

export default function OrderStatusScreenPage() {
  const { activeAdminStoreId } = useAuthStore();

  // Stores & Items state
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [popularItems, setPopularItems] = useState<any[]>([]);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Screen Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Track previous ready order IDs to trigger chime only on NEW ready orders
  const prevReadyIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // Auto-clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load sound preference
  useEffect(() => {
    const savedSound = localStorage.getItem("status_screen_sound_enabled");
    if (savedSound !== null) {
      setSoundEnabled(savedSound === "true");
    }
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem("status_screen_sound_enabled", String(nextVal));
    if (nextVal) {
      orderSoundAlert.playOrderChime();
      toast.success("Ready chime alert enabled 🔔");
    } else {
      toast.info("Chime alert muted 🔇");
    }
  };

  // Toggle TV Fullscreen Mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Fetch stores list
  useEffect(() => {
    fetch("/api/admin/stores")
      .then((res) => res.json())
      .then((data) => {
        const storeList = data.data || data.stores || [];
        setStores(storeList);
        // Default to activeAdminStoreId if available
        if (activeAdminStoreId && activeAdminStoreId !== "0") {
          setSelectedStore(activeAdminStoreId);
        } else if (storeList.length > 0 && selectedStore === "all") {
          // Pre-select first store or keep "all"
        }
      })
      .catch(() => {});
  }, [activeAdminStoreId]);

  // Fetch popular menu items (PHP OSSPopularItemResource inspiration)
  useEffect(() => {
    fetch("/api/admin/items")
      .then((res) => res.json())
      .then((data) => {
        const allItems = data.data || [];
        // Filter by store if not 'all', or show active items
        const filtered = selectedStore !== "all" 
          ? allItems.filter((it: any) => String(it.storeId) === String(selectedStore) || String(it.storeId) === "0" || !it.storeId)
          : allItems;
        setPopularItems(filtered.slice(0, 6));
      })
      .catch(() => {});
  }, [selectedStore]);

  // Fetch POS Orders for the selected store
  const fetchPosOrders = async () => {
    try {
      let url = `/api/admin/orders?isPos=true`;
      if (selectedStore && selectedStore !== "all") {
        url += `&storeId=${selectedStore}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.status) {
        const posOrders = data.data || [];
        setOrders(posOrders);

        // Filter currently ready orders
        const currentReady = posOrders.filter((o: any) => o.orderStatus === "ready");
        const currentReadyIds = new Set<string>(currentReady.map((o: any) => String(o._id)));

        // Detect if any new order has transitioned to ready
        if (!initialLoadRef.current && soundEnabled) {
          const hasNewReady = Array.from(currentReadyIds).some(
            (id) => !prevReadyIdsRef.current.has(id)
          );
          if (hasNewReady) {
            orderSoundAlert.playOrderChime();
            const newOrder = currentReady.find((o: any) => !prevReadyIdsRef.current.has(String(o._id)));
            const token = newOrder?.token || newOrder?.notes?.replace("Token No: ", "") || newOrder?.orderSerialNo;
            toast.success(`🔔 Order Ready for Pickup: Token #${token}!`, {
              duration: 6000,
            });
          }
        }

        prevReadyIdsRef.current = currentReadyIds;
        initialLoadRef.current = false;
      }
    } catch (err) {
      console.error("Failed to fetch live orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosOrders();
    // Live polling every 5 seconds
    const interval = setInterval(fetchPosOrders, 5000);
    return () => clearInterval(interval);
  }, [selectedStore]);

  // Filter orders into Preparing and Ready buckets (PHP OrderStatusScreenOrderService)
  const preparingOrders = useMemo(() => {
    return orders.filter((o: any) => o.orderStatus === "preparing" || o.orderStatus === "accepted");
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders.filter((o: any) => o.orderStatus === "ready");
  }, [orders]);

  // Helper to extract clean token number
  const getTokenDisplay = (order: any) => {
    if (order.token) return order.token;
    if (order.notes && order.notes.includes("Token No:")) {
      return order.notes.replace("Token No:", "").trim();
    }
    // Fallback to order serial number
    return order.orderSerialNo || "---";
  };

  const currentStoreObj = stores.find((s) => s._id === selectedStore);
  const currentStoreName = currentStoreObj ? currentStoreObj.name : "All Store Terminals";

  return (
    <div className={`flex flex-col font-sans select-none ${isFullscreen ? "fixed inset-0 z-50 bg-[#F7F7FC] p-4 sm:p-6 overflow-y-auto" : "pb-16"}`}>
      
      {/* ── TOP CONTROLS & LIVE HEADER ────────────────────────────────────────── */}
      <header className="bg-white rounded-2xl shadow-xs border border-[#EFF0F6] p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Store Selector */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#14142B] tracking-tight">
                In-Store Live Order Screen
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-green-100 text-green-700 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-[#6E7191] mt-0.5">
              Customer status display for POS sales & token collection
            </p>
          </div>

          {/* Store Switcher */}
          <div className="relative ml-0 sm:ml-2">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="h-10 pl-9 pr-8 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] hover:bg-[#EEF0F8] text-xs font-bold text-[#14142B] focus:outline-none focus:border-primary cursor-pointer transition-colors appearance-none shadow-xs"
            >
              <option value="all">🏬 All Stores (Combined)</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  📍 {s.name}
                </option>
              ))}
            </select>
            <StoreIcon className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Clock & Action Buttons */}
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {/* Live Clock Display */}
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#F7F7FC] border border-[#EFF0F6]">
            <Clock className="w-4 h-4 text-primary" />
            <div className="text-right">
              <p className="text-xs font-black text-[#14142B] font-mono leading-none">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-[10px] text-[#A0A3BD] font-medium mt-0.5">
                {currentTime.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Refresh Manual Trigger */}
          <button
            onClick={() => {
              setLoading(true);
              fetchPosOrders();
            }}
            className="w-10 h-10 rounded-xl bg-[#F7F7FC] hover:bg-[#EFF0F6] border border-[#EFF0F6] text-[#6E7191] flex items-center justify-center transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* Audio Chime Bell Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3.5 h-10 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              soundEnabled
                ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                : "bg-[#F7F7FC] border-[#EFF0F6] text-[#A0A3BD] hover:bg-[#EFF0F6]"
            }`}
            title={soundEnabled ? "Mute pickup chime" : "Enable pickup chime"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Chime On" : "Muted"}</span>
          </button>

          {/* TV Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#d60053] transition-colors shadow-sm"
            title="Toggle TV Fullscreen Mode"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "TV Fullscreen"}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN SCREEN GRID (Matching PHP OrderStatusScreen layout) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* ── LEFT SECTION (COL 1-2): POPULAR MENU ITEMS (PHP PopularItemComponent) */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-xs border border-[#EFF0F6] overflow-hidden">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#EFF0F6] flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0084FF]/10 text-[#0084FF] flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-[#0084FF]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0084FF] tracking-tight">
                    Popular Menu Items
                  </h3>
                  <p className="text-[11px] text-[#6E7191]">
                    Customer favorites at {currentStoreName}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#A0A3BD] uppercase tracking-wider bg-[#F7F7FC] px-2.5 py-1 rounded-lg border border-[#EFF0F6]">
                Kitchen Specials
              </span>
            </div>

            {/* Popular Items Grid */}
            <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 min-h-[380px]">
              {popularItems.length > 0 ? (
                popularItems.map((item, idx) => (
                  <div 
                    key={item._id || idx} 
                    className="flex flex-col items-center text-center p-3 rounded-2xl border border-[#F2F3FA] bg-[#FAFAFC] hover:bg-white hover:shadow-md transition-all group"
                  >
                    {/* Circular Image (matching PHP style) */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-white shadow-sm shrink-0 bg-white group-hover:scale-105 transition-transform">
                      <img 
                        src={item.image || "/images/default/item.png"} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                    
                    {/* Name & Price */}
                    <h4 className="text-xs sm:text-sm font-semibold text-[#14142B] line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs sm:text-sm font-black text-primary mt-1">
                      {formatPrice(item.discountPrice && Number(item.discountPrice) > 0 ? item.discountPrice : item.price)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 flex flex-col items-center justify-center p-12 text-center text-[#A0A3BD]">
                  <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs font-medium">No menu items loaded for this branch</p>
                </div>
              )}
            </div>

            {/* Bottom Promotional Ticker */}
            <div className="p-3 bg-[#F7F7FC] border-t border-[#EFF0F6] flex items-center justify-between text-xs text-[#6E7191] px-4">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Freshly prepared to order • Listen for your token number
              </span>
              <span className="text-[10px] font-bold text-primary">Nectar POS</span>
            </div>

          </div>
        </div>

        {/* ── RIGHT SECTION (COL 3-4): LIVE TOKENS (PREPARING & READY) ─────────── */}
        <div className="lg:col-span-2 order-1 lg:order-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          
          {/* ── COLUMN 1: PREPARING (PHP PreparingAndReadyComponent) ───────────── */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#EFF0F6] overflow-hidden flex flex-col min-h-[500px] max-h-[700px]">
            
            {/* Header: Primary / Pink #E8005B */}
            <div className="bg-primary text-white p-4 flex items-center justify-between rounded-t-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-base tracking-wider uppercase">
                  Preparing
                </h3>
              </div>
              <span className="bg-white/20 text-white font-black text-xs px-3 py-1 rounded-full backdrop-blur-xs">
                {preparingOrders.length}
              </span>
            </div>

            {/* Scrollable Token List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {preparingOrders.length > 0 ? (
                preparingOrders.map((order) => {
                  const tokenNo = getTokenDisplay(order);
                  return (
                    <div 
                      key={order._id} 
                      className="p-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] hover:bg-[#F2F3FA] transition-all flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#6E7191] tracking-wider mb-0.5">
                          Token Number
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-[#14142B] font-mono tracking-tight group-hover:text-primary transition-colors">
                          #{tokenNo}
                        </div>
                        <div className="text-[11px] text-[#A0A3BD] mt-1 flex items-center gap-1.5">
                          <span>Order #{order.orderSerialNo}</span>
                          <span>•</span>
                          <span className="capitalize">{order.orderType || "Takeaway"}</span>
                        </div>
                      </div>

                      {/* Animated preparation indicator */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 mt-1">
                          In Kitchen
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#A0A3BD]">
                  <ChefHat className="w-12 h-12 mb-3 opacity-25" />
                  <p className="font-bold text-sm text-[#6E7191]">Kitchen is all clear!</p>
                  <p className="text-xs mt-1">No orders currently in preparation</p>
                </div>
              )}
            </div>

            {/* Column Footer */}
            <div className="p-3 bg-[#F7F7FC] border-t border-[#EFF0F6] text-center text-[11px] font-semibold text-[#6E7191]">
              Orders are being cooked & packed
            </div>

          </div>

          {/* ── COLUMN 2: READY (PHP Prepared Items) ───────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#EFF0F6] overflow-hidden flex flex-col min-h-[500px] max-h-[700px]">
            
            {/* Header: Emerald Green #1AB759 */}
            <div className="bg-[#1AB759] text-white p-4 flex items-center justify-between rounded-t-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-base tracking-wider uppercase">
                  Ready for Pickup
                </h3>
              </div>
              <span className="bg-white/20 text-white font-black text-xs px-3 py-1 rounded-full backdrop-blur-xs">
                {readyOrders.length}
              </span>
            </div>

            {/* Scrollable Ready List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {readyOrders.length > 0 ? (
                readyOrders.map((order) => {
                  const tokenNo = getTokenDisplay(order);
                  return (
                    <div 
                      key={order._id} 
                      className="p-4 rounded-xl border-2 border-[#1AB759] bg-emerald-50/40 hover:bg-emerald-50 shadow-sm transition-all flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200"
                    >
                      <div>
                        <div className="text-[10px] uppercase font-extrabold text-[#1AB759] tracking-wider mb-0.5 flex items-center gap-1">
                          <Bell className="w-3 h-3 animate-bounce" />
                          Ready for Collection
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-[#1AB759] font-mono tracking-tight">
                          #{tokenNo}
                        </div>
                        <div className="text-[11px] text-[#4E4B66] font-medium mt-1">
                          Order #{order.orderSerialNo} {order.customerName ? `• ${order.customerName}` : ""}
                        </div>
                      </div>

                      {/* Big Pickup Badge */}
                      <div className="shrink-0 flex flex-col items-end">
                        <span className="px-3 py-1 rounded-lg bg-[#1AB759] text-white text-xs font-black tracking-wide shadow-xs">
                          PICKUP
                        </span>
                        <span className="text-[9px] text-[#1AB759] font-bold mt-1">
                          Counter 1
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#A0A3BD]">
                  <CheckCircle2 className="w-12 h-12 mb-3 opacity-25 text-[#1AB759]" />
                  <p className="font-bold text-sm text-[#6E7191]">No orders ready yet</p>
                  <p className="text-xs mt-1">Completed orders will appear here instantly</p>
                </div>
              )}
            </div>

            {/* Column Footer */}
            <div className="p-3 bg-emerald-50/60 border-t border-emerald-100 text-center text-[11px] font-bold text-[#1AB759]">
              Please show your receipt token at the pickup counter
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
