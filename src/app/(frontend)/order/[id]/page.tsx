"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <button
          onClick={() => router.push("/account/orders")}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </button>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
        ) : !order ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Order Not Found</h3>
            <p className="text-xs text-slate-400">The requested order details could not be retrieved.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Status Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">{order.orderSerialNo}</h2>
                  <p className="text-xs text-slate-400">
                    Placed on: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      order.orderStatus === "delivered"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.orderStatus === "canceled"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Status: {order.orderStatus.replace(/_/g, " ")}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      order.paymentStatus === "paid"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    Payment: {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Status Timeline Bar */}
              {order.orderStatus !== "canceled" && (
                <div className="py-4">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0"></div>
                    {statusSteps.map((step, idx) => {
                      const currentIdx = getStepIndex(order.orderStatus);
                      const isCompleted = idx <= currentIdx;
                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                              isCompleted
                                ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600 capitalize mt-2 hidden sm:block">
                            {step.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cancel Order Action Button */}
              {order.orderStatus === "pending" && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCancelOrder}
                    disabled={canceling}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              )}
            </div>

            {/* Order Items Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-red-500" />
                <span>Ordered Items</span>
              </h3>

              <div className="divide-y divide-slate-100">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      {item.variationName && (
                        <p className="text-xs text-slate-400">Variant: {item.variationName}</p>
                      )}
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-extrabold text-slate-900">{formatPrice(item.itemTotal)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
                {order.deliveryCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span>{formatPrice(order.deliveryCharge)}</span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2 flex justify-between text-base font-black text-slate-900">
                  <span>Total Paid</span>
                  <span className="text-red-500">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
