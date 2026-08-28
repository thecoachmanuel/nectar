"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, ArrowRight, Loader2 } from "lucide-react";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback seeder offers while API loads
  const seederOffers = [
    { _id: "1", title: "New Kings Collection", slug: "new-kings-collection", description: "Try our new premium collection", image: "/images/seeder/offer/new_kings_collection.png", discount: 10 },
    { _id: "2", title: "Free Fiery Chicken", slug: "free-fiery-chicken", description: "Get a free fiery chicken with every order above ₦5000", image: "/images/seeder/offer/free_fiery_chicken.png", discount: 15 },
    { _id: "3", title: "Free Apple Thick Shake", slug: "free-apple-thik-shake", description: "Complimentary apple shake with meal combos", image: "/images/seeder/offer/free_apple_thik_shake.png", discount: 0 },
    { _id: "4", title: "Kings Collection $49 Off", slug: "new-kings-collection-off", description: "Save big on our kings collection meals", image: "/images/seeder/offer/new_kings_collection_off_$49.png", discount: 20 },
  ];

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch("/api/frontend/offers");
        const data = await res.json();
        if (data.status && data.data?.length > 0) {
          setOffers(data.data);
        } else {
          setOffers(seederOffers);
        }
      } catch {
        setOffers(seederOffers);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fff0f6" }}>
          <Tag className="w-5 h-5" style={{ color: "#ff006b" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#14142b]">Offers & Deals</h1>
          <p className="text-sm text-[#6e7191]">Exclusive deals just for you</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#ff006b" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {offers.map((offer) => (
            <Link key={offer._id} href={`/offers/${offer.slug}`}
              className="group bg-white rounded-2xl border border-[#eff0f6] overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Offer Image */}
              <div className="relative overflow-hidden">
                <img
                  src={offer.image || "/images/default/offer.png"}
                  alt={offer.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/offer.png"; }}
                />
                {offer.discount > 0 && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "#ff006b" }}>
                    {offer.discount}% OFF
                  </div>
                )}
              </div>

              {/* Offer Content */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#14142b] mb-1 capitalize">{offer.title}</h3>
                <p className="text-xs text-[#6e7191] line-clamp-2 mb-3">{offer.description}</p>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#ff006b" }}>
                  View Deals
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
