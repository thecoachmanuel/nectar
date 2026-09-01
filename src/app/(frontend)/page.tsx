"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ItemModal from "@/components/frontend/ItemModal";
import { useSettingStore } from "@/store/useSettingStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatPrice } from "@/lib/formatters";
import { Search, Plus, Star, Leaf, Drumstick, Tag, MapPin, ChevronLeft, ChevronRight, Loader2, ArrowRight, Clock } from "lucide-react";

// Helper to shuffle items randomly
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function HomePage() {
  const { menuViewMode } = useSettingStore();
  const { settings } = useSettingsStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const catScrollRef = useRef<HTMLDivElement>(null);
  const storeScrollRef = useRef<HTMLDivElement>(null);

  const sliders = banners.map(b => ({
    image: b.image,
    title: b.title,
    subtitle: b.subtitle,
    link: b.link || "",
    showText: b.showText !== false, // default true
  }));

  // Auto-advance slider
  useEffect(() => {
    if (sliders.length <= 1) return;
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % sliders.length), 4000);
    return () => clearInterval(t);
  }, [sliders.length]);

  // Get location and load data
  useEffect(() => {
    const fetchData = (lat?: number, lng?: number) => {
      const locQuery = lat && lng ? `?latitude=${lat}&longitude=${lng}` : '';
      const andLocQuery = lat && lng ? `&latitude=${lat}&longitude=${lng}` : '';
      
      Promise.all([
        fetch("/api/frontend/categories").then(r => r.json()),
        fetch(`/api/frontend/items?featured=true${andLocQuery}`).then(r => r.json()),
        fetch(`/api/frontend/items?popular=true${andLocQuery}`).then(r => r.json()),
        fetch(`/api/frontend/items${locQuery}`).then(r => r.json()),
        fetch("/api/frontend/offers").then(r => r.json()).catch(() => ({ status: false })),
        fetch(`/api/frontend/stores${locQuery}`).then(r => r.json()).catch(() => ({ status: false })),
        fetch("/api/frontend/banners").then(r => r.json()).catch(() => ({ status: false })),
      ]).then(([cats, feat, pop, itemsRes, offs, strs, bans]) => {
        if (cats.status) setCategories(cats.data || []);
        if (feat.status) setFeaturedItems((feat.data || []).slice(0, 10));
        if (pop.status) {
          // Shuffle popular products every time user opens the app or website
          const shuffledPopular = shuffleArray(pop.data || []);
          setPopularItems(shuffledPopular.slice(0, 10));
        }
        if (itemsRes.status) setAllItems(itemsRes.data || []);
        
        if (offs.status && offs.data?.length > 0) setOffers(offs.data);
        if (strs.status) setStores(strs.stores || []);
        if (bans.status && bans.data?.length > 0) setBanners(bans.data);
      }).finally(() => setLoading(false));
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          fetchData(position.coords.latitude, position.coords.longitude);
        },
        () => { fetchData(); },
        { timeout: 5000 }
      );
    } else {
      fetchData();
    }
  }, []);

  // Map each category to its live products from the database;
  // shuffle each category's items every session so the home screen always feels fresh
  const categoriesWithProducts = React.useMemo(() => {
    if (!categories || categories.length === 0 || !allItems || allItems.length === 0) return [];
    
    return categories
      .map((cat: any) => {
        const catIdStr = cat._id?.toString();
        const catItems = allItems.filter((item: any) => {
          const rawCat = item.categoryId;
          const itemCatId = (rawCat && typeof rawCat === "object" ? rawCat._id?.toString() : rawCat?.toString()) || "";
          return itemCatId === catIdStr;
        });
        const shuffled = shuffleArray(catItems); // fresh shuffle every page mount
        return {
          ...cat,
          products: shuffled.slice(0, 10),
          totalCount: catItems.length,
        };
      })
      .filter((cat: any) => cat.products && cat.products.length > 0);
  }, [categories, allItems]);

  const openModal = (item: any) => { setSelectedItem(item); setIsModalOpen(true); };

  const scrollCats = (dir: "left" | "right") => {
    if (catScrollRef.current) catScrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };
  
  const scrollStores = (dir: "left" | "right") => {
    if (storeScrollRef.current) storeScrollRef.current.scrollBy({ left: dir === "left" ? -250 : 250, behavior: "smooth" });
  };

  return (
    <div>


      {/* ========= BANNER SLIDER ========= */}
      {sliders.length > 0 && (
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 sm:mt-8">
            <div className="group relative rounded-2xl overflow-hidden h-52 md:h-72 lg:h-80 banner-swiper">
              {sliders.map((slide, i) => {
                const Wrapper = slide.link ? Link : 'div';
                const wrapperProps: any = slide.link
                  ? { href: slide.link, className: `absolute inset-0 block transition-all duration-700 ${i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}` }
                  : { className: `absolute inset-0 transition-all duration-700 ${i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}` };
                return (
                  <Wrapper key={i} {...wrapperProps}>
                    <img src={slide.image} alt={slide.title || "Banner"}
                      className="w-full h-full object-cover rounded-2xl"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/slider.png"; }} />
                    {slide.showText && (slide.title || slide.subtitle) && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent rounded-2xl pointer-events-none" />
                        <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 text-white pointer-events-none">
                          <p className="text-xs font-semibold opacity-80 mb-1">⚡ Today&apos;s Special</p>
                          {slide.title && <h2 className="text-xl md:text-3xl font-black leading-tight mb-2">{slide.title}</h2>}
                          {slide.subtitle && <p className="text-xs md:text-sm opacity-90 mb-4">{slide.subtitle}</p>}
                        </div>
                      </>
                    )}
                  </Wrapper>
                );
              })}
              {/* Prev/Next */}
              {sliders.length > 1 && (
                <>
                  <button onClick={() => setCurrentSlide(p => (p - 1 + sliders.length) % sliders.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#14142b] hover:bg-primary hover:text-white transition-all opacity-0 hover:opacity-100 group-hover:opacity-100">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setCurrentSlide(p => (p + 1) % sliders.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#14142b] hover:bg-primary hover:text-white transition-all opacity-0 hover:opacity-100 group-hover:opacity-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              {/* Dots */}
              {sliders.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {sliders.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)}
                      className={`h-2 transition-all rounded-full ${i === currentSlide ? "w-6 bg-primary" : "w-2 bg-white/60 hover:bg-white"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========= CATEGORY SECTION ========= */}
      {categories.length > 0 && (
        <section className="mb-6 sm:mb-12 mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Categories</h2>
              <Link href="/menu" className="text-xs font-medium" style={{ color: "var(--primary-hex)" }}>
                View All
              </Link>
            </div>
            <div className="relative">
              <button onClick={() => scrollCats("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-primary transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div ref={catScrollRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-10 menu-slides">
                <Link href="/menu?category=all"
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all min-w-[80px] bg-white border-[#eff0f6] hover:bg-[#f7f7fc]`}>
                  <img src="/images/default/all-category.png" alt="All" className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-[10px] font-semibold text-[#14142b] whitespace-nowrap">All</span>
                </Link>
                {categories.map(cat => (
                  <Link key={cat._id} href={`/menu?category=${cat._id}`}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all min-w-[80px] bg-white border-[#eff0f6] hover:bg-[#f7f7fc]`}>
                    <img src={cat.image || "/images/category/thumb.png"} alt={cat.name}
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/category/thumb.png"; }} />
                    <span className="text-[10px] font-semibold text-[#14142b] whitespace-nowrap max-w-[70px] truncate">{cat.name}</span>
                  </Link>
                ))}
              </div>
              <button onClick={() => scrollCats("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-primary transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========= SHOP BY STORE ========= */}
      {settings.site_show_shop_by_store !== "No" && stores.length > 0 && (
        <section className="mb-6 sm:mb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: "var(--primary-hex)" }} />
                <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Shop By Store</h2>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => scrollStores("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-primary transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div ref={storeScrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-none px-10 menu-slides">
                {stores.map(store => (
                  <Link href={`/store/${store._id}`} key={store._id}
                    className="flex-shrink-0 flex flex-col gap-2 p-3 rounded-2xl border bg-white border-[#eff0f6] w-[200px] sm:w-[240px] shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                    <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden">
                      <img src={store.bannerImage || store.profileImage || "/images/default/store.png"} alt={store.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/store.png"; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      {!store.status && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                          Closed
                        </div>
                      )}
                      {store.distance !== undefined && store.distance !== Infinity && (
                        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-md">
                          {store.distance.toFixed(1)} km
                        </div>
                      )}
                    </div>
                    <div className="px-1 pb-1">
                      <h4 className="text-sm font-bold text-[#14142b] truncate group-hover:text-primary transition-colors">{store.name}</h4>
                      <div className="flex items-center gap-1 mt-1 text-[#6e7191]">
                        <Clock className="w-3 h-3" />
                        <p className="text-[11px] font-medium">{store.estimatedDeliveryTime || "20-30 mins"}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[#6e7191]">
                        <MapPin className="w-3 h-3" />
                        <p className="text-[11px] line-clamp-1">{store.address}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <button onClick={() => scrollStores("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#14142b] hover:text-primary transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========= FEATURED ITEMS ========= */}
      {settings.site_show_featured_items !== "No" && featuredItems.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Featured Items</h2>
              </div>
              <Link href="/menu?featured=true" className="text-xs font-medium" style={{ color: "var(--primary-hex)" }}>View All</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredItems.map((item) => (
                <ItemCard key={item._id} item={item} onOpen={openModal} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========= OFFERS SECTION ========= */}
      {offers.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5" style={{ color: "var(--primary-hex)" }} />
                <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Current Offers</h2>
              </div>
              <Link href="/offers" className="text-xs font-medium" style={{ color: "var(--primary-hex)" }}>View All</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {offers.map((offer) => (
                <Link key={offer._id} href={`/offers/${offer.slug}`}
                  className="rounded-xl overflow-hidden shadow-sm border border-[#eff0f6] bg-white hover:shadow-lg transition-all group">
                  <img src={offer.image || "/images/default/offer.png"} alt={offer.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/offer.png"; }} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========= POPULAR PRODUCTS ========= */}
      {popularItems.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b]">Popular Products</h2>
              <Link href="/menu" className="text-xs font-medium" style={{ color: "var(--primary-hex)" }}>View All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {popularItems.map((item) => (
                <div key={item._id} onClick={() => openModal(item)}
                  className="product-card-list cursor-pointer overflow-hidden w-full min-w-0">
                  <img src={item.image || "/images/item/thumb.png"} alt={item.name}
                    className="w-24 h-24 object-cover rounded-l-lg shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
                  <div className="p-3 flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div className="min-w-0 mb-1">
                      <h4 className="text-sm font-semibold text-[#14142b] leading-snug break-words w-full capitalize" title={item.name}>{item.name}</h4>
                      <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-[#6e7191] line-clamp-1 mt-0.5 break-words">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0 pt-1">
                      <span className="text-sm sm:text-base font-semibold text-[#14142b] truncate min-w-0">{formatPrice(item.price)}</span>
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }}
                        className="product-card-list-cart-btn flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-3xl shrink-0"
                        style={{ backgroundColor: "var(--primary-hex)" }}>
                        <Plus className="w-3.5 h-3.5" />Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========= CATEGORY PRODUCT SECTIONS (Peppers, Fruits, Vegetables, etc.) ========= */}
      {loading && categoriesWithProducts.length === 0 ? (
        <section className="pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary-hex)" }} />
          </div>
        </section>
      ) : categoriesWithProducts.length === 0 ? (
        <section className="pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl p-12 text-center border border-[#eff0f6]">
              <img
                src="/images/item/item-not-found.png"
                alt="Not Found"
                className="w-28 mx-auto mb-4 opacity-50"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-sm font-semibold text-[#14142b]">No products available</p>
            </div>
          </div>
        </section>
      ) : (
        <div className="pb-20 lg:pb-8 space-y-8 sm:space-y-12">
          {categoriesWithProducts.map((cat: any) => (
            <section key={cat._id}>
              <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Section header */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-lg sm:text-2xl font-semibold capitalize text-[#14142b] flex items-center gap-2">
                    {cat.image && (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-6 h-6 object-contain rounded"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    {cat.name}
                    <span className="text-xs font-normal text-[#a0a3bd] ml-1">({cat.totalCount})</span>
                  </h2>
                  <Link
                    href={`/menu?category=${cat._id}`}
                    className="flex items-center gap-0.5 text-xs font-semibold hover:underline shrink-0"
                    style={{ color: "var(--primary-hex)" }}
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {menuViewMode === "grid" ? (
                  /* Horizontal aisle scroll — industry standard (Instacart / Ocado / Blinkit pattern) */
                  <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-none">
                    <div className="flex gap-3 sm:gap-4 items-stretch" style={{ width: "max-content" }}>
                      {cat.products.map((item: any) => (
                        <div key={item._id} className="w-[10rem] sm:w-48 flex flex-col">
                          <ItemCard item={item} onOpen={openModal} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* List mode — 2-col compact grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.products.map((item: any) => (
                      <div
                        key={item._id}
                        onClick={() => openModal(item)}
                        className="product-card-list cursor-pointer overflow-hidden w-full min-w-0"
                      >
                        <img
                          src={item.image || "/images/item/thumb.png"}
                          alt={item.name}
                          className="w-24 sm:w-28 h-24 sm:h-28 object-cover rounded-l-lg shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }}
                        />
                        <div className="p-3 flex-1 min-w-0 flex flex-col justify-between h-full">
                          <div className="min-w-0 mb-1">
                            <h4
                              className="text-sm font-semibold text-[#14142b] leading-snug w-full capitalize line-clamp-2"
                              title={item.name}
                            >
                              {item.name}
                            </h4>
                            <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-[#6e7191] line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-2 min-w-0 pt-1">
                            <span className="text-sm sm:text-base font-semibold text-[#14142b] truncate min-w-0">
                              {formatPrice(item.price)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); openModal(item); }}
                              className="product-card-list-cart-btn flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-3xl shrink-0"
                              style={{ backgroundColor: "var(--primary-hex)" }}
                            >
                              <Plus className="w-3.5 h-3.5" />Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <ItemModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

/* Reusable grid card — h-full ensures uniform height inside aisle rows */
function ItemCard({ item, onOpen }: { item: any; onOpen: (item: any) => void }) {
  return (
    <div onClick={() => onOpen(item)} className="product-card-grid cursor-pointer group overflow-hidden w-full min-w-0 h-full">
      <div className="relative pt-[75%] bg-[#f7f7fc] rounded-t-2xl overflow-hidden">
        <img src={item.image || "/images/item/thumb.png"} alt={item.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />

        {item.isFeatured && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--primary-hex)" }}>
            <Star className="w-3 h-3 fill-white text-white" />
          </div>
        )}
      </div>
      <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-between">
        <div className="min-w-0 mb-1">
          <h4 className="text-xs sm:text-sm font-semibold text-[#14142b] leading-snug w-full capitalize line-clamp-2" title={item.name}>{item.name}</h4>
          <p className="text-[10px] leading-4 sm:text-xs sm:leading-5 text-[#6e7191] line-clamp-2 mt-0.5 break-words flex-1">{item.description}</p>
        </div>
        <div className="flex items-center justify-between gap-1 w-full min-w-0 pt-1 mt-auto">
          <span className="text-xs sm:text-base font-semibold text-[#14142b] truncate min-w-0">{formatPrice(item.price)}</span>
          <button onClick={(e) => { e.stopPropagation(); onOpen(item); }}
            className="product-card-grid-cart-btn shrink-0">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[10px]">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
