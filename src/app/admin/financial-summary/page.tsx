"use client";

import React, { useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { DollarSign, TrendingUp, Store as StoreIcon, Bike, Wallet, CheckCircle } from "lucide-react";

export default function FinancialSummaryPage() {
  const { execute, data, loading } = useApi();

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

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading financial data...</div>;
  }

  if (!data) return null;

  const { overview, stores, deliveryBoys } = data;

  return (
    <div className="pb-16 space-y-8 animate-in fade-in">
      
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
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
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Pending Balance (Left to Pay)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF0F6]">
                {stores.map((store: any) => (
                  <tr key={store.id} className="hover:bg-[#F7F7FC]/50">
                    <td className="px-5 py-4 font-bold text-[#14142B]">{store.name}</td>
                    <td className="px-5 py-4 text-right font-semibold text-[#1AB759]">{formatMoney(store.totalPaid)}</td>
                    <td className="px-5 py-4 text-right font-bold text-[#FFB020]">{formatMoney(store.walletBalance)}</td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">No stores found</td></tr>
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
                  <th className="px-5 py-3 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Pending Balance (Left to Pay)</th>
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
                  </tr>
                ))}
                {deliveryBoys.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">No delivery boys found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
