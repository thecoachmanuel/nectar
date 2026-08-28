"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingStore } from "@/store/useSettingStore";
import { Clock, CheckCircle, AlertCircle, Eye, XCircle, ArrowLeft } from "lucide-react";
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
    (o) => !["delivered", "canceled"].includes(o.orderStatus)
  );
  const previousOrders = orders.filter((o) =>
    ["delivered", "canceled"].includes(o.orderStatus)
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-800">My Orders</h1>

          {/* Active vs Previous Tabs */}
          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "active"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("previous")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "previous"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Previous ({previousOrders.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 h-32 animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : !user ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Please Login</h3>
            <p className="text-xs text-slate-400">Login to your account to view order history.</p>
            <Link
              href="/auth/login"
              className="inline-block bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Login Now
            </Link>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-3">
            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No {activeTab} Orders Found</h3>
            <p className="text-xs text-slate-400">Your {activeTab} food orders will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((ord) => (
              <div
                key={ord._id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-extrabold text-slate-800 text-base">{ord.orderSerialNo}</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        ord.orderStatus === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : ord.orderStatus === "canceled"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.orderStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} Items •{" "}
                    <span className="font-bold text-slate-700">{formatPrice(ord.totalAmount)}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {ord.orderStatus === "pending" && (
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
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
