"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingStore } from "@/store/useSettingStore";
import { Clock, AlertCircle, Eye, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MyOrdersPage() {
  const { user } = useAuthStore();
  const { formatPrice } = useSettingStore();

  const [activeTab, setActiveTab] = useState<"active" | "previous">("active");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/frontend/orders?userId=${user?._id}`);
      const data = await res.json();
      if (data.status) {
        setOrders(data.data || []);
      }
    } catch (e) {
      console.error("Fetch orders error:", e);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(
    (o) => !["delivered", "canceled", "cancelled"].includes(o.orderStatus || o.status)
  );
  const previousOrders = orders.filter((o) =>
    ["delivered", "canceled", "cancelled"].includes(o.orderStatus || o.status)
  );

  const displayedOrders = activeTab === "active" ? activeOrders : previousOrders;

  const handleCancel = async (orderId: string) => {
    toast.loading("Canceling order...");
    try {
      const res = await fetch("/api/frontend/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "cancel" }),
      });
      const data = await res.json();
      toast.dismiss();

      if (data.status) {
        toast.success("Order canceled successfully!");
        fetchOrders();
      } else {
        toast.error(data.message || "Unable to cancel order.");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Cancel order failed.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#14142b]">My Orders</h1>

        {/* Active vs Previous Tabs */}
        <div className="flex bg-[#f7f7fc] p-1 rounded-xl text-xs font-bold border border-[#eff0f6]">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "active"
                ? "bg-white text-[#ff006b] shadow-sm"
                : "text-[#6e7191] hover:text-[#14142b]"
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("previous")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "previous"
                ? "bg-white text-[#ff006b] shadow-sm"
                : "text-[#6e7191] hover:text-[#14142b]"
            }`}
          >
            Previous ({previousOrders.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 h-32 animate-pulse border border-[#eff0f6]"></div>
          ))}
        </div>
      ) : !user ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6] space-y-3">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-[#14142b]">Please Login</h3>
          <p className="text-xs text-[#a0a3bd]">Login to your account to view order history.</p>
          <Link
            href="/auth/login"
            className="inline-block text-white text-xs font-bold px-4 py-2 rounded-xl"
            style={{ backgroundColor: "#ff006b" }}
          >
            Login Now
          </Link>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6] space-y-3">
          <Clock className="w-12 h-12 text-[#a0a3bd] mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-[#14142b]">No {activeTab} Orders Found</h3>
          <p className="text-xs text-[#a0a3bd]">Your {activeTab} food orders will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((ord) => {
            const st = ord.orderStatus || ord.status || "pending";
            return (
              <div
                key={ord._id}
                className="bg-white rounded-2xl p-5 border border-[#eff0f6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-extrabold text-[#14142b] text-base">
                      #{ord._id?.slice(-8).toUpperCase() || ord.orderSerialNo}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        st === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : st === "canceled" || st === "cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#a0a3bd]">
                    {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ""} • {ord.items?.length || 0} Items •{" "}
                    <span className="font-bold text-[#14142b]">{formatPrice(ord.totalAmount)}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {st === "pending" && (
                    <button
                      onClick={() => handleCancel(ord._id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  <Link
                    href={`/order/${ord._id}`}
                    className="bg-[#14142b] hover:bg-[#202040] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
