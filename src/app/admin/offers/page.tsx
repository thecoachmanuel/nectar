"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit,
  Trash2,
  Eye
} from "lucide-react";

export default function OffersPage() {
  const [showFilter, setShowFilter] = useState(false);

  // Mock data
  const offers = [
    { id: 1, name: "Summer Discount", code: "SUMMER20", discount: "20%", type: "Percentage", validity: "2026-10-30", status: "Active" },
    { id: 2, name: "Welcome Bonus", code: "WELCOME500", discount: "₦500", type: "Fixed", validity: "2026-12-31", status: "Active" },
    { id: 3, name: "Flash Sale", code: "FLASH", discount: "50%", type: "Percentage", validity: "2026-10-15", status: "Inactive" },
  ];

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Offers</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
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
            
            <button className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors">
              <Download className="w-4 h-4" />
            </button>
            
            <button className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors">
              <Upload className="w-4 h-4" />
            </button>

            <button className="h-10 px-4 rounded-xl bg-[#ff006b] text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Offer</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Name</label>
              <input type="text" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Code</label>
              <input type="text" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Status</label>
              <select className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]">
                <option>-- Select --</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="lg:col-span-1 flex items-center gap-3 pt-2">
              <button className="h-10 px-6 rounded-xl bg-[#ff006b] text-white text-sm font-medium hover:bg-[#e60060] transition-colors">Search</button>
              <button className="h-10 px-6 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors">Clear</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Validity</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#14142B]">{offer.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#ff006b]">{offer.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-[#14142B]">{offer.discount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{offer.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{offer.validity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${offer.status === 'Active' ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] flex items-center justify-center hover:bg-[#e5ebff] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#1AB759] flex items-center justify-center hover:bg-[#E0FFED] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors">
                        <Trash2 className="w-4 h-4" />
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
