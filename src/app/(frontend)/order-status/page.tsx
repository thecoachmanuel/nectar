"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Undo2, MapPin, Phone, MessageSquare } from "lucide-react";

export default function OrderStatusPage() {
  const [loading, setLoading] = useState(true);

  // Mock Data
  const order = {
    order_serial_no: "100452",
    order_datetime: "28 Aug 2026, 12:45 PM",
    order_type: "DELIVERY",
    delivery_date: "28 Aug 2026",
    delivery_time: "01:30 PM",
    status: "PREPARING", // PENDING, ACCEPT, PREPARING, PREPARED, OUT_FOR_DELIVERY, DELIVERED
    payment_method: "Cash on Delivery",
    payment_status: "UNPAID",
    subtotal: 35.00,
    discount: 0.00,
    delivery_charge: 5.00,
    total: 40.00,
  };

  const orderBranch = {
    name: "Central Branch",
    address: "456 Food Avenue, City Center",
    phone: "+1234567890"
  };

  const orderAddress = {
    apartment: "Apt 4B",
    address: "123 Main St, Cityville"
  };

  const orderItems = [
    { id: 1, quantity: 2, item_name: "Chicken Burger", item_image: "/images/item/thumb.png", total_currency_price: "₦30.00" },
    { id: 2, quantity: 1, item_name: "Fries", item_image: "/images/item/thumb.png", total_currency_price: "₦5.00" }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getStatusIndex = (status: string) => {
    const statuses = ["PENDING", "ACCEPT", "PREPARING", "PREPARED", "OUT_FOR_DELIVERY", "DELIVERED"];
    return statuses.indexOf(status);
  };

  const currentStatusIndex = getStatusIndex(order.status);
  const statuses = [
    { key: "PENDING", label: "Placed" },
    { key: "ACCEPT", label: "Accept" },
    { key: "PREPARING", label: "Preparing" },
    { key: "PREPARED", label: "Prepared" },
    { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="foodappi-loader"></div>
        </div>
      )}
      
      <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <Link href="/account/my-orders" className="mb-3 inline-flex items-center gap-2 text-[#ff006b] hover:text-rose-600 transition-colors">
            <Undo2 className="w-4 h-4" />
            <span className="text-xs font-medium leading-6">Back to orders</span>
          </Link>
          
          <div className="flex flex-col md:flex-row items-start gap-6">
            
            {/* Left Column (Status & Info) */}
            <div className="w-full">
              <div className="p-4 sm:p-6 mb-6 rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                <h3 className="text-sm leading-6 mb-1 font-medium text-[#14142b]">
                  Order ID: <span className="text-[#008BBA]">#{order.order_serial_no}</span>
                </h3>
                <p className="text-xs font-light mb-3 text-[#6e7191]">{order.order_datetime}</p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm capitalize text-[#6e7191]">Order Type:</span>
                  <span className="text-sm capitalize text-[#14142b] font-medium">{order.order_type}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <span className="text-sm capitalize text-[#6e7191]">Delivery Time:</span>
                  <span className="text-sm capitalize text-[#14142b] font-medium">{order.delivery_date} {order.delivery_time}</span>
                </div>

                {/* Status Tracker */}
                <div className="mb-8">
                  <p className="text-xs text-center mb-2 text-[#6e7191]">Estimated Delivery Time</p>
                  <h4 className="text-xl font-medium text-center mb-6 text-[#14142b]">30 min</h4>
                  
                  <img src="/images/default/order-preparing.gif" alt="Order Status" className="h-32 mx-auto mb-4 object-contain opacity-80" />
                  <h5 className="text-xs font-normal text-center mb-8 text-[#6e7191]">The chef is preparing your food</h5>

                  <div className="px-4">
                    <ul className="flex items-center justify-between mx-2 mb-[70px] relative before:absolute before:top-2 before:left-0 before:w-full before:h-1 before:bg-[#ff006b]/20">
                      <div 
                        className="absolute top-2 left-0 h-1 bg-[#ff006b] transition-all duration-500" 
                        style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
                      ></div>
                      
                      {statuses.map((status, index) => {
                        const isCompleted = index <= currentStatusIndex;
                        return (
                          <li key={status.key} className="relative z-10 flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full border-[3px] bg-white transition-colors duration-300 ${isCompleted ? 'border-[#ff006b]' : 'border-[#eff0f6]'}`}>
                              {isCompleted && <div className="w-full h-full rounded-full bg-[#ff006b] scale-50"></div>}
                            </div>
                            <span className="absolute top-8 w-16 text-center text-[10px] leading-3 text-[#14142b] font-medium">
                              {status.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Branch Info */}
                <div className="pt-6 border-t border-[#eff0f6]">
                  <h3 className="font-medium mb-2 text-[#14142b]">{orderBranch.name}</h3>
                  <div className="flex items-center justify-between gap-5">
                    <div className="flex items-start justify-start gap-2.5">
                      <MapPin className="w-4 h-4 mt-1 text-[#6e7191] shrink-0" />
                      <span className="text-sm leading-6 text-[#14142b]">{orderBranch.address}</span>
                    </div>
                    <div className="flex gap-3">
                      <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[#D8FFFC] text-[#008BBA] hover:bg-[#008BBA] hover:text-white transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[#D8FFFC] text-[#008BBA] hover:bg-[#008BBA] hover:text-white transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 sm:p-6 mb-6 rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                <h3 className="text-sm leading-6 font-medium mb-2 text-[#14142b]">Delivery Address</h3>
                <div className="flex items-start justify-start gap-2.5">
                  <MapPin className="w-4 h-4 mt-1 text-[#6e7191] shrink-0" />
                  <span className="text-sm leading-6 text-[#14142b]">
                    {orderAddress.apartment ? orderAddress.apartment + ', ' : ''}
                    {orderAddress.address}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 sm:p-6 rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                <h3 className="capitalize font-medium text-sm leading-6 mb-3 text-[#14142b]">Payment Info</h3>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-center gap-2">
                    <span className="capitalize text-sm leading-6 text-[#6e7191]">Method:</span>
                    <span className="capitalize text-sm leading-6 text-[#14142b] font-medium">{order.payment_method}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="capitalize text-sm leading-6 text-[#6e7191]">Status:</span>
                    <span className={`capitalize text-sm leading-6 font-semibold ${order.payment_status === 'PAID' ? 'text-green-600' : 'text-red-500'}`}>
                      {order.payment_status}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column (Order Details) */}
            <div className="w-full md:w-[350px] shrink-0">
              <div className="rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                <div className="p-4 sm:p-5 border-b border-[#eff0f6]">
                  <h3 className="font-medium text-sm leading-6 capitalize mb-4 text-[#14142b]">Order Details</h3>
                  <div className="space-y-4">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="pb-4 border-b border-dashed border-[#eff0f6] last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 relative">
                          <span className="absolute top-0 -left-2 text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white bg-[#14142b] z-10 shadow-sm border-2 border-white">
                            {item.quantity}
                          </span>
                          <img src={item.item_image} alt={item.item_name} className="w-14 h-14 rounded-xl object-cover bg-[#f7f7fc]" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium capitalize text-[#14142b] hover:underline cursor-pointer">{item.item_name}</h4>
                            <h3 className="text-xs font-semibold text-[#14142b] mt-1">{item.total_currency_price}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 sm:p-5 bg-gray-50/50 rounded-b-2xl">
                  <div className="rounded-xl border border-[#EFF0F6] bg-white overflow-hidden">
                    <ul className="flex flex-col gap-2 p-3 sm:p-4 border-b border-dashed border-[#EFF0F6]">
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm leading-6 capitalize">Subtotal</span>
                        <span className="text-sm leading-6 capitalize">₦{order.subtotal.toFixed(2)}</span>
                      </li>
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm leading-6 capitalize">Discount</span>
                        <span className="text-sm leading-6 capitalize">₦{order.discount.toFixed(2)}</span>
                      </li>
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm leading-6 capitalize">Delivery Charge</span>
                        <span className="text-sm leading-6 capitalize font-medium text-[#1AB759]">₦{order.delivery_charge.toFixed(2)}</span>
                      </li>
                    </ul>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-[#fff5f9]/30">
                      <h4 className="text-sm leading-6 font-semibold capitalize text-[#14142b]">Total</h4>
                      <h5 className="text-sm leading-6 font-semibold capitalize text-[#ff006b]">₦{order.total.toFixed(2)}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
