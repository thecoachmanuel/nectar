"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Loader2, X } from "lucide-react";
import ItemModal from "@/components/frontend/ItemModal";
import { formatPrice } from "@/lib/formatters";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("s") || searchParams?.get("search") || "";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (query) { setSearchQuery(query); doSearch(query); }
  }, [query]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/frontend/items?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setItems(data.status ? data.data || [] : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchQuery);
    const url = new URL(window.location.href);
    url.searchParams.set("s", searchQuery);
    window.history.pushState({}, "", url.toString());
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#14142b] mb-4">Search Results</h1>
        <form onSubmit={handleSearch} className="relative max-w-xl">
          <Search className="w-4 h-4 text-[#a0a3bd] absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for food, category..."
            className="w-full pl-11 pr-12 py-3 bg-white border border-[#eff0f6] rounded-2xl text-sm text-[#14142b] placeholder:text-[#a0a3bd] focus:outline-none focus:border-primary transition-all shadow-sm" />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-[#a0a3bd] hover:text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-white flex items-center justify-center"
            style={{ backgroundColor: "var(--primary-hex)" }}>
            <Search className="w-4 h-4" />
          </button>
        </form>
        {query && !loading && (
          <p className="text-sm text-[#6e7191] mt-2">
            {items.length > 0
              ? `Found ${items.length} result${items.length !== 1 ? "s" : ""} for "${query}"`
              : `No results for "${query}"`}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary-hex)" }} />
        </div>
      ) : !query ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#eff0f6]">
          <Search className="w-12 h-12 mx-auto mb-3 text-[#eff0f6]" />
          <p className="text-base font-semibold text-[#14142b]">Search for anything</p>
          <p className="text-sm text-[#a0a3bd] mt-1">Type a food name, category, or ingredient</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#eff0f6]">
          <img src="/images/default/not-found.png" alt="Not Found" className="w-32 mx-auto mb-4 opacity-50"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p className="text-base font-semibold text-[#14142b]">No Results Found</p>
          <p className="text-sm text-[#a0a3bd] mt-1">Try different keywords or browse the menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {items.map((item) => {
            const hasDiscount = item.discountPrice && Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price);
            return (
              <div key={item._id} onClick={() => { setSelectedItem(item); setModalOpen(true); }}
                className="product-card-grid cursor-pointer overflow-hidden w-full min-w-0">
                <div className="relative pt-[75%] bg-[#f7f7fc] rounded-t-2xl overflow-hidden">
                  <img src={item.image || "/images/item/thumb.png"} alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black shadow-md z-10">
                      -{Math.round(((item.price - item.discountPrice) / item.price) * 100)}%
                    </div>
                  )}
                </div>
                <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
                  <div className="min-w-0 mb-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#14142b] leading-snug w-full capitalize line-clamp-2" title={item.name}>{item.name}</h4>
                    <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-[#6e7191] line-clamp-2 mt-0.5 break-words">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1 w-full min-w-0 pt-1 mt-auto">
                    <div className="min-w-0 flex items-baseline gap-1.5">
                      {hasDiscount ? (
                        <>
                          <span className="text-xs sm:text-base font-bold text-primary truncate min-w-0">
                            {formatPrice(item.discountPrice)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-[#a0a3bd] line-through truncate font-normal">
                            {formatPrice(item.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs sm:text-base font-semibold text-[#14142b] truncate min-w-0">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                    <button className="product-card-grid-cart-btn shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ItemModal item={selectedItem} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
