"use client";

import React, { useState, useEffect } from "react";
import { Undo2, Wallet, Plus, CreditCard, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function WalletPage() {
  const { user, token, updateUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [amount, setAmount] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const walletBalance = (user as any)?.walletBalance || 0;

  useEffect(() => {
    // Check if we are returning from Paystack
    const ref = searchParams.get("ref");
    if (ref && token) {
      verifyPayment(ref);
    }
  }, [searchParams, token]);

  const verifyPayment = async (reference: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/payments/wallet-fund/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reference })
      });
      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "Wallet funded successfully");
        if (data.newBalance !== undefined) {
          updateUser({ walletBalance: data.newBalance });
        }
        // Clean URL
        router.replace("/account/wallet");
      } else {
        toast.error(data.message || "Payment verification failed");
      }
    } catch (err) {
      toast.error("An error occurred verifying payment");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) < 100) {
      return toast.error("Minimum amount to fund is ₦100");
    }

    setIsInitializing(true);
    try {
      const res = await fetch("/api/payments/wallet-fund/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount) })
      });
      
      const data = await res.json();
      if (data.status && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.message || "Failed to initialize payment");
        setIsInitializing(false);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      setIsInitializing(false);
    }
  };

  return (
    <section className="pt-7 pb-16 bg-[#f7f7fc] min-h-screen">
      <div className="container mx-auto px-4 max-w-[800px]">
        <Link href="/" className="mb-3 inline-flex items-center gap-2 text-primary hover:text-rose-600 transition-colors">
          <Undo2 className="w-4 h-4" />
          <span className="text-xs font-medium leading-6">Back to home</span>
        </Link>
        
        <div className="py-6 px-4 sm:px-6 shadow-sm rounded-2xl bg-white border border-[#eff0f6]">
          <h2 className="capitalize mb-6 text-left text-[22px] font-semibold leading-[34px] text-[#14142b] flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            My Wallet
          </h2>

      {isVerifying && (
        <div className="bg-[#BDEFFF] border border-[#008BBA] text-[#00749B] px-4 py-3 rounded-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm font-medium">Verifying your payment, please wait...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nectar Card (Wallet Balance) */}
        <div className="bg-gradient-to-br from-[#14142B] to-[#2B2B4F] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-primary/30 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Current Balance</p>
              <h2 className="text-4xl font-bold tracking-tight">₦{walletBalance.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-8 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-sm">
              <CreditCard className="w-6 h-6 text-white/80" />
            </div>
          </div>
          
          <div className="relative z-10 mt-8">
            <p className="text-white/60 text-xs font-mono tracking-widest uppercase mb-1">Card Holder</p>
            <p className="font-semibold">{user?.name || "Customer"}</p>
          </div>
        </div>

        {/* Add Funds Form */}
        <div className="bg-white border border-[#EFF0F6] rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#14142B] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Funds
          </h3>
          <form onSubmit={handleAddFunds} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#6E7191] mb-2">Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#14142B] font-bold">₦</span>
                <input 
                  type="number" 
                  min="100"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary font-semibold"
                  required
                />
              </div>
              <p className="text-xs text-[#A0A3BD] mt-2">Minimum amount is ₦100.</p>
            </div>
            <button 
              type="submit"
              disabled={isInitializing}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-md shadow-primary/20 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Proceed to Pay"}
            </button>
          </form>
        </div>
      </div>
      
      </div>
      </div>
    </section>
  );
}
