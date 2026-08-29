"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { DollarSign, TrendingUp, Store as StoreIcon, Bike, Wallet, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export default function FinancialSummaryPage() {
  const { execute, data, loading } = useApi();
  const [payoutUser, setPayoutUser] = useState<{ id: string, name: string, role: string, maxAmount: number } | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    execute("/api/admin/financial-summary");
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleInitiatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutUser || !payoutAmount || Number(payoutAmount) <= 0) return;
    
    if (Number(payoutAmount) > payoutUser.maxAmount) {
      toast.error("Cannot pay more than the pending balance.");
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch("/api/admin/payouts/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: payoutUser.id,
          userRole: payoutUser.role,
          amount: Number(payoutAmount),
          paymentMethod: "manual"
        })
      });
      const result = await res.json();
      
      if (result.status) {
        toast.success("Payout recorded successfully!");
        setPayoutUser(null);
        setPayoutAmount("");
        // Refresh data
        execute("/api/admin/financial-summary");
      } else {
        toast.error(result.message || "Failed to process payout.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading financial data...</div>;
  }

  if (!data) return null;

  const { overview, stores, deliveryBoys } = data;

  return (
    <div className="pb-16 space-y-8 animate-in fade-in relative">
      
      <div>
        <h2 className="text-2xl font-bold text-[#14142B] mb-1">Financial Summary</h2>
        <p className="text-sm text-[#6E7191]">Comprehensive overview of app revenue, payouts, and pending balances.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EFF0F6] flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#E7FFF0] text-[#1AB759] flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#6E7191] font-medium">Gross Revenue</p>
              <h3 className="text-2xl font-bold text-[#14142B]">{formatMoney(overview.grossRevenue)}</h3>
            </div>
          </div>
          <p className="text-xs text-[#6E7191]">Total value of all delivered orders</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EFF0F6] flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#E9EEFF] text-[#567DFF] flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#6E7191] font-medium">Platform Commissions</p>
              <h3 className="text-2xl font-bold text-[#14142B]">{formatMoney(overview.totalCommissions)}</h3>
            </div>
          </div>
          <p className="text-xs text-[#6E7191]">Total commissions earned by admin</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EFF0F6] flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF6E6] text-[#FFB020] flex items-center justify-center">
              <StoreIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#6E7191] font-medium">Total Paid to Stores</p>
              <h3 className="text-2xl font-bold text-[#14142B]">{formatMoney(overview.storePayoutsTotal)}</h3>
            </div>
          </div>
          <p className="text-xs text-[#6E7191]">Total approved payouts to store managers</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EFF0F6] flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#A855F7] flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#6E7191] font-medium">Total Paid to Riders</p>
              <h3 className="text-2xl font-bold text-[#14142B]">{formatMoney(overview.deliveryPayoutsTotal)}</h3>
            </div>
          </div>
          <p className="text-xs text-[#6E7191]">Total approved payouts to delivery boys</p>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Stores Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
          <div className="p-5 border-b border-[#EFF0F6] flex justify-between items-center bg-[#FAFAFC]">
            <h3 className="font-semibold text-lg text-[#14142B] flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-slate-500" />
              Sellers Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white border-b border-[#EFF0F6]">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Store Name</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Total Paid</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Pending Balance</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF0F6]">
                {stores.map((store: any) => (
                  <tr key={store.id} className="hover:bg-[#F7F7FC]/50">
                    <td className="px-5 py-4 font-bold text-[#14142B]">{store.name}</td>
                    <td className="px-5 py-4 text-right font-semibold text-[#1AB759]">{formatMoney(store.totalPaid)}</td>
                    <td className="px-5 py-4 text-right font-bold text-[#FFB020]">{formatMoney(store.walletBalance)}</td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => setPayoutUser({ id: store.id, name: store.name, role: "store_manager", maxAmount: store.walletBalance })}
                        disabled={store.walletBalance <= 0}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No stores found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delivery Boys Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
          <div className="p-5 border-b border-[#EFF0F6] flex justify-between items-center bg-[#FAFAFC]">
            <h3 className="font-semibold text-lg text-[#14142B] flex items-center gap-2">
              <Bike className="w-5 h-5 text-slate-500" />
              Delivery Boys Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white border-b border-[#EFF0F6]">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Rider Details</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Total Paid</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Pending Balance</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF0F6]">
                {deliveryBoys.map((boy: any) => (
                  <tr key={boy.id} className="hover:bg-[#F7F7FC]/50">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#14142B]">{boy.name}</div>
                      <div className="text-xs text-slate-500">{boy.email}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#1AB759]">{formatMoney(boy.totalPaid)}</td>
                    <td className="px-5 py-4 text-right font-bold text-[#FFB020]">{formatMoney(boy.walletBalance)}</td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => setPayoutUser({ id: boy.id, name: boy.name, role: "delivery_boy", maxAmount: boy.walletBalance })}
                        disabled={boy.walletBalance <= 0}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#A855F7] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9333EA] transition-colors"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {deliveryBoys.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No delivery boys found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Payout Modal */}
      {payoutUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-[#EFF0F6] bg-[#FAFAFC]">
              <h3 className="font-bold text-lg text-[#14142B]">Initiate Payout</h3>
              <button 
                onClick={() => setPayoutUser(null)}
                className="p-2 text-[#6E7191] hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInitiatePayout} className="p-6 space-y-5">
              <div>
                <p className="text-sm font-medium text-[#6E7191]">Paying to</p>
                <p className="text-lg font-bold text-[#14142B]">{payoutUser.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-[#6E7191] mb-1">Pending Balance</p>
                <p className="text-2xl font-extrabold text-[#FFB020]">{formatMoney(payoutUser.maxAmount)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#14142B]">Amount to Pay (NGN)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[#6E7191] font-medium">₦</span>
                  </div>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    max={payoutUser.maxAmount}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-3 bg-[#F7F7FC] border border-[#EFF0F6] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    required
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setPayoutAmount(payoutUser.maxAmount.toString())}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Pay Full Balance
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutUser(null)}
                  className="flex-1 px-5 py-3 rounded-xl font-bold text-[#6E7191] bg-[#F7F7FC] hover:bg-[#EFF0F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="flex-1 px-5 py-3 rounded-xl font-bold text-white bg-primary disabled:opacity-70 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isPaying ? "Processing..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
