"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ImagePlus, Loader2, MapPin, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeToEdit?: any;
}

export default function StoreModal({ isOpen, onClose, onSuccess, storeToEdit }: StoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchBoxRef = useRef<any>(null);
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
    commissionRate: 0,
    password: "",
    taxAmount: 0,
    taxType: "percentage",
    status: true,
    profileImage: "",
    bannerImage: "",
    estimatedDeliveryTime: "30-45 mins",
    timeSlots: [
      { day: "Monday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
      { day: "Tuesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
      { day: "Wednesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
      { day: "Thursday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
      { day: "Friday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
      { day: "Saturday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
      { day: "Sunday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
    ]
  });

  const [fetchingCoords, setFetchingCoords] = useState(false);

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
        commissionRate: storeToEdit.commissionRate || 0,
        password: "", // Don't pre-fill password on edit
        taxAmount: storeToEdit.taxAmount || 0,
        taxType: storeToEdit.taxType || "percentage",
        status: storeToEdit.status ?? true,
        profileImage: storeToEdit.profileImage || "",
        bannerImage: storeToEdit.bannerImage || "",
        estimatedDeliveryTime: storeToEdit.estimatedDeliveryTime || "30-45 mins",
        timeSlots: storeToEdit.timeSlots?.length > 0 ? storeToEdit.timeSlots : [
          { day: "Monday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Tuesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Wednesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Thursday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Friday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Saturday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Sunday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
        ]
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
        commissionRate: 0,
        password: "",
        taxAmount: 0,
        taxType: "percentage",
        status: true,
        profileImage: "",
        bannerImage: "",
        estimatedDeliveryTime: "30-45 mins",
        timeSlots: [
          { day: "Monday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Tuesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Wednesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Thursday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Friday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Saturday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Sunday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
        ]
      });
    }
  }, [storeToEdit, isOpen]);

  const fetchCoordinates = async () => {
    if (!formData.address) {
      toast.error("Please enter an address first");
      return;
    }
    setFetchingCoords(true);
    try {
      // Combine address components to improve search accuracy on Nominatim
      const queryParts = [formData.address, formData.city, formData.state, formData.zipCode, "Nigeria"].filter(Boolean);
      const searchQuery = queryParts.join(", ");

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=ng&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon,
        }));
        toast.success("Coordinates fetched successfully");
      } else {
        toast.error("Could not find coordinates for this address");
      }
    } catch (err) {
      toast.error("Error fetching coordinates");
    } finally {
      setFetchingCoords(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "profileImage" | "bannerImage") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real app, you'd upload this to an S3 bucket or cloudinary.
    // Since we don't have an active upload route mapped in this snippet, we'll convert to base64 for simplicity.
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = storeToEdit ? `/api/admin/stores/${storeToEdit._id}` : `/api/admin/stores`;
      const method = storeToEdit ? "PUT" : "POST";

      const payload: any = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password on update

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          <form id="store-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Images */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Profile Image</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#EFF0F6] rounded-xl cursor-pointer hover:bg-[#F7F7FC] overflow-hidden relative">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-[#6E7191]">
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <p className="text-xs">Upload Profile</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "profileImage")} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Banner Image</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#EFF0F6] rounded-xl cursor-pointer hover:bg-[#F7F7FC] overflow-hidden relative">
                  {formData.bannerImage ? (
                    <img src={formData.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-[#6E7191]">
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <p className="text-xs">Upload Banner</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "bannerImage")} />
                </label>
              </div>
            </div>

            {/* Core Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Store Name *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Phone *</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
            </div>
            
            {/* Login Credentials */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Manager Email (Login ID) *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Manager Password {storeToEdit && '(Leave blank to keep)'}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required={!storeToEdit} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 pr-10 border rounded-xl outline-none focus:border-primary" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Address *</label>
              <div className="flex gap-2">
                <input required type="text" placeholder="Enter address..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="flex-1 px-3 py-2 border rounded-xl outline-none focus:border-primary" />
                <button type="button" onClick={fetchCoordinates} disabled={fetchingCoords} className="px-4 py-2 bg-[#F7F7FC] border border-[#EFF0F6] text-[#6E7191] rounded-xl hover:bg-[#EFF0F6] transition-colors flex items-center gap-2 font-medium text-sm whitespace-nowrap">
                  {fetchingCoords ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  Fetch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">City *</label>
                <input required type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Latitude *</label>
                <input required type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Longitude *</label>
                <input required type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
            </div>

            {/* Configs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Delivery Radius (km)</label>
                <input type="number" value={formData.deliveryRadius} onChange={(e) => setFormData({ ...formData, deliveryRadius: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Est. Delivery Time</label>
                <input type="text" placeholder="e.g. 30-45 mins" value={formData.estimatedDeliveryTime} onChange={(e) => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Admin Commission (%)</label>
                <input type="number" value={formData.commissionRate} onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Status *</label>
                <select value={formData.status ? "true" : "false"} onChange={(e) => setFormData({ ...formData, status: e.target.value === "true" })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Time Slots */}
            <div className="border border-[#EFF0F6] rounded-xl overflow-hidden mt-4">
              <div className="bg-[#F7F7FC] px-4 py-3 border-b border-[#EFF0F6]">
                <h3 className="font-semibold text-[#14142B] text-sm">Opening Hours</h3>
              </div>
              <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {formData.timeSlots.map((slot, idx) => (
                  <div key={slot.day} className="flex items-center gap-3">
                    <div className="w-24 shrink-0 text-sm font-medium text-[#14142B]">{slot.day}</div>
                    
                    <div className="flex-1 flex items-center gap-2">
                      <input 
                        type="time" 
                        disabled={slot.isClosed}
                        value={slot.openingTime}
                        onChange={(e) => {
                          const newSlots = [...formData.timeSlots];
                          newSlots[idx].openingTime = e.target.value;
                          setFormData({ ...formData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm outline-none disabled:opacity-50"
                      />
                      <span className="text-[#6E7191] text-xs">to</span>
                      <input 
                        type="time" 
                        disabled={slot.isClosed}
                        value={slot.closingTime}
                        onChange={(e) => {
                          const newSlots = [...formData.timeSlots];
                          newSlots[idx].closingTime = e.target.value;
                          setFormData({ ...formData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm outline-none disabled:opacity-50"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer shrink-0 w-24 justify-end">
                      <input 
                        type="checkbox" 
                        checked={slot.isClosed}
                        onChange={(e) => {
                          const newSlots = [...formData.timeSlots];
                          newSlots[idx].isClosed = e.target.checked;
                          setFormData({ ...formData, timeSlots: newSlots });
                        }}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-[#6E7191]">Closed</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-[#EFF0F6] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#6E7191] bg-[#F7F7FC] rounded-xl hover:bg-[#EFF0F6]">Cancel</button>
          <button type="submit" form="store-form" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-[var(--primary-color,#ff006b)] rounded-xl disabled:opacity-70 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : "Save Store"}
          </button>
        </div>
      </div>
    </div>
  );
}
