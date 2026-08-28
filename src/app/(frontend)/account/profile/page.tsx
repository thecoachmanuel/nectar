"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { User, Mail, Phone, Lock, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Name and Email are required.");
      return;
    }
    updateUser({ name, email, phone });
    toast.success("Profile updated successfully!");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    toast.success("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#14142b]">Account Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Form */}
        <div className="bg-white rounded-2xl p-6 border border-[#eff0f6] shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#14142b] flex items-center space-x-2 border-b border-[#eff0f6] pb-3">
            <User className="w-4 h-4" style={{ color: "#ff006b" }} />
            <span>Edit Personal Details</span>
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#6e7191] block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6e7191] block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6e7191] block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-1.5"
              style={{ backgroundColor: "#ff006b" }}
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </form>
        </div>

        {/* Change Security Password Form */}
        <div className="bg-white rounded-2xl p-6 border border-[#eff0f6] shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#14142b] flex items-center space-x-2 border-b border-[#eff0f6] pb-3">
            <ShieldCheck className="w-4 h-4" style={{ color: "#ff006b" }} />
            <span>Change Security Password</span>
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#6e7191] block mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6e7191] block mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6e7191] block mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#14142b] hover:bg-[#202040] text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
