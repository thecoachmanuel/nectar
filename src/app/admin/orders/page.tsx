"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ClipboardList, Search, Filter, Eye, CheckCircle, XCircle,
  Clock, Truck, ChefHat, Loader2, RefreshCw, Package
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    color: "#d97706", bg: "#fef3c7", icon: <Clock className="w-3.5 h-3.5" /> },
  accepted:   { label: "Accepted",   color: "#2563eb", bg: "#dbeafe", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  preparing:  { label: "Preparing",  color: "#7c3aed", bg: "#ede9fe", icon: <ChefHat className="w-3.5 h-3.5" /> },
  on_the_way: { label: "On the Way", color: "#0891b2", bg: "#cffafe", icon: <Truck className="w-3.5 h-3.5" /> },
  delivered:  { label: "Delivered",  color: "#16a34a", bg: "#dcfce7", icon: <Package className="w-3.5 h-3.5" /> },
  cancelled:  { label: "Cancelled",  color: "#dc2626", bg: "#fee2e2", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const ORDER_TYPES = ["all", "pending", "accepted", "preparing", "on_the_way", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !["admin", "waiter", "chef"].includes(user.role)) {
      router.push("/admin/login");
      return;
    }
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status) setOrders(data.data || []);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch { toast.error("Failed to update status"); }
    finally { setUpdating(null); }
  };

  const filteredOrders = orders.filter(o =>
    !search || o._id?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const nextStatuses: Record<string, string[]> = {
    pending:    ["accepted", "cancelled"],
    accepted:   ["preparing", "cancelled"],
    preparing:  ["on_the_way", "cancelled"],
    on_the_way: ["delivered"],
    delivered:  [],
    cancelled:  [],
  };

  return (
    <div className="db-main min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="db-breadcrumb mb-6">
          <h1 className="db-breadcrumb-title">Online Orders</h1>
          <nav className="db-breadcrumb-list text-sm text-[#6e7191]">
            <span>Admin</span>
            <span className="mx-1.5">/</span>
            <span style={{ color: "#ff006b" }}>Orders</span>
          </nav>
        </div>

        {/* Status Filter Tabs */}
        <div className="db-card mb-4">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
            {ORDER_TYPES.map(type => (
              <button key={type} onClick={() => setStatusFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${statusFilter === type
                  ? "text-white border-transparent"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#ff006b] hover:text-[#ff006b]"
                }`}
                style={statusFilter === type ? { backgroundColor: "#ff006b", borderColor: "#ff006b" } : {}}>
                {type === "on_the_way" ? "On the Way" : type}
                <span className="ml-1.5 opacity-70">
                  ({type === "all" ? orders.length : orders.filter(o => o.status === type).length})
                </span>
              </button>
            ))}
          </div>

          {/* Search & Refresh */}
          <div className="p-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3bd]" />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchOrders()}
                placeholder="Search order ID or customer..."
                className="db-field-control pl-10 h-9 text-sm" />
            </div>
            <button onClick={fetchOrders}
              className="db-btn h-9 px-3 text-sm border border-gray-200 bg-white text-gray-600 hover:text-[#ff006b] hover:border-[#ff006b] rounded-md">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="db-card">
          <div className="db-table-responsive">
            <table className="db-table">
              <thead className="db-table-head">
                <tr>
                  {["Order ID", "Customer", "Items", "Total", "Type", "Status", "Actions"].map(h => (
                    <th key={h} className="db-table-head-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="db-table-body">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#ff006b" }} />
                  </td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-[#a0a3bd] text-sm">
                    No orders found
                  </td></tr>
                ) : filteredOrders.map(order => {
                  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={order._id} className="db-table-body-tr hover:bg-[#f9fafb]">
                      <td className="db-table-body-td">
                        <span className="font-mono text-xs font-semibold text-[#14142b]">
                          #{order._id?.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="db-table-body-td">
                        <div>
                          <p className="text-sm font-medium text-[#14142b] capitalize">{order.customer?.name || "Guest"}</p>
                          <p className="text-xs text-[#6e7191]">{order.customer?.phone || order.customer?.email}</p>
                        </div>
                      </td>
                      <td className="db-table-body-td">
                        <span className="text-sm text-[#6e7191]">{order.items?.length || 0} item(s)</span>
                      </td>
                      <td className="db-table-body-td">
                        <span className="text-sm font-bold text-[#14142b]">₦{order.totalAmount?.toFixed(2)}</span>
                      </td>
                      <td className="db-table-body-td">
                        <span className={`db-badge capitalize ${order.orderType === "delivery" ? "db-badge-blue" : "db-badge-yellow"}`}>
                          {order.orderType || "delivery"}
                        </span>
                      </td>
                      <td className="db-table-body-td">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ color: sc.color, backgroundColor: sc.bg }}>
                          {sc.icon}{sc.label}
                        </span>
                      </td>
                      <td className="db-table-body-td">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => router.push(`/order/${order._id}`)}
                            className="db-table-action view">
                            <Eye className="w-3.5 h-3.5 text-[#ff006b] bg-[#fff0f6] p-0.5 rounded" />
                          </button>
                          {nextStatuses[order.status]?.map(next => (
                            <button key={next} onClick={() => updateStatus(order._id, next)}
                              disabled={updating === order._id}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all disabled:opacity-50 border"
                              style={{ color: STATUS_CONFIG[next]?.color, borderColor: STATUS_CONFIG[next]?.color, backgroundColor: STATUS_CONFIG[next]?.bg }}>
                              {updating === order._id ? <Loader2 className="w-3 h-3 animate-spin" /> : next.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
