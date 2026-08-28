"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, ArrowRight, Building } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in email and password.");
      return;
    }

    setLoading(true);
    toast.loading("Authenticating Backoffice Staff...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      toast.dismiss();

      if (data.status) {
        if (data.user.role !== "admin" && data.user.role !== "chef" && data.user.role !== "waiter" && data.user.role !== "delivery_boy") {
          toast.error("Access Denied: Account does not have Admin or Staff permissions.");
          return;
        }

        setAuth(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}! Accessing Backoffice...`);
        router.push("/admin/dashboard");
      } else {
        toast.error(data.message || "Invalid Admin credentials.");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error("Login error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-800 text-slate-100">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-2xl shadow-lg mx-auto">
            F
          </div>
          <h2 className="text-2xl font-black text-white pt-2">FoodAppi Backoffice</h2>
          <p className="text-xs text-slate-400">Admin, POS & Kitchen Staff Portal</p>
        </div>

        {/* Credentials Box */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-2xl text-xs space-y-1 text-slate-300">
          <p className="font-bold text-amber-400">Default Admin Credentials:</p>
          <p>Email: <code className="text-white font-bold">admin@example.com</code></p>
          <p>Password: <code className="text-white font-bold">123456</code></p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Login to Backoffice</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition">
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
