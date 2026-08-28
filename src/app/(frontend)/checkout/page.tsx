"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Undo2, MapPin, Edit2, Clock, X, Home as HomeIcon } from "lucide-react";
import { useSettingStore } from "@/store/useSettingStore";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<"DELIVERY" | "TAKEAWAY">("DELIVERY");
  const [schedule, setSchedule] = useState<"NOW" | "LATER">("NOW");
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleTab, setScheduleTab] = useState<"TODAY" | "TOMORROW">("TODAY");

  // Mock Data
  const cartItems = [
    { _id: "1", name: "Chicken Burger", price: 15.00, quantity: 2, image: "/images/item/thumb.png", total: 30.00 },
    { _id: "2", name: "Fries", price: 5.00, quantity: 1, image: "/images/item/thumb.png", total: 5.00 }
  ];
  const addresses = [
    { id: 1, label: "Home", address: "123 Main St, Cityville", apartment: "Apt 4B" }
  ];
  const [selectedAddress, setSelectedAddress] = useState<number>(1);
  const subtotal = 35.00;
  const deliveryCharge = orderType === "DELIVERY" ? 5.00 : 0;
  const discount = 0;
  const total = subtotal + deliveryCharge - discount;

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handlePlaceOrder = () => {
    setLoading(true);
    setTimeout(() => {
      router.push("/order-status");
    }, 1500);
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="foodappi-loader"></div>
        </div>
      )}
      
      <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 max-w-[965px]">
          <Link href="/" className="text-xs font-medium inline-flex mb-3 items-center gap-2 text-[#ff006b] hover:text-rose-600 transition-colors">
            <Undo2 className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="md:col-span-7">
              <div className="p-4 sm:p-6 mb-6 rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                
                {/* Delivery Address */}
                {orderType === "DELIVERY" && (
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <h4 className="capitalize font-medium text-[#14142b]">Delivery Address</h4>
                      <button className="group text-xs capitalize font-medium flex items-center rounded-3xl py-1.5 px-3 gap-1 text-[#00749B] bg-[#D6F5FF] transition hover:text-white hover:bg-[#00749B]">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => (
                        <label 
                          key={addr.id} 
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`p-3 rounded-xl w-full border cursor-pointer transition-colors ${selectedAddress === addr.id ? 'border-[#ff006b] bg-[#fff5f9]' : 'border-[#F7F7FC] bg-[#F7F7FC] hover:border-[#ff006b]/30'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs text-[#008BBA]">
                              <HomeIcon className="w-3.5 h-3.5" />
                              <span className="font-medium">{addr.label}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress === addr.id ? 'border-[#ff006b]' : 'border-[#a0a3bd]'}`}>
                              {selectedAddress === addr.id && <div className="w-2 h-2 rounded-full bg-[#ff006b]" />}
                            </div>
                          </div>
                          <div className="text-xs flex gap-2 text-[#14142b]">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#a0a3bd] shrink-0" />
                            <span>{addr.apartment ? `${addr.apartment}, ` : ''}{addr.address}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Time */}
                <div>
                  <h4 className="font-medium mb-3 text-[#14142b]">
                    {orderType === "DELIVERY" ? "Preferred Delivery Time" : "Preferred Takeaway Time"}
                  </h4>
                  <div className="flex flex-wrap items-start gap-4">
                    
                    <label 
                      onClick={() => setSchedule("NOW")}
                      className={`w-fit py-2.5 px-4 rounded-xl flex items-start gap-5 cursor-pointer border transition-all duration-300 ${schedule === "NOW" ? 'bg-[#fff5f9] border-[#ff006b]' : 'bg-white border-[#eff0f6]'}`}
                    >
                      <dl className="flex-auto">
                        <dt className="text-sm font-medium whitespace-nowrap mb-1 text-[#14142b]">Now</dt>
                        <dd className="text-xs whitespace-nowrap text-[#6e7191]">30 minutes</dd>
                      </dl>
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${schedule === "NOW" ? 'border-[#ff006b]' : 'border-[#a0a3bd]'}`}>
                        {schedule === "NOW" && <div className="w-2 h-2 rounded-full bg-[#ff006b]" />}
                      </div>
                    </label>

                    <label 
                      onClick={() => {
                        setSchedule("LATER");
                        setIsTimeModalOpen(true);
                      }}
                      className={`w-fit py-2.5 px-4 rounded-xl flex items-start gap-5 cursor-pointer border transition-all duration-300 ${schedule === "LATER" ? 'bg-[#fff5f9] border-[#ff006b]' : 'bg-white border-[#eff0f6]'}`}
                    >
                      <dl className="flex-auto">
                        <dt className="text-sm font-medium whitespace-nowrap mb-1 text-[#14142b]">Schedule for later</dt>
                        <dd className="text-xs whitespace-nowrap text-[#6e7191]">{selectedTime || "Choose a time"}</dd>
                      </dl>
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${schedule === "LATER" ? 'border-[#ff006b]' : 'border-[#a0a3bd]'}`}>
                        {schedule === "LATER" && <div className="w-2 h-2 rounded-full bg-[#ff006b]" />}
                      </div>
                    </label>
                    
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN (Cart Summary) */}
            <div className="md:col-span-5">
              <div className="rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                <div className="p-4 sm:p-5 border-b border-[#eff0f6]">
                  <h3 className="capitalize font-medium mb-4 text-center text-[#14142b]">Cart Summary</h3>
                  
                  {/* Delivery / Takeaway Toggle */}
                  <div className="flex items-center rounded-2xl w-fit mx-auto mb-6 bg-[#BDEFFF] p-1">
                    <button 
                      onClick={() => setOrderType("DELIVERY")}
                      className={`py-1.5 px-4 rounded-2xl text-xs font-medium capitalize transition-colors ${orderType === "DELIVERY" ? 'bg-[#008BBA] text-white' : 'text-[#008BBA] hover:bg-white/50'}`}
                    >
                      Delivery
                    </button>
                    <button 
                      onClick={() => setOrderType("TAKEAWAY")}
                      className={`py-1.5 px-4 rounded-2xl text-xs font-medium capitalize transition-colors ${orderType === "TAKEAWAY" ? 'bg-[#008BBA] text-white' : 'text-[#008BBA] hover:bg-white/50'}`}
                    >
                      Takeaway
                    </button>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cartItems.map((cart, idx) => (
                      <div key={idx} className="pb-4 border-b border-dashed border-[#eff0f6] last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 relative">
                          <span className="absolute top-0 -left-2 text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white bg-[#14142b] z-10 shadow-sm border-2 border-white">
                            {cart.quantity}
                          </span>
                          <img src={cart.image} alt={cart.name} className="w-14 h-14 rounded-xl object-cover bg-[#f7f7fc]" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium capitalize text-[#14142b] mb-1">{cart.name}</h4>
                            <p className="text-xs font-semibold text-[#14142b]">₦{cart.price.toFixed(2)}</p>
                          </div>
                          <div className="font-bold text-[#14142b] text-sm">
                            ₦{cart.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-gray-50/50 rounded-b-2xl">
                  {/* Coupon input mock */}
                  <div className="flex gap-2 mb-6">
                    <input type="text" placeholder="Coupon code" className="flex-1 px-4 py-2 bg-white border border-[#eff0f6] rounded-xl text-sm focus:outline-none focus:border-[#ff006b]" />
                    <button className="px-4 py-2 bg-[#14142b] text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">Apply</button>
                  </div>

                  <div className="rounded-xl mb-6 border border-[#EFF0F6] bg-white overflow-hidden">
                    <ul className="flex flex-col gap-2 p-3 sm:p-4 border-b border-dashed border-[#EFF0F6]">
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm capitalize">Subtotal</span>
                        <span className="text-sm">₦{subtotal.toFixed(2)}</span>
                      </li>
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm capitalize">Discount</span>
                        <span className="text-sm">₦{discount.toFixed(2)}</span>
                      </li>
                      {orderType === "DELIVERY" && (
                        <li className="flex items-center justify-between text-[#6e7191]">
                          <span className="text-sm capitalize">Delivery Charge</span>
                          <span className="text-sm font-medium text-[#1AB759]">₦{deliveryCharge.toFixed(2)}</span>
                        </li>
                      )}
                    </ul>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-[#fff5f9]/30">
                      <h4 className="text-base font-bold capitalize text-[#14142b]">Total</h4>
                      <h5 className="text-lg font-bold text-[#ff006b]">₦{total.toFixed(2)}</h5>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handlePlaceOrder}
                    className="w-full rounded-2xl capitalize font-bold text-base py-3.5 text-white bg-[#ff006b] hover:bg-rose-600 transition-colors shadow-md shadow-[#ff006b]/20"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Time Schedule Modal */}
      {isTimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#eff0f6]">
              <h3 className="text-lg font-semibold capitalize text-[#14142b]">Select Time Schedule</h3>
              <button onClick={() => setIsTimeModalOpen(false)} className="text-[#a0a3bd] hover:text-[#ff006b] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-[#eff0f6]">
              <nav className="w-fit flex items-center rounded-full bg-[#f7f7fc] p-1 border border-[#eff0f6]">
                <button 
                  onClick={() => setScheduleTab("TODAY")}
                  className={`text-sm font-medium capitalize h-9 px-6 rounded-full transition-colors ${scheduleTab === "TODAY" ? 'text-white bg-[#ff006b] shadow-sm' : 'text-[#6e7191] hover:text-[#14142b]'}`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setScheduleTab("TOMORROW")}
                  className={`text-sm font-medium capitalize h-9 px-6 rounded-full transition-colors ${scheduleTab === "TOMORROW" ? 'text-white bg-[#ff006b] shadow-sm' : 'text-[#6e7191] hover:text-[#14142b]'}`}
                >
                  Tomorrow
                </button>
              </nav>
            </div>

            <div className="p-4 max-h-[300px] overflow-y-auto">
              <ul className="grid grid-cols-2 gap-3">
                {["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM"].map((time) => (
                  <li 
                    key={time}
                    onClick={() => {
                      setSelectedTime(`${scheduleTab === 'TODAY' ? 'Today' : 'Tomorrow'} - ${time}`);
                      setIsTimeModalOpen(false);
                    }}
                    className={`w-full py-2.5 rounded-xl text-center text-sm cursor-pointer border transition-colors ${selectedTime?.includes(time) ? 'bg-[#fff5f9] border-[#ff006b] font-medium text-[#ff006b]' : 'border-[#eff0f6] bg-white text-[#14142b] hover:border-[#ff006b]/40'}`}
                  >
                    {time}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
