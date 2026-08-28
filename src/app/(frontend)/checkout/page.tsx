"use client";

import React, { useState } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import AddressModal from "@/components/frontend/AddressModal";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingStore } from "@/store/useSettingStore";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  MapPin,
  Clock,
  CreditCard,
  Tag,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Truck,
  Store,
  ShieldCheck,
  Building,
} from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isGuest, guestInfo, setGuest } = useAuthStore();
  const {
    items,
    branchId,
    orderType,
    setOrderType,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotalAmount,
    couponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    deliveryTimeSlot,
    setDeliveryTimeSlot,
  } = useCartStore();
  const { formatPrice, activeBranch } = useSettingStore();

  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Guest Info state if not logged in
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Coupon state
  const [inputCoupon, setInputCoupon] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("paystack");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = getSubtotal();
  const taxAmount = (subtotal * 5) / 100;
  const deliveryCharge = orderType === "delivery" ? 5 : 0;
  const totalAmount = getTotalAmount(5, deliveryCharge);

  const handleApplyCoupon = () => {
    if (!inputCoupon) return;
    if (inputCoupon.toUpperCase() === "WELCOME10") {
      applyCoupon("WELCOME10", 10);
      toast.success("Coupon WELCOME10 applied! $10 discount.");
    } else {
      toast.error("Invalid coupon code.");
    }
  };

  const handleAddAddress = (newAddr: any) => {
    if (user) {
      const updatedAddresses = [...(user.addresses || []), newAddr];
      useAuthStore.getState().updateUser({ addresses: updatedAddresses });
      setSelectedAddressIndex(updatedAddresses.length - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    let customerName = user?.name || guestInfo?.name || guestName;
    let customerEmail = user?.email || guestInfo?.email || guestEmail;
    let customerPhone = user?.phone || guestInfo?.phone || guestPhone;

    if (!user && (!customerName || !customerPhone)) {
      toast.error("Please enter your contact details or login to place order.");
      return;
    }

    if (!user && !isGuest) {
      setGuest({ name: customerName, email: customerEmail, phone: customerPhone });
    }

    const deliveryAddress =
      orderType === "delivery"
        ? user?.addresses?.[selectedAddressIndex] || { address: "Default Customer Address" }
        : undefined;

    setIsPlacingOrder(true);
    toast.loading("Processing order...");

    try {
      const orderPayload = {
        userId: user?._id || null,
        customerName,
        customerEmail,
        customerPhone,
        orderType,
        branchId: branchId || activeBranch?._id || "default_branch",
        items,
        deliveryAddress,
        deliveryTimeSlot,
        paymentMethod: selectedPaymentMethod,
        couponCode,
        notes: "Order placed via Web App",
      };

      const res = await fetch("/api/frontend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      toast.dismiss();

      if (data.status) {
        const createdOrder = data.data;

        // If Paystack is selected, initialize Paystack Payment
        if (selectedPaymentMethod === "paystack") {
          toast.loading("Redirecting to Paystack Gateway...");
          const payRes = await fetch("/api/payments/paystack/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: createdOrder._id }),
          });

          const payData = await payRes.json();
          toast.dismiss();

          if (payData.status && payData.authorizationUrl) {
            clearCart();
            window.location.href = payData.authorizationUrl;
            return;
          } else {
            toast.error(payData.message || "Failed to initialize Paystack payment.");
          }
        } else {
          // COD or standard payment
          clearCart();
          toast.success("Order placed successfully!");
          router.push(`/order/${createdOrder._id}`);
        }
      } else {
        toast.error(data.message || "Failed to place order.");
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error("Error placing order: " + e.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Checkout</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-4 max-w-md mx-auto">
            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Your Cart is Empty</h3>
            <p className="text-xs text-slate-400">Add delicious food items from our menu to proceed.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md transition"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Options & Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type Toggle (Takeaway vs Delivery) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Order Type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOrderType("delivery")}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm border transition ${
                      orderType === "delivery"
                        ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Home Delivery</span>
                  </button>

                  <button
                    onClick={() => setOrderType("takeaway")}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm border transition ${
                      orderType === "takeaway"
                        ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Takeaway</span>
                  </button>
                </div>
              </div>

              {/* Nearest Branch Info */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
                  <Building className="w-4 h-4 text-red-500" />
                  <span>Preparing Branch</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {activeBranch ? activeBranch.name : "Default Main Branch"} - {activeBranch?.address || "City Center Store"}
                </p>
              </div>

              {/* Delivery Address System */}
              {orderType === "delivery" && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>Delivery Address</span>
                    </h3>
                    <button
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  {user && user.addresses && user.addresses.length > 0 ? (
                    <div className="space-y-2">
                      {user.addresses.map((addr: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedAddressIndex(idx)}
                          className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                            selectedAddressIndex === idx
                              ? "border-red-500 bg-red-50/50 text-slate-800"
                              : "border-slate-100 hover:border-slate-200 text-slate-600"
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md mr-2">
                              {addr.label}
                            </span>
                            <span className="text-sm font-medium">{addr.address}</span>
                          </div>
                          {selectedAddressIndex === idx && (
                            <CheckCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                      <p className="text-xs text-slate-500">No saved addresses found.</p>
                      <button
                        onClick={() => setIsAddressModalOpen(true)}
                        className="bg-white border border-slate-300 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm hover:border-red-500"
                      >
                        Create Address
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Guest / Contact Details (if not logged in) */}
              {!user && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Your Full Name *"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Delivery Time Slot Picker */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>Delivery Time Slot</span>
                </h3>
                <select
                  value={deliveryTimeSlot}
                  onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                >
                  <option value="As soon as possible">As soon as possible (20-35 mins)</option>
                  <option value="Today: 01:00 PM - 02:00 PM">Today: 01:00 PM - 02:00 PM</option>
                  <option value="Today: 03:00 PM - 04:00 PM">Today: 03:00 PM - 04:00 PM</option>
                  <option value="Today: 06:00 PM - 07:00 PM">Today: 06:00 PM - 07:00 PM</option>
                </select>
              </div>

              {/* Payment Gateway Selection */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-red-500" />
                  <span>Payment Gateway</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Paystack Option */}
                  <label
                    onClick={() => setSelectedPaymentMethod("paystack")}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      selectedPaymentMethod === "paystack"
                        ? "border-red-500 bg-red-50/50 text-slate-800 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-xs">
                        PS
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Paystack</p>
                        <p className="text-[10px] text-slate-400">Card, Bank, USSD</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === "paystack" && (
                      <CheckCircle className="w-5 h-5 text-red-500" />
                    )}
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    onClick={() => setSelectedPaymentMethod("cash_on_delivery")}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      selectedPaymentMethod === "cash_on_delivery"
                        ? "border-red-500 bg-red-50/50 text-slate-800 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                        COD
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Cash on Delivery</p>
                        <p className="text-[10px] text-slate-400">Pay cash upon arrival</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === "cash_on_delivery" && (
                      <CheckCircle className="w-5 h-5 text-red-500" />
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Action */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 sticky top-24">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
                  Order Summary
                </h3>

                {/* Items List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs font-medium">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        {item.variationName && (
                          <p className="text-[10px] text-slate-400">Variant: {item.variationName}</p>
                        )}
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-800">{formatPrice(item.itemTotal)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Input */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. WELCOME10)"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium uppercase focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 py-2 rounded-xl transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Costs Breakdown */}
                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax (5%)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                  {orderType === "delivery" && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(deliveryCharge)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2 flex justify-between text-base font-black text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-red-500">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Place Order Action */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-red-500/20 transition flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{selectedPaymentMethod === "paystack" ? "Pay with Paystack" : "Place Order"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleAddAddress}
      />
    </div>
  );
}
