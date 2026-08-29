"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Undo2 } from "lucide-react";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    old_password: "",
    password: "",
    password_confirmation: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      alert("Passwords do not match");
      return;
    }
    alert("Password changed successfully!");
    setForm({ old_password: "", password: "", password_confirmation: "" });
  };

  return (
    <section className="pt-7 pb-16 bg-[#f7f7fc] min-h-screen">
      <div className="container mx-auto px-4 max-w-[550px]">
        <Link href="/" className="mb-3 inline-flex items-center gap-2 text-primary hover:text-rose-600 transition-colors">
          <Undo2 className="w-4 h-4" />
          <span className="text-xs font-medium leading-6">Back to home</span>
        </Link>
        
        <div className="py-6 px-4 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
          <h2 className="capitalize mb-6 text-left text-[22px] font-semibold leading-[34px] text-[#14142b]">
            Change Password
          </h2>
          
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="sm:col-span-2">
                <label htmlFor="old_password" className="block text-sm capitalize mb-1 text-[#6e7191]">Old Password</label>
                <input 
                  id="old_password" 
                  name="old_password"
                  type="password" 
                  value={form.old_password}
                  onChange={handleChange}
                  className="w-full h-12 text-sm rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="password" className="block text-sm capitalize mb-1 text-[#6e7191]">New Password</label>
                <input 
                  id="password" 
                  name="password"
                  type="password" 
                  value={form.password}
                  onChange={handleChange}
                  className="w-full h-12 text-sm rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="password_confirmation" className="block text-sm capitalize mb-1 text-[#6e7191]">Retype New Password</label>
                <input 
                  id="password_confirmation" 
                  name="password_confirmation"
                  type="password" 
                  value={form.password_confirmation}
                  onChange={handleChange}
                  className="w-full h-12 text-sm rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              <div className="sm:col-span-2 mt-4">
                <button 
                  type="submit"
                  className="w-full h-12 flex items-center justify-center capitalize font-bold text-base rounded-2xl text-white bg-primary hover:bg-rose-600 transition-colors shadow-md shadow-primary/20"
                >
                  Change Password
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
