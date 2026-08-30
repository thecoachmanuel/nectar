"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Copy, Check, Sparkles, Percent, Calendar, ShoppingBag } from "lucide-react";
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
    } catch {
    } finally {
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
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1AB759]/20 to-[#1AB759]/5 text-[#1AB759] flex items-center justify-center shadow-sm">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#14142B] flex items-center gap-2">
                Current Offers & Special Deals
                <Sparkles className="w-4 h-4 text-amber-500 hidden sm:inline" />
              </h1>
              <p className="text-xs sm:text-sm text-[#6E7191]">
                Claim exclusive discounts and apply coupon codes at checkout.
              </p>
            </div>
          </div>

          {offers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => {
                const discountVal = offer.discount || offer.discountAmount || 0;
                const discountText =
                  offer.discountType === "fixed"
                    ? `₦${Number(discountVal).toLocaleString()} OFF`
                    : `${discountVal}% OFF`;
                const displayName = offer.name || `Special Promo (${offer.code})`;
                const minSpend = offer.minimumOrderAmount || offer.minOrderAmount || 0;
                const maxDiscount = offer.maximumDiscount || 0;
                const validUntil = offer.endDate || offer.expiredDate;

                return (
                  <div
                    key={offer._id}
                    className="bg-white rounded-3xl border border-[#EFF0F6] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    <div>
                      {offer.image ? (
                        <div className="aspect-[2/1] relative overflow-hidden bg-[#FAFAFC]">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            src={offer.image}
                            alt={displayName}
                          />
                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary shadow">
                            {discountText}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-[#1AB759] to-[#128a42] p-6 text-white text-center relative overflow-hidden">
                          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight block">
                            {discountText}
                          </span>
                          <p className="text-xs mt-1 text-white/90 font-medium uppercase tracking-wider">
                            {displayName}
                          </p>
                        </div>
                      )}

                      <div className="p-5">
                        <h3 className="font-bold text-[#14142B] text-base mb-1.5 line-clamp-1">
                          {displayName}
                        </h3>
                        {offer.description && (
                          <p className="text-xs text-[#6E7191] leading-relaxed mb-3 line-clamp-2">
                            {offer.description}
                          </p>
                        )}

                        <div className="text-xs text-[#4E4B66] space-y-1.5 mb-4 bg-[#F8F9FE] p-3 rounded-2xl border border-[#EFF0F6]">
                          {minSpend > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#6E7191]">Min. Order:</span>
                              <span className="font-semibold text-[#14142B]">
                                ₦{minSpend.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {maxDiscount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#6E7191]">Max. Discount:</span>
                              <span className="font-semibold text-[#14142B]">
                                ₦{maxDiscount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {validUntil && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#6E7191]">Valid Until:</span>
                              <span className="font-semibold text-[#14142B]">
                                {new Date(validUntil).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="flex items-center justify-between bg-[#F7F7FC] border border-dashed border-[#D9DBE9] rounded-2xl p-2.5">
                        <div className="px-2">
                          <span className="text-[10px] text-[#6E7191] uppercase tracking-wider block font-semibold">
                            Coupon Code
                          </span>
                          <span className="font-mono font-bold text-sm text-primary uppercase">
                            {offer.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(offer.code)}
                          className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-[#e60060] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          {copiedCode === offer.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Code
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#EFF0F6] shadow-sm max-w-lg mx-auto p-8">
                <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-[#14142B] text-lg mb-1">
                  No Offers Available Right Now
                </h3>
                <p className="text-xs sm:text-sm text-[#6E7191] mb-6">
                  Check back soon for fresh deals, discounts, and promo codes.
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-[#e60060] transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" /> Start Shopping
                </Link>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
}
