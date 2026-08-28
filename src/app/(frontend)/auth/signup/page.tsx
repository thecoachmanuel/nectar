"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (data.status) {
        setAuth(data.token, data.user);
        toast.success(`Welcome to FoodAppi, ${data.user.name}!`);
        router.push("/");
      } else {
        toast.error(data.message || "Registration failed.");
      }
    } catch (err: any) {
      toast.error("Signup failed: " + err.message);
    } finally {
      setLoading(false);
    }
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#14142b]">Create Account</h1>
            <p className="text-sm text-[#6e7191] mt-1">Join FoodAppi and start ordering your favourite meals</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="db-field-title">Full Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="w-4 h-4 text-[#a0a3bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="db-field-control pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="db-field-title">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#a0a3bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="db-field-control pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="db-field-title">Phone Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#a0a3bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className="db-field-control pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="db-field-title">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#a0a3bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="db-field-control pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a3bd] hover:text-[#6e7191]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="db-field-title">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#a0a3bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password_confirmation"
                  required
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="db-field-control pl-10"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: "#ff006b" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#6e7191] mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#ff006b" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
