"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Undo2, Search, ArrowRight, ShoppingBag } from "lucide-react";

export default function MyOrdersPage() {
  const [loading, setLoading] = useState(true);

  const activeOrders = [
    { id: 1, order_serial_no: "100452", status: "PREPARING", order_datetime: "28 Aug 2026, 12:45 PM", order_type: "DELIVERY", total_currency_price: "₦40.00" }
  ];

  const previousOrders = [
    { id: 2, order_serial_no: "100300", status: "DELIVERED", order_datetime: "20 Aug 2026, 05:30 PM", order_type: "DELIVERY", total_currency_price: "₦25.00" },
    { id: 3, order_serial_no: "100250", status: "CANCELED", order_datetime: "15 Aug 2026, 01:10 PM", order_type: "TAKEAWAY", total_currency_price: "₦15.00" }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-orange-100 text-orange-600";
      case "PREPARING": return "bg-blue-100 text-blue-600";
      case "DELIVERED": return "bg-green-100 text-green-600";
      case "CANCELED": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="foodappi-loader"></div>
        </div>
      )}
      
      <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <Link href="/" className="mb-3 inline-flex items-center gap-2 text-[#ff006b] hover:text-rose-600 transition-colors">
            <Undo2 className="w-4 h-4" />
            <span className="text-xs font-medium leading-6">Back to home</span>
          </Link>
          
          <div className="flex items-start flex-col md:flex-row gap-6">
            
            {/* Active Orders */}
            <div className="w-full">
              <h3 className="capitalize font-medium text-[26px] leading-[40px] mb-4 text-[#008BBA]">
                Active Orders
              </h3>
              {activeOrders.length > 0 ? (
                <ul className="w-full p-4 rounded-2xl shadow-sm flex flex-col gap-4 bg-white border border-[#eff0f6]">
                  {activeOrders.map((order) => (
                    <li key={order.id} className="w-full rounded-2xl bg-white">
                      <div className="w-full rounded-xl py-3 px-4 flex items-center gap-5 border border-[#EFF0F6] hover:border-[#ff006b]/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#D6F5FF] flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-6 h-6 text-[#008BBA]" />
                        </div>
                        <div className="w-full">
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mb-1">
                            <p className="text-sm leading-6 text-[#6e7191]">Order ID: <span className="text-[#14142b] font-medium">#{order.order_serial_no}</span></p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusColor(order.status)}`}>
                              {order.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs font-light mb-1 text-[#6e7191]">{order.order_datetime}</p>
                          <p className="text-sm font-normal capitalize mb-2 text-[#00749B]">{order.order_type}</p>
                          <div className="flex flex-wrap gap-3 items-center justify-between">
                            <p className="text-sm leading-6 capitalize text-[#6e7191]">
                              Total: <span className="font-bold text-[#14142b]">{order.total_currency_price}</span>
                            </p>
                            <Link href={`/order/${order.id}`} className="text-[10px] leading-4 font-bold flex items-center gap-1 text-[#ff006b] hover:text-rose-600 uppercase tracking-wide">
                              See Details <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="w-full p-8 rounded-2xl shadow-sm bg-white border border-[#eff0f6] text-center text-[#6e7191]">
                  No active orders.
                </div>
              )}
            </div>

            {/* Previous Orders */}
            <div className="w-full">
              <h3 className="capitalize font-medium text-[26px] leading-[40px] mb-4 text-[#008BBA]">
                Previous Orders
              </h3>
              {previousOrders.length > 0 ? (
                <div className="w-full p-4 rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                  <ul className="flex flex-col gap-4">
                    {previousOrders.map((order) => (
                      <li key={order.id} className="w-full rounded-xl py-3 px-4 flex items-center gap-5 border border-[#EFF0F6] hover:border-[#ff006b]/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#f7f7fc] flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-6 h-6 text-[#a0a3bd]" />
                        </div>
                        <div className="w-full">
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mb-1">
                            <p className="text-sm leading-6 text-[#6e7191]">Order ID: <span className="text-[#14142b] font-medium">#{order.order_serial_no}</span></p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusColor(order.status)}`}>
                              {order.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs font-light mb-1 text-[#6e7191]">{order.order_datetime}</p>
                          <p className="text-sm font-normal capitalize mb-2 text-[#00749B]">{order.order_type}</p>
                          <div className="flex flex-wrap gap-3 items-center justify-between">
                            <p className="text-sm leading-6 capitalize text-[#6e7191]">
                              Total: <span className="font-bold text-[#14142b]">{order.total_currency_price}</span>
                            </p>
                            <Link href={`/order/${order.id}`} className="text-[10px] leading-4 font-bold flex items-center gap-1 text-[#ff006b] hover:text-rose-600 uppercase tracking-wide">
                              See Details <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="w-full p-8 rounded-2xl shadow-sm bg-white border border-[#eff0f6] text-center text-[#6e7191]">
                  No previous orders.
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
