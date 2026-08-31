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
                  <div key={item._id} className="relative flex flex-col rounded-2xl border transition border-[#EFF0F6] bg-white hover:shadow-xl cursor-pointer" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                    <img className="w-full rounded-t-2xl object-cover h-32 sm:h-40" src={item.image || "/images/item/thumb.png"} alt={item.name} />
                    <div className="p-2 sm:py-4 sm:px-3 rounded-b-2xl h-full flex flex-col">
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold capitalize text-ellipsis whitespace-nowrap overflow-hidden w-fit max-w-[200px]">{item.name}</h3>
                      </div>
                      <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-ellipsis mb-4 flex-auto text-[#6e7191] line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <h4 className="text-xs sm:text-lg font-bold text-[#14142b]">{formatPrice(item.price)}</h4>
                        </div>
                        <button className="flex items-center gap-1 sm:gap-1.5 rounded-3xl capitalize text-sm font-medium h-5 sm:h-6 px-2 shadow-md transition bg-white text-[#14142b] hover:bg-primary hover:text-white">
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
                  <div key={item._id} className="relative flex items-center rounded-lg border border-[#eff0f6] bg-white transition hover:shadow-xl cursor-pointer" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                    <img className="w-24 sm:w-32 h-24 sm:h-32 object-cover rounded-l-lg" src={item.image || "/images/item/thumb.png"} alt={item.name} />
                    <div className="p-3 sm:p-4 flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold capitalize text-[#14142b] line-clamp-1">{item.name}</h3>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#6e7191] line-clamp-2 mb-2 sm:mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm sm:text-base font-bold text-[#14142b]">{formatPrice(item.price)}</h4>
                        <button className="flex items-center gap-1.5 rounded-3xl capitalize text-sm font-medium h-6 sm:h-7 px-3 shadow-md transition bg-white text-[#14142b] hover:bg-primary hover:text-white">
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
