"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      alert("Passwords do not match");
      return;
    }
    router.push("/login");
  };

  return (
    <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen flex flex-col items-center justify-center">
      
      <div className="container max-w-[360px] py-6 p-4 mb-6 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
        <h2 className="capitalize mb-6 text-center text-[22px] font-semibold leading-[34px] text-[#14142b]">
          Sign Up
        </h2>
        
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm capitalize mb-1 text-[#6e7191]">Name</label>
            <input 
              id="name" 
              name="name"
              type="text" 
              value={form.name}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white" 
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm capitalize mb-1 text-[#6e7191]">Email</label>
            <input 
              id="email" 
              name="email"
              type="email" 
              value={form.email}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white" 
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm capitalize mb-1 text-[#6e7191]">Phone</label>
            <div className="w-full h-12 rounded-xl border border-[#eff0f6] px-4 flex items-center bg-white focus-within:border-primary transition-colors">
              <div className="w-fit flex-shrink-0 flex items-center gap-1 border-r border-[#eff0f6] pr-2 mr-2">
                <span className="text-sm">🇳🇬</span>
                <span className="whitespace-nowrap flex-shrink-0 text-sm text-[#14142b]">+234</span>
              </div>
              <input 
                id="phone" 
                name="phone"
                type="tel" 
                value={form.phone}
                onChange={handleChange}
                className="w-full h-full text-sm text-[#14142b] focus:outline-none bg-transparent"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm capitalize mb-1 text-[#6e7191]">Password</label>
            <div className="relative">
              <input 
                id="password" 
                name="password"
                type={showPassword ? "text" : "password"} 
                value={form.password}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border border-[#eff0f6] pl-4 pr-12 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password_confirmation" className="block text-sm capitalize mb-1 text-[#6e7191]">Confirm Password</label>
            <div className="relative">
              <input 
                id="password_confirmation" 
                name="password_confirmation"
                type={showPassword ? "text" : "password"} 
                value={form.password_confirmation}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border border-[#eff0f6] pl-4 pr-12 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white" 
              />
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
            className="w-full h-12 text-center capitalize font-bold text-base rounded-2xl mb-6 text-white bg-primary hover:bg-rose-600 transition-colors shadow-md shadow-primary/20"
          >
            Sign Up
          </button>
          
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-[#6E7191]">Already have an account?</span>
            <Link href="/login" className="text-xs font-medium text-primary hover:text-rose-600 transition-colors">
              Login
            </Link>
          </div>
          
        </form>
      </div>

    </section>
  );
}
