import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Loader2, X, PackageSearch } from "lucide-react";
import ItemModal from "@/components/frontend/ItemModal";
import ProductRequestModal from "@/components/frontend/ProductRequestModal";
import { formatPrice } from "@/lib/formatters";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("s") || searchParams?.get("search") || "";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

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
            placeholder="Search for food, category, brand..."
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
        <div className="text-center py-20 bg-white rounded-3xl border border-[#eff0f6]">
          <Search className="w-12 h-12 mx-auto mb-3 text-[#eff0f6]" />
          <p className="text-base font-semibold text-[#14142b]">Search for anything</p>
          <p className="text-sm text-[#a0a3bd] mt-1">Type a grocery name, category, or brand</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4 bg-white rounded-3xl border border-[#eff0f6] max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-[#FFF0F5] text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#14142b]">
            No Products Found for &ldquo;{query}&rdquo;
          </h3>
          <p className="text-xs sm:text-sm text-[#6e7191] mt-1.5 max-w-md mx-auto leading-relaxed">
            We don&apos;t have this item in our catalog yet, but you can request it and we&apos;ll get it stocked for you!
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setRequestModalOpen(true)}
              className="w-full sm:w-auto px-6 h-11 rounded-2xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              <PackageSearch className="w-4 h-4" />
              <span>Request This Product</span>
            </button>
            <Link
              href="/menu"
              className="w-full sm:w-auto px-6 h-11 rounded-2xl border border-[#eff0f6] bg-[#FAFAFC] text-[#14142b] text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              Browse All Groceries
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {items.map((item) => {
              const hasDiscount = Boolean(item.discountPrice && Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price));
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

          {/* Bottom request prompt banner */}
          <div className="mt-12 p-5 sm:p-6 bg-gradient-to-r from-primary/5 via-white to-primary/5 rounded-2xl border border-[#eff0f6] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <PackageSearch className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#14142b]">Looking for something else?</h4>
                <p className="text-xs text-[#6e7191]">Can&apos;t find a specific grocery item or brand? Request it and we&apos;ll stock it.</p>
              </div>
            </div>
            <button
              onClick={() => setRequestModalOpen(true)}
              className="px-5 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-[#e60060] transition-colors shrink-0 shadow-sm"
            >
              Request a Product
            </button>
          </div>
        </>
      )}

      <ItemModal item={selectedItem} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <ProductRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        initialProductName={query}
      />
    </div>
  );
}
