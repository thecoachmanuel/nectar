"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Download, 
  Tag, 
  ShoppingBag, 
  Store, 
  Loader2,
  Eye,
  Printer,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  FileText
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

export default function PosOrdersPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState("all");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { activeAdminStoreId, user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Thermal receipt modal state
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [receiptFooterSignature, setReceiptFooterSignature] = useState("Powered by Nectar App");
  const [receiptHeaderTagline, setReceiptHeaderTagline] = useState("");

  // Load stores and receipt settings list
  useEffect(() => {
    fetch("/api/admin/stores")
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setStores(data.data || data.stores || []);
        }
      })
      .catch(() => {});

    fetch("/api/settings")
      .then(res => res.json())
      .then(sData => {
        const items = sData.data || [];
        const footerSig = items.find((s: any) => s.key === "receipt_footer_signature");
        const tagline = items.find((s: any) => s.key === "receipt_header_tagline");
        if (footerSig && footerSig.payload) setReceiptFooterSignature(footerSig.payload);
        if (tagline && tagline.payload) setReceiptHeaderTagline(tagline.payload);
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
  }, [activeAdminStoreId, selectedStoreFilter]);

  // Client-side filtering for search, payment method & dates
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        (o.orderSerialNo && o.orderSerialNo.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q));

      // Payment Method filter
      let matchesPayment = true;
      if (selectedPaymentFilter !== "all") {
        const pMethod = String(o.posPaymentMethod || o.paymentMethod || "cash").toLowerCase();
        matchesPayment = pMethod === selectedPaymentFilter.toLowerCase();
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

  // Export to Excel with payment method & discount column
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
        { header: "Items Count", key: "itemsCount", width: 14 },
        { header: "Subtotal", key: "subtotal", width: 16 },
        { header: "Discount Amount", key: "discount", width: 16 },
        { header: "Total Paid", key: "totalAmount", width: 16 },
        { header: "Payment Method", key: "paymentMethod", width: 16 },
        { header: "Payment Ref/Note", key: "paymentNote", width: 20 },
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
          itemsCount: o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || o.items?.length || 0,
          subtotal: formatPrice(o.subtotal || o.totalAmount || 0),
          discount: discountVal > 0 ? `-${formatPrice(discountVal)}` : "₦0.00",
          totalAmount: formatPrice(o.totalAmount || 0),
          paymentMethod: String(o.posPaymentMethod || o.paymentMethod || "CASH").toUpperCase(),
          paymentNote: o.posPaymentNote || "—",
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

  // ── Thermal Receipt Print ──────────────────────────────────────────────
  // Opens a clean new window with ONLY the receipt HTML — no fixed overlays,
  // no visibility CSS hacks, no duplicate-page bugs.
  const handlePrint = () => {
    const el = document.getElementById('thermal-receipt');
    if (!el) return;

    const w = window.open('', '_blank', 'width=400,height=650,scrollbars=yes');
    if (!w) { window.print(); return; } // fallback if popup blocked

    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>POS Receipt</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  /* body takes full paper width — centering is handled by #receipt-wrapper below */
  body {
    background: #fff;
    color: #000;
    width: 100%;
    margin: 0;
    padding: 0;
    text-align: -webkit-center;
  }
  /* This wrapper centres the receipt on any paper size:
     - 80mm thermal  → fills full width (wrapper = 100% ≤ 80mm)
     - A4 / Letter   → centred 80mm column with equal side margins  */
  #receipt-wrapper {
    font-family: 'Courier New', Courier, monospace;
    font-size: 10.5pt;
    line-height: 1.45;
    width: 100%;
    max-width: 80mm;
    margin: 0 auto !important;
    padding: 3mm 4mm;
    text-align: left;
    box-sizing: border-box;
  }
  table { width: 100%; border-collapse: collapse; }
  .text-center { text-align: center; }
  .text-right  { text-align: right; }
  .text-left   { text-align: left; }
  .font-bold      { font-weight: 700; }
  .font-extrabold { font-weight: 900; }
  .font-semibold  { font-weight: 600; }
  .font-medium    { font-weight: 500; }
  .font-mono { font-family: 'Courier New', Courier, monospace; }
  .uppercase  { text-transform: uppercase; }
  .capitalize { text-transform: capitalize; }
  .italic { font-style: italic; }
  .tracking-tight   { letter-spacing: -0.025em; }
  .tracking-wider   { letter-spacing: 0.05em; }
  .tracking-widest  { letter-spacing: 0.1em; }
  .leading-tight    { line-height: 1.25; }
  .leading-relaxed  { line-height: 1.625; }
  .text-lg   { font-size: 1.1rem; }
  .text-base { font-size: 1rem; }
  .text-sm   { font-size: 0.875rem; }
  .text-xs   { font-size: 0.78rem; }
  .text-black     { color: #000; }
  .text-gray-500  { color: #6b7280; }
  .text-gray-600  { color: #4b5563; }
  .text-gray-700  { color: #374151; }
  .text-gray-800  { color: #1f2937; }
  .text-green-700 { color: #15803d; }
  .text-green-800 { color: #166534; }
  .text-amber-700 { color: #b45309; }
  .border-t { border-top: 1px solid; }
  .border-b { border-bottom: 1px solid; }
  .border-2 { border-width: 2px; border-style: solid; }
  .border-dashed  { border-style: dashed !important; }
  .border-gray-400 { border-color: #9ca3af; }
  .border-gray-300 { border-color: #d1d5db; }
  .border-gray-100 { border-color: #f3f4f6; }
  .border-black    { border-color: #000; }
  .p-5  { padding: 1.25rem; }
  .pb-2 { padding-bottom: 0.5rem; }
  .pb-3 { padding-bottom: 0.75rem; }
  .pt-2 { padding-top: 0.5rem; }
  .pt-2\\.5 { padding-top: 0.625rem; }
  .pl-6 { padding-left: 1.5rem; }
  .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .py-2 { padding-top: 0.5rem;  padding-bottom: 0.5rem; }
  .my-1 { margin-top: 0.25rem;  margin-bottom: 0.25rem; }
  .my-2 { margin-top: 0.5rem;   margin-bottom: 0.5rem; }
  .mt-0\\.5 { margin-top: 2px; }
  .mt-1 { margin-top: 0.25rem; }
  .w-full { width: 100%; }
  .w-7    { width: 1.75rem; }
  .flex { display: flex; justify-content: space-between; align-items: flex-start; }
  .align-top { vertical-align: top; }
  @page { size: auto; margin: 4mm 0; }
</style>
</head>
<body>
<div id="receipt-wrapper">
${el.innerHTML}
</div>
</body>
</html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); setTimeout(() => w.close(), 500); }, 350);
  };

  // KPI Calculations
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalDiscountsGiven = filteredOrders.reduce((acc, o) => acc + (Number(o.discountAmount || o.couponDiscount || 0)), 0);
  const cashRevenue = filteredOrders
    .filter(o => (o.posPaymentMethod || o.paymentMethod || "cash").toLowerCase() === "cash")
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const cardRevenue = filteredOrders
    .filter(o => (o.posPaymentMethod || o.paymentMethod) && ["card", "mobile_banking"].includes(String(o.posPaymentMethod || o.paymentMethod).toLowerCase()))
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

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
              Live records of in-store cash, POS card, and counter sales across branches
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
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-medium focus:outline-none focus:border-primary w-full sm:w-52 transition-colors text-[#14142B]"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Store Context Filter */}
            <div className="relative">
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className="h-10 pl-8 pr-7 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-[#14142B] appearance-none"
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
                className="h-10 pl-8 pr-7 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-[#14142B] appearance-none"
              >
                <option value="all">All Payments</option>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="mobile_banking">📱 Transfer</option>
                <option value="other">📝 Other</option>
              </select>
              <Banknote className="w-3.5 h-3.5 text-[#008BBA] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ── KPI Summary Strip with Cash & Card Tracking ────────────────────── */}
        <div className="p-4 sm:px-6 bg-[#FAFAFC] border-b border-[#EFF0F6] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">Total POS Sales</span>
            <p className="text-lg font-extrabold text-[#14142B]">{formatPrice(totalRevenue)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">💵 Cash Collected</span>
            <p className="text-lg font-extrabold text-[#16A34A]">{formatPrice(cashRevenue)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">💳 Card / Transfers</span>
            <p className="text-lg font-extrabold text-[#7C3AED]">{formatPrice(cardRevenue)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wide">Discounts Given</span>
            <p className="text-lg font-extrabold text-[#FB4E4E]">-{formatPrice(totalDiscountsGiven)}</p>
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
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-xs font-medium focus:outline-none focus:border-primary text-[#14142B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-xs font-medium focus:outline-none focus:border-primary text-[#14142B]"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="h-10 px-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-semibold text-[#6E7191] hover:bg-gray-200 transition-colors"
              >
                Reset Dates
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
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Products</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Subtotal</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-green-600">Discount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Total Paid</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Payment Method</th>
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
                const storeObj = stores.find(s => s._id === order.storeId);
                const storeName = storeObj?.name || "Main Store";
                const discountVal = Number(order.discountAmount || order.couponDiscount || 0);
                const orderSubtotal = order.subtotal || (order.totalAmount + discountVal);
                const method = String(order.posPaymentMethod || order.paymentMethod || "cash").toLowerCase();

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

                    {/* Payment Method Badge */}
                    <td className="px-6 py-4">
                      {method === "cash" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E0FFED] text-[#16A34A]">
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Cash</span>
                          {order.cashBackAmount > 0 && (
                            <span className="text-[10px] text-gray-500 font-normal ml-0.5">
                              (Chg: {formatPrice(order.cashBackAmount)})
                            </span>
                          )}
                        </span>
                      ) : method === "card" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F3E8FF] text-[#7C3AED]">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Card</span>
                          {order.posPaymentNote && (
                            <span className="text-[10px] font-mono ml-0.5">({order.posPaymentNote})</span>
                          )}
                        </span>
                      ) : method === "mobile_banking" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EBF3FF] text-[#2F80ED]">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Transfer</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F7F7FC] text-[#6E7191]">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="capitalize">{method}</span>
                        </span>
                      )}
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
                        
                        {/* Thermal Receipt Print Button */}
                        <button 
                          onClick={() => {
                            setReceiptOrder({
                              orderSerialNo: order.orderSerialNo,
                              id: order._id,
                              orderDate: new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                              orderTime: new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                              storeName: storeName,
                              storeAddress: storeObj?.address || "",
                              storePhone: storeObj?.phone || "",
                              customerName: order.customerName || "Walk-in Customer",
                              customerPhone: order.customerPhone || "",
                              orderType: order.orderType || "takeaway",
                              deliveryAddress: order.deliveryAddress?.address || (typeof order.deliveryAddress === "string" ? order.deliveryAddress : ""),
                              items: order.items || [],
                              subtotal: orderSubtotal,
                              discountAmount: discountVal,
                              deliveryCharge: order.deliveryCharge || 0,
                              totalAmount: order.totalAmount,
                              posPaymentMethod: method,
                              posReceivedAmount: order.posReceivedAmount,
                              cashBackAmount: order.cashBackAmount,
                              posPaymentNote: order.posPaymentNote,
                              token: order.notes?.replace("Token No: ", "") || ""
                            });
                          }} 
                          className="w-8 h-8 rounded-xl bg-[#F7F7FC] text-[#14142B] flex items-center justify-center hover:bg-gray-200 transition-colors" 
                          title="Print Thermal Receipt"
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

      {/* ── 80MM THERMAL RECEIPT MODAL ──────────────────────────────────────── */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-[340px] mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Top Action Bar */}
            <div className="p-3 bg-[#F7F7FC] border-b border-[#EFF0F6] flex items-center justify-between hidden-print">
              <button 
                onClick={() => setReceiptOrder(null)} 
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#FB4E4E] hover:bg-red-600 text-white text-xs font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 py-2 px-5 rounded-xl bg-[#1AB759] hover:bg-green-600 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>

            {/* 80mm Thermal Receipt Content */}
            <div id="thermal-receipt" className="p-5 font-mono text-black text-xs leading-relaxed select-text bg-white mx-auto" style={{ width: '100%', maxWidth: '340px' }}>
              <div className="text-center pb-3 border-b border-dashed border-gray-400">
                <h2 className="text-lg font-extrabold uppercase text-black tracking-tight">{receiptOrder.storeName || "Nectar Groceries"}</h2>
                {receiptOrder.storeAddress && <p className="text-[11px] text-gray-700 leading-tight mt-0.5">{receiptOrder.storeAddress}</p>}
                {receiptOrder.storePhone && <p className="text-[11px] text-gray-700 leading-tight">Tel: {receiptOrder.storePhone}</p>}
                {receiptHeaderTagline && <p className="text-[10px] text-gray-500 italic mt-0.5">{receiptHeaderTagline}</p>}
              </div>

              <table className="w-full my-2 text-[11px]">
                <tbody>
                  <tr>
                    <td className="text-left py-0.5 font-bold">ORDER #{receiptOrder.orderSerialNo}</td>
                    <td className="text-right py-0.5">{receiptOrder.orderTime}</td>
                  </tr>
                  <tr>
                    <td className="text-left py-0.5 text-gray-600">{receiptOrder.orderDate}</td>
                    <td className="text-right py-0.5 text-gray-600">Cashier: Admin</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-left py-0.5 text-gray-800 font-medium">Customer: {receiptOrder.customerName}</td>
                  </tr>
                  {receiptOrder.orderType === "delivery" && receiptOrder.deliveryAddress && (
                    <tr>
                      <td colSpan={2} className="text-left py-0.5 text-gray-700">Delivery: {receiptOrder.deliveryAddress}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <table className="w-full border-t border-b border-dashed border-gray-400 my-2">
                <thead>
                  <tr className="border-b border-dashed border-gray-400">
                    <th className="py-1 text-left font-bold text-[10px] uppercase w-7">QTY</th>
                    <th className="py-1 text-left font-bold text-[10px] uppercase">ITEM DESCRIPTION</th>
                    <th className="py-1 text-right font-bold text-[10px] uppercase">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptOrder.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="align-top border-b border-gray-100 last:border-none">
                      <td className="py-1 text-left font-bold">{item.quantity}</td>
                      <td className="py-1 text-left capitalize">
                        <div>{item.name}</div>
                        {item.variationName && <div className="text-[10px] text-gray-500">{item.variationName}</div>}
                      </td>
                      <td className="py-1 text-right font-bold">₦{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="py-1 pl-6">
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="text-left py-0.5 uppercase">Subtotal:</td>
                      <td className="text-right py-0.5">₦{Number(receiptOrder.subtotal || 0).toLocaleString()}</td>
                    </tr>
                    {receiptOrder.discountAmount > 0 && (
                      <tr>
                        <td className="text-left py-0.5 uppercase text-green-700">Discount:</td>
                        <td className="text-right py-0.5 text-green-700">-₦{Number(receiptOrder.discountAmount).toLocaleString()}</td>
                      </tr>
                    )}
                    {receiptOrder.orderType === "delivery" && (
                      <tr>
                        <td className="text-left py-0.5 uppercase">Delivery Charge:</td>
                        <td className="text-right py-0.5">₦{Number(receiptOrder.deliveryCharge || 0).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="border-t border-dashed border-gray-400 font-extrabold text-xs">
                      <td className="text-left py-1 uppercase">TOTAL:</td>
                      <td className="text-right py-1">₦{Number(receiptOrder.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t border-b border-dashed border-gray-400 py-2 my-1 text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span>ORDER TYPE:</span>
                  <span className="font-bold">{receiptOrder.orderType === "delivery" ? "DELIVERY" : "TAKEAWAY / PICKUP"}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold uppercase">
                    {receiptOrder.posPaymentMethod === "mobile_banking" ? "TRANSFER" : (receiptOrder.posPaymentMethod || "CASH")}
                  </span>
                </div>
                {receiptOrder.posPaymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between py-0.5">
                      <span>CASH RECEIVED:</span>
                      <span>₦{Number(receiptOrder.posReceivedAmount || receiptOrder.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-0.5 font-bold">
                      <span>CHANGE:</span>
                      <span>₦{Number(receiptOrder.cashBackAmount || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {receiptOrder.posPaymentMethod === "card" && receiptOrder.posPaymentNote && (
                  <div className="flex justify-between py-0.5">
                    <span>CARD REF / LAST 4:</span>
                    <span className="font-bold">{receiptOrder.posPaymentNote}</span>
                  </div>
                )}
                {receiptOrder.posPaymentMethod === "mobile_banking" && receiptOrder.posPaymentNote && (
                  <div className="flex justify-between py-0.5">
                    <span>TRANSACTION REF:</span>
                    <span className="font-bold">{receiptOrder.posPaymentNote}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2.5 pb-2 text-[11px] text-gray-700">
                <p className="font-semibold">Thank you for shopping with us!</p>
                <p>Please come again.</p>
              </div>

              <div className="pt-2 text-center border-t border-dashed border-gray-300">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {receiptFooterSignature || "Powered by Nectar App"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
