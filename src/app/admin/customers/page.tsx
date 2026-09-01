"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2, Wallet, RefreshCw } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import UserModal from "@/components/admin/UserModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";
import WalletAdjustmentModal from "@/components/admin/WalletAdjustmentModal";
import { formatPrice } from "@/lib/formatters";

export default function CustomersPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Wallet modal state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTargetUser, setWalletTargetUser] = useState<any>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const { execute, data: users, loading } = useApi();
  const { execute: deleteUser } = useApi();

  const fetchUsers = () => {
    execute("/api/admin/users?role=customer");
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleOpenWallet = (user: any) => {
    setWalletTargetUser(user);
    setIsWalletModalOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      await deleteUser(`/api/admin/users/${selectedUser._id}`, {
        method: "DELETE",
        successMessage: "Customer deleted",
      });
      fetchUsers();
    }
  };

  // Filtered customer list
  const filteredUsers = (users || []).filter((u: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));
      if (!match) return false;
    }
    if (filterName && (!u.name || !u.name.toLowerCase().includes(filterName.toLowerCase()))) return false;
    if (filterEmail && (!u.email || !u.email.toLowerCase().includes(filterEmail.toLowerCase()))) return false;
    if (filterPhone && (!u.phone || !u.phone.includes(filterPhone))) return false;
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      if (u.status !== isActive) return false;
    }
    return true;
  });

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-[#14142B]">Customers</h3>
            <button 
              onClick={fetchUsers}
              className="p-1.5 rounded-lg border border-[#EFF0F6] text-[#6E7191] hover:bg-[#F7F7FC] transition-colors"
              title="Refresh customer list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search name, phone, email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-60 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`h-10 px-3 rounded-xl border border-[#EFF0F6] flex items-center justify-center transition-colors ${
                showFilter ? "bg-primary text-white border-primary" : "bg-white text-[#6E7191] hover:bg-[#F7F7FC]"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button 
              onClick={handleAdd}
              className="h-10 px-4 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Customer</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="p-4 sm:p-6 border-b border-[#EFF0F6] bg-[#FAFAFC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Name</label>
              <input 
                type="text" 
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Filter by name"
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Email</label>
              <input 
                type="email" 
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                placeholder="Filter by email"
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Phone</label>
              <input 
                type="text" 
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                placeholder="Filter by phone"
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Status</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Wallet Balance</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !users ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">Loading customers...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">No customers found</td></tr>
              ) : (
                filteredUsers.map((user: any) => {
                  const bal = Number(user.walletBalance || 0);
                  return (
                    <tr key={user._id} className="hover:bg-[#FAFAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.image || "/images/default/user.png"} 
                            alt="User" 
                            className="w-10 h-10 rounded-full object-cover border border-[#EFF0F6]" 
                            onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/user.png"; }}
                          />
                          <span className="text-sm font-semibold text-[#14142B]">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#4E4B66]">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#4E4B66]">{user.phone || "-"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${bal > 0 ? "text-[#1AB759]" : "text-[#6E7191]"}`}>
                          {formatPrice(bal)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                          {user.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenWallet(user)} 
                            className="h-8 px-2.5 rounded-lg bg-[#EBF8FF] text-[#008BBA] hover:bg-[#d9f2fd] transition-colors flex items-center gap-1.5 text-xs font-semibold"
                            title="Fund or Deduct Wallet"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Wallet</span>
                          </button>
                          <button 
                            onClick={() => handleEdit(user)} 
                            className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#1AB759] flex items-center justify-center hover:bg-[#E0FFED] transition-colors"
                            title="Edit Customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(user)} 
                            className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {filteredUsers.length} entries</span>
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        role="customer"
        onSuccess={fetchUsers}
      />

      <WalletAdjustmentModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        user={walletTargetUser}
        initialAction="add"
        onSuccess={fetchUsers}
      />

      <DeleteConfirmationModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

    </div>
  );
}
