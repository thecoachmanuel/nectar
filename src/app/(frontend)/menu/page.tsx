"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { formatPrice } from "@/lib/formatters";
import { List, Grid, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useSearchParams, useRouter } from "next/navigation";

/* ─── helpers ─────────────────────────────────────────── */
// Shuffle array — fresh product order every session
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function groupByCategory(items: any[], categories: any[]) {
  const map: Record<string, { cat: any; items: any[] }> = {};
  // preserve category order
  categories.forEach(cat => { map[cat._id] = { cat, items: [] }; });

  items.forEach(item => {
    const catId = item.categoryId?._id || item.categoryId;
    if (catId && map[catId]) {
      map[catId].items.push(item);
    } else {
      // uncategorised bucket
      if (!map["__other"]) map["__other"] = { cat: { _id: "__other", name: "Other" }, items: [] };
      map["__other"].items.push(item);
    }
  });

  return Object.values(map).filter(g => g.items.length > 0);
}

/* ─── small product card (grid) ──────────────────────── */
function ProductCard({ item, onOpen }: { item: any; onOpen: (i: any) => void }) {
  return (
    <div
      onClick={() => onOpen(item)}
      className="product-card-grid cursor-pointer group overflow-hidden w-full min-w-0 flex-shrink-0 h-full"
    >
      <div className="relative w-full pt-[75%] bg-[#f7f7fc] overflow-hidden">
        <img
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={item.image || "/images/item/thumb.png"}
          alt={item.name}
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }}
        />
      </div>
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between min-w-0">
        <div className="min-w-0 mb-1.5">
          <h3 className="text-xs sm:text-sm font-semibold capitalize leading-snug w-full text-[#14142b] line-clamp-2" title={item.name}>
            {item.name}
          </h3>
          <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-[#6e7191] line-clamp-2 mt-0.5 break-words">
            {item.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-1.5 w-full min-w-0 pt-1 mt-auto">
          <h4 className="text-xs sm:text-base font-semibold text-[#14142b] truncate min-w-0">
            {formatPrice(item.price)}
          </h4>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(item); }}
            className="product-card-grid-cart-btn shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── list row card ───────────────────────────────────── */
function ProductRow({ item, onOpen }: { item: any; onOpen: (i: any) => void }) {
  return (
    <div
      onClick={() => onOpen(item)}
      className="relative flex items-center rounded-2xl border border-[#eff0f6] bg-white transition hover:shadow-xl cursor-pointer overflow-hidden w-full min-w-0"
    >
      <img
        className="w-24 sm:w-28 h-24 sm:h-28 object-cover rounded-l-2xl shrink-0"
        src={item.image || "/images/item/thumb.png"}
        alt={item.name}
        onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }}
      />
      <div className="p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-between h-full">
        <div className="min-w-0 mb-1">
          <h3 className="text-sm font-semibold capitalize text-[#14142b] leading-snug w-full line-clamp-2" title={item.name}>
            {item.name}
          </h3>
          <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-[#6e7191] line-clamp-2 mt-0.5 break-words">
            {item.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0 pt-1">
          <h4 className="text-sm sm:text-base font-semibold text-[#14142b] truncate min-w-0">
            {formatPrice(item.price)}
          </h4>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(item); }}
            className="flex items-center gap-1 rounded-3xl capitalize text-xs font-semibold h-7 px-3 shadow-sm transition text-white hover:opacity-90 shrink-0"
            style={{ backgroundColor: "var(--primary-hex)" }}
          >
            <Plus className="w-3 h-3" />
            <span className="text-[10px] sm:text-xs">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── "All Products" aisle-grouped view ──────────────── */
function AisleView({
  groups,
  onOpen,
  viewMode,
}: {
  groups: { cat: any; items: any[] }[];
  onOpen: (i: any) => void;
  viewMode: "grid" | "list";
}) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-10 sm:space-y-14">
      {groups.map(({ cat, items }) => (
        <section key={cat._id}>
          {/* Aisle header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-xl font-semibold capitalize text-[#14142b] flex items-center gap-2">
              {cat.image && cat._id !== "__other" && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-6 h-6 object-contain rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              {cat.name}
              <span className="text-xs font-normal text-[#a0a3bd] ml-1">
                ({items.length})
              </span>
            </h2>
            {cat._id !== "__other" && (
              <Link
                href={`/menu?category=${cat._id}`}
                className="flex items-center gap-0.5 text-xs font-semibold hover:underline shrink-0"
                style={{ color: "var(--primary-hex)" }}
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {viewMode === "grid" ? (
            /* Horizontal scroll row — top grocers (Ocado / Tesco / Instacart) pattern */
            <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <div
                className="flex gap-3 sm:gap-4 items-stretch"
                style={{ width: "max-content" }}
              >
                {items.map(item => (
                  <div
                    key={item._id}
                    className="w-[8.5rem] sm:w-44 flex flex-col"
                  >
                    <ProductCard item={item} onOpen={onOpen} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* List view: 1-col mobile, 2-col tablet, 3-col desktop */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(item => (
                <ProductRow key={item._id} item={item} onOpen={onOpen} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function MenuContent() {
  const router = useRouter();
  const { menuViewMode, setMenuViewMode } = useSettingStore();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const featuredParam = searchParams.get("featured");
  const offerParam = searchParams.get("offer");

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]); // full unfiltered set
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAllView = !selectedCategory && !searchParam && !featuredParam && !offerParam;

  /* fetch categories once */
  useEffect(() => {
    fetchCategories();
  }, []);

  /* react to URL category param changes (handles "View All" clicks from within the page) */
  useEffect(() => {
    if (categories.length === 0) return;
    if (categoryParam && categoryParam !== "all") {
      const found = categories.find(
        (c: any) => c._id === categoryParam || c.slug === categoryParam
      );
      setSelectedCategory(found || null);
    } else {
      setSelectedCategory(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categoryParam, categories]);

  /* fetch items on filter change */
  useEffect(() => {
    fetchItems();
  }, [selectedCategory, searchParam, featuredParam, offerParam]);

  /* pre-fetch ALL items for the aisle view */
  useEffect(() => {
    if (isAllView) {
      fetchAllItems();
    }
  }, [isAllView]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) {
        setCategories(data.data || []);
        // selectedCategory is now set reactively by the categoryParam effect above
      }
    } catch {}
  };

  const handleSelectCategory = (cat: any) => {
    setSelectedCategory(cat);
    if (cat) {
      router.push(`/menu?category=${cat._id}`, { scroll: true });
    } else {
      router.push('/menu', { scroll: true });
    }
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

  /* fetch all items (no filter) for grouped aisle view — shuffle for fresh order every visit */
  const fetchAllItems = async () => {
    try {
      const res = await fetch("/api/frontend/items?");
      const data = await res.json();
      if (data.status) setAllItems(shuffleArray(data.data || []));
    } catch {}
  };

  const openModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  /* grouped data for aisle view */
  const groups = isAllView ? groupByCategory(allItems, categories) : [];

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
                    onClick={() => handleSelectCategory(null)}
                    className={`w-[5.5rem] sm:w-32 h-[5.5rem] sm:h-32 flex flex-col items-center justify-center text-center gap-2 sm:gap-4 px-1.5 sm:p-3 rounded-2xl border-b-2 border-transparent transition hover:bg-[#D8FFFC] ${!selectedCategory ? 'menu-category-active' : 'bg-[#F7F7FC]'}`}
                  >
                    <img className="h-7 sm:h-12 drop-shadow-sm" src="/images/default/all-category.png" alt="All" />
                    <h3 className="text-[9px] leading-[14px] sm:leading-4 sm:text-xs font-medium">All Categories</h3>
                  </button>
                </SwiperSlide>
                {categories.map((cat) => (
                  <SwiperSlide key={cat._id} className="!w-fit">
                    <button
                      onClick={() => handleSelectCategory(cat)}
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

          {/* HEADER & VIEW TOGGLE */}
          <div className="flex gap-2 sm:gap-4 items-start justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="capitalize text-lg sm:text-2xl font-semibold text-primary">
                {selectedCategory ? selectedCategory.name : "All Products"}
              </h2>
              {isAllView && allItems.length > 0 && (
                <p className="text-xs text-[#6e7191] mt-0.5">
                  {allItems.length} products across {groups.length} {groups.length === 1 ? "category" : "categories"}
                </p>
              )}
              {!isAllView && items.length > 0 && (
                <p className="text-xs text-[#6e7191] mt-0.5">{items.length} products</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuViewMode("list")} className={`transition-colors ${menuViewMode === "list" ? "text-primary" : "text-[#A0A3BD]"}`}>
                <List className="w-6 h-6" />
              </button>
              <button onClick={() => setMenuViewMode("grid")} className={`transition-colors ${menuViewMode === "grid" ? "text-primary" : "text-[#A0A3BD]"}`}>
                <Grid className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ── ALL PRODUCTS: aisle-grouped view ── */}
          {isAllView ? (
            allItems.length === 0 && !loading ? (
              <div className="mt-12 text-center">
                <div className="max-w-[250px] mx-auto">
                  <img className="w-full mb-8 opacity-60" src="/images/item/item-not-found.png" alt="Not found" />
                </div>
                <span className="block w-full mb-4 text-center text-[#14142b]">No items available</span>
              </div>
            ) : (
              <AisleView groups={groups} onOpen={openModal} viewMode={menuViewMode} />
            )
          ) : (
            /* ── SINGLE CATEGORY / SEARCH / FEATURED: flat grid or list ── */
            items.length > 0 ? (
              menuViewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-6">
                  {items.map(item => (
                    <ProductCard key={item._id} item={item} onOpen={openModal} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {items.map(item => (
                    <ProductRow key={item._id} item={item} onOpen={openModal} />
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
            )
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
