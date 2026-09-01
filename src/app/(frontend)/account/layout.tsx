"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isGuest, fetchUserProfile } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch and refresh user profile with DB
  useEffect(() => {
    setMounted(true);
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile]);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f7f7fc]">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If there's no auth token (and they aren't a guest viewing guest-allowed things, but for /account, they MUST be fully logged in)
  if (!token && !isGuest) {
    return (
      <section className="min-h-[70vh] bg-[#f7f7fc] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-sm border border-[#eff0f6] overflow-hidden text-center p-8 sm:p-12">
          
          <div className="mx-auto w-20 h-20 bg-[#fff5f9] rounded-full flex items-center justify-center mb-6 shadow-sm shadow-primary/10">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-[28px] font-bold text-[#14142b] mb-3 leading-tight">
            Authentication Required
          </h2>
          <p className="text-[#6e7191] mb-8 text-[15px] leading-relaxed">
            You must be logged in to access your account profile, track orders, and manage your addresses.
          </p>

          <div className="space-y-4">
            <Link 
              href="/auth/login" 
              className="w-full h-[52px] rounded-2xl bg-primary text-white flex items-center justify-center gap-2 font-semibold hover:bg-rose-600 transition-colors shadow-md shadow-primary/20"
            >
              <LogIn className="w-5 h-5" />
              <span>Login to your account</span>
            </Link>
            
            <Link 
              href="/auth/signup" 
              className="w-full h-[52px] rounded-2xl bg-[#f7f7fc] border border-[#eff0f6] text-[#14142b] flex items-center justify-center gap-2 font-semibold hover:bg-[#eff0f6] transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create an account</span>
            </Link>
          </div>

        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc]">
      {children}
    </div>
  );
}
