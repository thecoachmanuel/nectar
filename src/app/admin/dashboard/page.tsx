"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  Utensils, 
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  Ban
} from "lucide-react";

// Dynamically import ApexCharts since it relies on window
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Chart Options
  const salesChartOptions: any = {
    chart: { type: 'area', fontFamily: 'inherit', zoom: { enabled: false }, toolbar: { show: false } },
    xaxis: { tooltip: { enabled: false }, axisBorder: { show: false }, labels: { show: false } },
    stroke: { width: 3, lineCap: "round", curve: "smooth" },
    colors: ["#FF4F99"],
    grid: { show: false },
    yaxis: { show: false },
    dataLabels: { enabled: false },
  };

  const salesChartSeries = [{ name: 'Sales', data: [10, 41, 35, 51, 49, 62, 69, 91, 148] }];

  const ordersChartOptions: any = {
    chart: { type: 'area', fontFamily: 'inherit', zoom: { enabled: false }, toolbar: { show: false } },
    xaxis: { tooltip: { enabled: false }, axisBorder: { show: false }, labels: { show: false } },
    stroke: { width: 3, lineCap: "round", curve: "smooth" },
    colors: ["#8262FE"],
    grid: { show: false },
    yaxis: { show: false },
    dataLabels: { enabled: false },
  };
  const ordersChartSeries = [{ name: 'Orders', data: [5, 20, 15, 30, 25, 40, 35, 50, 80] }];

  const customerChartOptions: any = {
    chart: { type: 'area', fontFamily: 'inherit', zoom: { enabled: false }, toolbar: { show: false } },
    xaxis: { tooltip: { enabled: false }, axisBorder: { show: false }, labels: { show: false } },
    stroke: { width: 3, lineCap: "round", curve: "smooth" },
    colors: ["#567DFF"],
    grid: { show: false },
    yaxis: { show: false },
    dataLabels: { enabled: false },
  };
  const customerChartSeries = [{ name: 'Customers', data: [2, 10, 8, 25, 20, 35, 45, 60, 90] }];

  return (
    <div className="pb-16 relative">
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="foodappi-loader"></div>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-8">
        <h3 className="font-semibold text-[26px] leading-10 capitalize text-[#ff006b]">{getGreeting()}</h3>
        <h4 className="font-medium text-[22px] leading-[34px] capitalize text-[#14142B]">Admin</h4>
      </div>

      {/* Overview Cards */}
      <div className="mb-9">
        <h4 className="font-semibold text-[22px] leading-[34px] mb-3 capitalize text-[#14142B]">Overview</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          
          <div className="p-4 rounded-2xl flex items-center gap-4 bg-[#FF4F99] shadow-md shadow-[#FF4F99]/20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shrink-0">
              <ShoppingBag className="w-6 h-6 text-[#FF4F99]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Total Sales</h3>
              <h4 className="font-semibold text-[22px] leading-[34px] text-white">₦24,500</h4>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl flex items-center gap-4 bg-[#8262FE] shadow-md shadow-[#8262FE]/20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shrink-0">
              <ShoppingCart className="w-6 h-6 text-[#8262FE]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Total Orders</h3>
              <h4 className="font-semibold text-[22px] leading-[34px] text-white">450</h4>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl flex items-center gap-4 bg-[#567DFF] shadow-md shadow-[#567DFF]/20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shrink-0">
              <Users className="w-6 h-6 text-[#567DFF]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Total Customers</h3>
              <h4 className="font-semibold text-[22px] leading-[34px] text-white">128</h4>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl flex items-center gap-4 bg-[#A953FF] shadow-md shadow-[#A953FF]/20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shrink-0">
              <Utensils className="w-6 h-6 text-[#A953FF]" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Total Menu Items</h3>
              <h4 className="font-semibold text-[22px] leading-[34px] text-white">56</h4>
            </div>
          </div>

        </div>
      </div>

      {/* Order Statistics */}
      <div className="mb-9">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-[22px] leading-[34px] capitalize text-[#14142B]">Order Statistics</h4>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EFF0F6] bg-white text-sm text-[#14142B] hover:border-[#ff006b] transition-colors">
            <Calendar className="w-4 h-4 text-[#ff006b]" />
            Today
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 mb-3">
          
          {/* Total Orders */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#fff5f9] shrink-0">
              <ShoppingCart className="w-6 h-6 text-[#ff006b]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Total Orders</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">450</h4>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFF6E6] shrink-0">
              <Clock className="w-6 h-6 text-[#FFB020]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Pending</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">12</h4>
            </div>
          </div>

          {/* Accept */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E7FFF0] shrink-0">
              <CheckCircle className="w-6 h-6 text-[#1AB759]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Accept</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">35</h4>
            </div>
          </div>

          {/* Preparing */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#e5ebff] shrink-0">
              <Utensils className="w-6 h-6 text-[#567DFF]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Preparing</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">8</h4>
            </div>
          </div>

          {/* Prepared */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F5EAFF] shrink-0">
              <PackageCheck className="w-6 h-6 text-[#A953FF]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Prepared</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">5</h4>
            </div>
          </div>

          {/* Out for Delivery */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E9F9FF] shrink-0">
              <Truck className="w-6 h-6 text-[#008BBA]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Out for Delivery</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">15</h4>
            </div>
          </div>

          {/* Delivered */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#EBE7FF] shrink-0">
              <CheckCircle className="w-6 h-6 text-[#8262FE]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Delivered</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">370</h4>
            </div>
          </div>

          {/* Canceled */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFEAEA] shrink-0">
              <XCircle className="w-6 h-6 text-[#FB4E4E]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Canceled</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">2</h4>
            </div>
          </div>

          {/* Returned */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E9EEFF] shrink-0">
              <RotateCcw className="w-6 h-6 text-[#567DFF]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Returned</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">1</h4>
            </div>
          </div>

          {/* Rejected */}
          <div className="flex items-center gap-4 p-4 rounded-xl shadow-sm border border-[#EFF0F6] bg-white hover:border-[#ff006b]/30 transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFEAEA] shrink-0">
              <Ban className="w-6 h-6 text-[#FB4E4E]" />
            </div>
            <div>
              <h3 className="font-normal text-sm leading-6 capitalize text-[#6E7191]">Rejected</h3>
              <h4 className="font-bold text-lg leading-[34px] text-[#14142B]">2</h4>
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
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EFF0F6] bg-[#f7f7fc] text-sm text-[#14142B] hover:border-[#ff006b] transition-colors">
              <Calendar className="w-4 h-4 text-[#ff006b]" />
              This Month
            </button>
          </div>
          <div className="flex gap-11 mb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">₦24,500</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Total Sales</p>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">₦816</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Avg Sales per day</p>
            </div>
          </div>
          <div className="-ml-3">
            <Chart options={salesChartOptions} series={salesChartSeries} type="area" height={250} />
          </div>
        </div>

        {/* Orders Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFF0F6] pb-4">
            <h3 className="font-semibold text-lg text-[#14142B]">Orders Summary</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EFF0F6] bg-[#f7f7fc] text-sm text-[#14142B] hover:border-[#8262FE] transition-colors">
              <Calendar className="w-4 h-4 text-[#8262FE]" />
              This Month
            </button>
          </div>
          <div className="flex gap-11 mb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">450</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Total Orders</p>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">15</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Avg Orders per day</p>
            </div>
          </div>
          <div className="-ml-3">
            <Chart options={ordersChartOptions} series={ordersChartSeries} type="area" height={250} />
          </div>
        </div>

      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-9">
        
        {/* Customer Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFF0F6] pb-4">
            <h3 className="font-semibold text-lg text-[#14142B]">Customer Stats</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EFF0F6] bg-[#f7f7fc] text-sm text-[#14142B] hover:border-[#567DFF] transition-colors">
              <Calendar className="w-4 h-4 text-[#567DFF]" />
              This Month
            </button>
          </div>
          <div className="flex gap-11 mb-2">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-[22px] leading-[34px] text-[#14142B]">128</h3>
              </div>
              <p className="text-xs text-[#6E7191]">Total Customers</p>
            </div>
          </div>
          <div className="-ml-3">
            <Chart options={customerChartOptions} series={customerChartSeries} type="area" height={250} />
          </div>
        </div>

        {/* Top Customers (Table) */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 hover:shadow-md transition-shadow flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFF0F6] pb-4 shrink-0">
            <h3 className="font-semibold text-lg text-[#14142B]">Top Customers</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <ul className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex items-center justify-between p-3 rounded-xl border border-[#EFF0F6] hover:bg-[#F7F7FC] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f7f7fc] text-[#ff006b] flex items-center justify-center font-bold">
                      C{i}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#14142B]">Customer {i}</h4>
                      <p className="text-xs text-[#6E7191]">+1 234 567 890{i}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-[#14142B]">2{i} Orders</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
