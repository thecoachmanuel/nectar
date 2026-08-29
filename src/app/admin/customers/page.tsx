"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import UserModal from "@/components/admin/UserModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

export default function CustomersPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
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

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Customers</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
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
              <input type="text" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Email</label>
              <input type="email" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Phone</label>
              <input type="text" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Status</label>
              <select className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary">
                <option>-- Select --</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !users ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              ) : users?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#6E7191]">No customers found</td></tr>
              ) : (
                users?.map((user: any) => (
                  <tr key={user._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.image || "/images/default/user.png"} alt="User" className="w-10 h-10 rounded-full object-cover border border-[#EFF0F6]" />
                        <span className="text-sm font-medium text-[#14142B]">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">{user.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">{user.phone || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                        {user.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(user)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#1AB759] flex items-center justify-center hover:bg-[#E0FFED] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(user)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {users?.length || 0} entries</span>
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        role="customer"
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
