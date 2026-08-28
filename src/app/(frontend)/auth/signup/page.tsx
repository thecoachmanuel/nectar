"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import Link from "next/link";

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
                className={`w-full h-12 rounded-lg border px-4 focus:outline-none focus:border-[#ff006b] transition-all ${errors.first_name ? 'border-red-500' : 'border-[#D9DBE9]'}`}
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
                className={`w-full h-12 rounded-lg border px-4 focus:outline-none focus:border-[#ff006b] transition-all ${errors.last_name ? 'border-red-500' : 'border-[#D9DBE9]'}`}
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
                className={`w-full h-12 rounded-lg border px-4 focus:outline-none focus:border-[#ff006b] transition-all ${errors.email ? 'border-red-500' : 'border-[#D9DBE9]'}`}
              />
              {errors.email && <small className="text-red-500 text-xs mt-1 block">{errors.email[0]}</small>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm capitalize mb-1 text-[#14142b]">Password</label>
              <input 
                type="password" 
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`w-full h-12 rounded-lg border px-4 focus:outline-none focus:border-[#ff006b] transition-all ${errors.password ? 'border-red-500' : 'border-[#D9DBE9]'}`}
              />
              {errors.password && <small className="text-red-500 text-xs mt-1 block">{errors.password[0]}</small>}
            </div>

            {/* Sign Up Button */}
            <div className="sm:col-span-2 mt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center text-center capitalize font-medium rounded-3xl text-white bg-[#ff006b] disabled:opacity-70 transition-opacity"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Sign Up"}
              </button>
            </div>
            
            <div className="sm:col-span-2 text-center mt-2">
               <span className="text-xs text-[#6E7191]">Already have an account? </span>
               <Link href="/auth/login" className="text-xs font-medium text-[#ff006b] hover:underline">
                  Login
               </Link>
            </div>

          </div>
        </form>
      </div>
    </section>
  );
}
