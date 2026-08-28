"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Search, Plus, Loader2, Tag } from "lucide-react";
import ItemModal from "@/components/frontend/ItemModal";

export default function OfferDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [offer, setOffer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchOfferItems = async () => {
      try {
        const res = await fetch(`/api/frontend/offers/${slug}`);
        const data = await res.json();
        if (data.status) {
          setOffer(data.offer);
          setItems(data.items || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchOfferItems();
  }, [slug]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Offer Banner */}
      {offer && (
        <div className="relative rounded-2xl overflow-hidden mb-8 h-48 md:h-64">
          <img
            src={offer.image || "/images/default/offer.png"}
            alt={offer.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/offer.png"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute left-6 bottom-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4" style={{ color: "#ff006b" }} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ff006b" }}>Special Offer</span>
            </div>
            <h1 className="text-2xl font-black">{offer.title}</h1>
            <p className="text-sm opacity-90">{offer.description}</p>
          </div>
        </div>
      )}

      {/* Items in offer */}
      <h2 className="text-lg font-bold text-[#14142b] mb-4">Items in this Offer</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#ff006b" }} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#eff0f6]">
          <p className="text-[#a0a3bd] text-sm">No items in this offer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item._id} onClick={() => { setSelectedItem(item); setModalOpen(true); }}
              className="product-card-grid cursor-pointer">
              <div className="relative pt-[70%] bg-[#f7f7fc] rounded-t-2xl overflow-hidden">
                <img src={item.image || "/images/item/thumb.png"} alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
                {offer?.discount > 0 && (
                  <div className="absolute top-2 right-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "#ff006b" }}>
                    -{offer.discount}%
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h4 className="text-xs font-semibold text-[#14142b] truncate mb-1">{item.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</span>
                  <button className="product-card-grid-cart-btn text-[#ff006b] hover:bg-[#ff006b] hover:text-white">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ItemModal item={selectedItem} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
