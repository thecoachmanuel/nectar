"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Tag,
  Banknote,
  CreditCard,
  ShoppingBag
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

export default function SalesReportPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const { execute, data: orders, loading } = useApi();

  useEffect(() => {
    execute("/api/admin/orders");
  }, []);

  const filteredOrders = (orders || []).filter((o: any) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      (o.orderSerialNo && o.orderSerialNo.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q));

    let matchesDate = true;
    if (fromDate) {
      const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
      if (orderDate < fromDate) matchesDate = false;
    }
    if (toDate) {
      const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
      if (orderDate > toDate) matchesDate = false;
    }

    return matchesSearch && matchesDate;
  });

  const totalSales = filteredOrders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
  const totalDiscounts = filteredOrders.reduce((acc: number, o: any) => acc + Number(o.discountAmount || o.couponDiscount || 0), 0);
  const cashSales = filteredOrders
    .filter((o: any) => String(o.posPaymentMethod || o.paymentMethod || "").toLowerCase() === "cash")
    .reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
  const digitalSales = filteredOrders
    .filter((o: any) => {
      const m = String(o.posPaymentMethod || o.paymentMethod || "").toLowerCase();
      return m !== "cash" && m !== "";
    })
    .reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
  const totalOrders = filteredOrders.length;

  const exportToExcel = async () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      worksheet.columns = [
        { header: "Order ID", key: "orderSerialNo", width: 20 },
        { header: "Date", key: "date", width: 20 },
        { header: "Customer Name", key: "customerName", width: 25 },
        { header: "Products Count", key: "itemsCount", width: 15 },
        { header: "Subtotal", key: "subtotal", width: 16 },
        { header: "Discount", key: "discount", width: 16 },
        { header: "Total Amount", key: "totalAmount", width: 16 },
        { header: "Payment Method", key: "paymentMethod", width: 18 },
        { header: "Status", key: "status", width: 15 },
      ];

      filteredOrders.forEach((o: any) => {
        const discountVal = Number(o.discountAmount || o.couponDiscount || 0);
        const subtotalVal = o.subtotal || ((o.totalAmount || 0) + discountVal);
        const method = String(o.posPaymentMethod || o.paymentMethod || "CASH").toUpperCase();

        worksheet.addRow({
          orderSerialNo: o.orderSerialNo,
          date: new Date(o.createdAt).toLocaleDateString(),
          customerName: o.customerName || "Customer",
          itemsCount: o.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0,
          subtotal: formatPrice(subtotalVal),
          discount: discountVal > 0 ? `-${formatPrice(discountVal)}` : "₦0.00",
          totalAmount: formatPrice(o.totalAmount || 0),
          paymentMethod: method,
          status: o.orderStatus,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `SalesReport_${Date.now()}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success("Sales report exported successfully!");
    } catch (e: any) {
      toast.error("Excel export failed: " + e.message);
    }
  };

  return (
    <div className="pb-16 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div>
            <h3 className="font-bold text-xl text-[#14142B]">Sales & Revenue Report</h3>
            <p className="text-xs text-[#6E7191] mt-0.5">Track all online, POS, and storefront sales records with payment analytics</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order ID or Name..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs font-semibold focus:outline-none focus:border-primary w-full sm:w-56 transition-colors text-[#14142B]"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`h-10 px-3 rounded-xl border border-[#EFF0F6] flex items-center justify-center transition-colors ${
                showFilter ? "bg-primary text-white" : "bg-white text-[#6E7191] hover:bg-[#F7F7FC]"
              }`}
              title="Date filter"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button 
              onClick={exportToExcel}
              className="h-10 px-4 rounded-xl bg-[#008BBA] text-white flex items-center gap-2 hover:bg-[#00749b] transition-colors shadow-md shadow-[#008BBA]/20 font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC] grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs focus:outline-none focus:border-primary text-[#14142B]" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs focus:outline-none focus:border-primary text-[#14142B]" 
              />
            </div>
            <div className="flex items-end gap-2">
              <button 
                onClick={() => { setFromDate(""); setToDate(""); }}
                className="h-10 px-4 rounded-xl bg-gray-200 text-[#14142B] text-xs font-bold hover:bg-gray-300 transition-colors"
              >
                Reset Dates
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards with Cash vs Card Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC]">
          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">Total Gross Revenue</p>
              <h4 className="text-lg font-extrabold text-[#14142B]">{formatPrice(totalSales)}</h4>
              <span className="text-[10px] text-[#A0A3BD]">{totalOrders} completed orders</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E0FFED] flex items-center justify-center text-[#1AB759]">
              <span className="font-bold">₦</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">💵 Cash Sales</p>
              <h4 className="text-lg font-extrabold text-[#16A34A]">{formatPrice(cashSales)}</h4>
              <span className="text-[10px] text-[#A0A3BD]">In-store physical cash</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#16A34A]">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">💳 Card & Digital</p>
              <h4 className="text-lg font-extrabold text-[#7C3AED]">{formatPrice(digitalSales)}</h4>
              <span className="text-[10px] text-[#A0A3BD]">POS, Paystack & transfers</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[#7C3AED]">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">Discounts Given</p>
              <h4 className="text-lg font-extrabold text-[#FB4E4E]">-{formatPrice(totalDiscounts)}</h4>
              <span className="text-[10px] text-[#A0A3BD]">Coupons & POS discounts</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#FB4E4E]">
              <Tag className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Products</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Subtotal</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-green-600">Discount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Total Paid</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !orders ? (
                <tr><td colSpan={9} className="p-8 text-center text-[#6E7191]">Loading sales records...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-[#6E7191]">No sales orders found</td></tr>
              ) : (
                filteredOrders.map((report: any) => {
                  const discountVal = Number(report.discountAmount || report.couponDiscount || 0);
                  const subtotalVal = report.subtotal || ((report.totalAmount || 0) + discountVal);
                  const method = String(report.posPaymentMethod || report.paymentMethod || "cash").toLowerCase();

                  return (
                    <tr key={report._id} className="hover:bg-[#FAFAFC] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-primary font-mono">{report.orderSerialNo}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#4E4B66]">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#14142B]">{report.customerName || "Customer"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-[#14142B] px-2 py-0.5 rounded-lg bg-[#F7F7FC] border border-[#EFF0F6]">
                          {report.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0} items
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#4E4B66]">{formatPrice(subtotalVal)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {discountVal > 0 ? (
                          <span className="text-xs font-bold text-[#1AB759]">-{formatPrice(discountVal)}</span>
                        ) : (
                          <span className="text-xs text-[#A0A3BD]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-extrabold text-[#14142B]">
                          {formatPrice(report.totalAmount || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {method === "cash" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                            <Banknote className="w-3 h-3" />
                            <span>Cash</span>
                          </span>
                        ) : method === "card" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#F3E8FF] text-[#7C3AED]">
                            <CreditCard className="w-3 h-3" />
                            <span>Card</span>
                          </span>
                        ) : method === "mobile_banking" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#EBF3FF] text-[#2F80ED]">
                            <span>Transfer</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#F7F7FC] text-[#6E7191] uppercase">
                            <span>{method}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-[#E0FFED] text-[#1AB759]">
                          {report.orderStatus?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination footer */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between text-xs text-[#6E7191]">
          <span>Showing {filteredOrders.length} entries</span>
          <span className="font-semibold text-primary">Nectar Sales Reporting</span>
        </div>

      </div>

    </div>
  );
}
