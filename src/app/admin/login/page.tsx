"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await res.json();

      if (data.status) {
        useAuthStore.getState().setAuth(data.token, data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        document.cookie = `token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}`;
        
        toast.success(`Welcome back, ${data.user.name}!`);
        if (["admin", "chef", "waiter", "store_manager"].includes(data.user.role)) {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } else {
        toast.error(data.message || "Invalid credentials.");
      }
    } catch (err: any) {
      toast.error("Login failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FC] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-sm border border-[#EFF0F6] overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#fff5f9] text-[#ff006b] rounded-2xl mb-4 shadow-sm shadow-[#ff006b]/10">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#14142B] mb-2">Admin Login</h2>
          <p className="text-sm text-[#6E7191]">Enter your credentials to access the portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
          
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-2">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@foodappi.com"
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b] transition-colors"
              />
              <Mail className="w-5 h-5 text-[#A0A3BD] absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[#14142B]">Password</label>
              <a href="#" className="text-xs font-semibold text-[#ff006b] hover:underline">Forgot Password?</a>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full h-12 pl-12 pr-12 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b] transition-colors"
              />
              <Lock className="w-5 h-5 text-[#A0A3BD] absolute left-4 top-1/2 -translate-y-1/2" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 mt-2 rounded-xl bg-[#ff006b] text-white font-semibold text-sm hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20 flex items-center justify-center disabled:opacity-70"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Login to Dashboard"
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
