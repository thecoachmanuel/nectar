import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useApi } from "@/hooks/useApi";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: any;
  onSuccess: () => void;
}

export default function CouponModal({ isOpen, onClose, coupon, onSuccess }: CouponModalProps) {
  const { execute, loading } = useApi();
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    discountType: "percentage",
    discount: 0,
    minimumOrderAmount: 0,
    maximumDiscount: 0,
    limitPerUser: 1,
    totalLimit: 1000,
    startDate: "",
    endDate: "",
    status: true,
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        name: coupon.name || "",
        code: coupon.code || "",
        discountType: coupon.discountType || "percentage",
        discount: coupon.discount || 0,
        minimumOrderAmount: coupon.minimumOrderAmount || 0,
        maximumDiscount: coupon.maximumDiscount || 0,
        limitPerUser: coupon.limitPerUser || 1,
        totalLimit: coupon.totalLimit || 1000,
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : "",
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : "",
        status: coupon.status ?? true,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        discountType: "percentage",
        discount: 0,
        minimumOrderAmount: 0,
        maximumDiscount: 0,
        limitPerUser: 1,
        totalLimit: 1000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: true,
      });
    }
  }, [coupon, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (coupon) {
        await execute(`/api/admin/coupons/${coupon._id}`, {
          method: "PUT",
          body: formData,
          successMessage: "Coupon updated successfully",
        });
      } else {
        await execute(`/api/admin/coupons`, {
          method: "POST",
          body: formData,
          successMessage: "Coupon created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      // Error handled by useApi hook
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={coupon ? "Edit Coupon" : "Add New Coupon"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Code <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Discount Type</label>
            <select 
              value={formData.discountType}
              onChange={(e) => setFormData({...formData, discountType: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₦)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Discount Value <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              value={formData.discount}
              onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Min Order Amount (₦)</label>
            <input 
              type="number" 
              min="0"
              value={formData.minimumOrderAmount}
              onChange={(e) => setFormData({...formData, minimumOrderAmount: Number(e.target.value)})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Max Discount (₦)</label>
            <input 
              type="number" 
              min="0"
              value={formData.maximumDiscount}
              onChange={(e) => setFormData({...formData, maximumDiscount: Number(e.target.value)})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">Start Date <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              required
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#14142B] mb-1">End Date <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              required
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="status" 
            checked={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.checked})}
            className="w-4 h-4 text-primary rounded focus:ring-[#ff006b]"
          />
          <label htmlFor="status" className="text-sm font-medium text-[#14142B] cursor-pointer">
            Active Status
          </label>
        </div>

        <div className="pt-4 border-t border-[#EFF0F6] flex justify-end gap-3 mt-6">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 h-11 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-medium hover:bg-[#F7F7FC] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 h-11 rounded-xl bg-primary text-white font-medium hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center min-w-[120px] disabled:opacity-70"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
