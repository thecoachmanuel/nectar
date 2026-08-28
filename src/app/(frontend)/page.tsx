"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { useCartStore } from "@/store/useCartStore";
import { Search, Plus, Leaf, Drumstick, Tag, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const { activeFoodType, menuViewMode } = useSettingStore();
  const { branchId } = useCartStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Slider images from seeder
  const sliders = [
    { image: "/images/seeder/slider/slider_one.png", title: "Flame Grilled Burgers", subtitle: "Fresh & Delicious" },
    { image: "/images/seeder/slider/slider_two.png", title: "Special Offers Await", subtitle: "Save Big Today" },
    { image: "/images/seeder/slider/slider_three.png", title: "Order From Anywhere", subtitle: "Fast Delivery" },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchItems(); }, [selectedCategoryId, activeFoodType, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/frontend/categories");
      const data = await res.json();
      if (data.status) setCategories(data.data || []);
    } catch (e) { console.error(e); }
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
      if (data.status) setItems(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openItemModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col font-rubik">
      <Navbar />

      {/* Hero Banner Slider */}
      <section className="relative overflow-hidden" style={{ marginTop: "0" }}>
        <div className="relative h-64 md:h-80 lg:h-96 w-full">
          {sliders.map((slide, i) => (
            <div key={i} className={`absolute inset-0 transition-all duration-700 ${i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/default/slider.png";
                }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 text-white space-y-2">
                <div className="inline-flex items-center gap-2 bg-[#ff006b] px-3 py-1 rounded-full text-xs font-semibold">
                  <Tag className="w-3 h-3" />
                  Fast & Fresh
                </div>
                <h1 className="text-2xl md:text-4xl font-black leading-tight">{slide.title}</h1>
                <p className="text-sm md:text-base opacity-90">{slide.subtitle}</p>
                <button
                  onClick={() => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-3xl text-sm font-semibold text-white transition-all hover:bg-[#ff3b8e]"
                  style={{ backgroundColor: "#ff006b" }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Order Now
                </button>
              </div>
            </div>
          ))}

          {/* Slide dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {sliders.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all duration-300 ${i === currentSlide ? "w-4 h-1.5 bg-[#ff006b]" : "w-3 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Offer Banner Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { image: "/images/seeder/offer/new_kings_collection.png", label: "New Collection" },
            { image: "/images/seeder/offer/free_fiery_chicken.png", label: "Fiery Chicken" },
            { image: "/images/seeder/offer/free_apple_thik_shake.png", label: "Apple Shake" },
            { image: "/images/seeder/offer/new_kings_collection_off_$49.png", label: "$49 Off Deal" },
          ].map((offer, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-sm border border-[#eff0f6] bg-white hover:shadow-lg transition-all cursor-pointer group">
              <img
                src={offer.image}
                alt={offer.label}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/default/offer.png";
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Main Menu Section */}
      <main id="menu-section" className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 flex-1 w-full">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-[#eff0f6]">
          <form onSubmit={(e) => { e.preventDefault(); fetchItems(); }} className="relative">
            <Search className="w-4 h-4 text-[#a0a3bd] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for pizza, burgers, sushi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm text-[#14142b] placeholder:text-[#a0a3bd] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
            />
          </form>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-4 menu-slides">
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all border ${selectedCategoryId === "all"
              ? "menu-category-active text-[#ff006b] border-[#ff006b] bg-[#fff5f9]"
              : "bg-white text-[#6e7191] border-[#eff0f6] hover:bg-[#f7f7fc]"
            }`}
          >
            <img src="/images/default/all-category.png" alt="All" className="w-5 h-5 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            All Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all border ${selectedCategoryId === cat._id
                ? "menu-category-active text-[#ff006b] border-[#ff006b] bg-[#fff5f9]"
                : "bg-white text-[#6e7191] border-[#eff0f6] hover:bg-[#f7f7fc]"
              }`}
            >
              {cat.image && (
                <img src={cat.image} alt={cat.name} className="w-5 h-5 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Item Listing */}
        {loading ? (
          <div className={`${menuViewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-3"}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden animate-pulse">
                <div className="w-full h-36 bg-[#eff0f6]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[#eff0f6] rounded w-3/4" />
                  <div className="h-4 bg-[#eff0f6] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6]">
            <img src="/images/item/item-not-found.png" alt="Not Found" className="w-32 mx-auto mb-4 opacity-60"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <h3 className="text-base font-bold text-[#14142b]">No Items Found</h3>
            <p className="text-xs text-[#a0a3bd] mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : menuViewMode === "grid" ? (
          /* === GRID VIEW: Exact PHP product-card-grid === */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => openItemModal(item)}
                className="product-card-grid cursor-pointer"
              >
                {/* Image */}
                <div className="relative w-full pt-[70%] bg-[#f7f7fc] rounded-t-2xl overflow-hidden">
                  <img
                    src={item.image || "/images/item/thumb.png"}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover product-card-grid-image group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }}
                  />
                  {/* Veg/Non-veg badge */}
                  <div className="absolute top-2 left-2">
                    {item.itemType === "veg" ? (
                      <div className="w-5 h-5 flex items-center justify-center rounded-sm border-2 border-emerald-500 bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center rounded-sm border-2 border-rose-500 bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      </div>
                    )}
                  </div>
                  {item.isFeatured && (
                    <div className="absolute top-2 right-2 bg-[#ff006b] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="product-card-grid-content-group p-2.5">
                  <div className="flex-1">
                    <h4 className="product-card-grid-title text-xs font-semibold text-[#14142b] mb-1 truncate">{item.name}</h4>
                    <p className="product-card-grid-describe text-[10px] text-[#6e7191] line-clamp-2">{item.description}</p>
                  </div>
                  <div className="product-card-grid-footer-group mt-2 flex items-center justify-between">
                    <span className="product-card-grid-price-current text-sm font-semibold text-[#14142b]">
                      ₦{item.price?.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openItemModal(item); }}
                      className="product-card-grid-cart-btn text-[#ff006b] hover:bg-[#ff006b] hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* === LIST VIEW: Exact PHP product-card-list === */
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => openItemModal(item)}
                className="product-card-list cursor-pointer"
              >
                {/* Image */}
                <img
                  src={item.image || "/images/item/thumb.png"}
                  alt={item.name}
                  className="product-card-list-image w-24 sm:w-28 h-full object-cover rounded-l-lg flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }}
                />

                <div className="product-card-list-content-group p-3 flex-1">
                  <div className="flex items-start gap-2 mb-1.5">
                    <h4 className="product-card-list-title text-sm font-semibold text-[#14142b] flex-1">{item.name}</h4>
                    {item.itemType === "veg" ? (
                      <div className="w-4 h-4 flex items-center justify-center rounded-sm border-2 border-emerald-500 bg-white flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 flex items-center justify-center rounded-sm border-2 border-rose-500 bg-white flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                      </div>
                    )}
                  </div>
                  <p className="product-card-list-describe text-xs text-[#6e7191] line-clamp-1 mb-2">{item.description}</p>
                  <div className="product-card-list-footer-group flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#14142b]">₦{item.price?.toFixed(2)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openItemModal(item); }}
                      className="product-card-list-cart-btn flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-1.5 rounded-3xl shadow-sm transition-all hover:opacity-90"
                      style={{ backgroundColor: "#ff006b" }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Item Modal */}
      <ItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
