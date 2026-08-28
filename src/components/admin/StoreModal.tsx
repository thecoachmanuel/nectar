"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeToEdit?: any;
}

export default function StoreModal({ isOpen, onClose, onSuccess, storeToEdit }: StoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    latitude: "",
    longitude: "",
    deliveryRadius: 5,
    taxAmount: 0,
    taxType: "percentage",
    status: "active",
  });

  useEffect(() => {
    if (storeToEdit) {
      setFormData({
        name: storeToEdit.name || "",
        email: storeToEdit.email || "",
        phone: storeToEdit.phone || "",
        address: storeToEdit.address || "",
        city: storeToEdit.city || "",
        state: storeToEdit.state || "",
        zipCode: storeToEdit.zipCode || "",
        latitude: storeToEdit.latitude || "",
        longitude: storeToEdit.longitude || "",
        deliveryRadius: storeToEdit.deliveryRadius || 5,
        taxAmount: storeToEdit.taxAmount || 0,
        taxType: storeToEdit.taxType || "percentage",
        status: storeToEdit.status || "active",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        latitude: "",
        longitude: "",
        deliveryRadius: 5,
        taxAmount: 0,
        taxType: "percentage",
        status: "active",
      });
    }
  }, [storeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = storeToEdit ? `/api/admin/stores/${storeToEdit._id}` : `/api/admin/stores`;
      const method = storeToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.status) throw new Error(data.message);

      toast.success(storeToEdit ? "Store updated successfully" : "Store created successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#EFF0F6]">
          <h2 className="text-lg font-bold text-[#14142B]">{storeToEdit ? "Edit Store" : "Add Store"}</h2>
          <button onClick={onClose} className="text-[#6E7191] hover:text-[#14142B]"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="store-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Store Name *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Email *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Phone *</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Status *</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Address *</label>
              <input required type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">City *</label>
                <input required type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">State *</label>
                <input required type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Zip Code *</label>
                <input required type="text" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Latitude *</label>
                <input required type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Longitude *</label>
                <input required type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Delivery Radius (km)</label>
                <input type="number" value={formData.deliveryRadius} onChange={(e) => setFormData({ ...formData, deliveryRadius: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Tax Amount</label>
                <input type="number" value={formData.taxAmount} onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Tax Type</label>
                <select value={formData.taxType} onChange={(e) => setFormData({ ...formData, taxType: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-[#EFF0F6] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#6E7191] bg-[#F7F7FC] rounded-xl hover:bg-[#EFF0F6]">Cancel</button>
          <button type="submit" form="store-form" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-[#ff006b] rounded-xl hover:bg-[#e60060] disabled:opacity-70">
            {loading ? "Saving..." : "Save Store"}
          </button>
        </div>
      </div>
    </div>
  );
}
