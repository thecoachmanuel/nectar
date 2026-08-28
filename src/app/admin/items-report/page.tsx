"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Download
} from "lucide-react";

export default function ItemsReportPage() {
  const [showFilter, setShowFilter] = useState(false);

  // Mock data
  const reports = [
    { id: 1, name: "Chicken Biryani", category: "Main Course", quantitySold: 120, revenue: "₦420,000" },
    { id: 2, name: "Beef Burger", category: "Fast Food", quantitySold: 85, revenue: "₦170,000" },
    { id: 3, name: "Coca Cola", category: "Beverages", quantitySold: 200, revenue: "₦100,000" },
    { id: 4, name: "Vanilla Ice Cream", category: "Dessert", quantitySold: 50, revenue: "₦75,000" },
  ];

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Items Report</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Item..." 
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
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Category</label>
              <select className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]">
                <option>All Categories</option>
                <option>Main Course</option>
                <option>Fast Food</option>
                <option>Beverages</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button className="h-10 px-6 rounded-xl bg-[#ff006b] text-white text-sm font-medium hover:bg-[#e60060] transition-colors flex-1">Filter</button>
              <button className="h-10 px-6 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors flex-1">Clear</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Quantity Sold</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#14142B]">{report.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{report.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-[#1AB759]">{report.quantitySold}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-[#14142B]">{report.revenue}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing 1 to 4 of 4 entries</span>
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
