"use client";

import React, { useState } from "react";
import { X, MapPin, Check, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import { toast } from "sonner";
import MapComponent from "./MapComponent";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: {
    _id?: string;
    label: string;
    address: string;
    apartment?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  initialData?: any;
}

export default function AddressModal({ isOpen, onClose, onSave, initialData }: AddressModalProps) {
  const [label, setLabel] = useState(initialData?.label || "Home");
  const [address, setAddress] = useState(initialData?.address || "");
  const [apartment, setApartment] = useState(initialData?.apartment || "");
  const [latitude, setLatitude] = useState<number | undefined>(initialData?.latitude || undefined);
  const [longitude, setLongitude] = useState<number | undefined>(initialData?.longitude || undefined);
  const [showMap, setShowMap] = useState(Boolean(initialData?.latitude));
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLabel(initialData?.label || "Home");
      setAddress(initialData?.address || "");
      setApartment(initialData?.apartment || "");
      setLatitude(initialData?.latitude || undefined);
      setLongitude(initialData?.longitude || undefined);
      setShowMap(Boolean(initialData?.latitude));
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addr && !address) {
      setAddress(addr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !address.trim()) {
      toast.error("Please enter your delivery address");
      return;
    }

    setIsSubmitting(true);

    let finalLat = latitude;
    let finalLng = longitude;

    // If coordinates weren't set from the map, attempt a quick background geocode
    if (!finalLat || !finalLng) {
      try {
        const query = address.trim();
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results.length > 0 && results[0].lat && results[0].lon) {
            finalLat = parseFloat(results[0].lat);
            finalLng = parseFloat(results[0].lon);
          }
        }
      } catch {
        // Non-blocking fallback: save the address text directly
      }
    }

    onSave({
      _id: initialData?._id,
      label,
      address: address.trim(),
      apartment: apartment.trim(),
      latitude: finalLat,
      longitude: finalLng,
    });

    toast.success("Address saved successfully!");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5 border border-[#eff0f6] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#eff0f6] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#fff5f9] text-primary flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#14142b]">
              {initialData ? "Edit Address" : "Add Delivery Address"}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-[#a0a3bd] hover:text-[#14142b] rounded-full hover:bg-[#f7f7fc] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label selector */}
          <div>
            <label className="text-xs font-semibold text-[#6e7191] uppercase tracking-wider block mb-1.5">
              Address Label
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Home", "Work", "Other"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setLabel(item)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    label === item
                      ? "border-primary bg-[#fff5f9] text-primary shadow-sm"
                      : "border-[#eff0f6] text-[#6e7191] hover:bg-[#f7f7fc]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label className="text-xs font-semibold text-[#14142b] uppercase tracking-wider block mb-1.5">
              Delivery Address *
            </label>
            <input
              type="text"
              placeholder="e.g. 15 Adeola Odeku St, Victoria Island, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
              required
              autoFocus
            />
            <p className="text-[11px] text-[#a0a3bd] mt-1">
              Type your street, area, or landmark. You can enter any address directly.
            </p>
          </div>

          {/* Apartment / Building / Landmark */}
          <div>
            <label className="text-xs font-semibold text-[#6e7191] uppercase tracking-wider block mb-1.5">
              Apartment / Floor / Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Apt 4B, Opposite Mega Plaza"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>

          {/* Map Pinning Option */}
          <div className="border border-[#eff0f6] rounded-2xl p-3 bg-[#f7f7fc]/60">
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#14142b] hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-primary" />
                <span>Pin on Map (Optional)</span>
                {latitude && longitude && (
                  <span className="text-[10px] text-green-600 bg-green-100 font-bold px-1.5 py-0.5 rounded-md">
                    ✓ Pinned
                  </span>
                )}
              </div>
              {showMap ? <ChevronUp className="w-4 h-4 text-[#a0a3bd]" /> : <ChevronDown className="w-4 h-4 text-[#a0a3bd]" />}
            </button>

            {showMap && (
              <div className="mt-3 pt-3 border-t border-[#eff0f6]">
                <MapComponent 
                  initialLat={latitude} 
                  initialLng={longitude} 
                  addressText={address}
                  onLocationSelect={handleLocationSelect} 
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 border border-[#eff0f6] text-[#6e7191] font-semibold text-sm rounded-xl hover:bg-[#f7f7fc] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-3 bg-primary hover:bg-rose-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-primary/20 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
