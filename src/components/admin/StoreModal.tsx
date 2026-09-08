"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ImagePlus, Loader2, Eye, EyeOff, MapPin, ChevronDown, ChevronUp, Search, Check } from "lucide-react";
import { toast } from "sonner";
import MapComponent from "@/components/frontend/MapComponent";
import { useSettingsStore } from "@/store/useSettingsStore";

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeToEdit?: any;
}

export default function StoreModal({ isOpen, onClose, onSuccess, storeToEdit }: StoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const addressContainerRef = useRef<HTMLDivElement | null>(null);
  const [fetchingCoords, setFetchingCoords] = useState(false);

  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    if (isOpen && Object.keys(settings).length === 0) {
      fetchSettings();
    }
  }, [isOpen, settings, fetchSettings]);

  const storeWideAddress = settings.store_wide_address || settings.company_address || "";
  const storeWideLat = settings.store_wide_latitude || settings.company_latitude || "";
  const storeWideLng = settings.store_wide_longitude || settings.company_longitude || "";

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
    deliveryRadius: 0,
    deliveryFee: 0,
    fixedDeliveryFee: 0,
    baseDeliveryFee: 0,
    feePerKm: 0,
    freeDeliveryThreshold: 0,
    largeOrderThreshold: 0,
    largeOrderFeePercent: 0,
    orderValueFeePercent: 0,
    commissionRate: 0,
    password: "",
    taxAmount: 0,
    taxType: "percentage",
    status: true,
    profileImage: "",
    bannerImage: "",
    estimatedDeliveryTime: "20-30 mins",
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressContainerRef.current && !addressContainerRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setShowAddressDropdown(false);
    setAddressSuggestions([]);

    if (storeToEdit) {
      const hasValidCoords = Boolean(
        storeToEdit.latitude && 
        storeToEdit.longitude && 
        Number(storeToEdit.latitude) !== 0 && 
        Number(storeToEdit.longitude) !== 0
      );
      setShowMap(hasValidCoords);

      setFormData({
        name: storeToEdit.name || "",
        email: storeToEdit.email || "",
        phone: storeToEdit.phone || "",
        address: storeToEdit.isUsingStoreWideAddress ? "" : (storeToEdit.rawAddress !== undefined ? storeToEdit.rawAddress : (storeToEdit.address || "")),
        city: storeToEdit.isUsingStoreWideAddress ? "" : (storeToEdit.city || ""),
        state: storeToEdit.isUsingStoreWideAddress ? "" : (storeToEdit.state || ""),
        zipCode: storeToEdit.isUsingStoreWideAddress ? "" : (storeToEdit.zipCode || ""),
        latitude: storeToEdit.isUsingStoreWideAddress ? "" : (storeToEdit.latitude !== undefined && storeToEdit.latitude !== null ? storeToEdit.latitude.toString() : ""),
        longitude: storeToEdit.isUsingStoreWideAddress ? "" : (storeToEdit.longitude !== undefined && storeToEdit.longitude !== null ? storeToEdit.longitude.toString() : ""),
        deliveryRadius: storeToEdit.deliveryRadius !== undefined ? storeToEdit.deliveryRadius : 0,
        deliveryFee: storeToEdit.deliveryFee || 0,
        fixedDeliveryFee: storeToEdit.fixedDeliveryFee || 0,
        baseDeliveryFee: storeToEdit.baseDeliveryFee || 0,
        feePerKm: storeToEdit.feePerKm || 0,
        freeDeliveryThreshold: storeToEdit.freeDeliveryThreshold || 0,
        largeOrderThreshold: storeToEdit.largeOrderThreshold || 0,
        largeOrderFeePercent: storeToEdit.largeOrderFeePercent || 0,
        orderValueFeePercent: storeToEdit.orderValueFeePercent || 0,
        commissionRate: storeToEdit.commissionRate || 0,
        password: "", // Don't pre-fill password on edit
        taxAmount: storeToEdit.taxAmount || 0,
        taxType: storeToEdit.taxType || "percentage",
        status: storeToEdit.status ?? true,
        profileImage: storeToEdit.profileImage || "",
        bannerImage: storeToEdit.bannerImage || "",
        estimatedDeliveryTime: storeToEdit.estimatedDeliveryTime || "20-30 mins",
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
      setShowMap(false);
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
        deliveryRadius: 0,
        deliveryFee: 0,
        fixedDeliveryFee: 0,
        baseDeliveryFee: 0,
        feePerKm: 0,
        freeDeliveryThreshold: 0,
        largeOrderThreshold: 0,
        largeOrderFeePercent: 0,
        orderValueFeePercent: 0,
        commissionRate: 0,
        password: "",
        taxAmount: 0,
        taxType: "percentage",
        status: true,
        profileImage: "",
        bannerImage: "",
        estimatedDeliveryTime: "20-30 mins",
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

  const handleLocationSelect = (lat: number, lng: number, addr: string, isFromAutocomplete?: boolean) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
      ...(addr && !prev.address && { address: addr })
    }));
  };

  const handleAddressInputChange = (newAddress: string) => {
    setFormData(prev => ({ ...prev, address: newAddress }));

    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }

    const trimmed = newAddress.trim();
    if (!trimmed || trimmed.length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      setIsSearchingAddress(false);
      return;
    }

    setIsSearchingAddress(true);
    addressDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAddressSuggestions(data);
            setShowAddressDropdown(true);

            // Auto-detect coordinates seamlessly in background if currently empty or 0:
            const topMatch = data[0];
            if (topMatch?.lat && topMatch?.lon && (!formData.latitude || Number(formData.latitude) === 0)) {
              setFormData(prev => ({
                ...prev,
                latitude: parseFloat(topMatch.lat).toFixed(6),
                longitude: parseFloat(topMatch.lon).toFixed(6),
              }));
            }
          } else {
            setAddressSuggestions([]);
            setShowAddressDropdown(false);
          }
        }
      } catch {
        // non-blocking
      } finally {
        setIsSearchingAddress(false);
      }
    }, 450);
  };

  const handleSelectSuggestion = (item: any) => {
    const lat = parseFloat(item.lat).toFixed(6);
    const lng = parseFloat(item.lon).toFixed(6);

    const addr = item.address || {};
    const city = addr.city || addr.town || addr.municipality || addr.suburb || addr.county || "";
    const state = addr.state || "";
    const zipCode = addr.postcode || "";

    setFormData(prev => ({
      ...prev,
      address: item.display_name,
      latitude: lat,
      longitude: lng,
      ...(city && !prev.city ? { city } : {}),
      ...(state && !prev.state ? { state } : {}),
      ...(zipCode && !prev.zipCode ? { zipCode } : {}),
    }));

    setShowAddressDropdown(false);
    toast.success("Store address and GPS coordinates detected!");
  };

  const geocodeTypedAddress = async (queryAddress?: string) => {
    const q = (queryAddress || formData.address || "").trim();
    if (!q) {
      toast.error("Please enter a store address first");
      return null;
    }
    setFetchingCoords(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const lat = parseFloat(data[0].lat).toFixed(6);
          const lng = parseFloat(data[0].lon).toFixed(6);
          const addr = data[0].address || {};
          const city = addr.city || addr.town || addr.municipality || addr.suburb || addr.county || "";
          const state = addr.state || "";
          const zipCode = addr.postcode || "";

          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            ...(city && !prev.city ? { city } : {}),
            ...(state && !prev.state ? { state } : {}),
            ...(zipCode && !prev.zipCode ? { zipCode } : {}),
          }));
          toast.success("GPS coordinates auto-detected!");
          return { lat, lng };
        }
      }
      toast.info("Could not auto-detect exact GPS coordinates. You can optionally pin on map or save directly.");
      return null;
    } catch {
      return null;
    } finally {
      setFetchingCoords(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "profileImage" | "bannerImage") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, [field]: data.url }));
        toast.success("Image uploaded!");
      } else {
        toast.error("Image upload failed");
      }
    } catch {
      toast.error("Image upload failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name?.trim()) {
        toast.error("Store name is required");
        setLoading(false);
        return;
      }

      let finalLat = formData.latitude ? parseFloat(formData.latitude) : 0;
      let finalLng = formData.longitude ? parseFloat(formData.longitude) : 0;

      // If coordinates are missing or zero and store has typed address, attempt auto-geocode from the typed address
      if ((!finalLat || !finalLng) && formData.address?.trim()) {
        try {
          const geo = await geocodeTypedAddress(formData.address);
          if (geo) {
            finalLat = parseFloat(geo.lat) || 0;
            finalLng = parseFloat(geo.lng) || 0;
          }
        } catch {}
      }

      if (isNaN(finalLat)) finalLat = 0;
      if (isNaN(finalLng)) finalLng = 0;

      const url = storeToEdit ? `/api/admin/stores/${storeToEdit._id}` : `/api/admin/stores`;
      const method = storeToEdit ? "PUT" : "POST";

      const payload: any = { 
        ...formData,
        address: formData.address.trim(),
        latitude: finalLat,
        longitude: finalLng,
        deliveryRadius: Number(formData.deliveryRadius || 0),
        fixedDeliveryFee: Number(formData.fixedDeliveryFee || 0),
      };
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

            {/* Store Address & Location */}
            <div className="space-y-4">
              <div ref={addressContainerRef} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-[#14142B]">
                    Store Address (Street / Area / Landmark)
                    <span className="text-xs font-normal text-[#6E7191] ml-1.5">
                      (Optional — inherits Store-Wide Address if blank)
                    </span>
                  </label>
                  {formData.address && (
                    <button
                      type="button"
                      onClick={() => geocodeTypedAddress()}
                      disabled={fetchingCoords || !formData.address}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      {fetchingCoords ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Auto-Detecting...
                        </>
                      ) : (
                        "⚡ Auto-Detect GPS"
                      )}
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={
                      storeWideAddress 
                        ? `Leave blank to inherit Store-Wide Address (${storeWideAddress})` 
                        : "Type store address (e.g. Plot 12, Admiralty Way, Lekki Phase 1, Lagos)"
                    }
                    value={formData.address} 
                    onChange={(e) => handleAddressInputChange(e.target.value)} 
                    onFocus={() => {
                      if (addressSuggestions.length > 0) setShowAddressDropdown(true);
                    }}
                    className="w-full px-3 py-2.5 pr-8 border border-[#EFF0F6] rounded-xl text-sm font-medium text-[#14142B] outline-none focus:border-primary transition" 
                  />
                  {isSearchingAddress && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showAddressDropdown && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-[#EFF0F6] rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-[#F7F7FC] border-b border-[#EFF0F6] text-[10px] font-bold uppercase text-[#6E7191] tracking-wider">
                      Address Suggestions (Click to auto-fill)
                    </div>
                    {addressSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#FFF5F9] border-b border-[#EFF0F6] last:border-b-0 transition flex items-start gap-2 text-xs text-[#14142B]"
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* If address is empty and storeWideAddress exists, show inheriting indicator */}
                {!formData.address?.trim() && storeWideAddress && (
                  <div className="mt-2.5 flex items-start gap-2 px-3 py-2 bg-blue-50/80 border border-blue-200/70 rounded-xl text-xs text-blue-900">
                    <span className="text-sm">🏬</span>
                    <div className="leading-relaxed">
                      <span className="font-semibold">Inheriting Store-Wide Address:</span> {storeWideAddress}
                      {storeWideLat && storeWideLng && (
                        <span className="block text-[11px] font-mono text-blue-700 mt-0.5">
                          GPS: ({parseFloat(storeWideLat).toFixed(4)}, {parseFloat(storeWideLng).toFixed(4)})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <span className="block text-[11px] text-[#A0A3BD] mt-1">
                  Type the physical street address to override default store-wide location. GPS coordinates auto-detect in the background.
                </span>

                {/* Coordinate status badge */}
                {formData.latitude && formData.longitude && Number(formData.latitude) !== 0 && Number(formData.longitude) !== 0 ? (
                  <div className="mt-2.5 flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs text-emerald-700 font-medium">
                        📍 Custom Store GPS: <span className="font-mono font-semibold">{parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, latitude: "0", longitude: "0" }))}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold ml-2"
                    >
                      Clear
                    </button>
                  </div>
                ) : !formData.address?.trim() && storeWideLat && storeWideLng ? (
                  <div className="mt-2.5 flex items-center gap-2 px-3 py-2 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-xs text-emerald-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Using default GPS from Store-Wide Address ({parseFloat(storeWideLat).toFixed(4)}, {parseFloat(storeWideLng).toFixed(4)}).</span>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2 px-3 py-2 bg-[#F7F7FC] border border-[#EFF0F6] rounded-xl text-xs text-[#6E7191]">
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>Coordinates are optional. Type address or optionally pin on map below.</span>
                  </div>
                )}
              </div>

              {/* Collapsible Map Section */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] hover:bg-[#EFF0F6] transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-[#14142B]">
                      {showMap ? "Hide Map & Coordinates" : "View / Pin on Map (Optional)"}
                    </span>
                  </div>
                  {showMap ? <ChevronUp className="w-4 h-4 text-[#6E7191]" /> : <ChevronDown className="w-4 h-4 text-[#6E7191]" />}
                </button>

                {showMap && (
                  <div className="mt-3 space-y-3 p-3 border border-[#EFF0F6] rounded-xl bg-white animate-in fade-in duration-200">
                    <MapComponent 
                      initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined} 
                      initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined} 
                      addressText={formData.address}
                      onLocationSelect={handleLocationSelect} 
                    />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-[#14142B] mb-1">Latitude (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 6.5244"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          className="w-full px-3 py-2 border border-[#EFF0F6] rounded-xl text-xs font-mono outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#14142B] mb-1">Longitude (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 3.3792"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          className="w-full px-3 py-2 border border-[#EFF0F6] rounded-xl text-xs font-mono outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">City *</label>
                <input required type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
              </div>
            </div>

            {/* General Configs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1.5">Est. Delivery Time</label>
                <input type="text" placeholder="e.g. 20-30 mins" value={formData.estimatedDeliveryTime} onChange={(e) => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:border-primary" />
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

            {/* Store Dynamic Delivery Fee Configuration */}
            <div className="border border-[#EFF0F6] rounded-xl p-4 bg-[#FAFAFC] mt-3 space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-[#14142B]">Store Delivery Terms & Rates</h4>
                <p className="text-xs text-[#6E7191]">Configure flat rate delivery or distance-based delivery rates for this store.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1">Fixed Delivery Fee (₦) [Optional]</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500 (Flat fee)" 
                    value={formData.fixedDeliveryFee || ""} 
                    onChange={(e) => setFormData({ ...formData, fixedDeliveryFee: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs outline-none focus:border-primary" 
                  />
                  <span className="block text-[10px] text-[#A0A3BD] mt-1">
                    When set &gt;0, orders from this store charge this exact flat fee regardless of distance.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1">Base Delivery Fee (₦)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500 (Default)" 
                    value={formData.baseDeliveryFee || ""} 
                    onChange={(e) => setFormData({ ...formData, baseDeliveryFee: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs outline-none focus:border-primary" 
                  />
                  <span className="block text-[10px] text-[#A0A3BD] mt-1">
                    Starting fee for distance-based delivery.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1">Charge Per Km (₦/km)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 100 (₦/km)" 
                    value={formData.feePerKm || ""} 
                    onChange={(e) => setFormData({ ...formData, feePerKm: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs outline-none focus:border-primary" 
                  />
                  <span className="block text-[10px] text-[#A0A3BD] mt-1">
                    Rate charged per additional kilometer.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1">Delivery Radius (km)</label>
                  <input 
                    type="number" 
                    placeholder="0 = Unlimited / anywhere" 
                    value={formData.deliveryRadius === 0 ? "0" : (formData.deliveryRadius || "")} 
                    onChange={(e) => setFormData({ ...formData, deliveryRadius: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs outline-none focus:border-primary" 
                  />
                  <span className="block text-[10px] text-[#A0A3BD] mt-1">
                    0 = Unlimited (orders from anywhere). Set &gt;0 to limit.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1">Free Delivery Over (₦)</label>
                  <input 
                    type="number" 
                    placeholder="Subtotal for ₦0 fee" 
                    value={formData.freeDeliveryThreshold || ""} 
                    onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs outline-none focus:border-primary" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1">Large Order Over (₦)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 20000" 
                    value={formData.largeOrderThreshold || ""} 
                    onChange={(e) => setFormData({ ...formData, largeOrderThreshold: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs outline-none focus:border-primary" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1">Large Order Surcharge (%)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 3" 
                    value={formData.largeOrderFeePercent || ""} 
                    onChange={(e) => setFormData({ ...formData, largeOrderFeePercent: Number(e.target.value) })} 
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs outline-none focus:border-primary" 
                  />
                </div>
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
