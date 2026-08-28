"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSettingStore } from "@/store/useSettingStore";
import {
  CheckCircle,
  Clock,
  MapPin,
  Building,
  AlertCircle,
  FileText,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Clock className="w-8 h-8 animate-spin text-[#ff006b]" /></div>}>
      <OrderDetailsContent />
    </Suspense>
  );
}

function OrderDetailsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice } = useSettingStore();

  const orderId = params?.id as string;
  const paymentQuery = searchParams.get("payment");
  const refQuery = searchParams.get("ref");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (orderId) {
      if (paymentQuery === "paystack" && refQuery) {
        verifyPaystackPayment(refQuery);
      } else {
        fetchOrderDetails();
      }
    }
  }, [orderId]);

  const verifyPaystackPayment = async (reference: string) => {
    toast.loading("Verifying Paystack transaction...");
    try {
      const res = await fetch("/api/payments/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, orderId }),
      });
      const data = await res.json();
      toast.dismiss();

      if (data.status) {
        toast.success("Payment verified via Paystack!");
      } else {
        toast.error(data.message || "Payment verification pending.");
      }
    } catch (e) {
      toast.dismiss();
      console.error("Paystack verification error:", e);
    } finally {
      fetchOrderDetails();
    }
  };

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/frontend/orders?orderId=${orderId}`);
      const data = await res.json();
      if (data.status && data.data) {
        const found = Array.isArray(data.data)
          ? data.data.find((o: any) => o._id === orderId)
          : data.data;
        setOrder(found);
      }
    } catch (e) {
      console.error("Fetch order details error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCanceling(true);
    toast.loading("Canceling order...");
    try {
      const res = await fetch("/api/frontend/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id, action: "cancel" }),
      });
      const data = await res.json();
      toast.dismiss();

      if (data.status) {
        toast.success("Order canceled successfully.");
        fetchOrderDetails();
      } else {
        toast.error(data.message || "Unable to cancel order.");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Cancel order error.");
    } finally {
      setCanceling(false);
    }
  };

  const statusSteps = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];

  const getStepIndex = (status: string) => {
    return statusSteps.indexOf(status);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => router.push("/account/orders")}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#6e7191] hover:text-[#14142b] transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to My Orders</span>
      </button>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 h-64 animate-pulse border border-[#eff0f6]"></div>
      ) : !order ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6] space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-[#14142b]">Order Not Found</h3>
          <p className="text-xs text-[#a0a3bd]">The requested order ID does not exist or was deleted.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Serial & Status */}
          <div className="bg-white rounded-2xl p-6 border border-[#eff0f6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-extrabold text-[#14142b]">#{order._id?.slice(-8).toUpperCase() || order.orderSerialNo}</h1>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                    order.orderStatus === "delivered"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.orderStatus === "canceled"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-[#a0a3bd]">Placed on {new Date(order.createdAt).toLocaleString()}</p>
            </div>

            {order.orderStatus === "pending" && (
              <button
                onClick={handleCancelOrder}
                disabled={canceling}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>

          {/* Stepper Progress */}
          {order.orderStatus !== "canceled" && (
            <div className="bg-white rounded-2xl p-6 border border-[#eff0f6] shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e7191]">Order Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {statusSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(order.orderStatus);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-xl border text-center space-y-1 transition ${
                        isDone
                          ? "border-[#ff006b] bg-[#fff0f6] text-[#ff006b]"
                          : "border-[#eff0f6] bg-[#f7f7fc] text-[#a0a3bd]"
                      }`}
                    >
                      <div className="flex justify-center">
                        {isDone ? (
                          <CheckCircle className="w-5 h-5 text-[#ff006b]" />
                        ) : (
                          <Clock className="w-5 h-5 opacity-40" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold capitalize">{step.replace(/_/g, " ")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details & Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-[#eff0f6] shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#14142b] border-b border-[#eff0f6] pb-3">
                Items Ordered
              </h3>
              <div className="space-y-3">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs font-medium">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#14142b]">{item.name}</p>
                      {item.variationName && (
                        <p className="text-[10px] text-[#a0a3bd]">Variant: {item.variationName}</p>
                      )}
                      <p className="text-[10px] text-[#a0a3bd]">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#14142b]">{formatPrice(item.itemTotal || item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#eff0f6] shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#14142b] border-b border-[#eff0f6] pb-3">
                Order Summary
              </h3>
              <div className="space-y-2 text-xs font-medium text-[#6e7191]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#14142b]">{formatPrice(order.subtotal || order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-bold text-[#14142b] capitalize">{order.paymentMethod || "Cash"}</span>
                </div>
                <div className="border-t border-[#eff0f6] pt-2 flex justify-between text-sm font-black text-[#14142b]">
                  <span>Total Paid</span>
                  <span className="text-[#ff006b]">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
