import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useApi } from "@/hooks/useApi";
import { Eye, EyeOff } from "lucide-react";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  role: "admin" | "customer" | "chef" | "waiter" | "delivery_boy";
  onSuccess: () => void;
}

export default function UserModal({ isOpen, onClose, user, role, onSuccess }: UserModalProps) {
  const { execute, loading } = useApi();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: true,
    deliveryCommissionType: "fixed",
    deliveryCommissionValue: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "", // Don't populate password on edit
        status: user.status ?? true,
        deliveryCommissionType: user.deliveryCommissionType || "fixed",
        deliveryCommissionValue: user.deliveryCommissionValue || 0,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        status: true,
        deliveryCommissionType: "fixed",
        deliveryCommissionValue: 0,
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, role };
      if (user) {
        await execute(`/api/admin/users/${user._id}`, {
          method: "PUT",
          body: payload,
          successMessage: "User updated successfully",
        });
      } else {
        await execute(`/api/admin/users`, {
          method: "POST",
          body: payload,
          successMessage: "User created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      // Error handled by useApi hook (toast)
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={user ? "Edit User" : "Add New User"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-[#14142B] mb-1">Email <span className="text-red-500">*</span></label>
          <input 
            type="email" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">Phone</label>
          <input 
            type="text" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#14142B] mb-1">
            Password {user ? "(Leave blank to keep unchanged)" : <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              required={!user}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full h-11 pl-4 pr-12 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
            Active Account
          </label>
        </div>

        {role === "delivery_boy" && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-[#14142B] mb-1">Commission Type</label>
              <select 
                value={formData.deliveryCommissionType}
                onChange={(e) => setFormData({...formData, deliveryCommissionType: e.target.value})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors bg-white"
              >
                <option value="fixed">Fixed (₦)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#14142B] mb-1">Value</label>
              <input 
                type="number" 
                value={formData.deliveryCommissionValue}
                onChange={(e) => setFormData({...formData, deliveryCommissionValue: Number(e.target.value)})}
                className="w-full h-11 px-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

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
