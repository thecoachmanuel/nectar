"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Undo2, MapPin, Edit2, Clock, X, Home as HomeIcon, Plus } from "lucide-react";
import { useSettingStore } from "@/store/useSettingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatPrice } from "@/lib/formatters";
import { toast } from "sonner";
import AddressModal from "@/components/frontend/AddressModal";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isGuest, guestInfo, token, fetchUserProfile, updateUser } = useAuthStore();
  const { items, orderType, setOrderType, getSubtotal, getTotalAmount, clearCart, removeItem } = useCartStore();
  const { settings, fetchSettings } = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<"NOW" | "LATER">("NOW");
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleTab, setScheduleTab] = useState<"TODAY" | "TOMORROW">("TODAY");
  
  const [paymentMethod, setPaymentMethod] = useState<string>(""); // empty until settings loaded
  const [paymentMethodInitialized, setPaymentMethodInitialized] = useState(false);
  const [isNoAddressModalOpen, setIsNoAddressModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  
  // Fetch fresh settings and user profile/wallet on checkout page mount
  useEffect(() => {
    fetchSettings();
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile, fetchSettings]);

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

  // Automatically select default address when addresses load or update
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (defaultAddr?._id) setSelectedAddress(defaultAddr._id);
    }
  }, [addresses, selectedAddress]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = getSubtotal();
  const total = Math.max(0, subtotal + (deliveryCharge > 0 ? deliveryCharge : 0) - discountAmount);

  useEffect(() => {
    const currentItems = useCartStore.getState().items;
    if (currentItems.length > 0) {
      let isMounted = true;
      fetch("/api/frontend/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: currentItems })
      })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.status && Array.isArray(data.data)) {
          const activeItems = useCartStore.getState().items;
          if (activeItems.length === 0) return;

          const merged = data.data.map((syncedItem: any) => {
            const active = activeItems.find((i) => i.id === syncedItem.id);
            const qty = active ? active.quantity : syncedItem.quantity;
            const extraTotal = syncedItem.extras?.reduce((acc: number, e: any) => acc + (Number(e.price) || 0), 0) || 0;
            const addonTotal = syncedItem.addons?.reduce((acc: number, a: any) => acc + (Number(a.price) || 0), 0) || 0;
            const unitPrice = (Number(syncedItem.price) || 0) + extraTotal + addonTotal;

            return {
              ...syncedItem,
              quantity: qty,
              itemTotal: unitPrice * qty,
            };
          });

          useCartStore.getState().setItems(merged);
        }
      })
      .catch(err => console.error("Cart sync failed:", err))
      .finally(() => {
        if (isMounted) {
          setTimeout(() => setLoading(false), 200);
        }
      });

      return () => {
        isMounted = false;
      };
    } else {
      setTimeout(() => setLoading(false), 300);
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

      const customerName = user?.name || guestInfo?.name || "Guest";
      const customerEmail = user?.email || guestInfo?.email || "";
      const customerPhone = user?.phone || guestInfo?.phone || "";

      try {
        const res = await fetch("/api/frontend/checkout/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            items, 
            orderType, 
            deliveryAddress: deliveryAddressObj, 
            couponCode: appliedCoupon,
            customerName,
            customerEmail,
            customerPhone,
            userId: user?._id,
          })
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
  }, [items, orderType, selectedAddress, addresses, appliedCoupon, user, guestInfo]);

  const handleSaveCheckoutAddress = async (savedAddr: any) => {
    if (!token) {
      const tempId = savedAddr._id || `addr_${Date.now()}`;
      const newAddr = { ...savedAddr, _id: tempId };
      const current = user?.addresses || [];
      const updated = editingAddress 
        ? current.map((a: any) => a._id === savedAddr._id ? newAddr : a)
        : [...current, newAddr];
      updateUser({ addresses: updated });
      setSelectedAddress(tempId);
      setIsAddressModalOpen(false);
      setEditingAddress(null);
      toast.success("Delivery address set!");
      return;
    }

    try {
      toast.loading("Saving address to your account...");
      const res = await fetch("/api/frontend/account/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(savedAddr)
      });
      const data = await res.json();
      toast.dismiss();
      if (data.status) {
        updateUser({ addresses: data.data });
        if (savedAddr._id) {
          setSelectedAddress(savedAddr._id);
        } else if (Array.isArray(data.data) && data.data.length > 0) {
          const newest = data.data[data.data.length - 1];
          setSelectedAddress(newest._id);
        }
        setIsAddressModalOpen(false);
        setEditingAddress(null);
        toast.success(data.message || "Address saved successfully!");
      } else {
        toast.error(data.message || "Failed to save address");
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to save address");
    }
  };

  const handlePlaceOrder = async (bypassAddressCheck = false) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (orderType === "delivery" && !selectedAddress && !bypassAddressCheck) {
      setIsNoAddressModalOpen(true);
      return;
    }
    if (orderType === "delivery" && selectedAddress && deliveryCharge === -1) {
      toast.error("Your address is out of delivery range for one or more items.");
      return;
    }
    if (paymentMethod === "wallet" && walletBalance < total) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setIsNoAddressModalOpen(false);

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
            text += `  Price: ${formatPrice(item.price)}\n`;
            text += `  Quantity: ${item.quantity}\n`;
            text += `  Total: ${formatPrice(item.itemTotal)}\n`;
            text += `  --------------------------\n`;
          });
          text += `*Subtotal* : ${formatPrice(subtotal)}\n`;
          text += `*Discount* : ${formatPrice(discountAmount)}\n`;
          text += `*Delivery* : ${deliveryCharge === 0 ? "FREE" : formatPrice(deliveryCharge)}\n`;
          text += `*Total*    : ${formatPrice(total)}\n`;
          text += `--------------------------\n`;
          text += `*Customer Info*\n`;
          text += `Name: ${customerName}\n`;
          text += `Phone: ${customerPhone}\n`;
          if (deliveryAddressObj) {
            text += `Address: ${deliveryAddressObj.address}\n`;
          } else if (orderType === "delivery") {
            text += `Address: Not provided (will send details via chat)\n`;
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
      const cEmail = user?.email || guestInfo?.email || "";
      const cPhone = user?.phone || guestInfo?.phone || "";
      const res = await fetch("/api/frontend/checkout/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items, 
          orderType, 
          deliveryAddress: orderType === "delivery" && selectedAddress ? addresses.find(a => a._id === selectedAddress) : undefined, 
          couponCode: couponCodeInput,
          customerEmail: cEmail,
          customerPhone: cPhone,
          userId: user?._id,
        })
      });
      const data = await res.json();
      if (data.status) {
        setAppliedCoupon(data.data.couponCode);
        setDiscountAmount(data.data.discountAmount || 0);
        if (data.data.isFreeDelivery) {
          setDeliveryCharge(0);
          toast.success("🚚 Free Delivery coupon applied! No delivery charge.");
        } else {
          toast.success("✅ Coupon applied successfully!");
        }
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
          <div className="errandshop-loader"></div>
        </div>
      )}
      
      <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 max-w-[965px]">
          {items.length > 0 ? (
            <Link href="/cart" className="text-xs font-medium inline-flex mb-3 items-center gap-2 text-primary hover:opacity-80 transition-colors">
              <Undo2 className="w-4 h-4" />
              <span>Back to Cart</span>
            </Link>
          ) : (
            <Link href="/" className="text-xs font-medium inline-flex mb-3 items-center gap-2 text-primary hover:opacity-80 transition-colors">
              <Undo2 className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="md:col-span-7">
              <div className="p-4 sm:p-6 mb-6 rounded-2xl shadow-sm bg-white border border-[#eff0f6]">
                
                {/* Delivery Address */}
                {orderType === "delivery" && (
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="capitalize font-medium text-[#14142b]">Delivery Address</h4>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6e7191] bg-[#f7f7fc] border border-[#eff0f6] px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(null);
                          setIsAddressModalOpen(true);
                        }}
                        className="group text-xs capitalize font-semibold flex items-center rounded-3xl py-1.5 px-3 gap-1 text-primary bg-primary-light transition hover:bg-primary hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Address</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.length === 0 ? (
                        <div className="col-span-full p-5 border border-dashed border-[#eff0f6] rounded-2xl text-center text-sm text-[#6e7191] bg-[#f7f7fc]/50">
                          <p className="mb-1 font-semibold text-[#14142B]">No saved addresses found</p>
                          <p className="text-xs text-[#a0a3bd] mb-3">
                            Add a delivery address to calculate exact distance and delivery fee, or proceed without one.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddress(null);
                              setIsAddressModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Delivery Address
                          </button>
                        </div>
                      ) : (
                        addresses.map((addr) => (
                          <div 
                            key={addr._id} 
                            onClick={() => setSelectedAddress(selectedAddress === addr._id ? null : (addr._id || null))}
                            className={`p-3 rounded-xl w-full border cursor-pointer transition-colors relative group ${selectedAddress === addr._id ? 'border-primary bg-primary-light' : 'border-[#F7F7FC] bg-[#F7F7FC] hover:border-primary/30'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs text-primary">
                                <HomeIcon className="w-3.5 h-3.5" />
                                <span className="font-medium">{addr.label || "Address"}</span>
                                {addr.isDefault && (
                                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-semibold">Default</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAddress(addr);
                                    setIsAddressModalOpen(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-primary text-[#6e7191]"
                                  title="Edit address"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress === addr._id ? 'border-primary' : 'border-[#a0a3bd]'}`}>
                                  {selectedAddress === addr._id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs flex gap-2 text-[#14142b]">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#a0a3bd] shrink-0" />
                              <span className="line-clamp-2">{addr.apartment ? `${addr.apartment}, ` : ''}{addr.address}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {addresses.length > 0 && selectedAddress && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedAddress(null)}
                          className="text-[11px] text-[#6e7191] hover:text-primary transition-colors underline"
                        >
                          Deselect address (proceed without address)
                        </button>
                      </div>
                    )}
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
                      className={`w-fit py-2.5 px-4 rounded-xl flex items-start gap-5 cursor-pointer border transition-all duration-300 ${schedule === "NOW" ? 'bg-primary-light border-primary' : 'bg-white border-[#eff0f6]'}`}
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
                      className={`w-fit py-2.5 px-4 rounded-xl flex items-start gap-5 cursor-pointer border transition-all duration-300 ${schedule === "LATER" ? 'bg-primary-light border-primary' : 'bg-white border-[#eff0f6]'}`}
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
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-300 ${paymentMethod === "paystack" ? 'bg-primary-light border-primary' : 'bg-white border-[#eff0f6]'}`}
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
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-300 ${paymentMethod === "whatsapp" ? 'bg-primary-light border-primary' : 'bg-white border-[#eff0f6]'}`}
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
                      className={`w-full py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all duration-300 ${paymentMethod === "wallet" ? 'bg-primary-light border-primary' : 'bg-white border-[#eff0f6]'}`}
                    >
                      <div>
                        <span className="block text-sm font-medium text-[#14142b]">Wallet</span>
                        <span className="block text-xs font-bold text-primary mt-0.5">Bal: {formatPrice(walletBalance)}</span>
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
                  <div className="flex items-center rounded-2xl w-fit mx-auto mb-6 bg-[#F7F7FC] p-1 border border-[#EFF0F6]">
                    <button 
                      onClick={() => setOrderType("delivery")}
                      className={`py-1.5 px-4 rounded-2xl text-xs font-semibold capitalize transition-all cursor-pointer ${orderType === "delivery" ? 'text-white shadow-xs' : 'text-[#6E7191] hover:text-[#14142B]'}`}
                      style={{
                        backgroundColor: orderType === "delivery" ? "var(--footer-hex)" : undefined
                      }}
                    >
                      Delivery
                    </button>
                    {settings.takeaway_enabled === "Yes" && (
                      <button 
                        onClick={() => setOrderType("takeaway")}
                        className={`py-1.5 px-4 rounded-2xl text-xs font-semibold capitalize transition-all cursor-pointer ${orderType === "takeaway" ? 'text-white shadow-xs' : 'text-[#6E7191] hover:text-[#14142B]'}`}
                        style={{
                          backgroundColor: orderType === "takeaway" ? "var(--footer-hex)" : undefined
                        }}
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
                            <span 
                              className="absolute top-0 -left-2 text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white z-10 shadow-sm border-2 border-white"
                              style={{ backgroundColor: "var(--footer-hex)" }}
                            >
                              {cart.quantity}
                            </span>
                            <img src={cart.image || "/images/item/thumb.png"} alt={cart.name} className="w-14 h-14 rounded-xl object-cover bg-[#f7f7fc]" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium capitalize text-[#14142b] mb-1">{cart.name}</h4>
                              <p className="text-xs font-semibold text-[#14142b]">{formatPrice(cart.price)}</p>
                            </div>
                            <div className="font-bold text-[#14142b] text-sm">
                              {formatPrice(cart.itemTotal)}
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
                        className="px-4 py-2 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: "var(--footer-hex)" }}
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-6 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-green-700">
                          <span className="text-sm font-bold uppercase font-mono">{appliedCoupon}</span>
                          <span className="text-xs font-semibold bg-green-100 px-2 py-0.5 rounded-full text-green-700">✓ Applied</span>
                        </div>
                        {deliveryCharge === 0 && discountAmount === 0 && (
                          <span className="text-[11px] font-semibold text-emerald-600">🚚 Free Delivery applied!</span>
                        )}
                        {discountAmount > 0 && (
                          <span className="text-[11px] font-semibold text-green-600">You save {formatPrice(discountAmount)}</span>
                        )}
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-xs font-medium text-red-500 hover:text-red-700 underline">Remove</button>
                    </div>
                  )}

                  <div className="rounded-xl mb-6 border border-[#EFF0F6] bg-white overflow-hidden">
                    <ul className="flex flex-col gap-2 p-3 sm:p-4 border-b border-dashed border-[#EFF0F6]">
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm capitalize">Subtotal</span>
                        <span className="text-sm font-semibold text-[#14142b]">{formatPrice(subtotal)}</span>
                      </li>
                      <li className="flex items-center justify-between text-[#6e7191]">
                        <span className="text-sm capitalize">Discount</span>
                        <span className={`text-sm ${discountAmount > 0 ? "text-green-600 font-semibold" : ""}`}>
                          {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : formatPrice(0)}
                        </span>
                      </li>
                      {orderType === "delivery" && (
                        <li className="flex items-center justify-between text-[#6e7191]">
                          <span className="text-sm capitalize">Delivery Charge</span>
                          {deliveryCharge === -1 ? (
                            <span className="text-sm font-medium text-[#FB4E4E]">Out of Range</span>
                          ) : deliveryCharge === 0 && appliedCoupon ? (
                            <span className="text-sm font-bold text-emerald-600">🚚 FREE</span>
                          ) : (
                            <span className="text-sm font-semibold text-[#1AB759]">{formatPrice(deliveryCharge)}</span>
                          )}
                        </li>
                      )}
                    </ul>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-primary-light">
                      <h4 className="text-base font-bold capitalize text-[#14142b]">Total</h4>
                      <h5 className="text-lg font-extrabold text-primary">{formatPrice(total)}</h5>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handlePlaceOrder(false)}
                    disabled={loading || (paymentMethod === "wallet" && walletBalance < total) || (orderType === "delivery" && selectedAddress !== null && deliveryCharge === -1)}
                    className={`w-full flex justify-center items-center gap-2 rounded-2xl capitalize font-bold text-base py-3.5 text-white transition-all shadow-md disabled:opacity-50 cursor-pointer ${paymentMethod === "whatsapp" ? 'bg-[#1AB759] hover:bg-[#159a4a] shadow-[#1AB759]/20' : 'bg-primary hover:opacity-90 shadow-primary/20'}`}
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
                    className={`w-full py-2.5 rounded-xl text-center text-sm cursor-pointer border transition-colors ${selectedTime?.includes(time) ? 'bg-primary-light border-primary font-medium text-primary' : 'border-[#eff0f6] bg-white text-[#14142b] hover:border-primary/40'}`}
                  >
                    {time}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No Delivery Address Confirmation Prompt Modal */}
      {isNoAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl p-6 overflow-hidden border border-[#eff0f6]">
            {/* Close Button */}
            <button
              onClick={() => setIsNoAddressModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#a0a3bd] hover:text-[#14142b] rounded-full hover:bg-[#f7f7fc] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Icon Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center shadow-inner mb-4">
                <MapPin className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-[#14142b]">
                No Delivery Address Selected
              </h3>
              <p className="text-xs sm:text-sm text-[#6e7191] mt-2 max-w-[280px] leading-relaxed">
                You haven&apos;t selected a delivery address for this order. Would you like to select one now, or proceed anyway?
              </p>
              <p className="text-[11px] text-[#a0a3bd] mt-1.5 italic">
                (You can share your address details directly via WhatsApp or phone call)
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handlePlaceOrder(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed Anyway
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsNoAddressModalOpen(false);
                  if (addresses.length === 0) {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl border border-[#eff0f6] bg-[#f7f7fc] hover:bg-[#eff0f6] text-[#14142b] font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
              >
                {addresses.length === 0 ? "Add Delivery Address" : "Select an Address"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Address Modal for Seamless Cross-Device Management */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        initialData={editingAddress}
        onSave={handleSaveCheckoutAddress}
      />
    </>
  );
}
