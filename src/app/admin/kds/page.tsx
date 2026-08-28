"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  Search,
  ChevronDown,
  Clock,
  CheckCircle,
  PackageCheck
} from "lucide-react";

export default function KDSPage() {
  const [activeTab, setActiveTab] = useState("Items Board");
  const [orderFilter, setOrderFilter] = useState("All Orders");

  const orderFilters = ["All Orders", "Confirmed", "Preparing", "Done"];

  // Mock data
  const itemsBoard = [
    { name: "Chicken Biryani", quantity: 3, extras: ["Extra spicy"], instruction: "No onions" },
    { name: "Beef Burger", quantity: 2, variations: ["Large"], instruction: "" },
    { name: "Coca Cola", quantity: 5, instruction: "Cold" },
  ];

  const onlineOrders = [
    {
      id: "#10045",
      status: "Confirmed",
      schedule: "14:30",
      time: "Oct 12, 14:00",
      items: [
        { name: "Chicken Biryani", qty: 2, extras: ["Extra spicy"], variations: undefined },
        { name: "Coca Cola", qty: 2, extras: undefined, variations: undefined }
      ]
    },
    {
      id: "#10046",
      status: "Preparing",
      schedule: "15:00",
      time: "Oct 12, 14:15",
      items: [
        { name: "Beef Burger", qty: 1, variations: ["Large"], extras: undefined }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7FC] flex flex-col">
      {/* Header for KDS */}
      <header className="h-[70px] bg-white border-b border-[#EFF0F6] flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="w-10 h-10 rounded-xl bg-[#F7F7FC] text-[#6E7191] flex items-center justify-center hover:bg-[#EFF0F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-semibold text-xl text-[#14142B]">Kitchen Display System</h2>
        </div>
        
        {/* Mobile Tabs */}
        <div className="lg:hidden flex bg-[#F7F7FC] rounded-lg p-1">
          <button 
            onClick={() => setActiveTab("Items Board")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === "Items Board" ? "bg-white text-[#14142B] shadow-sm" : "text-[#6E7191]"}`}
          >
            Items
          </button>
          <button 
            onClick={() => setActiveTab("Orders")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === "Orders" ? "bg-white text-[#14142B] shadow-sm" : "text-[#6E7191]"}`}
          >
            Orders
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Items Board Sidebar */}
        <div className={`w-full lg:w-[320px] bg-white rounded-2xl shadow-sm border border-[#EFF0F6] flex flex-col ${activeTab === "Items Board" || typeof window !== 'undefined' && window.innerWidth >= 1024 ? "flex" : "hidden lg:flex"}`}>
          <div className="p-4 border-b border-[#EFF0F6]">
            <h3 className="font-semibold text-lg text-[#14142B]">Items Board</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <ul className="space-y-2">
              {itemsBoard.map((item, index) => (
                <li key={index} className="p-3 rounded-xl border border-[#EFF0F6] flex items-start justify-between gap-3 bg-[#FAFAFC]">
                  <div>
                    <h5 className="text-sm font-semibold text-[#14142B] mb-1">{item.name}</h5>
                    {item.variations && (
                      <p className="text-xs text-[#6E7191]">Var: {item.variations.join(", ")}</p>
                    )}
                    {item.extras && (
                      <p className="text-xs text-[#6E7191]">Extras: {item.extras.join(", ")}</p>
                    )}
                    {item.instruction && (
                      <p className="text-xs text-[#ff006b] font-medium mt-1">Note: {item.instruction}</p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#14142B] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {item.quantity}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Orders Area */}
        <div className={`flex-1 flex flex-col ${activeTab === "Orders" || typeof window !== 'undefined' && window.innerWidth >= 1024 ? "flex" : "hidden lg:flex"}`}>
          
          {/* Order Filters Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-3 mb-4 flex flex-col xl:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto hide-scrollbar">
              {orderFilters.map(filter => (
                <button 
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${orderFilter === filter ? "bg-[#fff5f9] text-[#ff006b]" : "bg-white border border-[#EFF0F6] text-[#14142B] hover:bg-[#F7F7FC]"}`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="relative w-full xl:w-64">
              <input 
                type="text" 
                placeholder="Search Order..." 
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Orders Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              
              {/* Online Orders Section */}
              <div className="col-span-full">
                <h3 className="font-semibold text-lg text-[#14142B] mb-3">Online Orders</h3>
              </div>

              {onlineOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-[#EFF0F6] overflow-hidden shadow-sm flex flex-col">
                  {/* Card Header */}
                  <div className={`px-4 py-3 flex items-center justify-between ${order.status === 'Confirmed' ? 'bg-[#fff5f9]' : 'bg-[#e5ebff]'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${order.status === 'Confirmed' ? 'text-[#ff006b]' : 'text-[#567DFF]'}`} />
                      <span className="font-bold text-[#14142B]">{order.id}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wide ${order.status === 'Confirmed' ? 'bg-[#ff006b]' : 'bg-[#567DFF]'}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-4">
                      <p className="text-sm text-[#6E7191] mb-1">Schedule: <span className="font-semibold text-[#14142B]">{order.schedule}</span></p>
                      <p className="text-xs text-[#A0A3BD] flex items-center justify-between">
                        {order.time}
                        <ChevronDown className="w-4 h-4" />
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar mb-4">
                      <ul className="space-y-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 border-b border-dashed border-[#EFF0F6] pb-3 last:border-none last:pb-0">
                            <span className="text-sm font-bold text-[#14142B]">{item.qty}x</span>
                            <div>
                              <h5 className="text-sm font-semibold text-[#14142B]">{item.name}</h5>
                              {item.variations && <p className="text-xs text-[#6E7191]">{item.variations.join(", ")}</p>}
                              {item.extras && <p className="text-xs text-[#6E7191]">Extras: {item.extras.join(", ")}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button className={`w-full h-10 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-auto ${order.status === 'Confirmed' ? 'bg-[#ff006b] hover:bg-[#e60060]' : 'bg-[#1AB759] hover:bg-[#159a4a]'}`}>
                      {order.status === 'Confirmed' ? 'Start Preparing' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
