"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, MapPin, Check, ChevronDown, ChevronUp, Navigation, Loader2 } from "lucide-react";
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

  // Address Autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [fetchingCoords, setFetchingCoords] = useState(false);
  const addressDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const addressContainerRef = useRef<HTMLDivElement | null>(null);

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
    if (isOpen) {
      setLabel(initialData?.label || "Home");
      setAddress(initialData?.address || "");
      setApartment(initialData?.apartment || "");
      setLatitude(initialData?.latitude || undefined);
      setLongitude(initialData?.longitude || undefined);
      setShowMap(Boolean(initialData?.latitude));
      setIsSubmitting(false);
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
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

  const handleAddressInputChange = (newAddress: string) => {
    setAddress(newAddress);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
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
            if (!latitude || !longitude) {
              const top = data[0];
              if (top?.lat && top?.lon) {
                setLatitude(parseFloat(top.lat));
                setLongitude(parseFloat(top.lon));
              }
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
    }, 400);
  };

  const handleSelectSuggestion = (item: any) => {
    setAddress(item.display_name);
    if (item.lat && item.lon) {
      setLatitude(parseFloat(item.lat));
      setLongitude(parseFloat(item.lon));
    }
    setShowAddressDropdown(false);
    toast.success("Location and GPS coordinates selected!");
  };

  const geocodeTypedAddress = async () => {
    const q = address.trim();
    if (!q) {
      toast.error("Please enter an address first");
      return;
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
          setLatitude(parseFloat(data[0].lat));
          setLongitude(parseFloat(data[0].lon));
          toast.success("GPS location auto-detected!");
          return;
        }
      }
      toast.info("Could not pinpoint exact GPS, you can pin on map below");
    } catch {
    } finally {
      setFetchingCoords(false);
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
            <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center">
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
                      ? "border-primary bg-primary-light text-primary shadow-sm"
                      : "border-[#eff0f6] text-[#6e7191] hover:bg-[#f7f7fc]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Street Address with Suggestions */}
          <div ref={addressContainerRef} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#14142b] uppercase tracking-wider block">
                Delivery Address *
              </label>
              <button
                type="button"
                onClick={geocodeTypedAddress}
                disabled={fetchingCoords || !address.trim()}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {fetchingCoords ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Locating...
                  </>
                ) : (
                  "⚡ Auto-Detect GPS"
                )}
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 15 Adeola Odeku St, Victoria Island, Lagos"
                value={address}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                onFocus={() => {
                  if (addressSuggestions.length > 0) setShowAddressDropdown(true);
                }}
                className="w-full px-3.5 py-2.5 pr-9 bg-white border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                required
                autoFocus
              />
              {isSearchingAddress && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showAddressDropdown && addressSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#EFF0F6] rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 bg-[#F7F7FC] border-b border-[#EFF0F6] text-[10px] font-bold uppercase text-[#6E7191] tracking-wider">
                  Address Suggestions (Click to select)
                </div>
                {addressSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-primary-light border-b border-[#EFF0F6] last:border-b-0 transition flex items-start gap-2.5 text-xs text-[#14142B] cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-[#a0a3bd] mt-1">
              Type your street, area, or landmark for instant suggestions.
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
              className="w-1/2 py-3 bg-primary hover:opacity-90 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
