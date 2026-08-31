"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Package,
  TrendingUp,
  ShoppingBag,
  Layers
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import ExcelJS from "exceljs";
import { toast } from "sonner";

export default function ItemsReportPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/items");
      const data = await res.json();
      if (data.status) {
        setReports(data.data || []);
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (e: any) {
      toast.error("Failed to load items report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalUnitsSold = reports.reduce((sum, item) => sum + (item.quantitySold || 0), 0);
  const totalItemRevenue = reports.reduce((sum, item) => sum + (item.revenue || 0), 0);

  const exportToExcel = async () => {
    if (!filteredReports || filteredReports.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Products Report");

      worksheet.columns = [
        { header: "Product Name", key: "name", width: 30 },
        { header: "Store", key: "store", width: 20 },
        { header: "Category", key: "category", width: 20 },
        { header: "Unit Price", key: "price", width: 15 },
        { header: "Quantity Sold", key: "quantitySold", width: 15 },
        { header: "Total Revenue", key: "revenue", width: 20 },
      ];

      filteredReports.forEach((item: any) => {
        worksheet.addRow({
          name: item.name,
          store: item.store || "-",
          category: item.category || "-",
          price: `₦${(item.price || 0).toLocaleString()}`,
          quantitySold: item.quantitySold,
          revenue: `₦${(item.revenue || 0).toLocaleString()}`,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ProductsReport_${Date.now()}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success("Products report exported successfully!");
    } catch (e: any) {
      toast.error("Excel export failed: " + e.message);
    }
  };

  return (
    <div className="pb-16 space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#14142B] mb-1">Products Performance Report</h2>
        <p className="text-sm text-[#6E7191]">Track sales volume, quantities sold, and total revenue across all catalog products.</p>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFF0F6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Catalog Products</p>
            <h3 className="text-xl font-bold text-[#14142B]">{reports.length} Products</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFF0F6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Total Units Sold</p>
            <h3 className="text-xl font-bold text-[#14142B]">{totalUnitsSold.toLocaleString()} Units</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFF0F6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Total Products Sales</p>
            <h3 className="text-xl font-bold text-[#14142B]">₦{totalItemRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6]">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Products Sales Breakdown</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Product or Category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-60 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              type="button"
              onClick={() => setShowFilter(!showFilter)}
              className={`h-10 px-3 rounded-xl border border-[#EFF0F6] text-[#6E7191] flex items-center justify-center transition-colors ${showFilter ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-[#F7F7FC]'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button 
              type="button"
              onClick={exportToExcel}
              className="h-10 px-4 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="All">All Categories</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button 
                type="button" 
                onClick={() => { setSelectedCategory("All"); setSearchTerm(""); }}
                className="h-10 px-4 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Product Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Store</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Unit Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Units Sold</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">Loading products report...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">No products matching your criteria</td></tr>
              ) : (
                filteredReports.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#14142B]">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">{item.store || "Main Store"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {item.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-[#4E4B66]">₦{(item.price || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-semibold ${item.quantitySold > 0 ? 'text-[#1AB759]' : 'text-slate-400'}`}>
                        {item.quantitySold}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${item.revenue > 0 ? 'text-[#14142B]' : 'text-slate-400'}`}>
                        ₦{(item.revenue || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination / Summary Footer */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {filteredReports.length} of {reports.length} entries</span>
        </div>

      </div>

    </div>
  );
}
