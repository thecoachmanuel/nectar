"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import OfferModal from "@/components/admin/OfferModal";
import { useApi } from "@/hooks/useApi";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  const { execute } = useApi();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offers");
      const data = await res.json();
      if (data.status) {
        setOffers(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      try {
        await execute(`/api/admin/offers/${id}`, {
          method: "DELETE",
          successMessage: "Offer deleted successfully",
        });
        fetchOffers();
      } catch (err) {}
    }
  };

  const openAddModal = () => {
    setSelectedOffer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (offer: any) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-[#6E7191]">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14142B] mb-2">Offers</h1>
          <p className="text-[#6E7191] text-sm">Manage promotional offer banners</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-[#e60060] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          <span>Add Offer</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
                <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Banner</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Title / Slug</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {offers.map((offer) => (
                <tr key={offer._id} className="hover:bg-[#F7F7FC]/50 transition-colors">
                  <td className="px-6 py-4">
                    <img 
                      src={offer.image || "/images/default/offer.png"} 
                      alt={offer.title}
                      className="w-20 h-10 object-cover rounded-md border border-[#EFF0F6]"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#14142B]">{offer.title}</p>
                    <p className="text-xs text-[#6E7191]">{offer.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#14142B]">₦{offer.price || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      offer.status 
                        ? 'bg-[#1AB759]/10 text-[#1AB759]' 
                        : 'bg-[#FF4D4F]/10 text-[#FF4D4F]'
                    }`}>
                      {offer.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => openEditModal(offer)}
                        className="p-2 text-[#6E7191] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(offer._id)}
                        className="p-2 text-[#6E7191] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6E7191]">
                    No offers found. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OfferModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        offer={selectedOffer}
        onSuccess={fetchOffers}
      />
    </div>
  );
}
