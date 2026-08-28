"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { List, Grid, XCircle } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

export default function MenuPage() {
  const { activeFoodType, setActiveFoodType, menuViewMode, setMenuViewMode } = useSettingStore();
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
  }, [selectedCategory, activeFoodType]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) {
        setCategories(data.data || []);
        if (data.data?.length > 0) {
          setSelectedCategory(data.data[0]); // Default to first category to mimic Vue behavior when a query matches
        }
      }
    } catch {}
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/api/frontend/items?`;
      if (selectedCategory) url += `categoryId=${selectedCategory._id}&`;
      if (activeFoodType !== "all") url += `itemType=${activeFoodType}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status) setItems(data.data || []);
    } catch {} finally { 
      setLoading(false); 
    }
  };

  const itemTypeSet = (type: "all" | "veg" | "non_veg") => {
    setActiveFoodType(type);
  };

  const itemTypeReset = () => {
    setActiveFoodType("all");
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="foodappi-loader"></div>
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

          {/* VEG / NON-VEG FILTERS */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-3 w-full mb-6 sm:mb-12 veg-navs">
              <button 
                disabled={activeFoodType === "veg"}
                onClick={() => activeFoodType === "non_veg" ? itemTypeReset() : itemTypeSet("non_veg")}
                className={`flex items-center gap-3 w-fit pl-3 pr-4 py-1 sm:py-1.5 rounded-3xl transition hover:shadow-md hover:bg-white ${activeFoodType === "non_veg" ? 'veg-active' : 'bg-[#EFF0F6]'}`}
              >
                <img src="/images/item-type/veg.png" alt="category" className="h-6" />
                <span className="capitalize text-xs sm:text-sm font-medium text-[#14142b]">Non Veg</span>
                {activeFoodType === "non_veg" && <XCircle className="w-5 h-5 text-red-500 ml-2" />}
              </button>
              <button 
                disabled={activeFoodType === "non_veg"}
                onClick={() => activeFoodType === "veg" ? itemTypeReset() : itemTypeSet("veg")}
                className={`flex items-center gap-3 w-fit pl-3 pr-4 py-1 sm:py-1.5 rounded-3xl transition hover:shadow-md hover:bg-white ${activeFoodType === "veg" ? 'veg-active' : 'bg-[#EFF0F6]'}`}
              >
                <img src="/images/item-type/non-veg.png" alt="category" className="h-6" />
                <span className="capitalize text-xs sm:text-sm font-medium text-[#14142b]">Veg</span>
                {activeFoodType === "veg" && <XCircle className="w-5 h-5 text-red-500 ml-2" />}
              </button>
            </div>
          )}

          {/* HEADER & TOGGLE */}
          <div className="flex gap-2 sm:gap-4 items-start justify-between mb-4 sm:mb-6">
            <h2 className="capitalize text-lg sm:text-2xl font-semibold text-[#ff006b]">
              {selectedCategory ? selectedCategory.name : "All Items"}
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuViewMode("list")} className={`text-xl transition-colors ${menuViewMode === "list" ? "text-[#ff006b]" : "text-[#A0A3BD]"}`}>
                <List className="w-6 h-6" />
              </button>
              <button onClick={() => setMenuViewMode("grid")} className={`text-xl transition-colors ${menuViewMode === "grid" ? "text-[#ff006b]" : "text-[#A0A3BD]"}`}>
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
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold capitalize text-ellipsis whitespace-nowrap overflow-hidden w-fit max-w-[200px]">{item.name}</h3>
                      </div>
                      <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-ellipsis mb-4 flex-auto text-[#6e7191] line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <h4 className="text-xs sm:text-lg font-medium text-[#14142b]">₦{item.price?.toFixed(2)}</h4>
                        </div>
                        <button className="flex items-center gap-1 sm:gap-1.5 rounded-3xl capitalize text-sm font-medium h-5 sm:h-6 px-2 shadow-md transition bg-white text-[#14142b] hover:bg-[#ff006b] hover:text-white">
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
                        <h4 className="text-sm sm:text-base font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</h4>
                        <button className="flex items-center gap-1.5 rounded-3xl capitalize text-sm font-medium h-6 sm:h-7 px-3 shadow-md transition bg-white text-[#14142b] hover:bg-[#ff006b] hover:text-white">
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
              <span className="block w-full mb-4 text-center text-[#14142b]">No items available</span>
            </div>
          )}
        </div>
      </section>

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
