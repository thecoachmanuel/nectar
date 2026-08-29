"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import CouponModal from "@/components/admin/CouponModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

export default function CouponsPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  
  const { execute, data: coupons, loading } = useApi();
  const { execute: deleteCoupon } = useApi();

  const fetchCoupons = () => {
    execute("/api/admin/coupons");
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAdd = () => {
    setSelectedCoupon(null);
    setIsModalOpen(true);
  };

  const handleEdit = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCoupon) {
      await deleteCoupon(`/api/admin/coupons/${selectedCoupon._id}`, {
        method: "DELETE",
        successMessage: "Coupon deleted",
      });
      fetchCoupons();
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Coupons</h3>
          
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
              <span className="text-sm font-medium">Add Coupon</span>
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
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Code</label>
              <input type="text" className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E7191] mb-1.5">Status</label>
              <select className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary">
                <option>-- Select --</option>
                <option>Active</option>
                <option>Expired</option>
              </select>
            </div>
            <div className="lg:col-span-1 flex items-center gap-3 pt-2">
              <button className="h-10 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#e60060] transition-colors">Search</button>
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
              {loading && !coupons ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              ) : coupons?.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#6E7191]">No coupons found</td></tr>
              ) : (
                coupons?.map((coupon: any) => (
                  <tr key={coupon._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#14142B]">{coupon.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">{coupon.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#14142B]">{coupon.discountType === 'percentage' ? `${coupon.discount}%` : `₦${coupon.discount}`}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66] capitalize">{coupon.discountType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">
                        {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.status ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                        {coupon.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(coupon)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#1AB759] flex items-center justify-center hover:bg-[#E0FFED] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(coupon)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors">
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
          <span className="text-sm text-[#6E7191]">Showing {coupons?.length || 0} entries</span>
        </div>

      </div>

      <CouponModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coupon={selectedCoupon}
        onSuccess={fetchCoupons}
      />

      <DeleteConfirmationModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

    </div>
  );
}
