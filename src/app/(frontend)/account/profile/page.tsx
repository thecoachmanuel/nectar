"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Undo2 } from "lucide-react";

export default function EditProfilePage() {
  const [form, setForm] = useState({
    first_name: "John",
    last_name: "Doe",
    email: "admin@example.com",
    phone: "1234567890",
    country_code: "+1"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic
    alert("Profile updated successfully!");
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
            Edit Profile
          </h2>
          
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="sm:col-span-1">
                <label htmlFor="first_name" className="block text-xs capitalize mb-1 text-[#6e7191]">First Name</label>
                <input 
                  id="first_name" 
                  name="first_name"
                  type="text" 
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full h-12 text-sm rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="last_name" className="block text-xs capitalize mb-1 text-[#6e7191]">Last Name</label>
                <input 
                  id="last_name" 
                  name="last_name"
                  type="text" 
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full h-12 text-sm rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="email" className="block text-xs capitalize mb-1 text-[#6e7191]">Email</label>
                <input 
                  id="email" 
                  name="email"
                  type="email" 
                  value={form.email}
                  onChange={handleChange}
                  className="w-full h-12 text-sm rounded-xl border border-[#eff0f6] px-4 text-[#14142b] focus:outline-none focus:border-primary transition-colors bg-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="phone" className="block text-xs capitalize mb-1 text-[#6e7191]">Phone</label>
                <div className="w-full h-12 rounded-xl border border-[#eff0f6] px-4 flex items-center bg-white focus-within:border-primary transition-colors">
                  <div className="w-fit flex-shrink-0 flex items-center gap-1 border-r border-[#eff0f6] pr-2 mr-2">
                    <span className="text-sm">🇺🇸</span>
                    <span className="whitespace-nowrap flex-shrink-0 text-xs text-[#14142b]">{form.country_code}</span>
                  </div>
                  <input 
                    id="phone" 
                    name="phone"
                    type="text" 
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full h-full text-sm text-[#14142b] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 mt-4">
                <button 
                  type="submit"
                  className="w-full h-12 flex items-center justify-center capitalize font-bold text-base rounded-2xl text-white bg-primary hover:bg-rose-600 transition-colors shadow-md shadow-primary/20"
                >
                  Update Profile
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
