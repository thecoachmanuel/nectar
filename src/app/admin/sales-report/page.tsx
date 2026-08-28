"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Calendar
} from "lucide-react";

export default function SalesReportPage() {
  const [showFilter, setShowFilter] = useState(false);

  // Mock data
  const reports = [
    { id: 1, orderId: "#10045", date: "Oct 12, 2026", customer: "John Doe", items: 2, total: "₦5,500", status: "Delivered" },
    { id: 2, orderId: "#10044", date: "Oct 11, 2026", customer: "Jane Smith", items: 1, total: "₦2,000", status: "Delivered" },
    { id: 3, orderId: "#10043", date: "Oct 11, 2026", customer: "Walk-in", items: 4, total: "₦8,500", status: "Delivered" },
  ];

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Sales Report</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Order ID..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-[#ff006b] w-full sm:w-48 transition-colors"
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
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">From Date</label>
              <div className="relative">
                <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <div className="relative">
                <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Customer</label>
              <input type="text" placeholder="Name or Phone" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button className="h-10 px-6 rounded-xl bg-[#ff006b] text-white text-sm font-medium hover:bg-[#e60060] transition-colors flex-1">Filter</button>
              <button className="h-10 px-6 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors flex-1">Clear</button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC]">
          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">Total Sales</p>
              <h4 className="text-lg font-bold text-[#14142B]">₦16,000</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E0FFED] flex items-center justify-center text-[#1AB759]">
              <span className="font-bold">₦</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">Total Orders</p>
              <h4 className="text-lg font-bold text-[#14142B]">3</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#e5ebff] flex items-center justify-center text-[#567DFF]">
              <span className="font-bold">#</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">Items Sold</p>
              <h4 className="text-lg font-bold text-[#14142B]">7</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#fff5f9] flex items-center justify-center text-[#ff006b]">
              <span className="font-bold">x</span>
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
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#ff006b]">{report.orderId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{report.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#14142B]">{report.customer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-[#14142B]">{report.items}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#14142B]">{report.total}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E0FFED] text-[#1AB759]">
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing 1 to 3 of 3 entries</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">«</button>
            <button className="w-8 h-8 rounded-lg bg-[#ff006b] text-white flex items-center justify-center text-sm font-medium shadow-md shadow-[#ff006b]/20">1</button>
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">»</button>
          </div>
        </div>

      </div>

    </div>
  );
}
