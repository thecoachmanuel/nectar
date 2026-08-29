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
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";

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
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [assigningDriver, setAssigningDriver] = useState<boolean>(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
      fetchDeliveryAgents();
    } else {
      setOrder(null);
    }
  }, [isOpen, orderId]);

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
    let providedPin = undefined;

    if (newStatus === "delivered" && order.orderType === "delivery") {
      providedPin = window.prompt(`Enter 4-digit Delivery PIN (Customer PIN: ${order.deliveryPin || "N/A"}):`);
      if (!providedPin) {
        toast.error("Delivery PIN is required to complete delivery.");
        return;
      }
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus, providedPin }),
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

  const handlePrint = () => {
    if (!order) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt #${order.orderSerialNo}</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
            .text-center { text-align: center; }
            .flex { display: flex; justify-content: space-between; }
            .border-t { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; }
            .bold { font-weight: bold; }
            .pin-box { border: 2px solid #000; padding: 6px; text-align: center; font-size: 18px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="text-center bold" style="font-size: 18px; letter-spacing: 2px;">NECTAR</div>
          <div class="text-center" style="font-size: 10px; color: #555;">GROCERY DELIVERY</div>
          <div class="text-center">Order #${order.orderSerialNo}</div>
          <div class="text-center">${new Date(order.createdAt).toLocaleString()}</div>
          ${order.deliveryPin ? `<div class="pin-box">DELIVERY PIN: ${order.deliveryPin}</div>` : ""}
          <div class="border-t">Customer: ${order.customerName}</div>
          <div>Phone: ${order.customerPhone}</div>
          ${order.deliveryAddress?.address ? `<div>Address: ${order.deliveryAddress.address}</div>` : ""}
          <div class="border-t">
            ${order.items?.map((it: any) => `
              <div class="flex">
                <span>${it.quantity}x ${it.name}</span>
                <span>₦${it.itemTotal?.toFixed(2)}</span>
              </div>
            `).join("")}
          </div>
          <div class="border-t flex"><span>Subtotal:</span><span>₦${order.subtotal?.toFixed(2)}</span></div>
          <div class="flex"><span>Delivery Charge:</span><span>₦${order.deliveryCharge?.toFixed(2)}</span></div>
          ${order.discountAmount ? `<div class="flex"><span>Discount:</span><span>-₦${order.discountAmount?.toFixed(2)}</span></div>` : ""}
          <div class="flex bold border-t" style="font-size: 14px;"><span>TOTAL:</span><span>₦${order.totalAmount?.toFixed(2)}</span></div>
          <div class="text-center border-t" style="margin-top: 15px;">Thank you for ordering!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (!isOpen) return null;

  return (
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

              <button
                type="button"
                onClick={handlePrint}
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

          {/* Items Breakdown Table */}
          <div className="border border-[#EFF0F6] rounded-2xl overflow-hidden bg-white">
            <div className="p-3 bg-[#FAFAFC] border-b border-[#EFF0F6] flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#14142B] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Ordered Items ({order.items?.length || 0})
              </h5>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6] text-[#6E7191] font-semibold">
                  <tr>
                    <th className="p-3">Item</th>
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
                            Extras: {item.extras.map((ex: any) => `${ex.name} (+₦${ex.price})`).join(", ")}
                          </p>
                        )}
                        {item.addons?.length > 0 && (
                          <p className="text-[11px] text-[#6E7191] mt-0.5">
                            Addons: {item.addons.map((ad: any) => `${ad.name} (+₦${ad.price})`).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-[#14142B] font-medium">₦{(item.price || 0).toLocaleString()}</td>
                      <td className="p-3 text-center font-bold text-[#14142B]">{item.quantity}</td>
                      <td className="p-3 text-right font-bold text-[#14142B]">₦{(item.itemTotal || 0).toLocaleString()}</td>
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
                <span className="font-semibold text-[#14142B] uppercase">{order.paymentMethod || "Paystack"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E7191]">Payment Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full capitalize text-[11px] ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {order.paymentStatus || "unpaid"}
                </span>
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
                <span className="text-[#6E7191]">Items Subtotal:</span>
                <span className="font-semibold text-[#14142B]">₦{(order.subtotal || 0).toLocaleString()}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6E7191]">Tax Amount:</span>
                  <span className="font-semibold text-[#14142B]">₦{(order.taxAmount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6E7191]">Delivery Fee:</span>
                <span className="font-semibold text-[#14142B]">₦{(order.deliveryCharge || 0).toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-₦{(order.discountAmount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#EFF0F6] text-sm font-bold text-[#14142B]">
                <span>Grand Total:</span>
                <span className="text-primary text-base">₦{(order.totalAmount || 0).toLocaleString()}</span>
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
  );
}
