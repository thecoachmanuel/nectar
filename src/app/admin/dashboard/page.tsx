"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingStore } from "@/store/useSettingStore";
import {
  ShoppingBag,
  DollarSign,
  Users,
  Utensils,
  TrendingUp,
  Store,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { formatPrice, activeBranch } = useSettingStore();

  const [stats, setStats] = useState({
    totalOrders: 124,
    totalSales: 3480.5,
    totalCustomers: 89,
    totalItems: 42,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [activeBranch]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = "/api/frontend/orders?";
      if (activeBranch && activeBranch._id) {
        url += `branchId=${activeBranch._id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.status && data.data) {
        setRecentOrders(data.data.slice(0, 5));
        const totalSales = data.data.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
        setStats({
          totalOrders: data.data.length,
          totalSales,
          totalCustomers: 89,
          totalItems: 42,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Bar */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-md">
            F
          </div>
          <div>
            <h1 className="font-black text-lg text-white">FoodAppi Backoffice</h1>
            <p className="text-xs text-slate-400">
              Admin & Staff Portal • {activeBranch ? activeBranch.name : "All Branches"}
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center space-x-3 text-xs font-bold">
          <Link
            href="/admin/pos"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow"
          >
            <Store className="w-4 h-4" />
            <span>POS Register</span>
          </Link>

          <Link
            href="/admin/kds"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow"
          >
            <Utensils className="w-4 h-4" />
            <span>KDS Display</span>
          </Link>

          <Link
            href="/"
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl transition"
          >
            Storefront
          </Link>
        </div>
      </header>

      {/* Main Backoffice Content */}
      <main className="p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{formatPrice(stats.totalSales)}</p>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +14% vs last week
            </span>
          </div>

          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ShoppingBag className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalOrders}</p>
            <span className="text-[10px] text-slate-400">Online & POS Orders</span>
          </div>

          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalCustomers}</p>
            <span className="text-[10px] text-slate-400">Registered users</span>
          </div>

          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Menu Items</span>
              <Utensils className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalItems}</p>
            <span className="text-[10px] text-slate-400">Active food catalog</span>
          </div>
        </div>

        {/* Recent Orders Table & Navigation Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-base">Recent Live Orders</h3>
              <Link href="/admin/online-orders" className="text-xs font-bold text-red-400 hover:underline">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No orders recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-300">
                  <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {recentOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-700/30 transition">
                        <td className="py-3 px-3 font-bold text-white">{ord.orderSerialNo}</td>
                        <td className="py-3 px-3">{ord.customerName}</td>
                        <td className="py-3 px-3 capitalize">{ord.orderType}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-700 text-amber-300">
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white">
                          {formatPrice(ord.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Management Links */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base border-b border-slate-700 pb-3">
              Management Modules
            </h3>

            <div className="space-y-2 text-xs font-semibold">
              <Link
                href="/admin/online-orders"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-200 transition"
              >
                <span>Online Orders & Status</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/reports/sales"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-200 transition"
              >
                <span>Sales & PDF/XLSX Reports</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-200 transition"
              >
                <span>Paystack & Gateway Settings</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
