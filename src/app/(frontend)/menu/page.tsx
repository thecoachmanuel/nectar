"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { List, Grid, XCircle } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import { useSearchParams } from "next/navigation";

function MenuContent() {
  const { menuViewMode, setMenuViewMode } = useSettingStore();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const featuredParam = searchParams.get("featured");
  const offerParam = searchParams.get("offer");

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, searchParam, featuredParam, offerParam]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) {
        const fetchedCats = data.data || [];
        setCategories(fetchedCats);

        if (categoryParam && categoryParam !== "all") {
          const found = fetchedCats.find(
            (c: any) => c._id === categoryParam || c.slug === categoryParam
          );
          if (found) {
            setSelectedCategory(found);
            return;
          }
        }
        setSelectedCategory(null); // Default to All Categories
      }
    } catch {}
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/api/frontend/items?`;
      if (selectedCategory) url += `categoryId=${selectedCategory._id}&`;

      if (searchParam) url += `search=${encodeURIComponent(searchParam)}&`;
      if (featuredParam === "true") url += `isFeatured=true&`;
      if (offerParam) url += `offerId=${offerParam}&`;
      const res = await fetch(url);
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
          
          {/* CATEGORY SWIPER */}
          {categories.length > 0 && (
            <div className="mb-6 sm:mb-12 menu-swiper">
              <Swiper speed={1000} slidesPerView="auto" spaceBetween={16} className="menu-slides">
                <SwiperSlide className="!w-fit">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className={`w-[5.5rem] sm:w-32 h-[5.5rem] sm:h-32 flex flex-col items-center justify-center text-center gap-2 sm:gap-4 px-1.5 sm:p-3 rounded-2xl border-b-2 border-transparent transition hover:bg-[#D8FFFC] ${!selectedCategory ? 'menu-category-active' : 'bg-[#F7F7FC]'}`}
                  >
                    <img className="h-7 sm:h-12 drop-shadow-sm" src="/images/default/all-category.png" alt="All" />
                    <h3 className="text-[9px] leading-[14px] sm:leading-4 sm:text-xs font-medium">All Categories</h3>
                  </button>
                </SwiperSlide>
                {categories.map((cat) => (
                  <SwiperSlide key={cat._id} className="!w-fit">
                    <button 
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-[5.5rem] sm:w-32 h-[5.5rem] sm:h-32 flex flex-col items-center justify-center text-center gap-2 sm:gap-4 px-1.5 sm:p-3 rounded-2xl border-b-2 border-transparent transition hover:bg-[#D8FFFC] ${selectedCategory?._id === cat._id ? 'menu-category-active' : 'bg-[#F7F7FC]'}`}
                    >
                      <img className="h-7 sm:h-12 drop-shadow-sm" src={cat.image || "/images/category/thumb.png"} alt={cat.name} />
                      <h3 className="text-[9px] leading-[14px] sm:leading-4 sm:text-xs font-medium">{cat.name}</h3>
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* HEADER & TOGGLE */}
          <div className="flex gap-2 sm:gap-4 items-start justify-between mb-4 sm:mb-6">
            <h2 className="capitalize text-lg sm:text-2xl font-semibold text-primary">
              {selectedCategory ? selectedCategory.name : "All Products"}
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

          {/* ITEMS GRID/LIST */}
          {items.length > 0 ? (
            menuViewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-6">
                {items.map(item => (
                  <div key={item._id} className="relative flex flex-col rounded-2xl border transition border-[#EFF0F6] bg-white hover:shadow-xl cursor-pointer" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                    <img className="w-full rounded-t-2xl object-cover h-32 sm:h-40" src={item.image || "/images/item/thumb.png"} alt={item.name} />
                    <div className="p-2 sm:py-4 sm:px-3 rounded-b-2xl h-full flex flex-col">
                      <div className="flex flex-col gap-0.5 mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold capitalize text-ellipsis whitespace-nowrap overflow-hidden w-fit max-w-[200px]">{item.name}</h3>
                      </div>
                      <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-ellipsis mb-4 flex-auto text-[#6e7191] line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <h4 className="text-xs sm:text-lg font-medium text-[#14142b]">₦{item.price?.toFixed(2)}</h4>
                        </div>
                        <button className="flex items-center gap-1 sm:gap-1.5 rounded-3xl capitalize text-sm font-medium h-5 sm:h-6 px-3 shadow-md transition text-white hover:opacity-90"
                          style={{ backgroundColor: "var(--primary-hex)" }}>
                          <span className="text-[10px] sm:text-xs font-semibold">Add</span>
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
                      <div className="flex flex-col justify-between mb-1">
                        <h3 className="text-sm font-semibold capitalize text-[#14142b] line-clamp-1">{item.name}</h3>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#6e7191] line-clamp-2 mb-2 sm:mb-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm sm:text-base font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</h4>
                        <button className="flex items-center gap-1 sm:gap-1.5 rounded-3xl capitalize text-sm font-medium h-6 sm:h-7 px-4 shadow-md transition text-white hover:opacity-90"
                          style={{ backgroundColor: "var(--primary-hex)" }}>
                          <span className="text-[10px] sm:text-xs font-semibold">Add</span>
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
              <span className="block w-full mb-4 text-center text-[#14142b]">No items available</span>
            </div>
          )}
        </div>
      </section>

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default function MenuPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="nectar-loader"></div>
      </div>
    }>
      <MenuContent />
    </React.Suspense>
  );
}
