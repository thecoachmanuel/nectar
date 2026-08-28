"use client";

import React, { useState, useEffect, useRef } from "react";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { Search, Grid, List, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function MenuPage() {
  const { activeFoodType, menuViewMode, setMenuViewMode } = useSettingStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchItems(); }, [selectedCategory, activeFoodType, search]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) setCategories(data.data || []);
    } catch {}
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/api/frontend/items?`;
      if (selectedCategory !== "all") url += `categoryId=${selectedCategory}&`;
      if (activeFoodType !== "all") url += `itemType=${activeFoodType}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status) setItems(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const scrollCats = (dir: "left" | "right") => {
    catRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
      {/* Search + View Toggle */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-[#eff0f6] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#a0a3bd] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search menu items..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm text-[#14142b] placeholder:text-[#a0a3bd] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-1 bg-[#f7f7fc] p-1 rounded-xl">
          <button onClick={() => setMenuViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${menuViewMode === "grid" ? "bg-white text-[#ff006b] shadow-sm" : "text-[#a0a3bd]"}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setMenuViewMode("list")}
            className={`p-2 rounded-lg transition-all ${menuViewMode === "list" ? "bg-white text-[#ff006b] shadow-sm" : "text-[#a0a3bd]"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Scroll */}
      <div className="relative mb-4">
        <button onClick={() => scrollCats("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-[#ff006b] transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div ref={catRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-9 menu-slides">
          <button onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${selectedCategory === "all" ? "menu-category-active text-[#ff006b] border-[#ff006b] bg-[#fff5f9]" : "bg-white text-[#6e7191] border-[#eff0f6] hover:bg-[#f7f7fc]"}`}>
            <img src="/images/default/all-category.png" alt="All" className="w-5 h-5 rounded-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            All Categories
          </button>
          {categories.map(cat => (
            <button key={cat._id} onClick={() => setSelectedCategory(cat._id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${selectedCategory === cat._id ? "menu-category-active text-[#ff006b] border-[#ff006b] bg-[#fff5f9]" : "bg-white text-[#6e7191] border-[#eff0f6] hover:bg-[#f7f7fc]"}`}>
              {cat.image && <img src={cat.image} alt={cat.name} className="w-5 h-5 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              {cat.name}
            </button>
          ))}
        </div>
        <button onClick={() => scrollCats("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-[#ff006b] transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Items */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#ff006b" }} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6]">
          <img src="/images/item/item-not-found.png" alt="Not found" className="w-28 mx-auto mb-4 opacity-50"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p className="text-sm font-semibold text-[#14142b]">No items found</p>
        </div>
      ) : menuViewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map(item => (
            <div key={item._id} onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
              className="product-card-grid cursor-pointer group">
              <div className="relative pt-[70%] bg-[#f7f7fc] rounded-t-2xl overflow-hidden">
                <img src={item.image || "/images/item/thumb.png"} alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
                <div className="absolute top-2 left-2">
                  <div className={`w-5 h-5 flex items-center justify-center rounded-sm border-2 bg-white ${item.itemType === "veg" ? "border-emerald-500" : "border-rose-500"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${item.itemType === "veg" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </div>
                </div>
              </div>
              <div className="p-2.5">
                <h4 className="text-xs font-semibold text-[#14142b] truncate mb-1">{item.name}</h4>
                <p className="text-[10px] text-[#6e7191] line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</span>
                  <button className="product-card-grid-cart-btn text-[#ff006b] hover:bg-[#ff006b] hover:text-white">
                    <Plus className="w-3.5 h-3.5" /><span className="text-[10px]">Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item._id} onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
              className="product-card-list cursor-pointer">
              <img src={item.image || "/images/item/thumb.png"} alt={item.name}
                className="w-24 sm:w-28 h-full object-cover rounded-l-lg flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
              <div className="p-3 flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-[#14142b] flex-1 capitalize">{item.name}</h4>
                  <div className={`w-4 h-4 flex items-center justify-center rounded-sm border-2 bg-white flex-shrink-0 ${item.itemType === "veg" ? "border-emerald-500" : "border-rose-500"}`}>
                    <div className={`w-2 h-2 rounded-full ${item.itemType === "veg" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </div>
                </div>
                <p className="text-xs text-[#6e7191] line-clamp-1 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</span>
                  <button className="product-card-list-cart-btn flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-3xl"
                    style={{ backgroundColor: "#ff006b" }}>
                    <Plus className="w-3.5 h-3.5" />Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
