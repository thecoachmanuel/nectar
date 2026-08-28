"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Plus, Star, ChevronLeft, ChevronRight, Loader2, ArrowRight, ShoppingBag, Truck, Info
} from "lucide-react";

export default function HomePage() {
  const { activeFoodType, menuViewMode } = useSettingStore();
  const { user } = useAuthStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const catScrollRef = useRef<HTMLDivElement>(null);

  const sliders = [
    { image: "/images/seeder/slider/slider_one.png", title: "Flame Grilled Burgers", subtitle: "Cooked fresh, every single time" },
    { image: "/images/seeder/slider/slider_two.png", title: "Exclusive Deals Today", subtitle: "Save big on your favourite meals" },
    { image: "/images/seeder/slider/slider_three.png", title: "Order in Minutes", subtitle: "Fast delivery right to your door" },
  ];

  const seederOffers = [
    { _id: "1", title: "New Kings Collection", slug: "new-kings-collection", image: "/images/seeder/offer/new_kings_collection.png" },
    { _id: "2", title: "Free Fiery Chicken", slug: "free-fiery-chicken", image: "/images/seeder/offer/free_fiery_chicken.png" },
  ];

  // Auto-advance banner slider
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % sliders.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      fetch("/api/frontend/categories").then(r => r.json()),
      fetch("/api/frontend/items?featured=true").then(r => r.json()),
      fetch("/api/frontend/items?popular=true").then(r => r.json()),
      fetch("/api/frontend/offers").then(r => r.json()).catch(() => ({ status: false })),
    ]).then(([cats, feat, pop, offs]) => {
      if (cats.status) setCategories(cats.data || []);
      if (feat.status) setFeaturedItems((feat.data || []).slice(0, 8));
      if (pop.status) setPopularItems((pop.data || []).slice(0, 6));
      if (offs.status && offs.data?.length > 0) setOffers(offs.data.slice(0, 2));
      else setOffers(seederOffers);
    }).finally(() => setLoading(false));
  }, []);

  // Check active order for logged user
  useEffect(() => {
    if (user?._id) {
      fetch(`/api/frontend/orders?userId=${user._id}&status=active`)
        .then(r => r.json())
        .then(data => {
          if (data.status && data.data?.length > 0) {
            const active = data.data.find((o: any) => ["accepted", "preparing", "on_the_way"].includes(o.status || o.orderStatus));
            setActiveOrder(active || null);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const openModal = (item: any) => { setSelectedItem(item); setIsModalOpen(true); };

  const scrollCats = (dir: "left" | "right") => {
    if (catScrollRef.current) catScrollRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  // Filter items by food type if active
  const filterByFoodType = (list: any[]) => {
    if (activeFoodType === "all") return list;
    return list.filter(i => i.itemType === activeFoodType);
  };

  const filteredFeatured = filterByFoodType(featuredItems);
  const filteredPopular = filterByFoodType(popularItems);

  return (
    <div className="min-h-screen bg-[#f7f7fc]">

      {/* ============================================================ */}
      {/* 1. TRACK ORDER STAGE BANNER (PHP TrackOrderComponent)        */}
      {/* ============================================================ */}
      {activeOrder && (
        <div className="bg-[#00B3A5] text-white py-3 px-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-100">Order Progress Stage</p>
                <p className="text-sm font-bold capitalize">
                  Order #{activeOrder._id?.slice(-6).toUpperCase()} is {activeOrder.status?.replace("_", " ")}
                </p>
              </div>
            </div>
            <Link href={`/order/${activeOrder._id}`}
              className="w-8 h-8 rounded-full bg-white text-[#00B3A5] flex items-center justify-center shadow hover:scale-105 transition-all flex-shrink-0">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. BANNER SLIDER (PHP SliderComponent)                       */}
      {/* ============================================================ */}
      <section className="mb-6 mt-4 sm:mt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl overflow-hidden h-44 sm:h-64 md:h-72 lg:h-80 shadow-sm bg-gray-900 group">
            {sliders.map((slide, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                <img src={slide.image} alt={slide.title}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/slider.png"; }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent rounded-2xl" />
                <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 text-white max-w-sm">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white inline-block mb-2" style={{ backgroundColor: "#ff006b" }}>
                    Special Offer
                  </span>
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-tight mb-1">{slide.title}</h2>
                  <p className="text-xs sm:text-sm text-gray-200 mb-3 line-clamp-2">{slide.subtitle}</p>
                  <Link href="/menu" className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-full transition-all hover:opacity-90 shadow-md"
                    style={{ backgroundColor: "#ff006b" }}>
                    Order Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Slider Navigation Arrows */}
            <button onClick={() => setCurrentSlide(p => (p - 1 + sliders.length) % sliders.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-[#14142b] hover:bg-[#ff006b] hover:text-white transition-all opacity-0 group-hover:opacity-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentSlide(p => (p + 1) % sliders.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-[#14142b] hover:bg-[#ff006b] hover:text-white transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Slider Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {sliders.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-5 bg-[#ff006b]" : "w-1.5 bg-white/60"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CATEGORY SECTION (PHP CategoryComponent)                  */}
      {/* ============================================================ */}
      {categories.length > 0 && (
        <section className="mb-6 sm:mb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
              <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Our Menu</h2>
              <Link href="/menu"
                className="rounded-3xl capitalize text-xs sm:text-sm font-medium py-1 px-3 transition-all text-[#ff006b] bg-[#D8FFFC] hover:text-white hover:bg-[#ff006b]">
                View All
              </Link>
            </div>

            {/* Swiper Category Cards matching PHP: w-[5.5rem] sm:w-32 h-[5.5rem] sm:h-32 */}
            <div className="relative">
              <button onClick={() => scrollCats("left")}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-[#ff006b] transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div ref={catScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-4">
                {categories.map((cat) => (
                  <Link key={cat._id} href={`/menu?categoryId=${cat._id}`}
                    className="w-[5.5rem] sm:w-32 h-[5.5rem] sm:h-32 flex-shrink-0 flex flex-col items-center justify-center text-center gap-2 sm:gap-3 px-1.5 sm:p-3 rounded-2xl border-b-2 border-transparent transition-all bg-[#F7F7FC] hover:bg-[#D8FFFC] group">
                    <img src={cat.image || "/images/category/thumb.png"} alt={cat.name}
                      className="h-7 sm:h-12 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/category/thumb.png"; }} />
                    <h3 className="text-[9px] sm:text-xs font-medium text-[#14142b] line-clamp-1 capitalize">{cat.name}</h3>
                  </Link>
                ))}
              </div>
              <button onClick={() => scrollCats("right")}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-[#ff006b] transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 4. FEATURED ITEMS (PHP FeaturedItemComponent)               */}
      {/* ============================================================ */}
      {filteredFeatured.length > 0 && (
        <section className="mb-6 sm:mb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
              <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Featured Items</h2>
              <Link href="/menu" className="text-xs font-semibold text-[#ff006b] hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-6">
              {filteredFeatured.map((item) => (
                <GridProductCard key={item._id} item={item} onOpen={openModal} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. OFFER BANNERS (PHP OfferComponent)                       */}
      {/* ============================================================ */}
      {offers.length > 0 && (
        <section className="mb-6 sm:mb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {offers.map((offer) => (
                <Link key={offer._id} href={`/offers/${offer.slug}`}
                  className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                  <img src={offer.image || "/images/default/offer.png"} alt={offer.title}
                    className="w-full rounded-2xl object-cover group-hover:scale-102 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/offer.png"; }} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 6. MOST POPULAR ITEMS (PHP PopularItemComponent)             */}
      {/* ============================================================ */}
      {filteredPopular.length > 0 && (
        <section className="mb-16 sm:mb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
              <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Most Popular Items</h2>
              <Link href="/menu" className="text-xs font-semibold text-[#ff006b] hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {filteredPopular.map((item) => (
                <ListProductCard key={item._id} item={item} onOpen={openModal} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff006b]" />
        </div>
      )}

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

/* PHP-exact Grid Product Card matching product-card-grid */
function GridProductCard({ item, onOpen }: { item: any; onOpen: (item: any) => void }) {
  return (
    <div onClick={() => onOpen(item)} className="product-card-grid cursor-pointer group">
      <div className="relative pt-[75%] bg-[#f7f7fc] rounded-t-2xl overflow-hidden">
        <img src={item.image || "/images/item/thumb.png"} alt={item.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
        {/* Veg/Non-Veg dot */}
        <div className="absolute top-2 left-2">
          <div className={`w-4 h-4 flex items-center justify-center rounded-sm border bg-white ${item.itemType === "veg" ? "border-emerald-500" : "border-rose-500"}`}>
            <div className={`w-2 h-2 rounded-full ${item.itemType === "veg" ? "bg-emerald-500" : "bg-rose-500"}`} />
          </div>
        </div>
        {item.isFeatured && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#ff006b" }}>
            <Star className="w-3 h-3 fill-white" />
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-[#14142b] truncate mb-1 capitalize">{item.name}</h3>
          <p className="text-[10px] sm:text-xs text-[#6e7191] line-clamp-2 mb-2">{item.description}</p>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#eff0f6]">
          <h4 className="text-xs sm:text-sm font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</h4>
          <button onClick={(e) => { e.stopPropagation(); onOpen(item); }}
            className="product-card-grid-cart-btn">
            <ShoppingBag className="w-3 h-3 text-[#ff006b]" />
            <span className="text-[10px] sm:text-xs text-[#ff006b]">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* PHP-exact List Product Card matching product-card-list */
function ListProductCard({ item, onOpen }: { item: any; onOpen: (item: any) => void }) {
  return (
    <div onClick={() => onOpen(item)} className="product-card-list cursor-pointer group p-2.5">
      <img src={item.image || "/images/item/thumb.png"} alt={item.name}
        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform"
        onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />

      <div className="flex-1 min-w-0 ml-3 flex flex-col justify-between h-20 sm:h-24 py-0.5">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-xs sm:text-sm font-semibold text-[#14142b] truncate capitalize">{item.name}</h3>
            <div className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm border bg-white flex-shrink-0 ${item.itemType === "veg" ? "border-emerald-500" : "border-rose-500"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${item.itemType === "veg" ? "bg-emerald-500" : "bg-rose-500"}`} />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-[#6e7191] line-clamp-1 mt-0.5">{item.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</h4>
          <button onClick={(e) => { e.stopPropagation(); onOpen(item); }}
            className="product-card-grid-cart-btn">
            <ShoppingBag className="w-3 h-3 text-[#ff006b]" />
            <span className="text-[10px] sm:text-xs text-[#ff006b]">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
