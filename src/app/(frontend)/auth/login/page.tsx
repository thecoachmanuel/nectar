"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setGuest } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in email and password.");
      return;
    }

    setLoading(true);
    toast.loading("Authenticating...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      toast.dismiss();

      if (data.status) {
        setAuth(data.token, data.user);
        toast.success("Welcome back, " + data.user.name);

        if (data.user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/checkout");
        }
      } else {
        toast.error(data.message || "Invalid credentials.");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error("Login error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuest({
      name: "Guest Customer",
      email: "guest@foodappi.com",
      phone: "+1000000000",
    });
    toast.success("Proceeding as Guest Customer");
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6 border border-slate-100">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-2xl shadow-md">
              F
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Food<span className="text-red-500">Appi</span>
            </span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-800 pt-2">Sign in to your Account</h2>
          <p className="text-xs text-slate-400">Or continue as guest for instant food ordering</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative border-t border-slate-100 my-4 text-center">
          <span className="bg-white px-3 text-xs font-semibold text-slate-400 relative -top-2.5">
            OR
          </span>
        </div>

        {/* Guest Login Action */}
        <button
          onClick={handleGuestLogin}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-2"
        >
          <UserCheck className="w-4 h-4 text-slate-500" />
          <span>Continue as Guest</span>
        </button>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-red-500 font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
