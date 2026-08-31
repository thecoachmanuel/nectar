import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useApi } from "@/hooks/useApi";
import { Sparkles, Truck, Users, Lock, Calendar } from "lucide-react";

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
    oneTimePerUser: false,
    onlyForNewCustomers: false,
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
        limitPerUser: coupon.limitPerUser || (coupon.oneTimePerUser ? 1 : 1),
        oneTimePerUser: coupon.oneTimePerUser ?? (coupon.limitPerUser === 1),
        onlyForNewCustomers: coupon.onlyForNewCustomers ?? false,
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
        oneTimePerUser: false,
        onlyForNewCustomers: false,
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
      const payload = {
        ...formData,
        discount: formData.discountType === "free_delivery" ? 0 : Number(formData.discount),
        limitPerUser: formData.oneTimePerUser ? 1 : Number(formData.limitPerUser) || 1,
      };

      if (coupon) {
        await execute(`/api/admin/coupons/${coupon._id}`, {
          method: "PUT",
          body: payload,
          successMessage: "Coupon updated successfully",
        });
      } else {
        await execute(`/api/admin/coupons`, {
          method: "POST",
          body: payload,
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
        {/* Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">Coupon Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder="e.g. Free Delivery Weekend / 10% Off"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">Coupon Code <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder="e.g. FREEDELIVERY / WELCOME10"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '')})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors uppercase font-mono font-bold text-sm"
            />
          </div>
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">Discount Type</label>
            <select 
              value={formData.discountType}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({
                  ...formData, 
                  discountType: newType,
                  discount: newType === "free_delivery" ? 0 : formData.discount
                });
              }}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white font-medium text-sm"
            >
              <option value="percentage">Percentage (%) Discount</option>
              <option value="fixed">Fixed Amount (₦) Discount</option>
              <option value="free_delivery">🚚 Free Delivery (100% Free Shipping)</option>
            </select>
          </div>

          {formData.discountType === "free_delivery" ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
              <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-semibold">100% Free Delivery</strong>
                <span>Waives delivery fee for the customer on checkout.</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-[#14142B] mb-1">
                {formData.discountType === "percentage" ? "Discount Percentage (%)" : "Discount Amount (₦)"} <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                placeholder={formData.discountType === "percentage" ? "e.g. 10" : "e.g. 1000"}
                value={formData.discount}
                onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-semibold"
              />
            </div>
          )}
        </div>

        {/* Min Order & Max Discount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">Min. Order Subtotal (₦)</label>
            <input 
              type="number" 
              min="0"
              placeholder="0 for no minimum"
              value={formData.minimumOrderAmount}
              onChange={(e) => setFormData({...formData, minimumOrderAmount: Number(e.target.value)})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          {formData.discountType === "percentage" ? (
            <div>
              <label className="block text-sm font-semibold text-[#14142B] mb-1">Max. Discount Cap (₦)</label>
              <input 
                type="number" 
                min="0"
                placeholder="0 for no maximum"
                value={formData.maximumDiscount}
                onChange={(e) => setFormData({...formData, maximumDiscount: Number(e.target.value)})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-[#14142B] mb-1">Total Limit (Across all users)</label>
              <input 
                type="number" 
                min="1"
                value={formData.totalLimit}
                onChange={(e) => setFormData({...formData, totalLimit: Number(e.target.value)})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          )}
        </div>

        {/* Audience & Usage Restrictions */}
        <div className="p-4 bg-[#FAFAFC] rounded-xl border border-[#EFF0F6] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7191]">Audience & Eligibility Rules</h4>

          {/* New Customers Only Toggle */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <label htmlFor="onlyForNewCustomers" className="text-sm font-semibold text-[#14142B] cursor-pointer">
                  New Customers Only
                </label>
                <p className="text-xs text-[#6E7191]">
                  Available exclusively to first-time shoppers with 0 previous orders.
                </p>
              </div>
            </div>
            <input 
              type="checkbox" 
              id="onlyForNewCustomers" 
              checked={formData.onlyForNewCustomers}
              onChange={(e) => setFormData({...formData, onlyForNewCustomers: e.target.checked})}
              className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer mt-0.5"
            />
          </div>

          {/* One-Time Use Per User Toggle */}
          <div className="flex items-start justify-between gap-3 pt-2 border-t border-[#EFF0F6]">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <label htmlFor="oneTimePerUser" className="text-sm font-semibold text-[#14142B] cursor-pointer">
                  One-Time Use Per User
                </label>
                <p className="text-xs text-[#6E7191]">
                  Each customer account / phone number can only use this coupon once.
                </p>
              </div>
            </div>
            <input 
              type="checkbox" 
              id="oneTimePerUser" 
              checked={formData.oneTimePerUser}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData({
                  ...formData, 
                  oneTimePerUser: checked,
                  limitPerUser: checked ? 1 : formData.limitPerUser
                });
              }}
              className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer mt-0.5"
            />
          </div>

          {/* If NOT one-time, allow setting max usage per user */}
          {!formData.oneTimePerUser && (
            <div className="pt-2 border-t border-[#EFF0F6] flex items-center justify-between">
              <label className="text-xs font-semibold text-[#14142B]">Max Uses Per Customer</label>
              <input 
                type="number" 
                min="1"
                value={formData.limitPerUser}
                onChange={(e) => setFormData({...formData, limitPerUser: Number(e.target.value)})}
                className="w-24 h-9 px-3 rounded-lg border border-[#EFF0F6] text-sm text-right focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Validity Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">Start Date <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              required
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">End Date <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              required
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="status" 
            checked={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.checked})}
            className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer"
          />
          <label htmlFor="status" className="text-sm font-semibold text-[#14142B] cursor-pointer">
            Coupon Active Status
          </label>
        </div>

        {/* Form Actions */}
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
            {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Save Coupon"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
