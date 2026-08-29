"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Tag, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/frontend/coupons");
      const data = await res.json();
      if (data.status) {
        setOffers(data.data || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="nectar-loader"></div>
        </div>
      )}
      
      <section className="mb-24 sm:mb-16 mt-4 sm:mt-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#fff5f9] text-primary flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#14142B]">
                Current Offers & Special Deals
              </h2>
              <p className="text-xs sm:text-sm text-[#6E7191]">
                Claim exclusive discounts and apply coupon codes at checkout.
              </p>
            </div>
          </div>
          
          {offers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <div 
                  key={offer._id} 
                  className="bg-white rounded-2xl border border-[#EFF0F6] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {offer.image ? (
                      <div className="aspect-[2/1] relative overflow-hidden bg-[#FAFAFC]">
                        <img 
                          className="w-full h-full object-cover" 
                          src={offer.image} 
                          alt={offer.name || offer.code} 
                        />
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-[#ff006b] to-orange-500 p-6 text-white text-center">
                        <span className="text-3xl font-extrabold tracking-tight">
                          {offer.discountType === "percentage" ? `${offer.discountAmount}% OFF` : `₦${offer.discountAmount} OFF`}
                        </span>
                        <p className="text-xs mt-1 text-white/90 font-medium uppercase tracking-wider">
                          {offer.name || "Special Discount"}
                        </p>
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="font-bold text-[#14142B] text-base mb-1">
                        {offer.name || `Coupon ${offer.code}`}
                      </h3>
                      {offer.description && (
                        <p className="text-xs text-[#6E7191] leading-relaxed mb-3">
                          {offer.description}
                        </p>
                      )}
                      
                      <div className="text-xs text-[#4E4B66] space-y-1 mb-4">
                        {offer.minOrderAmount > 0 && (
                          <p>• Min Order: <span className="font-semibold text-[#14142B]">₦{offer.minOrderAmount}</span></p>
                        )}
                        {offer.expiredDate && (
                          <p>• Valid Until: <span className="font-semibold text-[#14142B]">{new Date(offer.expiredDate).toLocaleDateString()}</span></p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="flex items-center justify-between bg-[#F7F7FC] border border-dashed border-[#D9DBE9] rounded-xl p-2.5">
                      <div className="px-2">
                        <span className="text-[10px] text-[#6E7191] uppercase tracking-wider block font-semibold">Code</span>
                        <span className="font-mono font-bold text-sm text-primary uppercase">{offer.code}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(offer.code)}
                        className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-[#e60060] transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedCode === offer.code ? (
                          <><Check className="w-3.5 h-3.5" /> Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy Code</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#EFF0F6]">
                <Tag className="w-12 h-12 text-[#A0A3BD] mx-auto mb-3" />
                <h3 className="font-bold text-[#14142B] text-base mb-1">No Offers Available</h3>
                <p className="text-xs text-[#6E7191]">Check back soon for new deals and promotions.</p>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
}
