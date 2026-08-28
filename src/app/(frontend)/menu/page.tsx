"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { Search, Grid, List, Plus, Leaf, Drumstick } from "lucide-react";

export default function MenuPage() {
  const { activeFoodType, menuViewMode, setMenuViewMode, formatPrice } = useSettingStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, activeFoodType, search]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) setCategories(data.data || []);
    } catch (e) {
      console.error(e);
    }
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search full menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMenuViewMode("grid")}
                className={`p-2 rounded-lg transition ${
                  menuViewMode === "grid" ? "bg-white text-red-500 shadow-sm" : "text-slate-500"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMenuViewMode("list")}
                className={`p-2 rounded-lg transition ${
                  menuViewMode === "list" ? "bg-white text-red-500 shadow-sm" : "text-slate-500"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category horizontal scroll */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat._id ? "bg-red-500 text-white" : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-64 animate-pulse p-4"></div>
            ))}
          </div>
        ) : menuViewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition p-4 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <img
                    src={item.image || "/images/icons/icon-192x192.png"}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-xl mb-3"
                  />
                  <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                  <span className="font-bold text-sm text-slate-900">{formatPrice(item.price)}</span>
                  <button className="bg-red-500 text-white p-2 rounded-xl text-xs font-bold flex items-center space-x-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image || "/images/icons/icon-192x192.png"}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                    <span className="font-bold text-xs text-red-500">{formatPrice(item.price)}</span>
                  </div>
                </div>
                <button className="bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl">
                  Select Options
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <ItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
