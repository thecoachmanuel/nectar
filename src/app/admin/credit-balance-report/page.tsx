"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Plus,
  Minus,
  Wallet
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import WalletAdjustmentModal from "@/components/admin/WalletAdjustmentModal";

export default function CreditBalanceReportPage() {
  const [showFilter, setShowFilter] = useState(false);

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wallet modal state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalAction, setModalAction] = useState<"add" | "deduct">("add");

  // Filters
  const [balanceStatus, setBalanceStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterPhone, setFilterPhone] = useState("");

  // Pagination (Mocked for now, but state can be added)
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [balanceStatus, searchTerm, page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/credit-balance-report?page=${page}`;
      if (balanceStatus !== "all") url += `&balanceStatus=${balanceStatus}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterName) url += `&name=${encodeURIComponent(filterName)}`;
      if (filterPhone) url += `&phone=${encodeURIComponent(filterPhone)}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.status) {
        setReports(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openWalletModal = (user: any, action: "add" | "deduct") => {
    setSelectedUser(user);
    setModalAction(action);
    setWalletModalOpen(true);
  };

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Credit Balance Report</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Customer..." 
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
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Customer Name</label>
              <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Phone</label>
              <input type="text" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Balance Status</label>
              <select 
                value={balanceStatus}
                onChange={(e) => setBalanceStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">All</option>
                <option value="has_balance">Has Balance</option>
                <option value="zero_balance">Zero Balance</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button onClick={fetchReports} className="h-10 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#e60060] transition-colors flex-1">Filter</button>
              <button onClick={() => {
                setBalanceStatus("all");
                setFilterName("");
                setFilterPhone("");
                setSearchTerm("");
                fetchReports(); // Trigger fetch directly since we bypass useEffect deps for some
              }} className="h-10 px-6 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors flex-1">Clear</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Balance</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#14142B]">{report.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{report.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{report.phone}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-bold ${report.walletBalance > 0 ? 'text-[#1AB759]' : 'text-[#6E7191]'}`}>
                      {formatPrice(report.walletBalance || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openWalletModal(report, "add")}
                        className="px-3 py-1.5 rounded-lg bg-[#E0FFED] text-[#1AB759] text-xs font-semibold hover:bg-[#c9fce0] transition-colors flex items-center gap-1 shadow-sm"
                        title="Add Credit"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Fund</span>
                      </button>
                      <button 
                        onClick={() => openWalletModal(report, "deduct")}
                        className="px-3 py-1.5 rounded-lg bg-[#FFF4E5] text-[#FF9F43] text-xs font-semibold hover:bg-[#ffead1] transition-colors flex items-center gap-1 shadow-sm"
                        title="Deduct Credit"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Deduct</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6E7191]">
                    {loading ? "Loading..." : "No customers found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {reports.length} entries</span>
        </div>

      </div>

      <WalletAdjustmentModal 
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        user={selectedUser}
        initialAction={modalAction}
        onSuccess={fetchReports}
      />

    </div>
  );
}
