"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Undo2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function EditProfilePage() {
  const { user, token, updateUser } = useAuthStore();
  
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country_code: "+234"
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      setForm({
        first_name: firstName,
        last_name: lastName,
        email: user.email || "",
        phone: user.phone || "",
        country_code: "+234"
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("You must be logged in.");

    setIsLoading(true);
    try {
      const fullName = `${form.first_name} ${form.last_name}`.trim();
      const res = await fetch("/api/frontend/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: fullName,
          phone: form.phone
        })
      });
      
      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "Profile updated successfully!");
        updateUser({ name: fullName, phone: form.phone });
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
                  required
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
                  required
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
                  readOnly
                  className="w-full h-12 text-sm rounded-xl border border-[#eff0f6] px-4 text-[#6e7191] bg-[#f7f7fc] cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="phone" className="block text-xs capitalize mb-1 text-[#6e7191]">Phone (WhatsApp Number)</label>
                <div className="w-full h-12 rounded-xl border border-[#eff0f6] px-4 flex items-center bg-white focus-within:border-primary transition-colors">
                  <div className="w-fit flex-shrink-0 flex items-center gap-1 border-r border-[#eff0f6] pr-2 mr-2">
                    <span className="text-sm">🇳🇬</span>
                    <span className="whitespace-nowrap flex-shrink-0 text-xs text-[#14142b]">{form.country_code}</span>
                  </div>
                  <input 
                    id="phone" 
                    name="phone"
                    type="text" 
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full h-full text-sm text-[#14142b] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 mt-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 flex items-center justify-center gap-2 capitalize font-bold text-base rounded-2xl text-white bg-primary hover:bg-rose-600 transition-colors shadow-md shadow-primary/20 disabled:opacity-70"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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
