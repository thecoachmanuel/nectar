"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Undo2, MapPin, Clock, Info, Plus } from "lucide-react";
import ItemModal from "@/components/frontend/ItemModal";
import { formatPrice } from "@/lib/formatters";

export default function StoreDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchStoreData();
  }, [id]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      // Fetch store
      const storeRes = await fetch(`/api/frontend/stores`);
      const storeData = await storeRes.json();
      if (storeData.status) {
        const found = storeData.stores?.find((s: any) => s._id === id);
        if (found) {
          setStore(found);
        } else {
          router.push("/");
        }
      }

      // Fetch items for store
      const itemsRes = await fetch(`/api/frontend/items?storeId=${id}`);
      const itemsData = await itemsRes.json();
      if (itemsData.status) {
        setItems(itemsData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch store details", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="nectar-loader"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Store not found.</p>
      </div>
    );
  }

  return (
    <>
      <section className="bg-[#f7f7fc] min-h-screen pb-24">
        {/* Store Header */}
        <div className="relative w-full h-48 md:h-64 bg-slate-200">
          <img 
            src={store.bannerImage || store.profileImage || "/images/default/store.png"} 
            alt={store.name} 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/store.png"; }}
          />
          <div className="absolute inset-0 bg-black/40"></div>
          
          <div className="absolute top-4 left-4 z-10">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-primary transition-colors">
              <Undo2 className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-black/80 to-transparent">
            <div className="container mx-auto max-w-5xl flex items-end gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white overflow-hidden shrink-0 bg-white shadow-lg">
                <img 
                  src={store.profileImage || "/images/default/store.png"} 
                  alt={store.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/store.png"; }}
                />
              </div>
              <div className="pb-1 text-white flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold truncate">{store.name}</h1>
                  {!store.status && (
                    <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">Closed</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{store.estimatedDeliveryTime || "30-45 mins"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Items */}
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#14142B]">All Products from {store.name}</h2>
          </div>
          
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6]">
              <img src="/images/item/item-not-found.png" alt="Not Found" className="w-28 mx-auto mb-4 opacity-50"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <p className="text-sm font-semibold text-[#14142b]">No items found for this store</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {items.map((item) => (
                <div key={item._id} onClick={() => openModal(item)} className="product-card-grid cursor-pointer group overflow-hidden w-full min-w-0">
                  <div className="relative pt-[75%] bg-[#f7f7fc] rounded-t-2xl overflow-hidden">
                    <img src={item.image || "/images/item/thumb.png"} alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
                  </div>
                  <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                    <div className="min-w-0 mb-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#14142b] truncate w-full capitalize group-hover:text-primary transition-colors" title={item.name}>{item.name}</h4>
                      <p className="text-[10px] sm:text-xs text-[#6e7191] line-clamp-2 mt-0.5 break-words">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between gap-1 w-full min-w-0 pt-1 mt-auto">
                      <span className="text-xs sm:text-sm font-bold text-[#14142b] truncate min-w-0">{formatPrice(item.price)}</span>
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }}
                        className="product-card-grid-cart-btn shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
