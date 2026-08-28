"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import ExcelJS from "exceljs";
import { toast } from "sonner";

export default function SalesReportPage() {
  const [showFilter, setShowFilter] = useState(false);
  
  const { execute, data: orders, loading } = useApi();

  useEffect(() => {
    execute("/api/admin/orders");
  }, []);

  const totalSales = orders?.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalItems = orders?.reduce((acc: number, o: any) => {
    return acc + (o.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0);
  }, 0) || 0;

  const exportToExcel = async () => {
    if (!orders || orders.length === 0) {
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
        { header: "Items Count", key: "itemsCount", width: 15 },
        { header: "Total Amount", key: "totalAmount", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ];

      orders.forEach((o: any) => {
        worksheet.addRow({
          orderSerialNo: o.orderSerialNo,
          date: new Date(o.createdAt).toLocaleDateString(),
          customerName: o.customerName,
          itemsCount: o.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0,
          totalAmount: `₦${(o.totalAmount || 0).toLocaleString()}`,
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
              <h4 className="text-lg font-bold text-[#14142B]">₦{totalSales.toLocaleString()}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E0FFED] flex items-center justify-center text-[#1AB759]">
              <span className="font-bold">₦</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">Total Orders</p>
              <h4 className="text-lg font-bold text-[#14142B]">{totalOrders}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#e5ebff] flex items-center justify-center text-[#567DFF]">
              <span className="font-bold">#</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#EFF0F6] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1">Items Sold</p>
              <h4 className="text-lg font-bold text-[#14142B]">{totalItems}</h4>
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
              {loading && !orders ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              ) : orders?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">No orders found</td></tr>
              ) : (
                orders?.map((report: any) => (
                  <tr key={report._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#ff006b]">{report.orderSerialNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#14142B]">{report.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#14142B]">
                        {report.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#14142B]">
                        ₦{(report.totalAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-[#E0FFED] text-[#1AB759]">
                        {report.orderStatus?.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {orders?.length || 0} entries</span>
        </div>

      </div>

    </div>
  );
}
