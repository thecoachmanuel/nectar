"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Eye,
  Printer,
  Loader2,
  Store,
  Tag,
  ShoppingBag
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice } from "@/lib/formatters";
import Link from "next/link";
import ExcelJS from "exceljs";
import { toast } from "sonner";

export default function PosOrdersPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("all");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { activeAdminStoreId, user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load stores list
  useEffect(() => {
    fetch("/api/admin/stores")
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setStores(data.data || data.stores || []);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/orders?isPos=true`;
      
      const effectiveStore = selectedStoreFilter !== "all" 
        ? selectedStoreFilter 
        : (activeAdminStoreId && activeAdminStoreId !== "0" ? activeAdminStoreId : null);

      if (effectiveStore) {
        url += `&storeId=${effectiveStore}`;
      }
      if (selectedPaymentFilter !== "all") {
        url += `&paymentMethod=${selectedPaymentFilter}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.status) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch POS orders", err);
      toast.error("Failed to fetch POS orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeAdminStoreId, selectedStoreFilter, selectedPaymentFilter]);

  // Client-side filtering for search & dates
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        (o.orderSerialNo && o.orderSerialNo.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q));

      // Payment filter
      let matchesPayment = true;
      if (selectedPaymentFilter !== "all") {
        matchesPayment = o.paymentMethod === selectedPaymentFilter;
      }

      // Date Range
      let matchesDate = true;
      if (fromDate) {
        const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
        if (orderDate < fromDate) matchesDate = false;
      }
      if (toDate) {
        const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
        if (orderDate > toDate) matchesDate = false;
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, selectedPaymentFilter, fromDate, toDate]);

  // Export to Excel with full payment method & discount columns
  const exportToExcel = async () => {
    if (filteredOrders.length === 0) {
      toast.error("No POS orders to export");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("POS Orders Report");

      worksheet.columns = [
        { header: "Order ID", key: "orderSerialNo", width: 18 },
        { header: "Date & Time", key: "date", width: 22 },
        { header: "Customer Name", key: "customerName", width: 22 },
        { header: "Customer Phone", key: "customerPhone", width: 18 },
        { header: "Store Context", key: "store", width: 22 },
        { header: "Payment Method", key: "paymentMethod", width: 16 },
        { header: "Payment Ref / Note", key: "paymentReference", width: 22 },
        { header: "Items Count", key: "itemsCount", width: 14 },
        { header: "Subtotal", key: "subtotal", width: 16 },
        { header: "Discount Amount", key: "discount", width: 16 },
        { header: "Total Paid", key: "totalAmount", width: 16 },
        { header: "Order Type", key: "orderType", width: 14 },
        { header: "Status", key: "status", width: 14 },
      ];

      filteredOrders.forEach((o: any) => {
        const storeName = stores.find(s => s._id === o.storeId)?.name || o.storeId || "Main Store";
        const discountVal = Number(o.discountAmount || o.couponDiscount || 0);

        worksheet.addRow({
          orderSerialNo: o.orderSerialNo,
          date: new Date(o.createdAt).toLocaleString(),
          customerName: o.customerName || "Walk-in Customer",
          customerPhone: o.customerPhone || "—",
          store: storeName,
          paymentMethod: (o.paymentMethod || "cash").toUpperCase(),
          paymentReference: o.paymentReference || "—",
          itemsCount: o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || o.items?.length || 0,
          subtotal: formatPrice(o.subtotal || o.totalAmount || 0),
          discount: discountVal > 0 ? `-${formatPrice(discountVal)}` : "₦0.00",
          totalAmount: formatPrice(o.totalAmount || 0),
          orderType: o.orderType || "takeaway",
          status: o.orderStatus || "accepted",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `POS_Orders_Report_${Date.now()}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success("POS orders report exported successfully!");
    } catch (err: any) {
      console.error("Export failed:", err);
      toast.error("Failed to export: " + err.message);
    }
  };

  // KPI Calculations
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalDiscountsGiven = filteredOrders.reduce((acc, o) => acc + (Number(o.discountAmount || o.couponDiscount || 0)), 0);

  return (
    <div className="pb-16 font-sans">
      
      {/* ── Header Card ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#EFF0F6] mb-6">
        
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div>
            <h1 className="font-bold text-xl text-[#14142B] flex items-center gap-2">
              <span>POS Orders & Terminal Sales</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {filteredOrders.length} orders
              </span>
            </h1>
            <p className="text-xs text-[#6E7191] mt-0.5">
              Live records of in-store cash, POS, and counter sales across branches
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order ID or Name..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-medium focus:outline-none focus:border-primary w-full sm:w-56 transition-colors text-[#14142B]"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Store Context Filter */}
            <div className="relative">
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className="h-10 pl-8 pr-8 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-[#14142B] appearance-none"
              >
                <option value="all">All Stores</option>
                {stores.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <Store className="w-3.5 h-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={selectedPaymentFilter}
                onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-[#14142B]"
              >
                <option value="all">All Payments</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_banking">Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`h-10 px-3.5 rounded-xl border border-[#EFF0F6] flex items-center justify-center transition-colors ${
                showFilter ? "bg-primary text-white" : "bg-white text-[#6E7191] hover:bg-[#F7F7FC]"
              }`}
              title="Date filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            {/* Export Button */}
            <button 
              onClick={exportToExcel}
              className="h-10 px-4 rounded-xl bg-[#008BBA] text-white flex items-center gap-2 hover:bg-[#00749b] transition-colors shadow-sm shadow-[#008BBA]/20 font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* ── KPI Summary Strip ──────────────────────────────────────────────── */}
        <div className="p-4 sm:px-6 bg-[#FAFAFC] border-b border-[#EFF0F6] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">Total Sales</span>
            <p className="text-lg font-extrabold text-[#14142B]">{formatPrice(totalRevenue)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">Discounts Given</span>
            <p className="text-lg font-extrabold text-[#1AB759]">-{formatPrice(totalDiscountsGiven)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">Total Orders</span>
            <p className="text-lg font-extrabold text-[#14142B]">{filteredOrders.length}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">Store Context</span>
            <p className="text-sm font-bold text-primary truncate">
              {selectedStoreFilter === "all" ? "All Stores" : (stores.find(s => s._id === selectedStoreFilter)?.name || "Active Store")}
            </p>
          </div>
        </div>

        {/* ── Date Range Filter Section ──────────────────────────────────────── */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-white grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs font-medium focus:outline-none focus:border-primary text-[#14142B]" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs font-medium focus:outline-none focus:border-primary text-[#14142B]" 
              />
            </div>
            <div className="flex items-end gap-2">
              <button 
                onClick={() => { setFromDate(""); setToDate(""); setSearchQuery(""); setSelectedPaymentFilter("all"); }}
                className="h-10 px-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] hover:bg-gray-100 text-xs font-bold text-[#6E7191] transition-colors w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* ── POS Orders Table ───────────────────────────────────────────────── */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Store Branch</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Products</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Subtotal</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-green-600">Discount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Total Paid</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <span className="text-xs text-[#6E7191]">Loading POS orders...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-[#6E7191]">
                    <ShoppingBag className="w-10 h-10 text-[#D9DBE9] mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#14142B]">No POS orders found</p>
                    <p className="text-xs text-[#A0A3BD] mt-0.5">
                      New orders placed at the POS terminal will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : filteredOrders.map((order) => {
                const storeName = stores.find(s => s._id === order.storeId)?.name || "Main Store";
                const discountVal = Number(order.discountAmount || order.couponDiscount || 0);
                const orderSubtotal = order.subtotal || (order.totalAmount + discountVal);

                return (
                  <tr key={order._id} className="hover:bg-[#FAFAFC] transition-colors">
                    {/* Order ID */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-extrabold text-primary font-mono">{order.orderSerialNo}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-xs font-semibold text-[#14142B] block">{order.customerName || "Walk-in Customer"}</span>
                        {order.customerPhone && (
                          <span className="text-[11px] text-[#6E7191] font-mono">{order.customerPhone}</span>
                        )}
                      </div>
                    </td>

                    {/* Store */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[#4E4B66] inline-flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#A0A3BD]" />
                        {storeName}
                      </span>
                    </td>

                    {/* Payment Method Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentMethod === 'cash'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.paymentMethod === 'card'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : order.paymentMethod === 'mobile_banking'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.paymentMethod || "cash"}
                      </span>
                      {order.paymentReference && (
                        <span className="block text-[10px] text-[#A0A3BD] font-mono mt-0.5 max-w-[120px] truncate" title={order.paymentReference}>
                          {order.paymentReference}
                        </span>
                      )}
                    </td>

                    {/* Products count */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#14142B] px-2 py-0.5 rounded-lg bg-[#F7F7FC] border border-[#EFF0F6]">
                        {order.items?.length || 0} items
                      </span>
                    </td>

                    {/* Subtotal */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-[#4E4B66]">{formatPrice(orderSubtotal)}</span>
                    </td>

                    {/* Discount Amount */}
                    <td className="px-6 py-4">
                      {discountVal > 0 ? (
                        <span className="text-xs font-bold text-[#1AB759] inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          -{formatPrice(discountVal)}
                        </span>
                      ) : (
                        <span className="text-xs text-[#A0A3BD]">None</span>
                      )}
                    </td>

                    {/* Total Paid */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-extrabold text-[#14142B]">{formatPrice(order.totalAmount || 0)}</span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#6E7191]">{new Date(order.createdAt).toLocaleString()}</span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        order.orderStatus === 'delivered' 
                          ? 'bg-[#E0FFED] text-[#1AB759]' 
                          : order.orderStatus === 'accepted' 
                          ? 'bg-[#EBF3FF] text-[#2F80ED]' 
                          : 'bg-[#FFF4E5] text-[#FF9F43]'
                      }`}>
                        {order.orderStatus?.replace('_', ' ') || "Accepted"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/order/${order._id}`} 
                          className="w-8 h-8 rounded-xl bg-[#F7F7FC] text-[#567DFF] flex items-center justify-center hover:bg-[#e5ebff] transition-colors" 
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => window.open(`/order/${order._id}?print=true`, '_blank')} 
                          className="w-8 h-8 rounded-xl bg-[#F7F7FC] text-[#14142B] flex items-center justify-center hover:bg-gray-200 transition-colors" 
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 sm:px-6 border-t border-[#EFF0F6] flex items-center justify-between text-xs text-[#6E7191]">
          <span>Showing {filteredOrders.length} of {orders.length} entries</span>
          <span className="font-semibold text-primary">Nectar POS Reporting</span>
        </div>

      </div>

    </div>
  );
}
