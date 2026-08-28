"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Clock, Plus, CheckCircle, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import ItemModal from "@/components/frontend/ItemModal";

export default function WaiterPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !["admin", "waiter"].includes(user.role)) { router.push("/admin/login"); return; }
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders?type=dine_in", {
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
      if (data.status) { toast.success("Order updated"); fetchOrders(); }
    } catch { toast.error("Update failed"); }
    finally { setUpdating(null); }
  };

  const statusGroups = {
    pending: orders.filter(o => o.status === "pending"),
    accepted: orders.filter(o => o.status === "accepted"),
    preparing: orders.filter(o => o.status === "preparing"),
    delivered: orders.filter(o => o.status === "delivered"),
  };

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: "Pending",   color: "#d97706", bg: "#fef3c7" },
    accepted:  { label: "Accepted",  color: "#2563eb", bg: "#dbeafe" },
    preparing: { label: "Preparing", color: "#7c3aed", bg: "#ede9fe" },
    delivered: { label: "Delivered", color: "#16a34a", bg: "#dcfce7" },
  };

  return (
    <div className="min-h-screen bg-[#f7f7fc] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: "#ff006b" }}>
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#14142b]">Waiter Station</h1>
            <p className="text-sm text-[#6e7191]">Dine-in order management</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => router.push("/admin/pos")}
              className="text-xs px-4 py-2 rounded-xl text-white font-medium transition-all"
              style={{ backgroundColor: "#ff006b" }}>
              <Plus className="w-3.5 h-3.5 inline mr-1" />New Order
            </button>
            <button onClick={fetchOrders}
              className="text-xs px-4 py-2 rounded-xl border border-[#eff0f6] bg-white text-[#6e7191] hover:border-[#ff006b] hover:text-[#ff006b] transition-all">
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#ff006b" }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-[#eff0f6]">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-base font-semibold text-[#14142b]">No active orders</p>
            <p className="text-sm text-[#a0a3bd] mt-1">Dine-in orders will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(statusGroups).map(([status, statusOrders]) => {
              const sc = STATUS_CONFIG[status];
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sc.color }} />
                    <h2 className="text-sm font-bold text-[#14142b]">{sc.label}</h2>
                    <span className="text-xs text-[#a0a3bd]">({statusOrders.length})</span>
                  </div>
                  <div className="space-y-3">
                    {statusOrders.length === 0 ? (
                      <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-[#eff0f6] text-xs text-[#a0a3bd]">
                        None
                      </div>
                    ) : statusOrders.map(order => (
                      <div key={order._id} className="bg-white rounded-2xl border border-[#eff0f6] p-3.5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-[#14142b]">
                            #{order._id?.slice(-6).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-[#a0a3bd]">
                            <Clock className="w-3 h-3" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </div>
                        </div>
                        <p className="text-xs text-[#6e7191] mb-2 capitalize">
                          {order.customer?.name || "Guest"} • {order.items?.length || 0} items
                        </p>
                        <p className="text-sm font-bold text-[#14142b] mb-3">₦{order.totalAmount?.toFixed(2)}</p>
                        <div className="space-y-1.5">
                          {status === "pending" && (
                            <button onClick={() => updateStatus(order._id, "accepted")} disabled={updating === order._id}
                              className="w-full h-7 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                              style={{ backgroundColor: "#2563eb" }}>
                              {updating === order._id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Accept"}
                            </button>
                          )}
                          {status === "preparing" && (
                            <button onClick={() => updateStatus(order._id, "delivered")} disabled={updating === order._id}
                              className="w-full h-7 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                              style={{ backgroundColor: "#16a34a" }}>
                              {updating === order._id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Served"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ItemModal item={selectedItem} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
