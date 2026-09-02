"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  Apple,
  Utensils, 
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  Ban,
  BellRing,
  Phone,
  Send,
  Ticket,
  MessageCircle,
  Bot,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();
        if (json.status) {
          setDashboardData(json.data);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 18) return "Good Afternoon,";
    return "Good Evening,";
  };

  const salesChartOptions: any = {
    chart: { type: 'area', fontFamily: 'inherit', zoom: { enabled: false }, toolbar: { show: false } },
    xaxis: { tooltip: { enabled: false }, axisBorder: { show: false }, labels: { show: false } },
    stroke: { width: 3, lineCap: "round", curve: "smooth" },
    colors: ["#FF4F99"],
    grid: { show: false },
    yaxis: { show: false },
    dataLabels: { enabled: false },
  };

  // Default charts if no daily aggregate is returned yet
  const salesChartSeries = [{ name: 'Sales', data: [0, 0, 0, dashboardData?.totalSales || 0] }];
  const ordersChartSeries = [{ name: 'Orders', data: [0, 0, 0, dashboardData?.totalOrders || 0] }];
  const customerChartSeries = [{ name: 'Customers', data: [0, 0, 0, dashboardData?.totalCustomers || 0] }];

  return (
    <div className="pb-16">
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="nectar-loader"></div>
        </div>
      )}

      {/* Greeting & WhatsApp Notification Info */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[26px] leading-10 capitalize text-primary">{getGreeting()}</h3>
          <h4 className="font-medium text-[22px] leading-[34px] capitalize text-[#14142B]">{user?.name || "Admin"}</h4>
        </div>

        {/* 🔔 Admin Order Notification WhatsApp Number Card */}
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-3.5 p-3.5 px-4 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all group max-w-fit"
          title="Click to manage Admin WhatsApp notification settings"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BellRing className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-semibold text-[#6E7191] uppercase tracking-wider">
                Order Alert WhatsApp
              </span>
              {dashboardData?.adminNotificationWhatsApp ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Not Set
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-[#14142B] font-mono group-hover:text-primary transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-500" />
              {dashboardData?.adminNotificationWhatsApp
                ? `+${dashboardData.adminNotificationWhatsApp}`
                : "Click to configure in Settings"}
            </p>
          </div>
        </Link>
      </div>

      {/* Admin Quick Action Hub */}
      <div className="mb-8 p-4 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6E7191]">
            ⚡ Admin Quick Features
          </span>
          <span className="text-[11px] text-[#A0A3BD] font-medium">Instant Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <Link
            href="/admin/push-notifications"
            className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-100 text-purple-700 transition-all flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-purple-600 group-hover:scale-110 transition-transform">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold truncate">Push Alerts</span>
          </Link>

          <Link
            href="/admin/coupons"
            className="p-3 rounded-xl bg-pink-50 hover:bg-pink-100/80 border border-pink-100 text-pink-700 transition-all flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
              <Ticket className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold truncate">Coupons</span>
          </Link>

          <Link
            href="/admin/whatsapp-chat"
            className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-700 transition-all flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold truncate">WhatsApp Live</span>
          </Link>

          <Link
            href="/admin/whatsapp"
            className="p-3 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-100 text-teal-700 transition-all flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-teal-600 group-hover:scale-110 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold truncate">Bot Settings</span>
          </Link>

          <Link
            href="/admin/items"
            className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-100 text-blue-700 transition-all flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
              <Apple className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold truncate">Products</span>
          </Link>

          <Link
            href="/admin/items-report"
            className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-100 text-amber-700 transition-all flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-amber-600 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold truncate">Sales Report</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-9">
        <h4 className="font-semibold text-[22px] leading-[34px] mb-3 capitalize text-[#14142B]">Overview</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-[#FF4F99] shadow-md shadow-[#FF4F99]/20">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#FF4F99]" />
            </div>
            {user?.role === "store_manager" ? (
              <div>
                <h3 className="font-medium text-white text-[11px] uppercase tracking-wide">Net Earnings</h3>
                <h4 className="font-semibold text-lg text-white">{formatPrice(dashboardData?.storeManagerEarnings || 0)}</h4>
              </div>
            ) : (
              <div>
                <h3 className="font-medium text-white text-[11px] uppercase tracking-wide">Total Revenue</h3>
                <h4 className="font-semibold text-lg text-white">{formatPrice(dashboardData?.totalSales || 0)}</h4>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl flex items-center gap-3 bg-[#00D09C] shadow-md shadow-[#00D09C]/20">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shrink-0">
              <Truck className="w-5 h-5 text-[#00D09C]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-[11px] uppercase tracking-wide">Delivery Fees</h3>
              <h4 className="font-semibold text-lg text-white">{formatPrice(dashboardData?.totalDeliveryCharges || 0)}</h4>
            </div>
          </div>

          <div className="p-4 rounded-2xl flex items-center gap-3 bg-[#FFA500] shadow-md shadow-[#FFA500]/20">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shrink-0">
              <CheckCircle className="w-5 h-5 text-[#FFA500]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-[11px] uppercase tracking-wide">Commission</h3>
              <h4 className="font-semibold text-lg text-white">{formatPrice(dashboardData?.totalCommission || 0)}</h4>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-[#8262FE] shadow-md shadow-[#8262FE]/20">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shrink-0">
              <ShoppingCart className="w-5 h-5 text-[#8262FE]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-[11px] uppercase tracking-wide">Total Orders</h3>
              <h4 className="font-semibold text-lg text-white">{dashboardData?.totalOrders || 0}</h4>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-[#567DFF] shadow-md shadow-[#567DFF]/20">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shrink-0">
              <Users className="w-5 h-5 text-[#567DFF]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-[11px] uppercase tracking-wide">Total Customers</h3>
              <h4 className="font-semibold text-lg text-white">{dashboardData?.totalCustomers || 0}</h4>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-[#A953FF] shadow-md shadow-[#A953FF]/20">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shrink-0">
              <Apple className="w-5 h-5 text-[#A953FF]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-[11px] uppercase tracking-wide">Total Products</h3>
              <h4 className="font-semibold text-lg text-white">{dashboardData?.totalItems || 0}</h4>
            </div>
          </div>

        </div>
      </div>

      {/* Order Statistics */}
      <div className="mb-9">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-[22px] leading-[34px] capitalize text-[#14142B]">Order Statistics</h4>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EFF0F6] bg-white text-sm text-[#14142B] hover:border-primary transition-colors">
            <Calendar className="w-4 h-4 text-primary" />
            All Time
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 mb-3">
          
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#fff5f9] shrink-0">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Total Orders</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.totalOrders || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFF6E6] shrink-0">
              <Clock className="w-6 h-6 text-[#FFB020]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Pending</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.pending || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E7FFF0] shrink-0">
              <CheckCircle className="w-6 h-6 text-[#1AB759]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Accept</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.accept || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#e5ebff] shrink-0">
              <Utensils className="w-6 h-6 text-[#567DFF]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Preparing</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.preparing || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F5EAFF] shrink-0">
              <PackageCheck className="w-6 h-6 text-[#A953FF]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Prepared</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.prepared || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E9F9FF] shrink-0">
              <Truck className="w-6 h-6 text-[#008BBA]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Out for Delivery</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.out_for_delivery || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#EBE7FF] shrink-0">
              <CheckCircle className="w-6 h-6 text-[#8262FE]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Delivered</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.delivered || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFEAEA] shrink-0">
              <XCircle className="w-6 h-6 text-[#FB4E4E]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Canceled</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.canceled || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E9EEFF] shrink-0">
              <RotateCcw className="w-6 h-6 text-[#567DFF]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Returned</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.returned || 0}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFEAEA] shrink-0">
              <Ban className="w-6 h-6 text-[#FB4E4E]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Rejected</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">{dashboardData?.orderStats?.rejected || 0}</h4>
            </div>
          </div>

        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-9">
        
        {/* Sales Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFF0F6] pb-4">
            <h3 className="font-semibold text-lg text-[#14142B]">Sales Summary</h3>
          </div>
          <div className="flex gap-11 mb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">{formatPrice(dashboardData?.totalSales || 0)}</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Total Sales</p>
            </div>
          </div>
          <div className="-ml-3">
            <Chart options={salesChartOptions as any} series={salesChartSeries} type="area" height={250} />
          </div>
        </div>

        {/* Orders Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFF0F6] pb-4">
            <h3 className="font-semibold text-lg text-[#14142B]">Orders Summary</h3>
          </div>
          <div className="flex gap-11 mb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">{dashboardData?.totalOrders || 0}</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Total Orders</p>
            </div>
          </div>
          <div className="-ml-3">
            <Chart options={{...salesChartOptions, colors: ["#8262FE"]} as any} series={ordersChartSeries} type="area" height={250} />
          </div>
        </div>

      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-9">
        
        {/* Customer Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFF0F6] pb-4">
            <h3 className="font-semibold text-lg text-[#14142B]">Customer Stats</h3>
          </div>
          <div className="flex gap-11 mb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">{dashboardData?.totalCustomers || 0}</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Total Customers</p>
            </div>
          </div>
          <div className="-ml-3">
            <Chart options={{...salesChartOptions, colors: ["#567DFF"]} as any} series={customerChartSeries} type="area" height={250} />
          </div>
        </div>

        {/* Top Customers (Table) */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 hover:shadow-md transition-shadow flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFF0F6] pb-4 shrink-0">
            <h3 className="font-semibold text-lg text-[#14142B]">Top Customers</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <ul className="space-y-4">
              {dashboardData?.topCustomersData?.map((c: any, i: number) => (
                <li key={i} className="flex items-center justify-between p-3 rounded-xl border border-[#EFF0F6] hover:bg-[#F7F7FC] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f7f7fc] text-primary flex items-center justify-center font-bold">
                      C{i + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#14142B]">{c._id || "Guest"}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-[#14142B]">{c.count} Orders</span>
                  </div>
                </li>
              ))}
              {(!dashboardData?.topCustomersData || dashboardData.topCustomersData.length === 0) && (
                <li className="text-center text-sm text-[#6E7191] mt-4">No order data available yet.</li>
              )}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
