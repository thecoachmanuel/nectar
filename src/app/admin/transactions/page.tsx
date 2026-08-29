"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Download,
  Eye
} from "lucide-react";

export default function TransactionsPage() {
  const [showFilter, setShowFilter] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.status) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Transactions</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Transaction ID..." 
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
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">From Date</label>
              <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">To Date</label>
              <input type="date" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Payment Method</label>
              <select className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary">
                <option>All</option>
                <option>Paystack</option>
                <option>Cash on Delivery</option>
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
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {transactions.map((txn) => (
                <tr key={txn._id} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-primary">{txn._id.slice(-8).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#14142B]">{txn.orderId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{new Date(txn.createdAt).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{txn.paymentType === 'cod' ? 'Cash on Delivery' : 'Digital Payment'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#14142B]">₦{txn.total}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${txn.paymentStatus === 'paid' ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFF4E5] text-[#FF9F43]'}`}>
                      {txn.paymentStatus === 'paid' ? 'Successful' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/admin/orders/${txn._id}`} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] inline-flex items-center justify-center hover:bg-[#e5ebff] transition-colors">
                      <Eye className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6E7191]">
                    {loading ? "Loading..." : "No transactions found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing 1 to 2 of 2 entries</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">«</button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium shadow-md shadow-primary/20">1</button>
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">»</button>
          </div>
        </div>

      </div>

    </div>
  );
}
