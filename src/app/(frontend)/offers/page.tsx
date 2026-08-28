"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/frontend/offers");
      const data = await res.json();
      if (data.status) {
        setOffers(data.data || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="foodappi-loader"></div>
        </div>
      )}
      
      <section className="mb-24 sm:mb-16 mt-4 sm:mt-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <h2 className="capitalize text-lg sm:text-2xl font-semibold mb-4 sm:mb-6 text-[#ff006b]">
            All Offers
          </h2>
          
          {offers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {offers.map((offer) => (
                <Link key={offer._id} href={`/offers/${offer.slug}`} className="block transition-transform hover:scale-[1.02]">
                  <img 
                    className="w-full rounded-2xl object-cover shadow-sm" 
                    src={offer.image || "/images/default/offer.png"} 
                    alt={offer.title} 
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/offer.png"; }}
                  />
                </Link>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12">
                <p className="text-[#6e7191]">No offers available at the moment.</p>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
}
