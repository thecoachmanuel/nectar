"use client";

import React, { useState } from "react";
import { X, MapPin, Check } from "lucide-react";
import { toast } from "sonner";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: {
    label: string;
    address: string;
    apartment?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
}

export default function AddressModal({ isOpen, onClose, onSave }: AddressModalProps) {
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading("Detecting coordinates...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          toast.dismiss();
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          if (!address) {
            setAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
          }
          toast.success("Location coordinates pinned!");
        },
        () => {
          toast.dismiss();
          toast.error("Could not fetch current coordinates.");
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please enter a street address");
      return;
    }

    onSave({
      label,
      address,
      apartment,
      latitude,
      longitude,
    });

    toast.success("Address added successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800">Add New Delivery Address</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label selector */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Address Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Home", "Work", "Other"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setLabel(item)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    label === item
                      ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Street Address
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 123 Main Street, Suite 4B"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Apartment / Building */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Apartment / Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Apt 12, Floor 3"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Map Location Pin button */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                {latitude && longitude
                  ? `Pin: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                  : "Pick Map Coordinates"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="bg-white border border-slate-300 hover:border-red-500 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition"
            >
              Pin Location
            </button>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl shadow-md transition"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
