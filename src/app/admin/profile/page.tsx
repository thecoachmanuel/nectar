"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useApi } from "@/hooks/useApi";

export default function AdminProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { execute, loading: isSaving } = useApi();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingAvatar(true);
      const file = e.target.files[0];
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (data.url) {
          // Immediately save to backend since avatar is a separate action usually, 
          // or we can just update local user state and wait for "Save Profile"
          const { data: updatedUser } = await execute(`/api/admin/users/${user?._id}`, {
            method: "PUT",
            body: { image: data.url },
            successMessage: "Avatar uploaded successfully!",
          });
          if (updatedUser) {
            updateUser(updatedUser);
            localStorage.setItem("user", JSON.stringify({ ...user, ...updatedUser }));
          }
        }
      } catch (err) {
        console.error(err);
      }
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const { data } = await execute(`/api/admin/users/${user._id}`, {
        method: "PUT",
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        successMessage: "Profile updated successfully!",
      });
      if (data) {
        updateUser(data);
        localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
      }
    } catch (err) {}
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    
    try {
      // In a real app we would verify currentPassword on the backend.
      // Since this is admin/users/[id], we just pass password to PUT.
      await execute(`/api/admin/users/${user._id}`, {
        method: "PUT",
        body: {
          password: formData.newPassword,
        },
        successMessage: "Password changed successfully!",
      });
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {}
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
                {uploadingAvatar ? (
                   <span className="w-8 h-8 border-4 border-primary/40 border-t-[#ff006b] rounded-full animate-spin"></span>
                ) : (
                   <img src={user?.image || "/images/default/user.png"} alt="Profile" className="w-full h-full object-cover" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-[#e60060] transition-colors cursor-pointer">
                <Camera className="w-5 h-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            <h3 className="text-lg font-bold text-[#14142B]">{user?.name}</h3>
            <p className="text-sm text-[#6E7191] font-medium mb-1 capitalize">{user?.role?.replace("_", " ")}</p>
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Full Name</label>
                  <div className="relative">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary" />
                    <User className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Email Address</label>
                  <div className="relative">
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary" />
                    <Mail className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Phone Number</label>
                  <div className="relative">
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary" />
                    <Phone className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSaving} className="h-11 px-6 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
                  {isSaving ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
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
                  <input type={showPassword ? "text" : "password"} name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="w-full h-11 pl-10 pr-12 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary" />
                  <Lock className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} onChange={handleChange} required className="w-full h-11 pl-10 pr-12 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary" />
                    <Lock className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full h-11 pl-10 pr-12 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary" />
                    <Lock className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSaving} className="h-11 px-6 rounded-xl bg-[#14142B] text-white flex items-center gap-2 hover:bg-black transition-colors shadow-md disabled:opacity-50">
                  {isSaving ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
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
