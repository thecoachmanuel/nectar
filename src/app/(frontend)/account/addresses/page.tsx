"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Undo2, Plus, Trash2, Home, Briefcase, MapPin } from "lucide-react";
import AddressModal from "@/components/frontend/AddressModal";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AddressesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, token, updateUser } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>(user?.addresses || []);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAddresses();
  }, [token]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/frontend/account/addresses", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.status) {
        setAddresses(data.data);
        updateUser({ addresses: data.data });
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const handleSaveAddress = async (newAddress: any) => {
    try {
      toast.loading("Saving address...");
      const res = await fetch("/api/frontend/account/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });
      const data = await res.json();
      toast.dismiss();
      if (data.status) {
        setAddresses(data.data);
        updateUser({ addresses: data.data });
        setIsModalOpen(false);
        toast.success("Address added successfully");
      } else {
        toast.error(data.message || "Failed to add address");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      toast.loading("Deleting address...");
      const res = await fetch(`/api/frontend/account/addresses?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      toast.dismiss();
      if (data.status) {
        setAddresses(data.data);
        updateUser({ addresses: data.data });
        toast.success("Address deleted");
      } else {
        toast.error(data.message || "Failed to delete address");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("An error occurred");
    }
  };

  const getIcon = (label: string) => {
    if (label.toLowerCase() === "home") return <Home className="w-4 h-4" />;
    if (label.toLowerCase() === "work") return <Briefcase className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <section className="pt-6 pb-24 sm:pt-8 sm:pb-16 bg-[#f7f7fc] min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-[#ff006b] hover:text-rose-600 transition-colors">
          <Undo2 className="w-4 h-4" />
          <span className="text-xs font-medium leading-6">Back to home</span>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[26px] leading-10 font-semibold capitalize text-[#14142b]">Address</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#ff006b] hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md shadow-[#ff006b]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        </div>

        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((address: any) => (
              <div key={address._id || address.id} className="p-4 rounded-2xl w-full bg-white border border-[#eff0f6] shadow-sm hover:border-[#ff006b]/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[#008BBA] bg-[#D6F5FF] px-2.5 py-1 rounded-full">
                    {getIcon(address.label || "Other")}
                    <span className="font-medium text-xs leading-6 capitalize">{address.label || "Other"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => handleDelete(address._id)} className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-[#6e7191] shrink-0" />
                  <span className="text-sm leading-6 text-[#14142b]">
                    {address.apartment ? address.apartment + ', ' : ''}
                    {address.address}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full p-8 rounded-2xl shadow-sm bg-white border border-[#eff0f6] text-center text-[#6e7191]">
            <img src="/images/default/not-found.png" alt="Not Found" className="max-w-[150px] mx-auto opacity-50 mb-4" />
            No addresses available.
          </div>
        )}

        <AddressModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveAddress} 
        />
      </div>
    </section>
  );
}
