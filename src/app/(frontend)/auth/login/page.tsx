"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setGuest } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.status) {
        setAuth(data.token, data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        document.cookie = `token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}`;
        toast.success(`Welcome back, ${data.user.name}!`);
        if (data.user.role === "admin" || data.user.role === "chef" || data.user.role === "waiter") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } else {
        toast.error(data.message || "Invalid email or password.");
      }
    } catch (err: any) {
      toast.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuest({ name: "Guest", email: "guest@nectar.com", phone: "" });
    toast.success("Continuing as guest.");
    router.push("/");
  };

  const setupCredit = (role: string) => {
    if (role === 'admin') { setEmail('admin@example.com'); setPassword('123456'); }
    else if (role === 'customer') { setEmail('customer@example.com'); setPassword('123456'); }
    else if (role === 'branchManager') { setEmail('branchmanager@example.com'); setPassword('123456'); }
    else if (role === 'posOperator') { setEmail('posoperator@example.com'); setPassword('123456'); }
    else if (role === 'chef') { setEmail('chef@example.com'); setPassword('123456'); }
  };

  return (
    <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-[calc(100vh-100px)] flex items-center justify-center">
      {/* Login Box */}
      <div className="container mx-auto max-w-[360px] py-6 p-4 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
        <h2 className="capitalize mb-6 text-center text-[22px] font-semibold leading-[34px] text-[#14142b]">
          Welcome Back
        </h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="formEmail" className="block text-sm capitalize mb-1 text-[#14142b]">Email</label>
            <input 
              type="email" 
              id="formEmail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-lg border px-4 border-[#D9DBE9] focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="formPassword" className="block text-sm capitalize mb-1 text-[#14142b]">Password</label>
            <input 
              type="password"
              id="formPassword"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-lg border px-4 border-[#D9DBE9] focus:outline-none focus:border-primary transition-all" 
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="relative w-3 h-3 flex items-center justify-center border border-[#6E7191] rounded-[3px]">
                <input type="checkbox" id="rememberMe" className="opacity-0 absolute inset-0 cursor-pointer peer" />
                <Check className="w-2.5 h-2.5 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
              </div>
              <label htmlFor="rememberMe" className="text-xs text-[#14142b] cursor-pointer select-none">
                Remember Me
              </label>
            </div>
            <Link href="/auth/forgot-password" className="capitalize text-xs font-medium transition text-primary hover:underline">
              Forget Password
            </Link>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center text-center capitalize font-medium rounded-3xl mb-6 text-white bg-primary disabled:opacity-70 transition-opacity"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Login"}
          </button>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-[#6E7191]">Don't have an account?</span>
            <Link href="/auth/signup" className="text-xs font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </div>

          {/* Social login divider */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-full h-[1px] bg-gradient-to-r from-white to-[#D9DBE9]"></span>
            <span className="text-sm text-[#6E7191]">OR</span>
            <span className="w-full h-[1px] bg-gradient-to-l from-white to-[#D9DBE9]"></span>
          </div>

          {/* Social Login Buttons - Using SVGs embedded directly to prevent missing icon issues */}
          <div className="flex justify-center flex-wrap gap-[10px] mb-6">
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

          <p className="text-sm uppercase text-center mb-3 text-[#6E7191]">OR</p>
          <button 
            type="button"
            onClick={handleGuestLogin}
            className="w-full h-12 leading-[46px] text-center capitalize font-medium rounded-3xl border text-primary border-primary bg-white hover:bg-[#fff5f9] transition-colors"
          >
            Login As Guest
          </button>
        </form>
      </div>
    </section>
  );
}
