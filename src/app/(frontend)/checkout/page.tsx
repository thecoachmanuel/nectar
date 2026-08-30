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
  const { items, orderType, setOrderType, getSubtotal, getTotalAmount, clearCart, removeItem } = useCartStore();
  const { settings, fetchSettings } = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<"NOW" | "LATER">("NOW");
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleTab, setScheduleTab] = useState<"TODAY" | "TOMORROW">("TODAY");
  
  const [paymentMethod, setPaymentMethod] = useState<string>(""); // empty until settings loaded
  const [paymentMethodInitialized, setPaymentMethodInitialized] = useState(false);
  
  // Fetch fresh settings on checkout page mount to avoid stale cache
  useEffect(() => {
    fetchSettings();
  }, []);

  // Set default payment method ONCE after fresh settings are loaded
  useEffect(() => {
    if (paymentMethodInitialized) return; // Don't override user's choice
    const hasPaystack = settings.pay_paystack_enabled !== "No";
    const hasWhatsapp = settings.pay_whatsapp_enabled === "Yes";
    if (hasPaystack) {
      setPaymentMethod("paystack");
      setPaymentMethodInitialized(true);
    } else if (hasWhatsapp) {
      setPaymentMethod("whatsapp");
      setPaymentMethodInitialized(true);
    } else {
      setPaymentMethod("wallet");
      setPaymentMethodInitialized(true);
    }
  }, [settings, paymentMethodInitialized]);
  const walletBalance = (user as any)?.walletBalance || 0;
  
  const addresses = user?.addresses || [];
  const [selectedAddress, setSelectedAddress] = useState<string | null>(addresses.length > 0 ? addresses[0]._id || null : null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = getSubtotal();
  const total = Math.max(0, subtotal + (deliveryCharge > 0 ? deliveryCharge : 0) - discountAmount);

  useEffect(() => {
    if (items.length > 0) {
      fetch("/api/frontend/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status && data.data) {
          useCartStore.getState().setItems(data.data);
        }
      })
      .catch(err => console.error("Cart sync failed:", err))
      .finally(() => {
        setTimeout(() => setLoading(false), 300);
      });
    } else {
      setTimeout(() => setLoading(false), 500);
    }
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
          body: JSON.stringify({ items, orderType, deliveryAddress: deliveryAddressObj, couponCode: appliedCoupon })
        });
        const data = await res.json();
        if (data.status) {
          setDeliveryCharge(data.data.deliveryCharge);
          setDiscountAmount(data.data.discountAmount || 0);
          if (data.data.couponCode) setAppliedCoupon(data.data.couponCode);
        } else {
          if (data.outOfRangeStoreIds && data.outOfRangeStoreIds.length > 0) {
            const names = data.outOfRangeStoreNames.join(", ");
            toast.error(`Items from ${names} removed (outside delivery radius).`, { duration: 5000 });
            
            items.forEach(item => {
              const itemStoreId = item.storeId || "admin";
              if (data.outOfRangeStoreIds.includes(itemStoreId)) {
                removeItem(item.id);
              }
            });
          } else {
            setDeliveryCharge(-1);
            toast.error(data.message || "Failed to calculate delivery fee");
          }
        }
      } catch (err) {
        console.error("Failed to calculate delivery fee", err);
      }
    };
    
    fetchDeliveryCharge();
  }, [items, orderType, selectedAddress, addresses, appliedCoupon]);

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
    if (orderType === "delivery" && deliveryCharge === -1) {
      toast.error("Your address is out of delivery range for one or more items.");
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
          discountAmount: discountAmount,
          deliveryCharge,
          totalAmount: total,
          couponCode: appliedCoupon,
          couponDiscount: discountAmount,
          deliveryAddress: deliveryAddressObj,
          deliveryTimeSlot: schedule === "NOW" ? "As soon as possible" : selectedTime,
          paymentMethod: paymentMethod,
        })
      });
      
      const data = await res.json();
      if (data.status) {
        clearCart();
        
        if (paymentMethod === "paystack") {
          try {
            const initRes = await fetch("/api/payments/paystack/initialize", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
              body: JSON.stringify({ orderId: data.orderId })
            });
            const initData = await initRes.json();
            
            if (initData.status && initData.authorizationUrl) {
              window.location.href = initData.authorizationUrl;
              return;
            } else {
              toast.error(initData.message || "Failed to initialize Paystack payment");
              router.push(`/order/${data.orderId}`);
            }
          } catch (err) {
            toast.error("Payment initialization error");
            router.push(`/order/${data.orderId}`);
          }
        } else if (paymentMethod === "whatsapp") {
          const phone = settings.pay_whatsapp_phone_number || "";
          let text = `*New Order Placed*\n`;
          text += `****************************************************\n`;
          text += `*Order ID#* : ${data.orderId}\n`;
          text += `*Order Type* : ${orderType}\n`;
          text += `*Delivery Time* : ${schedule === "NOW" ? "As soon as possible" : selectedTime}\n`;
          text += `--------------------------\n`;
          text += `*Order Details*\n`;
          text += `--------------------------\n`;
          items.forEach((item, idx) => {
            text += `${idx + 1}) ${item.name}\n`;
            text += `  Price: ₦${item.price.toFixed(2)}\n`;
            text += `  Quantity: ${item.quantity}\n`;
            text += `  Total: ₦${item.itemTotal.toFixed(2)}\n`;
            text += `  --------------------------\n`;
          });
          text += `*Subtotal* : ₦${subtotal.toFixed(2)}\n`;
          text += `*Discount* : ₦${discountAmount.toFixed(2)}\n`;
          text += `*Delivery* : ₦${deliveryCharge.toFixed(2)}\n`;
          text += `*Total*    : ₦${total.toFixed(2)}\n`;
          text += `--------------------------\n`;
          text += `*Customer Info*\n`;
          text += `Name: ${customerName}\n`;
          text += `Phone: ${customerPhone}\n`;
          if (deliveryAddressObj) {
            text += `Address: ${deliveryAddressObj.address}\n`;
          }
          
          const encoded = encodeURIComponent(text);
          window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`, "_blank");
          
          toast.success("Order placed! Opening WhatsApp...");
          router.push(`/order/${data.orderId}`);
        } else {
          toast.success("Order placed successfully!");
          router.push(`/order/${data.orderId}`);
        }
      } else {
        toast.error(data.message || "Failed to place order");
        setLoading(false);
      }
    } catch (error) {
      toast.error("An error occurred");
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput) return;
    setIsApplyingCoupon(true);
    try {
      const res = await fetch("/api/frontend/checkout/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items, 
          orderType, 
          deliveryAddress: orderType === "delivery" && selectedAddress ? addresses.find(a => a._id === selectedAddress) : undefined, 
          couponCode: couponCodeInput 
        })
      });
      const data = await res.json();
      if (data.status) {
        setAppliedCoupon(data.data.couponCode);
        setDiscountAmount(data.data.discountAmount);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(data.message || "Invalid coupon code");
      }
    } catch (e) {
      toast.error("Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput("");
    toast.success("Coupon removed");
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
                      <Link href="/account/addresses?from=checkout" className="group text-xs capitalize font-medium flex items-center rounded-3xl py-1.5 px-3 gap-1 text-[#00749B] bg-[#D6F5FF] transition hover:text-white hover:bg-[#00749B]">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Add/Edit</span>
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.length === 0 ? (
                        <div className="col-span-full p-4 border border-dashed border-[#eff0f6] rounded-xl text-center text-sm text-[#6e7191]">
                          No addresses found. <Link href="/account/addresses?from=checkout" className="text-primary font-medium hover:underline">Add one now</Link>.
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
                  <div className="space-y-3">
                    {settings.pay_paystack_enabled !== "No" && (
                      <label 
                        onClick={() => setPaymentMethod("paystack")}
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-300 ${paymentMethod === "paystack" ? 'bg-[#fff5f9] border-primary' : 'bg-white border-[#eff0f6]'}`}
                      >
                        <span className="text-sm font-medium text-[#14142b]">Pay Online (Paystack)</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "paystack" ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                          {paymentMethod === "paystack" && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                      </label>
                    )}

                    {settings.pay_whatsapp_enabled === "Yes" && (
                      <label 
                        onClick={() => setPaymentMethod("whatsapp")}
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-300 ${paymentMethod === "whatsapp" ? 'bg-[#fff5f9] border-primary' : 'bg-white border-[#eff0f6]'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#14142b]">WhatsApp Checkout</span>
                          <span className="text-[10px] font-bold bg-[#1AB759] text-white px-2 py-0.5 rounded-full">NEW</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "whatsapp" ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                          {paymentMethod === "whatsapp" && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                      </label>
                    )}

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
                  {/* Coupon UI */}
                  {!appliedCoupon ? (
                    <div className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        placeholder="Coupon code" 
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        disabled={isApplyingCoupon}
                        className="flex-1 px-4 py-2 bg-white border border-[#eff0f6] rounded-xl text-sm uppercase focus:outline-none focus:border-primary disabled:opacity-50" 
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCodeInput}
                        className="px-4 py-2 bg-[#14142b] text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-6 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700">
                        <span className="text-sm font-bold uppercase">{appliedCoupon}</span>
                        <span className="text-xs font-medium bg-green-100 px-2 py-0.5 rounded-full">Applied</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-xs font-medium text-red-500 hover:text-red-700 underline">Remove</button>
                    </div>
                  )}

                  <div className="rounded-xl mb-6 border border-[#EFF0F6] bg-white overflow-hidden">
                    <ul className="flex flex-col gap-2 p-3 sm:p-4 border-b border-dashed border-[#EFF0F6]">
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm capitalize">Subtotal</span>
                        <span className="text-sm">₦{subtotal.toFixed(2)}</span>
                      </li>
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm capitalize">Discount</span>
                        <span className={`text-sm ${discountAmount > 0 ? "text-green-600 font-medium" : ""}`}>
                          {discountAmount > 0 ? "-" : ""}₦{discountAmount.toFixed(2)}
                        </span>
                      </li>
                      {orderType === "delivery" && (
                        <li className="flex items-center justify-between text-[#6e7191]">
                          <span className="text-sm capitalize">Delivery Charge</span>
                          <span className={`text-sm font-medium ${deliveryCharge === -1 ? 'text-[#FB4E4E]' : 'text-[#1AB759]'}`}>
                            {deliveryCharge === -1 ? "Out of Range" : `₦${deliveryCharge.toFixed(2)}`}
                          </span>
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
                    disabled={loading || (paymentMethod === "wallet" && walletBalance < total) || (orderType === "delivery" && deliveryCharge === -1)}
                    className={`w-full flex justify-center items-center gap-2 rounded-2xl capitalize font-bold text-base py-3.5 text-white transition-colors shadow-md disabled:opacity-50 ${paymentMethod === "whatsapp" ? 'bg-[#1AB759] hover:bg-[#159a4a] shadow-[#1AB759]/20' : 'bg-primary hover:bg-rose-600 shadow-primary/20'}`}
                  >
                    {paymentMethod === "paystack" ? "Proceed to Payment" : paymentMethod === "whatsapp" ? "Proceed To WhatsApp" : "Place Order"}
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
