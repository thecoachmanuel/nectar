"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Undo2, MapPin, Edit2, Clock, X, Home as HomeIcon } from "lucide-react";
import { useSettingStore } from "@/store/useSettingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isGuest, guestInfo, token } = useAuthStore();
  const { items, orderType, setOrderType, getSubtotal, getTotalAmount, clearCart } = useCartStore();
  const { settings } = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<"NOW" | "LATER">("NOW");
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleTab, setScheduleTab] = useState<"TODAY" | "TOMORROW">("TODAY");
  
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "wallet">("paystack");
  const walletBalance = (user as any)?.walletBalance || 0;
  
  const addresses = user?.addresses || [];
  const [selectedAddress, setSelectedAddress] = useState<string | null>(addresses.length > 0 ? addresses[0]._id || null : null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const subtotal = getSubtotal();
  const total = getTotalAmount(0, deliveryCharge);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  useEffect(() => {
    const fetchDeliveryCharge = async () => {
      if (orderType === "takeaway" || items.length === 0) {
        setDeliveryCharge(0);
        return;
      }
      
      let deliveryAddressObj = undefined;
      if (orderType === "delivery" && selectedAddress) {
        deliveryAddressObj = addresses.find(a => a._id === selectedAddress);
      }

      try {
        const res = await fetch("/api/frontend/checkout/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, orderType, deliveryAddress: deliveryAddressObj })
        });
        const data = await res.json();
        if (data.status) {
          setDeliveryCharge(data.data.deliveryCharge);
        }
      } catch (err) {
        console.error("Failed to calculate delivery fee", err);
      }
    };
    
    fetchDeliveryCharge();
  }, [items, orderType, selectedAddress, addresses]);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (orderType === "delivery" && !selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    if (paymentMethod === "wallet" && walletBalance < total) {
      toast.error("Insufficient wallet balance");
      return;
    }

    const customerName = user?.name || guestInfo?.name || "Guest";
    const customerEmail = user?.email || guestInfo?.email || "";
    const customerPhone = user?.phone || guestInfo?.phone || "N/A";
    
    let deliveryAddressObj = undefined;
    if (orderType === "delivery" && selectedAddress) {
      deliveryAddressObj = addresses.find(a => a._id === selectedAddress);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/frontend/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          orderType,
          items,
          subtotal,
          taxAmount: 0,
          discountAmount: 0,
          deliveryCharge,
          totalAmount: total,
          deliveryAddress: deliveryAddressObj,
          deliveryTimeSlot: schedule === "NOW" ? "As soon as possible" : selectedTime,
          paymentMethod: paymentMethod,
        })
      });
      
      const data = await res.json();
      if (data.status) {
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/order/${data.orderId}`);
      } else {
        toast.error(data.message || "Failed to place order");
        setLoading(false);
      }
    } catch (error) {
      toast.error("An error occurred");
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="nectar-loader"></div>
        </div>
      )}
      
      <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 max-w-[965px]">
          <Link href="/" className="text-xs font-medium inline-flex mb-3 items-center gap-2 text-primary hover:text-rose-600 transition-colors">
            <Undo2 className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="md:col-span-7">
              <div className="p-4 sm:p-6 mb-6 rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                
                {/* Delivery Address */}
                {orderType === "delivery" && (
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <h4 className="capitalize font-medium text-[#14142b]">Delivery Address</h4>
                      <Link href="/account/addresses" className="group text-xs capitalize font-medium flex items-center rounded-3xl py-1.5 px-3 gap-1 text-[#00749B] bg-[#D6F5FF] transition hover:text-white hover:bg-[#00749B]">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Add/Edit</span>
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.length === 0 ? (
                        <div className="col-span-full p-4 border border-dashed border-[#eff0f6] rounded-xl text-center text-sm text-[#6e7191]">
                          No addresses found. <Link href="/account/addresses" className="text-primary font-medium hover:underline">Add one now</Link>.
                        </div>
                      ) : (
                        addresses.map((addr) => (
                          <label 
                            key={addr._id} 
                            onClick={() => setSelectedAddress(addr._id || null)}
                            className={`p-3 rounded-xl w-full border cursor-pointer transition-colors ${selectedAddress === addr._id ? 'border-primary bg-[#fff5f9]' : 'border-[#F7F7FC] bg-[#F7F7FC] hover:border-primary/30'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs text-[#008BBA]">
                                <HomeIcon className="w-3.5 h-3.5" />
                                <span className="font-medium">{addr.label || "Address"}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress === addr._id ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                                {selectedAddress === addr._id && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </div>
                            </div>
                            <div className="text-xs flex gap-2 text-[#14142b]">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#a0a3bd] shrink-0" />
                              <span>{addr.apartment ? `${addr.apartment}, ` : ''}{addr.address}</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
                

                {/* Preferred Time */}
                <div>
                  <h4 className="font-medium mb-3 text-[#14142b]">
                    {orderType === "delivery" ? "Preferred Delivery Time" : "Preferred Takeaway Time"}
                  </h4>
                  <div className="flex flex-wrap items-start gap-4">
                    
                    <label 
                      onClick={() => setSchedule("NOW")}
                      className={`w-fit py-2.5 px-4 rounded-xl flex items-start gap-5 cursor-pointer border transition-all duration-300 ${schedule === "NOW" ? 'bg-[#fff5f9] border-primary' : 'bg-white border-[#eff0f6]'}`}
                    >
                      <dl className="flex-auto">
                        <dt className="text-sm font-medium whitespace-nowrap mb-1 text-[#14142b]">Now</dt>
                        <dd className="text-xs whitespace-nowrap text-[#6e7191]">30 minutes</dd>
                      </dl>
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${schedule === "NOW" ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                        {schedule === "NOW" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </label>

                    <label 
                      onClick={() => {
                        setSchedule("LATER");
                        setIsTimeModalOpen(true);
                      }}
                      className={`w-fit py-2.5 px-4 rounded-xl flex items-start gap-5 cursor-pointer border transition-all duration-300 ${schedule === "LATER" ? 'bg-[#fff5f9] border-primary' : 'bg-white border-[#eff0f6]'}`}
                    >
                      <dl className="flex-auto">
                        <dt className="text-sm font-medium whitespace-nowrap mb-1 text-[#14142b]">Schedule for later</dt>
                        <dd className="text-xs whitespace-nowrap text-[#6e7191]">{selectedTime || "Choose a time"}</dd>
                      </dl>
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${schedule === "LATER" ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                        {schedule === "LATER" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </label>
                    
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-6 border-t border-[#eff0f6] pt-6">
                  <h4 className="font-medium mb-3 text-[#14142b]">Payment Method</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label 
                      onClick={() => setPaymentMethod("paystack")}
                      className={`w-full py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-300 ${paymentMethod === "paystack" ? 'bg-[#fff5f9] border-primary' : 'bg-white border-[#eff0f6]'}`}
                    >
                      <span className="text-sm font-medium text-[#14142b]">Pay Online (Paystack)</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "paystack" ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                        {paymentMethod === "paystack" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </label>

                    <label 
                      onClick={() => setPaymentMethod("wallet")}
                      className={`w-full py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-300 ${paymentMethod === "wallet" ? 'bg-[#fff5f9] border-primary' : 'bg-white border-[#eff0f6]'}`}
                    >
                      <div>
                        <span className="block text-sm font-medium text-[#14142b]">Wallet</span>
                        <span className="block text-xs font-bold text-primary mt-0.5">Bal: ₦{walletBalance.toLocaleString()}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "wallet" ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                        {paymentMethod === "wallet" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </label>
                  </div>
                  {paymentMethod === "wallet" && walletBalance < total && (
                    <p className="text-xs text-[#FB4E4E] mt-2 font-medium">Insufficient wallet balance. Please add funds or pay online.</p>
                  )}
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
                      onClick={() => setOrderType("delivery")}
                      className={`py-1.5 px-4 rounded-2xl text-xs font-medium capitalize transition-colors ${orderType === "delivery" ? 'bg-[#008BBA] text-white' : 'text-[#008BBA] hover:bg-white/50'}`}
                    >
                      Delivery
                    </button>
                    {settings.takeaway_enabled === "Yes" && (
                      <button 
                        onClick={() => setOrderType("takeaway")}
                        className={`py-1.5 px-4 rounded-2xl text-xs font-medium capitalize transition-colors ${orderType === "takeaway" ? 'bg-[#008BBA] text-white' : 'text-[#008BBA] hover:bg-white/50'}`}
                      >
                        Takeaway
                      </button>
                    )}
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4">
                    {items.length === 0 ? (
                      <p className="text-center text-sm text-[#6e7191]">Your cart is empty.</p>
                    ) : (
                      items.map((cart, idx) => (
                        <div key={idx} className="pb-4 border-b border-dashed border-[#eff0f6] last:border-0 last:pb-0">
                          <div className="flex items-center gap-3 relative">
                            <span className="absolute top-0 -left-2 text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white bg-[#14142b] z-10 shadow-sm border-2 border-white">
                              {cart.quantity}
                            </span>
                            <img src={cart.image || "/images/item/thumb.png"} alt={cart.name} className="w-14 h-14 rounded-xl object-cover bg-[#f7f7fc]" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium capitalize text-[#14142b] mb-1">{cart.name}</h4>
                              <p className="text-xs font-semibold text-[#14142b]">₦{cart.price.toFixed(2)}</p>
                            </div>
                            <div className="font-bold text-[#14142b] text-sm">
                              ₦{cart.itemTotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-gray-50/50 rounded-b-2xl">
                  {/* Coupon input mock */}
                  <div className="flex gap-2 mb-6">
                    <input type="text" placeholder="Coupon code" className="flex-1 px-4 py-2 bg-white border border-[#eff0f6] rounded-xl text-sm focus:outline-none focus:border-primary" />
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
                        <span className="text-sm">₦0.00</span>
                      </li>
                      {orderType === "delivery" && (
                        <li className="flex items-center justify-between text-[#6e7191]">
                          <span className="text-sm capitalize">Delivery Charge</span>
                          <span className="text-sm font-medium text-[#1AB759]">₦{deliveryCharge.toFixed(2)}</span>
                        </li>
                      )}
                    </ul>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-[#fff5f9]/30">
                      <h4 className="text-base font-bold capitalize text-[#14142b]">Total</h4>
                      <h5 className="text-lg font-bold text-primary">₦{total.toFixed(2)}</h5>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={loading || (paymentMethod === "wallet" && walletBalance < total)}
                    className="w-full flex justify-center items-center gap-2 rounded-2xl capitalize font-bold text-base py-3.5 text-white bg-primary hover:bg-rose-600 transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    {paymentMethod === "paystack" ? "Proceed to Payment" : "Place Order"}
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
              <button onClick={() => setIsTimeModalOpen(false)} className="text-[#a0a3bd] hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-[#eff0f6]">
              <nav className="w-fit flex items-center rounded-full bg-[#f7f7fc] p-1 border border-[#eff0f6]">
                <button 
                  onClick={() => setScheduleTab("TODAY")}
                  className={`text-sm font-medium capitalize h-9 px-6 rounded-full transition-colors ${scheduleTab === "TODAY" ? 'text-white bg-primary shadow-sm' : 'text-[#6e7191] hover:text-[#14142b]'}`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setScheduleTab("TOMORROW")}
                  className={`text-sm font-medium capitalize h-9 px-6 rounded-full transition-colors ${scheduleTab === "TOMORROW" ? 'text-white bg-primary shadow-sm' : 'text-[#6e7191] hover:text-[#14142b]'}`}
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
                    className={`w-full py-2.5 rounded-xl text-center text-sm cursor-pointer border transition-colors ${selectedTime?.includes(time) ? 'bg-[#fff5f9] border-primary font-medium text-primary' : 'border-[#eff0f6] bg-white text-[#14142b] hover:border-primary/40'}`}
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
