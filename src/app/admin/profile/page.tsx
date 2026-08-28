"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Lock,
  Camera,
  Save
} from "lucide-react";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@foodappi.com",
    phone: "+234 800 000 0000",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Profile updated successfully!");
    }, 1000);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    
    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Password changed successfully!");
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 1000);
  };

  return (
    <div className="pb-16 max-w-4xl">
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#14142B] mb-1">My Profile</h2>
        <p className="text-sm text-[#6E7191]">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Basic Info Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-[#F7F7FC] border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                <img src="/images/default/user.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#ff006b] rounded-full text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-[#e60060] transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-[#14142B]">{formData.firstName} {formData.lastName}</h3>
            <p className="text-sm text-[#6E7191] font-medium mb-1">Administrator</p>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E0FFED] text-[#1AB759]">
              Active
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* General Information Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[#EFF0F6]">
              <h3 className="font-semibold text-lg text-[#14142B]">General Information</h3>
            </div>
            <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">First Name</label>
                  <div className="relative">
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b]" />
                    <User className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Last Name</label>
                  <div className="relative">
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b]" />
                    <User className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Email Address</label>
                  <div className="relative">
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b]" />
                    <Mail className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Phone Number</label>
                  <div className="relative">
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b]" />
                    <Phone className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isLoading} className="h-11 px-6 rounded-xl bg-[#ff006b] text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">Update Profile</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[#EFF0F6]">
              <h3 className="font-semibold text-lg text-[#14142B]">Change Password</h3>
            </div>
            <form onSubmit={handleSavePassword} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Current Password</label>
                <div className="relative">
                  <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b]" />
                  <Lock className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">New Password</label>
                  <div className="relative">
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b]" />
                    <Lock className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b]" />
                    <Lock className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isLoading} className="h-11 px-6 rounded-xl bg-[#14142B] text-white flex items-center gap-2 hover:bg-black transition-colors shadow-md disabled:opacity-50">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Update Password</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
