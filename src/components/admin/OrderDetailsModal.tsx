"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Printer, 
  MapPin, 
  Phone, 
  Mail, 
  User as UserIcon, 
  Store as StoreIcon, 
  Bike, 
  ShieldCheck, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  KeyRound,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import { formatPrice } from "@/lib/formatters";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onOrderUpdated?: () => void;
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  orderId,
  onOrderUpdated
}: OrderDetailsModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [markingPaid, setMarkingPaid] = useState<boolean>(false);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [assigningDriver, setAssigningDriver] = useState<boolean>(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Thermal receipt state — same pattern as POS orders
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptFooterSignature, setReceiptFooterSignature] = useState("Powered by Nectar App");
  const [receiptHeaderTagline, setReceiptHeaderTagline] = useState("");

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
      fetchDeliveryAgents();
    } else {
      setOrder(null);
      setShowReceipt(false);
    }
  }, [isOpen, orderId]);

  // Fetch receipt settings once
  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(sData => {
        const items = sData.data || [];
        const footerSig = items.find((s: any) => s.key === "receipt_footer_signature");
        const tagline = items.find((s: any) => s.key === "receipt_header_tagline");
        if (footerSig?.payload) setReceiptFooterSignature(footerSig.payload);
        if (tagline?.payload) setReceiptHeaderTagline(tagline.payload);
      })
      .catch(() => {});
  }, []);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (data.status) {
        setOrder(data.data);
        if (data.data.deliveryBoyId) {
          setSelectedDriverId(String(data.data.deliveryBoyId));
        }
      } else {
        toast.error(data.message || "Failed to load order details");
      }
    } catch (error) {
      toast.error("Error fetching order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      const res = await fetch("/api/admin/delivery-boys");
      const data = await res.json();
      if (data.status) {
        setDeliveryBoys(data.data || []);
      }
    } catch (e) {}
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success(`Order status updated to ${newStatus.replace("_", " ")}`);
        fetchOrderDetails(order._id);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        toast.error(data.message || "Failed to update order status");
      }
    } catch (err) {
      toast.error("An error occurred while updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePaymentStatus = async (newStatus: "paid" | "unpaid") => {
    if (!order) return;
    const actionText = newStatus === "paid" ? "mark as PAID" : "mark as UNPAID";
    const confirm = window.confirm(
      `Are you sure you want to ${actionText} order #${order.orderSerialNo} (${formatPrice(order.totalAmount)})?`
    );
    if (!confirm) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success(`Payment status updated to ${newStatus.toUpperCase()}!`);
        fetchOrderDetails(order._id);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        toast.error(data.message || "Failed to update payment status");
      }
    } catch (err) {
      toast.error("An error occurred while updating payment status");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleAssignDeliveryAgent = async () => {
    if (!order || !selectedDriverId) return;
    setAssigningDriver(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryBoyId: selectedDriverId }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success("Delivery Agent assigned successfully!");
        fetchOrderDetails(order._id);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        toast.error(data.message || "Failed to assign delivery agent");
      }
    } catch (err) {
      toast.error("Failed to assign delivery agent");
    } finally {
      setAssigningDriver(false);
    }
  };

  if (!isOpen) return null;

  // ── Thermal receipt derived values ─────────────────────────────────────
  const receiptStoreName  = order?.storeInfo?.name || "Main Kitchen";
  const receiptStoreAddr  = order?.storeInfo?.address || "";
  const receiptStorePhone = order?.storeInfo?.phone || "";
  const receiptDate = order
    ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const receiptTime = order
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={order ? `Order Details - #${order.orderSerialNo}` : "Order Details"}
        maxWidth="max-w-5xl"
      >
        {loading || !order ? (
          <div className="p-12 text-center text-[#6E7191]">
            <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading order details...</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">

            {/* Top Bar Status & Print */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAFAFC] border border-[#EFF0F6] rounded-2xl">
              <div>
                <p className="text-xs text-[#6E7191]">Order Serial No</p>
                <h4 className="text-lg font-bold text-primary">#{order.orderSerialNo}</h4>
                <p className="text-xs text-[#A0A3BD] mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6E7191] mb-1">Status</p>
                  <select
                    value={order.orderStatus}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="h-9 px-3 text-xs font-bold rounded-xl border border-[#EFF0F6] bg-white text-[#14142B] focus:outline-none focus:border-primary cursor-pointer capitalize"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>

                {/* Print Invoice — opens thermal receipt modal */}
                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="h-9 px-4 rounded-xl bg-white border border-[#EFF0F6] text-[#14142B] hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm mt-4 sm:mt-0"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  Print Invoice
                </button>
              </div>
            </div>

            {/* Delivery PIN Highlight Card */}
            {order.orderType === "delivery" && order.deliveryPin && (
              <div 
                className="p-5 rounded-2xl shadow-md flex items-center justify-between gap-4 text-white"
                style={{ backgroundColor: "var(--primary-hex)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/90">Customer Delivery Verification PIN</p>
                    <p className="text-xs text-white/80">Require this 4-digit code from the customer before completing delivery</p>
                  </div>
                </div>
                <div 
                  className="bg-white px-5 py-2 rounded-xl font-mono text-2xl font-black tracking-widest shadow-inner shrink-0"
                  style={{ color: "var(--primary-hex)" }}
                >
                  {order.deliveryPin}
                </div>
              </div>
            )}

            {/* Grid Information Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Customer Information */}
              <div className="p-4 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC] space-y-3">
                <h5 className="text-xs font-bold text-[#14142B] uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary" /> Customer Info
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E7191]">Name:</span>
                    <span className="font-semibold text-[#14142B]">{order.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E7191]">Phone:</span>
                    <a href={`tel:${order.customerPhone}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {order.customerPhone}
                    </a>
                  </div>
                  {order.customerEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#6E7191]">Email:</span>
                      <span className="font-medium text-[#14142B]">{order.customerEmail}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#EFF0F6]">
                    <span className="text-[#6E7191] block mb-1">Delivery Address:</span>
                    <p className="font-medium text-[#14142B] bg-white p-2.5 rounded-xl border border-[#EFF0F6]">
                      {order.deliveryAddress?.address || "Takeaway / Direct Order"}
                      {order.deliveryAddress?.apartment && ` (Apt: ${order.deliveryAddress.apartment})`}
                    </p>
                    {order.deliveryAddress?.latitude && order.deliveryAddress?.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                      >
                        <MapPin className="w-3 h-3" /> View Location on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Store & Delivery Agent Info */}
              <div className="p-4 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC] space-y-3">
                <h5 className="text-xs font-bold text-[#14142B] uppercase tracking-wider flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-primary" /> Fulfillment & Logistics
                </h5>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E7191]">Order Type:</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
                      {order.orderType?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6E7191]">Store / Branch:</span>
                    <span className="font-semibold text-[#14142B]">
                      {order.storeInfo?.name || (String(order.storeId) === "0" || String(order.storeId) === "admin" ? "Main Admin Kitchen" : `Store ID #${order.storeId}`)}
                    </span>
                  </div>

                  {order.deliveryTimeSlot && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#6E7191]">Time Slot:</span>
                      <span className="font-medium text-[#14142B]">{order.deliveryTimeSlot}</span>
                    </div>
                  )}

                  {/* Delivery Agent Assignment Section */}
                  <div className="pt-2 border-t border-[#EFF0F6]">
                    <span className="text-[#6E7191] block mb-1.5 font-semibold">Assigned Delivery Agent:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="flex-1 h-9 px-3 text-xs rounded-xl border border-[#EFF0F6] bg-white text-[#14142B] focus:outline-none focus:border-primary"
                      >
                        <option value="">-- Assign Delivery Agent --</option>
                        {deliveryBoys.map((driver: any) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} ({driver.phone || "No Phone"})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={assigningDriver || !selectedDriverId}
                        onClick={handleAssignDeliveryAgent}
                        className="h-9 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-[#e60060] transition-colors disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                    {order.deliveryAgent && (
                      <p className="text-[11px] text-green-700 font-medium mt-1.5 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5" /> Assigned: {order.deliveryAgent.name} ({order.deliveryAgent.phone})
                      </p>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* Products Breakdown Table */}
            <div className="border border-[#EFF0F6] rounded-2xl overflow-hidden bg-white">
              <div className="p-3 bg-[#FAFAFC] border-b border-[#EFF0F6] flex items-center justify-between">
                <h5 className="text-xs font-bold text-[#14142B] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Ordered Products ({order.items?.length || 0})
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6] text-[#6E7191] font-semibold">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFF0F6]">
                    {order.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#FAFAFC]">
                        <td className="p-3">
                          <p className="font-semibold text-[#14142B]">{item.name}</p>
                          {item.variationName && (
                            <span className="text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium mr-2">
                              Variation: {item.variationName}
                            </span>
                          )}
                          {item.extras?.length > 0 && (
                            <p className="text-[11px] text-[#6E7191] mt-0.5">
                              Extras: {item.extras.map((ex: any) => `${ex.name} (+${formatPrice(ex.price)})`).join(", ")}
                            </p>
                          )}
                          {item.addons?.length > 0 && (
                            <p className="text-[11px] text-[#6E7191] mt-0.5">
                              Addons: {item.addons.map((ad: any) => `${ad.name} (+${formatPrice(ad.price)})`).join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-[#14142B] font-medium">{formatPrice(item.price)}</td>
                        <td className="p-3 text-center font-bold text-[#14142B]">{item.quantity}</td>
                        <td className="p-3 text-right font-bold text-[#14142B]">{formatPrice(item.itemTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Charges Calculation Box */}
            <div className="p-4 bg-[#FAFAFC] border border-[#EFF0F6] rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Payment Method & Meta */}
              <div className="space-y-2 text-xs">
                <h5 className="text-xs font-bold text-[#14142B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" /> Payment Summary
                </h5>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E7191]">Payment Method:</span>
                  <span className={`font-semibold text-[#14142B] uppercase flex items-center gap-1.5`}>
                    {order.paymentMethod === "whatsapp" && (
                      <span className="text-[10px] font-bold bg-[#1AB759] text-white px-1.5 py-0.5 rounded">WA</span>
                    )}
                    {order.paymentMethod || "Paystack"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E7191]">Payment Status:</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full capitalize text-[11px] ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                  </span>
                </div>

                {/* Admin Payment Toggle Buttons */}
                <div className="pt-2 border-t border-[#EFF0F6]">
                  {order.paymentStatus === "paid" ? (
                    <button
                      type="button"
                      onClick={() => handleUpdatePaymentStatus("unpaid")}
                      disabled={markingPaid}
                      className="w-full h-8 rounded-xl border border-[#D9DBE9] bg-white hover:bg-amber-50 text-amber-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {markingPaid ? (
                        <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      {markingPaid ? "Updating..." : "↩ Mark as Unpaid"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdatePaymentStatus("paid")}
                      disabled={markingPaid}
                      className="w-full h-9 rounded-xl bg-[#1AB759] hover:bg-[#159a4a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      {markingPaid ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {markingPaid ? "Updating..." : "✓ Confirm Payment (Mark as Paid)"}
                    </button>
                  )}
                </div>
                {order.paymentReference && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E7191]">Ref Code:</span>
                    <span className="font-mono text-[11px] text-[#4E4B66]">{order.paymentReference}</span>
                  </div>
                )}
                {order.couponCode && (
                  <div className="flex items-center justify-between text-green-700">
                    <span>Applied Coupon:</span>
                    <span className="font-bold">{order.couponCode}</span>
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1.5 text-xs text-right border-t md:border-t-0 md:border-l border-[#EFF0F6] pt-3 md:pt-0 md:pl-6">
                <div className="flex justify-between">
                  <span className="text-[#6E7191]">Products Subtotal:</span>
                  <span className="font-semibold text-[#14142B]">{formatPrice(order.subtotal)}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#6E7191]">Tax Amount:</span>
                    <span className="font-semibold text-[#14142B]">{formatPrice(order.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6E7191]">Delivery Fee:</span>
                  <span className="font-semibold text-[#14142B]">{formatPrice(order.deliveryCharge)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#EFF0F6] text-sm font-bold text-[#14142B]">
                  <span>Grand Total:</span>
                  <span className="text-primary text-base">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

            </div>

            {/* Action Buttons Footer */}
            <div className="pt-3 flex justify-end gap-3 border-t border-[#EFF0F6]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-10 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-medium hover:bg-[#F7F7FC] text-xs transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* ── 80MM THERMAL RECEIPT MODAL (same as POS orders page) ──────────────── */}
      {showReceipt && order && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-[340px] mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Top Action Bar */}
            <div className="p-3 bg-[#F7F7FC] border-b border-[#EFF0F6] flex items-center justify-between hidden-print">
              <button 
                onClick={() => setShowReceipt(false)} 
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#FB4E4E] hover:bg-red-600 text-white text-xs font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 py-2 px-5 rounded-xl bg-[#1AB759] hover:bg-green-600 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>

            {/* 80mm Thermal Receipt Content */}
            <div id="thermal-receipt" className="p-5 font-mono text-black text-xs leading-relaxed select-text bg-white mx-auto" style={{ width: '100%', maxWidth: '340px' }}>
              {/* Store Header */}
              <div className="text-center pb-3 border-b border-dashed border-gray-400">
                <h2 className="text-lg font-extrabold uppercase text-black tracking-tight">{receiptStoreName}</h2>
                {receiptStoreAddr && <p className="text-[11px] text-gray-700 leading-tight mt-0.5">{receiptStoreAddr}</p>}
                {receiptStorePhone && <p className="text-[11px] text-gray-700 leading-tight">Tel: {receiptStorePhone}</p>}
                {receiptHeaderTagline && <p className="text-[10px] text-gray-500 italic mt-0.5">{receiptHeaderTagline}</p>}
              </div>

              {/* Order Meta */}
              <table className="w-full my-2 text-[11px]">
                <tbody>
                  <tr>
                    <td className="text-left py-0.5 font-bold">ORDER #{order.orderSerialNo}</td>
                    <td className="text-right py-0.5">{receiptTime}</td>
                  </tr>
                  <tr>
                    <td className="text-left py-0.5 text-gray-600">{receiptDate}</td>
                    <td className="text-right py-0.5 text-gray-600">Cashier: Admin</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-left py-0.5 text-gray-800 font-medium">
                      Customer: {order.customerName}
                    </td>
                  </tr>
                  {order.customerPhone && (
                    <tr>
                      <td colSpan={2} className="text-left py-0.5 text-gray-700">
                        Phone: {order.customerPhone}
                      </td>
                    </tr>
                  )}
                  {order.orderType === "delivery" && order.deliveryAddress?.address && (
                    <tr>
                      <td colSpan={2} className="text-left py-0.5 text-gray-700">
                        Delivery: {order.deliveryAddress.address}
                      </td>
                    </tr>
                  )}
                  {order.deliveryPin && (
                    <tr>
                      <td colSpan={2} className="py-1">
                        <div className="border-2 border-black text-center font-extrabold text-base py-1 mt-1 tracking-widest">
                          DELIVERY PIN: {order.deliveryPin}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Items Table */}
              <table className="w-full border-t border-b border-dashed border-gray-400 my-2">
                <thead>
                  <tr className="border-b border-dashed border-gray-400">
                    <th className="py-1 text-left font-bold text-[10px] uppercase w-7">QTY</th>
                    <th className="py-1 text-left font-bold text-[10px] uppercase">ITEM DESCRIPTION</th>
                    <th className="py-1 text-right font-bold text-[10px] uppercase">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="align-top border-b border-gray-100 last:border-none">
                      <td className="py-1 text-left font-bold">{item.quantity}</td>
                      <td className="py-1 text-left capitalize">
                        <div>{item.name}</div>
                        {item.variationName && <div className="text-[10px] text-gray-500">{item.variationName}</div>}
                        {item.extras?.length > 0 && (
                          <div className="text-[10px] text-gray-500">
                            + {item.extras.map((ex: any) => ex.name).join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="py-1 text-right font-bold">
                        {formatPrice((item.price * item.quantity) + (item.extras?.reduce((s: number, ex: any) => s + (ex.price * item.quantity), 0) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="py-1 pl-6">
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="text-left py-0.5 uppercase">Subtotal:</td>
                      <td className="text-right py-0.5">{formatPrice(order.subtotal || 0)}</td>
                    </tr>
                    {order.discountAmount > 0 && (
                      <tr>
                        <td className="text-left py-0.5 uppercase text-green-700">Discount:</td>
                        <td className="text-right py-0.5 text-green-700">-{formatPrice(order.discountAmount)}</td>
                      </tr>
                    )}
                    {order.taxAmount > 0 && (
                      <tr>
                        <td className="text-left py-0.5 uppercase">Tax:</td>
                        <td className="text-right py-0.5">{formatPrice(order.taxAmount)}</td>
                      </tr>
                    )}
                    {order.orderType === "delivery" && (
                      <tr>
                        <td className="text-left py-0.5 uppercase">Delivery Charge:</td>
                        <td className="text-right py-0.5">{formatPrice(order.deliveryCharge || 0)}</td>
                      </tr>
                    )}
                    <tr className="border-t border-dashed border-gray-400 font-extrabold text-xs">
                      <td className="text-left py-1 uppercase">TOTAL:</td>
                      <td className="text-right py-1">{formatPrice(order.totalAmount || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Summary Strip */}
              <div className="border-t border-b border-dashed border-gray-400 py-2 my-1 text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span>ORDER TYPE:</span>
                  <span className="font-bold uppercase">
                    {order.orderType === "delivery" ? "DELIVERY" : order.orderType === "dine_in" ? "DINE-IN" : "TAKEAWAY / PICKUP"}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold uppercase">{order.paymentMethod || "ONLINE"}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>PAYMENT STATUS:</span>
                  <span className={`font-bold uppercase ${order.paymentStatus === "paid" ? "text-green-800" : "text-amber-700"}`}>
                    {order.paymentStatus === "paid" ? "✓ PAID" : "PENDING"}
                  </span>
                </div>
                {order.couponCode && (
                  <div className="flex justify-between py-0.5 text-green-800">
                    <span>COUPON USED:</span>
                    <span className="font-bold">{order.couponCode}</span>
                  </div>
                )}
                {order.paymentReference && (
                  <div className="flex justify-between py-0.5">
                    <span>PAYMENT REF:</span>
                    <span className="font-bold font-mono text-[10px]">{order.paymentReference}</span>
                  </div>
                )}
              </div>

              {/* Thank you */}
              <div className="text-center pt-2.5 pb-2 text-[11px] text-gray-700">
                <p className="font-semibold">Thank you for ordering with us!</p>
                <p>We hope to see you again soon.</p>
              </div>

              {/* Footer Signature */}
              <div className="pt-2 text-center border-t border-dashed border-gray-300">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {receiptFooterSignature || "Powered by Nectar App"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Thermal Print Stylesheet — matches POS orders */}
      <style jsx global>{`
        @media print {
          /* Hide everything on the page except the receipt */
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible !important;
          }

          /* Receipt container — auto-adapts to paper:
             - 80mm thermal printer  → fills full width (100% ≤ 80mm)
             - A4 / Letter printer   → centered 80mm column with auto side margins
          */
          #thermal-receipt {
            position: relative !important;
            display: block !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 4mm 4mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 10.5pt !important;
            line-height: 1.45 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }

          .hidden-print {
            display: none !important;
          }

          /* Let the browser use whatever paper the printer has loaded.
             'auto' page size = thermal roll OR A4 OR Letter, all supported. */
          @page {
            size: auto;
            margin: 6mm 0;
          }
        }
      `}</style>
    </>
  );
}

