"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Leaf, 
  Truck, 
  ShieldCheck, 
  HeartHandshake, 
  ChevronRight, 
  ArrowRight,
  ShoppingBag,
  Users,
  Store as StoreIcon,
  CheckCircle2,
  Mail,
  Phone
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function AboutPage() {
  const { settings, fetchSettings } = useSettingsStore();
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetch("/api/frontend/pages/about-us")
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.data) {
          setPageContent(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchSettings]);

  const contactEmail = settings?.company_email || settings?.contactEmail || "info@nectar.com";
  const contactPhone = settings?.company_phone || settings?.contactPhone || "+1 800 123 4567";

  const pillars = [
    {
      icon: Leaf,
      title: "100% Farm Fresh & Organic",
      description: "Directly sourced from verified local farmers and agricultural hubs daily to ensure peak freshness and nutrition.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Truck,
      title: "Lightning 30-Min Delivery",
      description: "Our distributed fulfillment network ensures your fresh produce and essentials arrive within 30 minutes.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: ShieldCheck,
      title: "Quality & Hygiene Guaranteed",
      description: "Rigorous 3-stage quality checks on all fruits, vegetables, dairy, and pantry items before packing.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: HeartHandshake,
      title: "Fair Everyday Prices",
      description: "Cutting out middlemen allows us to offer supermarket and wholesale rates with zero hidden markups.",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 lg:pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-white via-rose-50/20 to-[#F7F7FC] border-b border-[#EFF0F6] py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A0A3BD] mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#14142B]">About Us</span>
          </div>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Nectar Groceries Story
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-[#14142B] tracking-tight leading-[1.15]">
              Redefining Online Groceries with Freshness & Speed
            </h1>
            <p className="text-base sm:text-lg text-[#6E7191] mt-4 leading-relaxed">
              We started Nectar with a singular mission: to make farm-fresh groceries and household essentials easily accessible to every family with instant on-demand delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-16">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#EFF0F6] shadow-sm text-center">
            <span className="block text-3xl sm:text-4xl font-black text-primary mb-1">10k+</span>
            <span className="text-xs sm:text-sm font-semibold text-[#6E7191]">Happy Households</span>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-[#EFF0F6] shadow-sm text-center">
            <span className="block text-3xl sm:text-4xl font-black text-[#14142B] mb-1">500+</span>
            <span className="text-xs sm:text-sm font-semibold text-[#6E7191]">Fresh Products</span>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-[#EFF0F6] shadow-sm text-center">
            <span className="block text-3xl sm:text-4xl font-black text-emerald-600 mb-1">30min</span>
            <span className="text-xs sm:text-sm font-semibold text-[#6E7191]">Average Delivery</span>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-[#EFF0F6] shadow-sm text-center">
            <span className="block text-3xl sm:text-4xl font-black text-blue-600 mb-1">100%</span>
            <span className="text-xs sm:text-sm font-semibold text-[#6E7191]">Freshness Guarantee</span>
          </div>
        </div>

        {/* Core Pillars */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14142B]">
              Why Shoppers Love Nectar
            </h2>
            <p className="text-sm text-[#6E7191] mt-2">
              Built from the ground up for convenience, transparency, and top-tier farm freshness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-white border border-[#EFF0F6] shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${pillar.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-[#14142B] mb-2">{pillar.title}</h3>
                    <p className="text-xs sm:text-sm text-[#6E7191] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Story / Content Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFF0F6] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Our Commitment
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14142B]">
                {pageContent?.title || "Freshness You Can Trust"}
              </h2>

              {pageContent?.description ? (
                <div 
                  className="prose prose-sm max-w-none text-[#6E7191] leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{ __html: pageContent.description }}
                />
              ) : (
                <div className="text-[#6E7191] text-sm leading-relaxed space-y-3">
                  <p>
                    At Nectar, we handpick every fruit, vegetable, and grocery item with the same care and attention you would give when shopping for your own family.
                  </p>
                  <p>
                    From crisp seasonal greens to dairy, beverages, and pantry essentials, our state-of-the-art temperature-controlled fulfillment hubs keep products in pristine condition until they reach your kitchen.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-[#FAFAFC] to-[#EFF0F6] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-[#E2E8F0] space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#14142B] mb-2">Have a question or custom order?</h3>
                <p className="text-xs sm:text-sm text-[#6E7191]">
                  Our support team is on standby to assist with product inquiries, bulk orders, or feedback.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#D9DBE9]">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href={`mailto:${contactEmail}`} className="text-xs sm:text-sm font-semibold text-[#14142B] hover:text-primary transition-colors truncate">
                    {contactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href={`tel:${contactPhone}`} className="text-xs sm:text-sm font-semibold text-[#14142B] hover:text-primary transition-colors">
                    {contactPhone}
                  </a>
                </div>
              </div>

              <Link
                href="/contact"
                className="w-full h-11 rounded-xl bg-[#14142B] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Contact Customer Care</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-primary via-[#ff006b] to-[#e60060] rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-primary/20 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Stock Up on Fresh Groceries?
            </h2>
            <p className="text-sm sm:text-base text-white/90">
              Browse our fresh categories today and enjoy fast, reliable delivery right to your door.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/menu"
                className="h-12 px-8 rounded-2xl bg-white text-primary font-extrabold text-sm hover:bg-white/90 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Products</span>
              </Link>
              <Link
                href="/contact"
                className="h-12 px-6 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-all border border-white/30 flex items-center gap-2"
              >
                <span>Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
