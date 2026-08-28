"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { useCartStore } from "@/store/useCartStore";
import { Search, Grid, List, Sparkles, Plus, Clock, Star, Leaf, Drumstick } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const { activeBranch, activeFoodType, menuViewMode, setMenuViewMode, formatPrice } =
    useSettingStore();
  const { branchId } = useCartStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCategoryId, activeFoodType, searchQuery, activeBranch]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) {
        setCategories(data.data || []);
      }
    } catch (e) {
      console.error("Fetch categories error:", e);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/api/frontend/items?`;
      if (selectedCategoryId !== "all") url += `categoryId=${selectedCategoryId}&`;
      if (activeFoodType !== "all") url += `itemType=${activeFoodType}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.status) {
        setItems(data.data || []);
      }
    } catch (e) {
      console.error("Fetch items error:", e);
    } finally {
      setLoading(false);
    }
  };

  const openItemModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Promotional Banner */}
      <section className="bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white py-12 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fast & Fresh Food Delivery</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
              Delicious Meals Delivered Direct To Your Door
            </h1>
            <p className="text-sm md:text-base text-red-100 font-medium">
              Choose from wide range of cuisines, custom variations, and extra toppings.
            </p>
          </div>

          <div className="w-full md:w-auto flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-2xl flex items-center justify-center relative overflow-hidden">
              <img
                src="/images/icons/icon-512x512.png"
                alt="Delicious Dish"
                className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Search & Layout Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          {/* Search Bar Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for pizza, burgers, sushi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMenuViewMode("grid")}
                className={`p-2 rounded-lg transition ${
                  menuViewMode === "grid" ? "bg-white text-red-500 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMenuViewMode("list")}
                className={`p-2 rounded-lg transition ${
                  menuViewMode === "list" ? "bg-white text-red-500 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition shadow-sm ${
              selectedCategoryId === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition shadow-sm ${
                selectedCategoryId === cat._id
                  ? "bg-red-500 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Listing Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 h-64 animate-pulse border border-slate-100">
                <div className="w-full h-36 bg-slate-200 rounded-xl mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-3">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
              🍽️
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Food Items Found</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : menuViewMode === "grid" ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => openItemModal(item)}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.image || "/images/icons/icon-192x192.png"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex items-center space-x-1">
                      {item.itemType === "veg" ? (
                        <>
                          <Leaf className="w-3 h-3 text-emerald-400" />
                          <span>Veg</span>
                        </>
                      ) : (
                        <>
                          <Drumstick className="w-3 h-3 text-rose-400" />
                          <span>Non-Veg</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h4 className="font-bold text-slate-800 group-hover:text-red-500 transition line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between mt-2">
                  <span className="font-extrabold text-base text-slate-900">
                    {formatPrice(item.price)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openItemModal(item);
                    }}
                    className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white p-2 rounded-xl transition font-bold text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View Layout */
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => openItemModal(item)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image || "/images/icons/icon-192x192.png"}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-slate-100 text-slate-600">
                        {item.itemType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                    <p className="font-extrabold text-sm text-red-500">{formatPrice(item.price)}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openItemModal(item);
                  }}
                  className="bg-red-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow hover:bg-red-600 transition shrink-0"
                >
                  Select Options
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Item Modal Popup */}
      <ItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
