"use client";

import React, { useState } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import AddressModal from "@/components/frontend/AddressModal";
import { useAuthStore } from "@/store/useAuthStore";
import { MapPin, Plus, Trash2, Home, Briefcase, Tag } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Manage Addresses</h1>
            <p className="text-xs text-slate-400">Save delivery addresses with map location markers</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-2">
            <p className="text-sm font-bold text-slate-700">Please login to manage your saved addresses.</p>
          </div>
        ) : !user.addresses || user.addresses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-3">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Saved Addresses</h3>
            <p className="text-xs text-slate-400">Click Add New Address to pin your location on map.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.addresses.map((addr: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-1 bg-red-50 text-red-600 rounded-lg flex items-center space-x-1">
                      {addr.label === "Home" ? (
                        <Home className="w-3 h-3" />
                      ) : (
                        <Briefcase className="w-3 h-3" />
                      )}
                      <span>{addr.label || "Home"}</span>
                    </span>

                    <button
                      onClick={() => handleDeleteAddress(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm font-bold text-slate-800">{addr.address}</p>
                  {addr.apartment && <p className="text-xs text-slate-400">{addr.apartment}</p>}

                  {addr.latitude && addr.longitude && (
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-1">
                      <MapPin className="w-3 h-3 text-red-500" />
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
      </main>

      <Footer />

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddAddress}
      />
    </div>
  );
}
