"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "1234567890", // Mocking phone since we skipped the phone verification step for demo
    country_code: "+1",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Basic validation
    const newErrors: any = {};
    if (!form.first_name) newErrors.first_name = ["The first name field is required."];
    if (!form.last_name) newErrors.last_name = ["The last name field is required."];
    if (!form.email) newErrors.email = ["The email field is required."];
    if (!form.password) newErrors.password = ["The password field is required."];
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: `${form.first_name} ${form.last_name}`, 
          email: form.email, 
          password: form.password, 
          phone: form.phone 
        }),
      });
      const data = await res.json();

      if (data.status) {
        toast.success(data.message || "Account created successfully!");
        
        // Auto login
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const loginData = await loginRes.json();
        if (loginData.status) {
          setAuth(loginData.token, loginData.user);
          router.push("/");
        } else {
          router.push("/auth/login");
        }
      } else {
        toast.error(data.message || "Failed to create account.");
      }
    } catch (err: any) {
      toast.error("Signup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-[calc(100vh-100px)]">
      <div className="container mx-auto max-w-[550px] py-6 p-4 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
        <h2 className="capitalize mb-6 text-center text-[22px] font-semibold leading-[34px] text-[#14142b]">
          Create Account
        </h2>
        
        <form onSubmit={handleSignup}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* First Name */}
            <div>
              <label className="block text-sm capitalize mb-1 text-[#14142b]">First Name</label>
              <input 
                type="text" 
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className={`w-full h-12 rounded-lg border px-4 focus:outline-none focus:border-primary transition-all ${errors.first_name ? 'border-red-500' : 'border-[#D9DBE9]'}`}
              />
              {errors.first_name && <small className="text-red-500 text-xs mt-1 block">{errors.first_name[0]}</small>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm capitalize mb-1 text-[#14142b]">Last Name</label>
              <input 
                type="text" 
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className={`w-full h-12 rounded-lg border px-4 focus:outline-none focus:border-primary transition-all ${errors.last_name ? 'border-red-500' : 'border-[#D9DBE9]'}`}
              />
              {errors.last_name && <small className="text-red-500 text-xs mt-1 block">{errors.last_name[0]}</small>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm capitalize mb-1 text-[#14142b]">Email</label>
              <input 
                type="email" 
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full h-12 rounded-lg border px-4 focus:outline-none focus:border-primary transition-all ${errors.email ? 'border-red-500' : 'border-[#D9DBE9]'}`}
              />
              {errors.email && <small className="text-red-500 text-xs mt-1 block">{errors.email[0]}</small>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm capitalize mb-1 text-[#14142b]">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full h-12 rounded-lg border pl-4 pr-12 focus:outline-none focus:border-primary transition-all ${errors.password ? 'border-red-500' : 'border-[#D9DBE9]'}`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <small className="text-red-500 text-xs mt-1 block">{errors.password[0]}</small>}
            </div>

            {/* Social login divider */}
            <div className="sm:col-span-2 mt-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-full h-[1px] bg-gradient-to-r from-white to-[#D9DBE9]"></span>
                <span className="text-sm text-[#6E7191]">OR</span>
                <span className="w-full h-[1px] bg-gradient-to-l from-white to-[#D9DBE9]"></span>
              </div>

              {/* Social Login Buttons - Using SVGs embedded directly */}
              <div className="flex justify-center flex-wrap gap-[10px] mb-4">
                <div className="flex items-center justify-center gap-1.5 bg-[#F7F7FC] px-3 h-10 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c-.1-1.1-.9-1.99-1.95-1.99H12v4.02h6.17c-.25 1.35-1 2.57-2.14 3.34l3.46 2.68c.02.01-.01.03.01.03z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.46-2.68c-.99.66-2.25 1.05-3.82 1.05-2.94 0-5.43-1.98-6.32-4.66H2.07v2.79C3.9 20.48 7.64 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.68 14.05c-.23-.68-.36-1.41-.36-2.16s.13-1.48.36-2.16V6.94H2.07C1.38 8.35 1 9.92 1 11.5s.38 3.15 1.07 4.56l3.61-2.01z"/>
                      <path fill="#EA4335" d="M12 4.61c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.19 14.97 0 12 0 7.64 0 3.9 2.52 2.07 6.16l3.61 2.79c.89-2.68 3.38-4.34 6.32-4.34z"/>
                    </svg>
                    <span className="font-medium text-[13px] text-[#14142b]">Google</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 bg-[#F7F7FC] px-3 h-10 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path fill="#1877F2" d="M24 12.07c-.04-6.63-5.45-11.99-12.07-11.99S-.03 5.44-.03 12.07c0 5.98 4.38 10.95 10.2 11.85v-8.38H7.09v-3.47h3.06V9.34c0-3.03 1.8-4.7 4.56-4.7 1.32 0 2.68.24 2.68.24v2.94h-1.5c-1.49 0-1.95.93-1.95 1.87v 2.25h3.32l-.53 3.47h-2.79v8.38C20.04 22.94 24 18.01 24 12.07Z"/>
                    </svg>
                    <span className="font-medium text-[13px] text-[#14142b]">Facebook</span>
                </div>
              </div>
            </div>

            {/* Sign Up Button */}
            <div className="sm:col-span-2 mt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center text-center capitalize font-medium rounded-3xl text-white bg-primary disabled:opacity-70 transition-opacity"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Sign Up"}
              </button>
            </div>
            
            <div className="sm:col-span-2 text-center mt-2">
               <span className="text-xs text-[#6E7191]">Already have an account? </span>
               <Link href="/auth/login" className="text-xs font-medium text-primary hover:underline">
                  Login
               </Link>
            </div>

          </div>
        </form>
      </div>
    </section>
  );
}
