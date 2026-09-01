"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { formatPrice } from "@/lib/formatters";
import { List, Grid, Plus } from "lucide-react";
import Link from "next/link";

export default function OfferDetailsPage() {
  const { slug } = useParams();
  const { menuViewMode, setMenuViewMode } = useSettingStore();
  const [offer, setOffer] = useState<any>({});
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOfferItems();
  }, [slug]);

  const fetchOfferItems = async () => {
    try {
      const res = await fetch(`/api/frontend/offers/${slug}`);
      const data = await res.json();
      if (data.status) {
        const offerData = data.data || {};
        setOffer(offerData);
        if (offerData._id) {
          const itemsRes = await fetch(`/api/frontend/items?offerId=${offerData._id}`);
          const itemsData = await itemsRes.json();
          setItems(itemsData.data || []);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="nectar-loader"></div>
        </div>
      )}
      
      <section className="mb-24 sm:mb-16 mt-4 sm:mt-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          
          <div className="flex gap-2 sm:gap-4 items-start justify-between mb-4 sm:mb-6">
            <h2 className="capitalize text-lg sm:text-2xl font-semibold text-primary">
              {offer.title || "Offer Details"}
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuViewMode("list")} className={`text-xl transition-colors ${menuViewMode === "list" ? "text-primary" : "text-[#A0A3BD]"}`}>
                <List className="w-6 h-6" />
              </button>
              <button onClick={() => setMenuViewMode("grid")} className={`text-xl transition-colors ${menuViewMode === "grid" ? "text-primary" : "text-[#A0A3BD]"}`}>
                <Grid className="w-6 h-6" />
              </button>
            </div>
          </div>

          {items.length > 0 ? (
            menuViewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-6">
                {items.map(item => {
                  const hasDiscount = item.discountPrice && Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price);
                  return (
                    <div key={item._id} className="product-card-grid cursor-pointer overflow-hidden w-full min-w-0" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                      <div className="relative w-full pt-[75%] bg-[#f7f7fc] overflow-hidden">
                        <img className="absolute inset-0 w-full h-full object-cover rounded-t-2xl" src={item.image || "/images/item/thumb.png"} alt={item.name} />
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black shadow-md z-10">
                            -{Math.round(((item.price - item.discountPrice) / item.price) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 sm:p-3.5 rounded-b-2xl flex-1 flex flex-col justify-between min-w-0">
                        <div className="min-w-0 mb-1.5">
                          <h3 className="text-xs sm:text-sm font-semibold capitalize leading-snug w-full text-[#14142b] line-clamp-2" title={item.name}>{item.name}</h3>
                          <p className="text-[10px] leading-4 sm:text-xs text-[#6e7191] line-clamp-2 mt-0.5 break-words">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 w-full min-w-0 pt-1 mt-auto">
                          <div className="min-w-0 flex items-baseline gap-1.5">
                            {hasDiscount ? (
                              <>
                                <h4 className="text-xs sm:text-base font-bold text-primary truncate min-w-0">{formatPrice(item.discountPrice)}</h4>
                                <span className="text-[10px] sm:text-xs text-[#a0a3bd] line-through truncate font-normal">{formatPrice(item.price)}</span>
                              </>
                            ) : (
                              <h4 className="text-xs sm:text-base font-semibold text-[#14142b] truncate min-w-0">{formatPrice(item.price)}</h4>
                            )}
                          </div>
                          <button className="product-card-grid-cart-btn shrink-0">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[10px] sm:text-xs">Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {items.map(item => {
                  const hasDiscount = item.discountPrice && Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price);
                  return (
                    <div key={item._id} className="relative flex items-center rounded-2xl border border-[#eff0f6] bg-white transition hover:shadow-xl cursor-pointer overflow-hidden w-full min-w-0" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                      <div className="relative shrink-0">
                        <img className="w-24 sm:w-28 h-24 sm:h-28 object-cover rounded-l-2xl shrink-0" src={item.image || "/images/item/thumb.png"} alt={item.name} />
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black shadow-md z-10">
                            -{Math.round(((item.price - item.discountPrice) / item.price) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-between h-full">
                        <div className="min-w-0 mb-1">
                          <h3 className="text-sm font-semibold capitalize text-[#14142b] leading-snug w-full line-clamp-2" title={item.name}>{item.name}</h3>
                          <p className="text-[10px] sm:text-xs text-[#6e7191] line-clamp-2 mt-0.5 break-words">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 min-w-0 pt-1">
                          <div className="min-w-0 flex items-baseline gap-1.5">
                            {hasDiscount ? (
                              <>
                                <h4 className="text-sm sm:text-base font-bold text-primary truncate min-w-0">{formatPrice(item.discountPrice)}</h4>
                                <span className="text-xs text-[#a0a3bd] line-through truncate font-normal">{formatPrice(item.price)}</span>
                              </>
                            ) : (
                              <h4 className="text-sm sm:text-base font-semibold text-[#14142b] truncate min-w-0">{formatPrice(item.price)}</h4>
                            )}
                          </div>
                          <button className="flex items-center gap-1 rounded-3xl capitalize text-xs font-semibold h-7 px-3.5 shadow-sm transition text-white hover:opacity-90 shrink-0"
                            style={{ backgroundColor: "var(--primary-hex)" }}>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[10px] sm:text-xs">Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="mt-12 text-center">
              <div className="max-w-[300px] mx-auto">
                <img className="w-full mb-8 opacity-60" src="/images/item/item-not-found.png" alt="Not found" />
              </div>
              <span className="block w-full mb-4 text-center text-[#14142b]">No data available</span>
            </div>
          )}
        </div>
      </section>

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
