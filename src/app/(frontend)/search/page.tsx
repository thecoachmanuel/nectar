"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { formatPrice } from "@/lib/formatters";
import { List, Grid } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("s") || "";
  
  const { menuViewMode, setMenuViewMode } = useSettingStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [query]);

  const fetchItems = async () => {
    if (!query) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/frontend/items?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.status) setItems(data.data || []);
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
          
          {/* HEADER & TOGGLE */}
          <div className="flex gap-2 sm:gap-4 items-start justify-between mb-4 sm:mb-6">
            <h2 className="capitalize text-lg sm:text-2xl font-semibold text-primary">
              {query ? `Search: ${query}` : "Search"}
            </h2>
            {query && (
              <div className="flex items-center gap-3">
                <button onClick={() => setMenuViewMode("list")} className={`text-xl transition-colors ${menuViewMode === "list" ? "text-primary" : "text-[#A0A3BD]"}`}>
                  <List className="w-6 h-6" />
                </button>
                <button onClick={() => setMenuViewMode("grid")} className={`text-xl transition-colors ${menuViewMode === "grid" ? "text-primary" : "text-[#A0A3BD]"}`}>
                  <Grid className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* ITEMS GRID/LIST */}
          {items.length > 0 ? (
            menuViewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-6">
                {items.map(item => (
                  <div key={item._id} className="relative flex flex-col rounded-2xl border transition border-[#EFF0F6] bg-white hover:shadow-xl cursor-pointer overflow-hidden w-full min-w-0" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                    <div className="relative w-full pt-[75%] bg-[#f7f7fc] overflow-hidden">
                      <img className="absolute inset-0 w-full h-full object-cover rounded-t-2xl" src={item.image || "/images/item/thumb.png"} alt={item.name} />
                    </div>
                    <div className="p-2.5 sm:p-3.5 rounded-b-2xl flex-1 flex flex-col justify-between min-w-0">
                      <div className="min-w-0 mb-1.5">
                        <h3 className="text-xs sm:text-sm font-semibold capitalize truncate w-full text-[#14142b]" title={item.name}>{item.name}</h3>
                        <p className="text-[10px] leading-4 sm:text-xs text-[#6e7191] line-clamp-2 mt-0.5 break-words">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between gap-1.5 w-full min-w-0 pt-1 mt-auto">
                        <h4 className="text-xs sm:text-sm font-bold text-[#14142b] truncate min-w-0">{formatPrice(item.price)}</h4>
                        <button className="flex items-center gap-1 rounded-3xl capitalize text-xs font-semibold h-6 px-2.5 shadow-sm transition text-white hover:opacity-90 shrink-0"
                          style={{ backgroundColor: "var(--primary-hex)" }}>
                          <span className="text-[10px] sm:text-xs">Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {items.map(item => (
                  <div key={item._id} className="relative flex items-center rounded-2xl border border-[#eff0f6] bg-white transition hover:shadow-xl cursor-pointer overflow-hidden w-full min-w-0" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                    <img className="w-24 sm:w-28 h-24 sm:h-28 object-cover rounded-l-2xl shrink-0" src={item.image || "/images/item/thumb.png"} alt={item.name} />
                    <div className="p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div className="min-w-0 mb-1">
                        <h3 className="text-sm font-semibold capitalize text-[#14142b] truncate w-full" title={item.name}>{item.name}</h3>
                        <p className="text-[10px] sm:text-xs text-[#6e7191] line-clamp-2 mt-0.5 break-words">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0 pt-1">
                        <h4 className="text-sm sm:text-base font-bold text-[#14142b] truncate min-w-0">{formatPrice(item.price)}</h4>
                        <button className="flex items-center gap-1 rounded-3xl capitalize text-xs font-semibold h-7 px-3.5 shadow-sm transition text-white hover:opacity-90 shrink-0"
                          style={{ backgroundColor: "var(--primary-hex)" }}>
                          <span className="text-[10px] sm:text-xs">Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="mt-12 text-center">
              <div className="max-w-[250px] mx-auto">
                <img className="w-full mb-8 opacity-60" src="/images/item/item-not-found.png" alt="Not found" />
              </div>
              <span className="block w-full mb-4 text-center text-[#14142b]">No items found</span>
              <Link href="/" className="block w-full mx-auto max-w-[250px] py-3 rounded-3xl capitalize text-base font-medium leading-6 text-center bg-primary text-white hover:bg-rose-600 transition-colors">
                Go to Home
              </Link>
            </div>
          )}
        </div>
      </section>

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="nectar-loader"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
