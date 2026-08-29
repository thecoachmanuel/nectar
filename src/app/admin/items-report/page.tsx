"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import ExcelJS from "exceljs";
import { toast } from "sonner";

export default function ItemsReportPage() {
  const [showFilter, setShowFilter] = useState(false);

  const { execute, data: orders, loading } = useApi();

  useEffect(() => {
    execute("/api/admin/orders");
  }, []);

  // Aggregate item sales
  const itemMap: Record<string, any> = {};
  orders?.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const key = item.itemId;
      if (!itemMap[key]) {
        itemMap[key] = {
          id: key,
          name: item.name,
          category: "-", // Note: Category would need to be populated on orders or cross-referenced with Items
          quantitySold: 0,
          revenue: 0,
        };
      }
      itemMap[key].quantitySold += (item.quantity || 1);
      itemMap[key].revenue += (item.itemTotal || item.price * (item.quantity || 1));
    });
  });

  const reports = Object.values(itemMap).sort((a: any, b: any) => b.quantitySold - a.quantitySold);

  const exportToExcel = async () => {
    if (!reports || reports.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Items Report");

      worksheet.columns = [
        { header: "Item Name", key: "name", width: 30 },
        { header: "Category", key: "category", width: 20 },
        { header: "Quantity Sold", key: "quantitySold", width: 15 },
        { header: "Total Revenue", key: "revenue", width: 20 },
      ];

      reports.forEach((item: any) => {
        worksheet.addRow({
          name: item.name,
          category: item.category,
          quantitySold: item.quantitySold,
          revenue: `₦${item.revenue.toLocaleString()}`,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ItemsReport_${Date.now()}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success("Items report exported successfully!");
    } catch (e: any) {
      toast.error("Excel export failed: " + e.message);
    }
  };

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
            
            <button 
              onClick={exportToExcel}
              className="h-10 px-4 rounded-xl bg-[#008BBA] text-white flex items-center gap-2 hover:bg-[#00749b] transition-colors shadow-md shadow-[#008BBA]/20"
            >
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
                <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <div className="relative">
                <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Category</label>
              <select className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary">
                <option>All Categories</option>
                <option>Main Course</option>
                <option>Fast Food</option>
                <option>Beverages</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button className="h-10 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#e60060] transition-colors flex-1">Filter</button>
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
              {loading && !orders ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#6E7191]">No items found</td></tr>
              ) : (
                reports.map((report: any) => (
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
                      <span className="text-sm font-bold text-[#14142B]">₦{report.revenue.toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {reports.length} entries</span>
        </div>

      </div>

    </div>
  );
}
