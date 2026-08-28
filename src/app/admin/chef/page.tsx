"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { ChefHat, Clock, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ChefPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !["admin", "chef"].includes(user.role)) { router.push("/admin/login"); return; }
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders?status=accepted,preparing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status) setOrders(data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success(`Order marked as ${status}`);
        setOrders(prev => prev.filter(o => o._id !== orderId || status === "preparing"));
        fetchOrders();
      }
    } catch { toast.error("Update failed"); }
    finally { setUpdating(null); }
  };

  const accepted = orders.filter(o => o.status === "accepted");
  const preparing = orders.filter(o => o.status === "preparing");

  return (
    <div className="min-h-screen bg-[#f7f7fc] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: "#ff006b" }}>
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#14142b]">Chef Station</h1>
            <p className="text-sm text-[#6e7191]">Kitchen order management</p>
          </div>
          <button onClick={fetchOrders} className="ml-auto text-xs px-4 py-2 rounded-xl border border-[#eff0f6] bg-white text-[#6e7191] hover:border-[#ff006b] hover:text-[#ff006b] transition-all">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#ff006b" }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Orders (Accepted) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="font-bold text-[#14142b]">New Orders ({accepted.length})</h2>
              </div>
              <div className="space-y-3">
                {accepted.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#eff0f6] text-sm text-[#a0a3bd]">
                    No new orders
                  </div>
                ) : accepted.map(order => (
                  <OrderCard key={order._id} order={order} updating={updating}
                    actions={[{ label: "Start Preparing", status: "preparing", color: "#ff006b" }]}
                    onUpdate={updateStatus} />
                ))}
              </div>
            </div>

            {/* In Progress (Preparing) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
                <h2 className="font-bold text-[#14142b]">Preparing ({preparing.length})</h2>
              </div>
              <div className="space-y-3">
                {preparing.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#eff0f6] text-sm text-[#a0a3bd]">
                    Nothing in preparation
                  </div>
                ) : preparing.map(order => (
                  <OrderCard key={order._id} order={order} updating={updating}
                    actions={[{ label: "Mark Ready", status: "on_the_way", color: "#16a34a" }]}
                    onUpdate={updateStatus} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, updating, actions, onUpdate }: any) {
  return (
    <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono text-sm font-bold text-[#14142b]">#{order._id?.slice(-6).toUpperCase()}</span>
          <p className="text-xs text-[#6e7191] mt-0.5 capitalize">{order.customer?.name || "Guest"}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#a0a3bd]">
          <Clock className="w-3.5 h-3.5" />
          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-[#14142b] font-medium">{item.name}</span>
            <span className="w-6 h-6 rounded-full bg-[#f7f7fc] flex items-center justify-center text-xs font-bold text-[#14142b]">
              {item.quantity}
            </span>
          </div>
        ))}
      </div>

      {order.note && (
        <div className="bg-amber-50 rounded-xl p-2.5 mb-3 text-xs text-amber-700">
          📝 {order.note}
        </div>
      )}

      <div className="flex gap-2">
        {actions.map((action: any) => (
          <button key={action.status} onClick={() => onUpdate(order._id, action.status)}
            disabled={updating === order._id}
            className="flex-1 h-9 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: action.color }}>
            {updating === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
