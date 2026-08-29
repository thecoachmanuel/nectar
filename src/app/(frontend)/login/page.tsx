"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/");
  };

  const handleQuickDemo = (role: string) => {
    if (role === 'admin') {
      setForm({ email: 'admin@example.com', password: 'password123' });
    } else {
      setForm({ email: 'customer@example.com', password: 'password123' });
    }
  };

  return (
    <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen flex flex-col items-center justify-center">
      
      <div className="container max-w-[360px] py-6 p-4 mb-6 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
        <h2 className="capitalize mb-6 text-center text-[22px] font-semibold leading-[34px] text-[#14142b]">
          Welcome Back
        </h2>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm capitalize mb-1 text-[#6e7191]">Email</label>
            <input 
              id="email" 
              name="email"
              type="text" 
              value={form.email}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white" 
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm capitalize mb-1 text-[#6e7191]">Password</label>
            <input 
              id="password" 
              name="password"
              type="password" 
              value={form.password}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white" 
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary' : 'bg-white border-[#a0a3bd] group-hover:border-primary'}`}>
                {rememberMe && <Check className="w-3 h-3 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span className="text-xs text-[#14142b]">Remember me</span>
            </label>
            
            <Link href="#" className="capitalize text-xs font-medium transition text-primary hover:text-rose-600">
              Forget Password?
            </Link>
          </div>
          
          <button 
            type="submit"
            className="w-full h-12 text-center capitalize font-bold text-base rounded-2xl mb-6 text-white bg-primary hover:bg-rose-600 transition-colors shadow-md shadow-primary/20"
          >
            Login
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-[#6E7191]">Don't have an account?</span>
            <Link href="/signup" className="text-xs font-medium text-primary hover:text-rose-600 transition-colors">
              Sign Up
            </Link>
          </div>
          
          <div>
            <p className="text-xs uppercase text-center mb-3 text-[#6E7191]">Or</p>
            <button type="button" className="w-full h-12 text-center capitalize font-medium rounded-2xl border border-primary text-primary bg-white hover:bg-[#fff5f9] transition-colors">
              Login as guest
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
