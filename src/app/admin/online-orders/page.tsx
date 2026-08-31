"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Eye,
  Printer,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { orderSoundAlert } from "@/utils/audioAlert";

import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

export default function OnlineOrdersPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingOrders, setClearingOrders] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const lastLatestIdRef = useRef<string | null>(null);

  // Load sound preference
  useEffect(() => {
    const saved = localStorage.getItem("admin_order_sound_enabled");
    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("admin_order_sound_enabled", String(newVal));
    if (newVal) {
      orderSoundAlert.playOrderChime();
      toast.success("Order chime sound alert enabled 🔔");
    } else {
      toast.info("Order sound alert muted 🔇");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.status) {
        setOrders(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Detect new incoming orders and play chime
  useEffect(() => {
    if (orders && Array.isArray(orders) && orders.length > 0) {
      const latestOrder = orders[0];
      if (lastLatestIdRef.current && lastLatestIdRef.current !== latestOrder._id) {
        if (soundEnabled) {
          orderSoundAlert.playOrderChime();
          toast.success(`🔔 New Order #${latestOrder.orderSerialNo || "New"} Received!`, {
            description: `${latestOrder.customerName || "Customer"} — ₦${Number(latestOrder.totalAmount || 0).toLocaleString()}`,
          });
        }
      }
      lastLatestIdRef.current = latestOrder._id;
    }
  }, [orders, soundEnabled]);

  const handleClearAllOrders = async () => {
    const confirmation = window.prompt(
      "⚠️ DANGER: This will permanently delete ALL orders and order history across the entire site!\n\nTo confirm, please type 'CLEAR' below:"
    );

    if (confirmation !== "CLEAR") {
      if (confirmation !== null) {
        toast.error("Operation cancelled. You must type 'CLEAR' exactly to proceed.");
      }
      return;
    }

    setClearingOrders(true);
    try {
      const res = await fetch("/api/admin/orders/clear-all", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "All orders cleared successfully!");
        fetchOrders();
      } else {
        toast.error(data.message || "Failed to clear orders.");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred while clearing orders.");
    } finally {
      setClearingOrders(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      const data = await res.json();
      if (data.status) {
        toast.success("Order status updated");
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = orders.filter(order => 
    order.orderSerialNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Online Orders</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Order ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-48 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={() => setShowFilter(!showFilter)}
              className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button className="h-10 px-4 rounded-xl bg-[#008BBA] text-white flex items-center gap-2 hover:bg-[#00749b] transition-colors shadow-md shadow-[#008BBA]/20">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>

            {/* Sound Alert Toggle Button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                soundEnabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              title={soundEnabled ? "Order chime sound is active (Click to mute)" : "Order chime sound is muted (Click to unmute)"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span className="hidden sm:inline">{soundEnabled ? "Chime: ON" : "Chime: OFF"}</span>
            </button>

            {/* Clear All Orders Button */}
            <button
              type="button"
              onClick={handleClearAllOrders}
              disabled={clearingOrders}
              className="h-10 px-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              title="Clear all orders database and start fresh"
            >
              {clearingOrders ? (
                <span className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{clearingOrders ? "Clearing..." : "Clear All Orders"}</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Order Status</label>
              <select className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary">
                <option>All</option>
                <option>Pending</option>
                <option>Delivered</option>
                <option>Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">From Date</label>
              <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button className="h-10 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#e60060] transition-colors flex-1">Search</button>
              <button className="h-10 px-6 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors flex-1">Clear</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Products</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">#{order.orderSerialNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#14142B]">{order.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#14142B]">{order.items?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#14142B]">₦{order.totalAmount?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">{new Date(order.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full outline-none cursor-pointer ${
                          order.orderStatus === 'delivered' ? 'bg-[#E0FFED] text-[#1AB759]' : 
                          order.orderStatus === 'canceled' ? 'bg-red-100 text-red-600' :
                          'bg-[#FFF4E5] text-[#FF9F43]'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedOrderId(order._id)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] flex items-center justify-center hover:bg-[#e5ebff] transition-colors" title="View Order Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSelectedOrderId(order._id)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#14142B] flex items-center justify-center hover:bg-gray-200 transition-colors" title="Print Invoice">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing 1 to 2 of 2 entries</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">«</button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium shadow-md shadow-primary/20">1</button>
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">»</button>
          </div>
        </div>

      </div>

      <OrderDetailsModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
        onOrderUpdated={fetchOrders}
      />

    </div>
  );
}
