"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Printer,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Pending", "Accept", "Preparing", "Prepared", "Out for Delivery", "Delivered", "Canceled", "Rejected", "Returned"];

  // Mock data
  const orders = [
    { id: "#10045", customer: "John Doe", amount: "₦5,500", type: "Delivery", date: "Oct 12, 2026, 14:30", status: "Pending" },
    { id: "#10044", customer: "Jane Smith", amount: "₦2,000", type: "Takeaway", date: "Oct 12, 2026, 14:15", status: "Preparing" },
    { id: "#10043", customer: "Guest User", amount: "₦8,500", type: "Delivery", date: "Oct 12, 2026, 13:50", status: "Out for Delivery" },
    { id: "#10042", customer: "Alice Johnson", amount: "₦1,500", type: "Takeaway", date: "Oct 12, 2026, 12:10", status: "Delivered" },
    { id: "#10041", customer: "Bob Brown", amount: "₦4,200", type: "Delivery", date: "Oct 12, 2026, 11:30", status: "Canceled" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-[#FFF6E6] text-[#FFB020]";
      case "Preparing": return "bg-[#e5ebff] text-[#567DFF]";
      case "Out for Delivery": return "bg-[#E9F9FF] text-[#008BBA]";
      case "Delivered": return "bg-[#EBE7FF] text-[#8262FE]";
      case "Canceled": return "bg-[#FFEAEA] text-[#FB4E4E]";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Online Orders</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by Order ID..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-[#ff006b] w-full sm:w-64 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#EFF0F6] overflow-x-auto hide-scrollbar">
          <div className="flex px-4 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab 
                    ? "border-[#ff006b] text-[#ff006b]" 
                    : "border-transparent text-[#6E7191] hover:text-[#14142B]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#ff006b]">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#14142B]">{order.customer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-[#14142B]">{order.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{order.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{order.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#14142B] flex items-center justify-center hover:bg-[#e2e2ec] transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] flex items-center justify-center hover:bg-[#e5ebff] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing 1 to 5 of 5 entries</span>
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
