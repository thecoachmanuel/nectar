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
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { orderSoundAlert } from "@/utils/audioAlert";
import { formatPrice, formatDateTime } from "@/lib/formatters";

import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastOrderCountRef = useRef<number | null>(null);
  const lastLatestIdRef = useRef<string | null>(null);

  const handleQuickMarkPaid = async (order: any) => {
    const isWA = order.paymentMethod === "whatsapp";
    const confirmMsg = `Mark Order #${order.orderSerialNo} (${formatPrice(order.totalAmount || 0)})${isWA ? " [WhatsApp Order]" : ""} as PAID?\n\n• Product inventory stock will be automatically deducted\n• WhatsApp payment confirmation will be sent to the customer`;
    if (!window.confirm(confirmMsg)) return;

    setMarkingPaidId(order._id);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success(`Order #${order.orderSerialNo} marked as PAID! 🎉`, {
          description: "Inventory stock updated & WhatsApp receipt sent.",
        });
        fetchOrders();
      } else {
        toast.error(data.message || "Failed to update payment status");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while marking as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const tabs = ["All", "pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "canceled"];

  const { execute, data: orders, loading } = useApi();
  const { execute: updateOrder } = useApi();

  const fetchOrders = () => {
    execute("/api/admin/orders?isPos=false");
  };

  // Load sound preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin_order_sound_enabled");
    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }
  }, []);

  // Toggle sound
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

  useEffect(() => {
    fetchOrders();
    // Auto-poll every 6 seconds for new orders
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
        // A new order has arrived!
        if (soundEnabled) {
          orderSoundAlert.playOrderChime();
          toast.success(`🔔 New Order #${latestOrder.orderSerialNo || "New"} Received!`, {
            description: `${latestOrder.customerName || "Customer"} — ${formatPrice(latestOrder.totalAmount || 0)}`,
          });
        }
      }
      lastLatestIdRef.current = latestOrder._id;
      lastOrderCountRef.current = orders.length;
    }
  }, [orders, soundEnabled]);

  const handleStatusChange = async (id: string, status: string, order: any) => {
    let providedPin = undefined;
    
    if (status === "delivered" && order.orderType === "delivery") {
      providedPin = window.prompt("Enter the 4-digit PIN provided by the customer:");
      if (!providedPin) {
        toast.error("Delivery PIN is required to mark as delivered.");
        // We fetch orders to reset the dropdown UI since it was aborted
        fetchOrders();
        return;
      }
    }

    try {
      await updateOrder(`/api/admin/orders/${id}`, {
        method: "PUT",
        body: { orderStatus: status, providedPin },
        successMessage: `Order marked as ${status.replace("_", " ")}`,
      });
      fetchOrders();
    } catch (e) {}
  };

  const [clearingOrders, setClearingOrders] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-[#FFF6E6] text-[#FFB020]";
      case "preparing": return "bg-[#e5ebff] text-[#567DFF]";
      case "out_for_delivery": return "bg-[#E9F9FF] text-[#008BBA]";
      case "delivered": return "bg-[#EBE7FF] text-[#8262FE]";
      case "canceled": return "bg-[#FFEAEA] text-[#FB4E4E]";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const filteredOrders = orders?.filter((order: any) => {
    if (order.isPos) return false;
    if (activeTab === "All") return true;
    return order.orderStatus === activeTab;
  });

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
                placeholder="Search by Order ID..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-64 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors">
              <Download className="w-4 h-4" />
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

        {/* Tabs */}
        <div className="border-b border-[#EFF0F6] overflow-x-auto hide-scrollbar">
          <div className="flex px-4 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab 
                    ? "border-primary text-primary" 
                    : "border-transparent text-[#6E7191] hover:text-[#14142B]"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !orders ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              ) : filteredOrders?.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#6E7191]">No orders found</td></tr>
              ) : (
                filteredOrders?.map((order: any) => (
                  <tr key={order._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">{order.orderSerialNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#14142B]">{order.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#14142B]">{formatPrice(order.totalAmount || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66] capitalize">{order.orderType?.replace("_", " ")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">{formatDateTime(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value, order)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-none focus:ring-0 cursor-pointer capitalize ${getStatusColor(order.orderStatus)}`}
                      >
                        {tabs.filter(t => t !== "All").map(statusOption => (
                          <option key={statusOption} value={statusOption}>{statusOption.replace("_", " ")}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {order.paymentStatus === "paid" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shadow-2xs">
                            <span className="text-xs">✓</span> Paid
                          </span>
                          {order.paymentMethod === "whatsapp" && (
                            <span className="text-[9px] bg-[#1AB759] text-white px-1.5 py-0.5 rounded font-black tracking-wide" title="WhatsApp Order">
                              WA
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={markingPaidId === order._id}
                          onClick={() => handleQuickMarkPaid(order)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer ${
                            order.paymentMethod === "whatsapp"
                              ? "bg-[#1AB759] hover:bg-[#159a4a] shadow-[#1AB759]/25 ring-2 ring-[#1AB759]/30"
                              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                          }`}
                          title="1-Click Mark as Paid: auto-deducts inventory & sends WhatsApp receipt"
                        >
                          {markingPaidId === order._id ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5" />
                          )}
                          <span>{markingPaidId === order._id ? "Saving..." : "Mark Paid"}</span>
                          {order.paymentMethod === "whatsapp" && (
                            <span className="text-[9px] bg-white/30 px-1 py-0.2 rounded font-black">WA</span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => window.open(`/order/${order._id}?print=true`, '_blank')} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#14142B] flex items-center justify-center hover:bg-[#e2e2ec] transition-colors" title="Print Invoice">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSelectedOrderId(order._id)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] flex items-center justify-center hover:bg-[#e5ebff] transition-colors" title="View Order Details">
                          <Eye className="w-4 h-4" />
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
          <span className="text-sm text-[#6E7191]">Showing {filteredOrders?.length || 0} entries</span>
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
