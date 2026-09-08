"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

// Helper function to resolve the exact transaction amount from multiple possible fields
export function resolveTransactionAmount(txn: any): number {
  if (!txn) return 0;
  if (typeof txn.amount === "number" && !isNaN(txn.amount) && txn.amount > 0) return txn.amount;
  if (typeof txn.totalAmount === "number" && !isNaN(txn.totalAmount) && txn.totalAmount > 0) return txn.totalAmount;
  if (txn.totalAmount && !isNaN(Number(txn.totalAmount)) && Number(txn.totalAmount) > 0) return Number(txn.totalAmount);
  if (typeof txn.total === "number" && !isNaN(txn.total) && txn.total > 0) return txn.total;
  if (txn.total && !isNaN(Number(txn.total)) && Number(txn.total) > 0) return Number(txn.total);
  if (typeof txn.posReceivedAmount === "number" && !isNaN(txn.posReceivedAmount) && txn.posReceivedAmount > 0) return txn.posReceivedAmount;
  
  // Calculate from subtotal, delivery, tax, discount
  const subtotal = Number(txn.subtotal) || 0;
  const delivery = Number(txn.deliveryCharge) || 0;
  const tax = Number(txn.taxAmount) || 0;
  const discount = Number(txn.discountAmount || txn.discount || txn.couponDiscount) || 0;
  const computed = subtotal + delivery + tax - discount;
  if (computed > 0) return computed;

  // Fallback to items array sum
  if (Array.isArray(txn.items) && txn.items.length > 0) {
    const itemsSum = txn.items.reduce((sum: number, it: any) => {
      const price = Number(it.price) || 0;
      const qty = Number(it.quantity) || 1;
      return sum + (Number(it.itemTotal) || (price * qty));
    }, 0);
    if (itemsSum > 0) return itemsSum + delivery + tax - discount;
  }
  return 0;
}

export default function TransactionsPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  // Detail Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Copy tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // First try dedicated transactions route with normalized amounts
      const res = await fetch("/api/admin/transactions");
      const data = await res.json();
      if (data.status && Array.isArray(data.data)) {
        setTransactions(data.data);
      } else {
        // Fallback to orders endpoint
        const ordersRes = await fetch("/api/admin/orders");
        const ordersData = await ordersRes.json();
        if (ordersData.status && Array.isArray(ordersData.data)) {
          setTransactions(ordersData.data);
        }
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(`Copied: ${text}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatPaymentMethod = (txn: any) => {
    const raw = String(txn.paymentMethod || txn.posPaymentMethod || txn.paymentType || "").toLowerCase();
    if (raw.includes("paystack")) return "Paystack (Online)";
    if (raw.includes("wallet")) return "Digital Wallet";
    if (raw.includes("whatsapp")) return "WhatsApp Order";
    if (raw.includes("cod") || raw.includes("cash_on_delivery")) return "Cash on Delivery";
    if (raw.includes("cash")) return "Cash Payment";
    if (raw.includes("pos") || txn.isPos) {
      return txn.posPaymentMethod ? `POS (${txn.posPaymentMethod.toUpperCase()})` : "POS In-Store";
    }
    if (raw.includes("card")) return "Card Payment";
    return raw.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Digital Payment";
  };

  // Filtered transactions computation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const txnId = (txn.transactionId || txn.paymentReference || txn._id || "").toLowerCase();
        const orderSerial = (txn.orderSerialNo || txn.orderId || "").toLowerCase();
        const customer = (txn.customerName || "").toLowerCase();
        const phone = (txn.customerPhone || "").toLowerCase();
        if (!txnId.includes(q) && !orderSerial.includes(q) && !customer.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (fromDate) {
        const itemDate = new Date(txn.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(txn.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // 3. Payment Method Filter
      if (paymentMethodFilter !== "all") {
        const method = String(txn.paymentMethod || txn.posPaymentMethod || "").toLowerCase();
        if (paymentMethodFilter === "paystack" && !method.includes("paystack")) return false;
        if (paymentMethodFilter === "cod" && !method.includes("cash_on_delivery") && !method.includes("cod")) return false;
        if (paymentMethodFilter === "wallet" && !method.includes("wallet")) return false;
        if (paymentMethodFilter === "pos" && !method.includes("pos") && !txn.isPos) return false;
        if (paymentMethodFilter === "whatsapp" && !method.includes("whatsapp")) return false;
      }

      // 4. Payment Status Filter
      if (paymentStatusFilter !== "all") {
        const status = String(txn.paymentStatus || "").toLowerCase();
        if (paymentStatusFilter === "paid" && status !== "paid") return false;
        if (paymentStatusFilter === "unpaid" && status === "paid") return false;
        if (paymentStatusFilter === "failed" && status !== "failed") return false;
      }

      return true;
    });
  }, [transactions, searchQuery, fromDate, toDate, paymentMethodFilter, paymentStatusFilter]);

  // Overall and filtered financial metrics
  const summaryMetrics = useMemo(() => {
    let totalVolume = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let pendingVolume = 0;

    filteredTransactions.forEach((txn) => {
      const amt = resolveTransactionAmount(txn);
      if (txn.paymentStatus === "paid") {
        totalVolume += amt;
        paidCount++;
      } else {
        pendingVolume += amt;
        pendingCount++;
      }
    });

    return {
      totalVolume,
      paidCount,
      pendingCount,
      pendingVolume,
      totalCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setFromDate("");
    setToDate("");
    setPaymentMethodFilter("all");
    setPaymentStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== "" || fromDate !== "" || toDate !== "" || paymentMethodFilter !== "all" || paymentStatusFilter !== "all";

  // Paginated records
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;

  // CSV Export with exact amounts
  const exportToCsv = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = [
      "Transaction ID",
      "Order ID",
      "Customer Name",
      "Customer Phone",
      "Date",
      "Payment Method",
      "Exact Amount",
      "Payment Status",
      "Order Status"
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.paymentReference || t.transactionId || t._id.slice(-8).toUpperCase()}"`,
      `"${t.orderSerialNo || t.orderId || t._id.slice(-6).toUpperCase()}"`,
      `"${t.customerName || 'Customer'}"`,
      `"${t.customerPhone || 'N/A'}"`,
      `"${new Date(t.createdAt).toLocaleString()}"`,
      `"${formatPaymentMethod(t)}"`,
      resolveTransactionAmount(t),
      `"${t.paymentStatus === 'paid' ? 'Successful' : 'Pending'}"`,
      `"${t.orderStatus || 'N/A'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `errandshop_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transactions exported successfully");
  };

  return (
    <div className="pb-16 space-y-6">
      
      {/* Top Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
              Total Paid Volume
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#14142B] mt-1">
              {formatPrice(summaryMetrics.totalVolume)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 inline-block">
              ✓ {summaryMetrics.paidCount} successful payments
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Transactions Count */}
        <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
              Total Transactions
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#14142B] mt-1">
              {summaryMetrics.totalCount}
            </h3>
            <span className="text-[11px] text-[#6E7191] mt-0.5 inline-block">
              Recorded orders & checkouts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Volume */}
        <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
              Pending / Unpaid
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#14142B] mt-1">
              {formatPrice(summaryMetrics.pendingVolume)}
            </h3>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 inline-block">
              ⏳ {summaryMetrics.pendingCount} unpaid transactions
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Average Transaction Value */}
        <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
              Avg Paid Order
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#14142B] mt-1">
              {formatPrice(summaryMetrics.paidCount > 0 ? summaryMetrics.totalVolume / summaryMetrics.paidCount : 0)}
            </h3>
            <span className="text-[11px] text-blue-600 font-medium mt-0.5 inline-block">
              Per successful checkout
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Transactions Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6]">
        
        {/* Toolbar */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div>
            <h3 className="font-semibold text-lg text-[#14142B]">Transaction Ledger</h3>
            <p className="text-xs text-[#6E7191] mt-0.5">
              Live capturing of exact order totals, digital payments & POS checkout receipts.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <input 
                type="text" 
                placeholder="Search TXN, order or phone..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-64 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Toggle Button */}
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`h-10 px-3.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                showFilter || hasActiveFilters 
                  ? "border-primary text-primary bg-primary-light/10 font-bold" 
                  : "border-[#EFF0F6] bg-white text-[#6E7191] hover:bg-[#F7F7FC]"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            
            {/* CSV Export Button */}
            <button 
              onClick={exportToCsv}
              className="h-10 px-4 rounded-xl bg-[#008BBA] text-white flex items-center gap-2 hover:bg-[#00749b] transition-colors shadow-md shadow-[#008BBA]/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Payment Method</label>
              <select 
                value={paymentMethodFilter}
                onChange={(e) => { setPaymentMethodFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="paystack">Paystack (Online)</option>
                <option value="cod">Cash on Delivery</option>
                <option value="wallet">Digital Wallet</option>
                <option value="pos">POS (In-Store)</option>
                <option value="whatsapp">WhatsApp Order</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Payment Status</label>
              <select 
                value={paymentStatusFilter}
                onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Successful / Paid</option>
                <option value="unpaid">Pending / Unpaid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2">
                <button 
                  onClick={clearAllFilters}
                  className="h-9 px-4 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] hover:text-[#14142B] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Transaction ID / Ref</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Exact Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-[#6E7191]">
                    <div className="errandshop-loader mx-auto mb-3"></div>
                    Loading transaction records...
                  </td>
                </tr>
              ) : paginatedTransactions.map((txn) => {
                const exactAmount = resolveTransactionAmount(txn);
                const orderSerial = txn.orderSerialNo || txn.orderId || `#${txn._id.slice(-6).toUpperCase()}`;
                const rawTxnId = txn.paymentReference || txn.transactionId || txn._id.slice(-8).toUpperCase();
                const isPaid = txn.paymentStatus === "paid";

                return (
                  <tr key={txn._id} className="hover:bg-[#FAFAFC] transition-colors">
                    {/* Transaction Reference */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-primary font-mono" title={rawTxnId}>
                          {rawTxnId.length > 18 ? `${rawTxnId.slice(0, 16)}...` : rawTxnId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(rawTxnId, txn._id)}
                          className="text-[#A0A3BD] hover:text-primary transition-colors p-1"
                          title="Copy Transaction Reference"
                        >
                          {copiedId === txn._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setSelectedOrderId(txn._id); setIsDetailsOpen(true); }}
                        className="text-sm font-semibold text-[#14142B] hover:text-primary transition-colors"
                        title="View order details"
                      >
                        {orderSerial}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#14142B]">{txn.customerName || "Customer"}</div>
                      <div className="text-xs text-[#A0A3BD]">{txn.customerPhone || "N/A"}</div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#4E4B66]">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </span>
                      <span className="block text-[11px] text-[#A0A3BD]">
                        {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#14142B]">
                        {formatPaymentMethod(txn)}
                      </span>
                    </td>

                    {/* EXACT AMOUNT */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#14142B] font-mono">
                        {formatPrice(exactAmount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isPaid 
                          ? 'bg-[#E0FFED] text-[#1AB759] border border-[#1AB759]/20' 
                          : txn.paymentStatus === 'failed'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-[#FFF4E5] text-[#FF9F43] border border-[#FF9F43]/20'
                      }`}>
                        {isPaid ? 'Successful' : txn.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button 
                          onClick={() => { setSelectedOrderId(txn._id); setIsDetailsOpen(true); }}
                          className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] inline-flex items-center justify-center hover:bg-[#e5ebff] transition-colors cursor-pointer"
                          title="Quick View Order & Thermal Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a 
                          href={`/admin/orders/${txn._id}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#6E7191] inline-flex items-center justify-center hover:bg-slate-200 transition-colors"
                          title="Open Order in Dedicated Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-[#6E7191]">
                    <p className="text-sm font-semibold text-[#14142B]">No transactions found</p>
                    <p className="text-xs text-[#A0A3BD] mt-1">
                      {hasActiveFilters 
                        ? "Try clearing filters or changing your search criteria." 
                        : "Orders and payments processed across the storefront and POS will automatically appear here."}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination & Active Summary */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs sm:text-sm text-[#6E7191]">
            Showing <strong className="text-[#14142B]">{filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{" "}
            <strong className="text-[#14142B]">{Math.min(currentPage * pageSize, filteredTransactions.length)}</strong> of{" "}
            <strong className="text-[#14142B]">{filteredTransactions.length}</strong> transactions
            {hasActiveFilters && " (filtered)"}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-xs font-semibold text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === pageNum 
                        ? "bg-primary text-white shadow-sm shadow-primary/20" 
                        : "border border-[#EFF0F6] text-[#6E7191] hover:bg-[#F7F7FC]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-xs font-semibold text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Order Details & Receipt Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedOrderId(null); }}
        orderId={selectedOrderId}
        onOrderUpdated={fetchTransactions}
      />

    </div>
  );
}
