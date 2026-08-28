"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setGuest } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        toast.success(`Welcome back, ${data.user.name}!`);
        // Redirect admins to backoffice, customers to home
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
    setGuest({ name: "Guest", email: "guest@foodappi.com", phone: "" });
    toast.success("Continuing as guest.");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/images/theme/theme-logo.png"
              alt="FoodAppi"
              className="h-12 mx-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-3xl font-black" style={{ color: "#ff006b" }}>FoodAppi</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#14142b] capitalize">Welcome Back</h1>
            <p className="text-sm text-[#6e7191] mt-1">Sign in to continue ordering your favourite food</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="db-field-title">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#a0a3bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="db-field-control pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="db-field-title">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#a0a3bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="db-field-control pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a3bd] hover:text-[#6e7191]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="db-btn db-btn-primary w-full h-11 text-sm font-semibold rounded-xl disabled:opacity-60"
              style={{ backgroundColor: "#ff006b", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-[#eff0f6]" />
            <span className="text-xs text-[#a0a3bd] font-medium">OR</span>
            <hr className="flex-1 border-[#eff0f6]" />
          </div>

          {/* Guest Login */}
          <button
            onClick={handleGuestLogin}
            className="w-full h-11 rounded-xl text-sm font-medium text-[#6e7191] border border-[#e2e8f0] hover:border-[#ff006b] hover:text-[#ff006b] hover:bg-[#fff5f9] transition-all"
          >
            Continue as Guest
          </button>

          {/* Sign Up link */}
          <p className="text-center text-sm text-[#6e7191] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: "#ff006b" }}>
              Create Account
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 p-3 rounded-xl text-xs text-[#6e7191] bg-white border border-[#eff0f6] text-center">
          <span className="font-semibold text-[#14142b]">Demo Admin:</span> admin@example.com &nbsp;/&nbsp;
          <span className="font-semibold text-[#14142b]">Password:</span> 123456
        </div>
      </div>
    </div>
  );
}
