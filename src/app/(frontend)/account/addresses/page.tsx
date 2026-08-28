"use client";

import React, { useState } from "react";
import AddressModal from "@/components/frontend/AddressModal";
import { useAuthStore } from "@/store/useAuthStore";
import { MapPin, Plus, Trash2, Home, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function ManageAddressesPage() {
  const { user, updateUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddAddress = (newAddr: any) => {
    if (!user) return;
    const updatedAddresses = [...(user.addresses || []), newAddr];
    updateUser({ addresses: updatedAddresses });
    toast.success("Address added to your address book!");
  };

  const handleDeleteAddress = (index: number) => {
    if (!user) return;
    const updatedAddresses = (user.addresses || []).filter((_, idx) => idx !== index);
    updateUser({ addresses: updatedAddresses });
    toast.success("Address deleted.");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#eff0f6] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14142b]">Manage Addresses</h1>
          <p className="text-xs text-[#a0a3bd]">Save delivery addresses with map location markers</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5"
          style={{ backgroundColor: "#ff006b" }}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {!user ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6] space-y-2">
          <p className="text-sm font-bold text-[#14142b]">Please login to manage your saved addresses.</p>
        </div>
      ) : !user.addresses || user.addresses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6] space-y-3">
          <MapPin className="w-12 h-12 text-[#a0a3bd] mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-[#14142b]">No Saved Addresses</h3>
          <p className="text-xs text-[#a0a3bd]">Click Add New Address to pin your location on map.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses.map((addr: any, idx: number) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-[#eff0f6] shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-[#fff0f6] text-[#ff006b] rounded-lg flex items-center space-x-1">
                    {addr.label === "Home" ? (
                      <Home className="w-3 h-3" />
                    ) : (
                      <Briefcase className="w-3 h-3" />
                    )}
                    <span>{addr.label || "Home"}</span>
                  </span>

                  <button
                    onClick={() => handleDeleteAddress(idx)}
                    className="text-[#a0a3bd] hover:text-[#ff006b] p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm font-bold text-[#14142b]">{addr.address}</p>
                {addr.apartment && <p className="text-xs text-[#a0a3bd]">{addr.apartment}</p>}

                {addr.latitude && addr.longitude && (
                  <div className="text-[10px] text-[#a0a3bd] flex items-center space-x-1 pt-1">
                    <MapPin className="w-3 h-3 text-[#ff006b]" />
                    <span>
                      Pin: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddAddress}
      />
    </div>
  );
}
