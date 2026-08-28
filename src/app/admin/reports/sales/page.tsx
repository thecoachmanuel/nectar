"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettingStore } from "@/store/useSettingStore";
import { ArrowLeft, Download, FileText, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function SalesReportPage() {
  const { formatPrice, activeStore } = useSettingStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [activeStore]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = "/api/frontend/orders?";
      if (activeStore && activeStore._id) {
        url += `storeId=${activeStore._id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.status) {
        setOrders(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalTax = orders.reduce((acc, o) => acc + (o.taxAmount || 0), 0);

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      worksheet.columns = [
        { header: "Order Serial No", key: "orderSerialNo", width: 20 },
        { header: "Customer Name", key: "customerName", width: 25 },
        { header: "Order Type", key: "orderType", width: 15 },
        { header: "Payment Method", key: "paymentMethod", width: 20 },
        { header: "Payment Status", key: "paymentStatus", width: 15 },
        { header: "Total Amount", key: "totalAmount", width: 15 },
        { header: "Date", key: "createdAt", width: 20 },
      ];

      orders.forEach((o) => {
        worksheet.addRow({
          orderSerialNo: o.orderSerialNo,
          customerName: o.customerName,
          orderType: o.orderType,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          totalAmount: o.totalAmount,
          createdAt: new Date(o.createdAt).toLocaleDateString(),
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

      toast.success("Sales report exported to Excel XLSX!");
    } catch (e: any) {
      toast.error("Excel export failed: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/admin/dashboard" className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-extrabold text-base text-white">Sales & Financial Reports</h1>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold">
          <button
            onClick={exportToExcel}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow"
          >
            <Download className="w-4 h-4" />
            <span>Export XLSX</span>
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Report Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Gross Sales</span>
            <p className="text-2xl font-black text-emerald-400">{formatPrice(totalSales)}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
            <p className="text-2xl font-black text-white">{orders.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Tax Collected</span>
            <p className="text-2xl font-black text-cyan-400">{formatPrice(totalTax)}</p>
          </div>
        </div>

        {/* Detailed Sales Orders Table */}
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base border-b border-slate-700 pb-3">
            Sales Ledger Breakdown
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading report data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300">
                <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Serial No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Gateway</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-3 font-bold text-white">{o.orderSerialNo}</td>
                      <td className="py-3 px-3">{o.customerName}</td>
                      <td className="py-3 px-3 uppercase text-emerald-400">{o.paymentMethod}</td>
                      <td className="py-3 px-3 uppercase font-bold">{o.paymentStatus}</td>
                      <td className="py-3 px-3 text-right font-black text-white">
                        {formatPrice(o.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
