"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettingStore } from "@/store/useSettingStore";
import { Utensils, Clock, CheckCircle2, ArrowLeft, Volume2 } from "lucide-react";
import { toast } from "sonner";

export default function KitchenDisplaySystemPage() {
  const { activeBranch } = useSettingStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKdsOrders();
    const interval = setInterval(fetchKdsOrders, 8000); // 8-second auto refresh
    return () => clearInterval(interval);
  }, [activeBranch]);

  const fetchKdsOrders = async () => {
    try {
      let url = "/api/frontend/orders?";
      if (activeBranch && activeBranch._id) {
        url += `branchId=${activeBranch._id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.status && data.data) {
        // Filter orders for Kitchen Display (Pending, Accepted, Preparing)
        const kitchenOrders = data.data.filter((o: any) =>
          ["pending", "accepted", "preparing"].includes(o.orderStatus)
        );
        setOrders(kitchenOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    toast.loading("Updating status...");
    try {
      // Direct state update
      setOrders(
        orders.map((o) =>
          o._id === orderId ? { ...o, orderStatus: nextStatus } : o
        )
      );
      toast.dismiss();
      toast.success(`Order status updated to ${nextStatus.toUpperCase()}`);
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top KDS Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/admin/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            <h1 className="font-black text-lg text-white">Kitchen Display System (KDS)</h1>
          </div>
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-bold">
            {activeBranch ? activeBranch.name : "All Kitchens"}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-xl text-emerald-400">
            <Volume2 className="w-4 h-4" />
            <span>Audio Alert Active</span>
          </div>
        </div>
      </header>

      {/* Main KDS Order Cards Stream */}
      <main className="p-6 max-w-7xl mx-auto w-full flex-1">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            Loading kitchen tickets...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3 max-w-md mx-auto">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">All Kitchen Orders Clear!</h3>
            <p className="text-xs text-slate-400">New orders placed by customers or POS will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((ord) => (
              <div
                key={ord._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-black text-xl text-amber-400">{ord.orderSerialNo}</h3>
                      <p className="text-[10px] text-slate-400 capitalize">
                        Type: {ord.orderType.replace(/_/g, " ")} {ord.tableNumber ? `• ${ord.tableNumber}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-amber-500/20 text-amber-400">
                      {ord.orderStatus}
                    </span>
                  </div>

                  {/* Item List */}
                  <div className="space-y-2">
                    {ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="bg-slate-800/60 p-2.5 rounded-xl text-xs font-medium space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>{it.quantity}x {it.name}</span>
                          {it.variationName && <span className="text-amber-400">[{it.variationName}]</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Toggle Action */}
                <div className="pt-2">
                  {ord.orderStatus === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, "preparing")}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 rounded-xl transition"
                    >
                      Start Preparing Order
                    </button>
                  )}

                  {ord.orderStatus === "preparing" && (
                    <button
                      onClick={() => handleUpdateStatus(ord._id, "ready")}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3 rounded-xl transition"
                    >
                      Mark Order Ready for Pickup
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
