"use client";

import React from "react";
import { CheckCircle2, Clock, ChefHat, Truck } from "lucide-react";

export default function OrderStatusScreenPage() {
  
  // Mock live data for the status screen (often displayed on a TV)
  const orders = {
    pending: [
      { id: "10045", customer: "John Doe", time: "14:30" },
      { id: "10048", customer: "Sarah M.", time: "14:45" },
    ],
    preparing: [
      { id: "10042", customer: "Mike T.", time: "14:15" },
    ],
    ready: [
      { id: "10040", customer: "Walk-in", time: "14:05" },
      { id: "10039", customer: "UberEats", time: "14:00" },
    ]
  };

  return (
    <div className="min-h-[80vh] bg-[#F7F7FC]">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6 p-6">
        <h2 className="text-2xl font-bold text-[#14142B] text-center">Live Order Status Screen</h2>
        <p className="text-[#6E7191] text-center mt-1">This screen is designed to be cast to a TV in the waiting area.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pending */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#FFF4E5] p-4 border-b border-[#FFE8CC] flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#FF9F43]" />
            <h3 className="font-bold text-lg text-[#FF9F43]">Preparing Soon</h3>
            <span className="ml-auto bg-white text-[#FF9F43] font-bold px-3 py-1 rounded-full">{orders.pending.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {orders.pending.map(order => (
              <div key={order.id} className="p-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl font-black text-[#14142B]">#{order.id}</span>
                  <span className="text-sm font-semibold text-[#6E7191]">{order.time}</span>
                </div>
                <div className="text-sm font-medium text-[#4E4B66]">{order.customer}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preparing */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#E5F3FF] p-4 border-b border-[#CCE7FF] flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-[#008BBA]" />
            <h3 className="font-bold text-lg text-[#008BBA]">Now Preparing</h3>
            <span className="ml-auto bg-white text-[#008BBA] font-bold px-3 py-1 rounded-full">{orders.preparing.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {orders.preparing.map(order => (
              <div key={order.id} className="p-4 rounded-xl border border-[#008BBA] bg-[#E5F3FF] shadow-sm shadow-[#008BBA]/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl font-black text-[#008BBA]">#{order.id}</span>
                  <span className="text-sm font-semibold text-[#008BBA]">{order.time}</span>
                </div>
                <div className="text-sm font-bold text-[#008BBA]">{order.customer}</div>
                <div className="mt-3 w-full bg-white rounded-full h-2">
                  <div className="bg-[#008BBA] h-2 rounded-full w-[60%] animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#E0FFED] p-4 border-b border-[#B3FFD6] flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#1AB759]" />
            <h3 className="font-bold text-lg text-[#1AB759]">Ready for Pickup</h3>
            <span className="ml-auto bg-white text-[#1AB759] font-bold px-3 py-1 rounded-full">{orders.ready.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {orders.ready.map(order => (
              <div key={order.id} className="p-4 rounded-xl border-2 border-[#1AB759] bg-white shadow-sm shadow-[#1AB759]/20 animate-pulse">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-3xl font-black text-[#1AB759]">#{order.id}</span>
                </div>
                <div className="text-lg font-bold text-[#14142B]">{order.customer}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
