"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Clock, Truck, ChefHat, XCircle, Package } from "lucide-react";

const STATUSES = [
  { key: "pending",    label: "Order Placed",   icon: Clock,         color: "#d97706", desc: "Your order has been received" },
  { key: "accepted",   label: "Accepted",        icon: CheckCircle,   color: "#2563eb", desc: "Restaurant accepted your order" },
  { key: "preparing",  label: "Preparing",       icon: ChefHat,       color: "#7c3aed", desc: "Your food is being prepared" },
  { key: "on_the_way", label: "On the Way",      icon: Truck,         color: "#0891b2", desc: "Rider is heading to you" },
  { key: "delivered",  label: "Delivered",       icon: Package,       color: "#16a34a", desc: "Enjoy your meal! 🎉" },
];

export default function OrderStatusPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center py-20"><Clock className="w-10 h-10 animate-spin text-[#ff006b]" /></div>}>
      <OrderStatusContent />
    </React.Suspense>
  );
}

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") || "";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) fetchOrder();
    const interval = setInterval(() => { if (orderId) fetchOrder(); }, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/frontend/orders/${orderId}`);
      const data = await res.json();
      if (data.status) setOrder(data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const currentStatusIdx = STATUSES.findIndex(s => s.key === order?.status);

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/images/theme/theme-logo.png" alt="FoodAppi" className="h-10 mx-auto mb-3"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <h1 className="text-xl font-bold text-[#14142b]">Order Status</h1>
          {order && <p className="text-xs text-[#a0a3bd] mt-1">#{order._id?.slice(-8).toUpperCase()}</p>}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6] shadow-sm">
            <Clock className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: "#ff006b" }} />
            <p className="text-sm text-[#6e7191]">Loading order status...</p>
          </div>
        ) : !order ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6] shadow-sm">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="text-base font-semibold text-[#14142b]">Order not found</p>
            <p className="text-sm text-[#a0a3bd] mt-1">Please check your order ID</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#eff0f6] shadow-sm overflow-hidden">
            {/* Status Header */}
            <div className="p-6 text-center border-b border-[#eff0f6]"
              style={{ backgroundColor: order.status === "delivered" ? "#dcfce7" : order.status === "cancelled" ? "#fee2e2" : "#fff0f6" }}>
              {order.status === "cancelled" ? (
                <XCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
              ) : order.status === "delivered" ? (
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
              ) : (
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: "#ff006b" }}>
                  <Truck className="w-6 h-6 text-white" />
                </div>
              )}
              <h2 className="text-lg font-bold text-[#14142b] capitalize">
                {STATUSES.find(s => s.key === order.status)?.label || order.status}
              </h2>
              <p className="text-sm text-[#6e7191] mt-1">
                {STATUSES.find(s => s.key === order.status)?.desc}
              </p>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <div className="relative">
                {STATUSES.filter(s => s.key !== "cancelled").map((step, i) => {
                  const isCompleted = currentStatusIdx >= i;
                  const isCurrent = currentStatusIdx === i;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex gap-4 mb-5 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isCompleted ? "text-white" : "bg-[#f7f7fc] text-[#a0a3bd]"}`}
                          style={isCompleted ? { backgroundColor: step.color } : {}}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {i < STATUSES.length - 2 && (
                          <div className={`w-0.5 flex-1 mt-1 ${isCompleted && currentStatusIdx > i ? "" : "bg-[#eff0f6]"}`}
                            style={isCompleted && currentStatusIdx > i ? { backgroundColor: step.color } : {}} />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className={`text-sm font-semibold ${isCompleted ? "text-[#14142b]" : "text-[#a0a3bd]"}`}>{step.label}</p>
                        <p className={`text-xs mt-0.5 ${isCurrent ? "" : "text-[#a0a3bd]"}`}
                          style={isCurrent ? { color: step.color } : {}}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-[#eff0f6] p-4">
              <p className="text-xs text-[#a0a3bd] mb-2">Order Summary</p>
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm text-[#6e7191] py-1">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₦{item.itemTotal?.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-[#14142b] pt-2 border-t border-[#eff0f6] mt-2">
                <span>Total</span>
                <span>₦{order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Auto refresh note */}
        <p className="text-center text-[10px] text-[#a0a3bd] mt-4">Auto-refreshing every 15 seconds</p>
      </div>
    </div>
  );
}
