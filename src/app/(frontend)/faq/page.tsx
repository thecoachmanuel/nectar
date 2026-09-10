"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Search,
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  X
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: "services" | "ordering" | "pricing" | "delivery" | "general";
  categoryLabel: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 1,
    question: "What services do you offer?",
    answer:
      "We buy fresh food items from the market and other store items based on your shopping list. We clean, prep, package and deliver them to your doorstep for orders placed before 4pm.",
    category: "services",
    categoryLabel: "Services & Sourcing",
  },
  {
    id: 2,
    question: "How do I place an order?",
    answer: "You can place your order through the app or whatsapp",
    category: "ordering",
    categoryLabel: "Ordering",
  },
  {
    id: 3,
    question: "Can you get every item I request?",
    answer:
      "We will make every effort to find exactly what you ask for. If an item is unavailable, we’ll contact you for approval before substituting it with a similar product.",
    category: "services",
    categoryLabel: "Item Availability",
  },
  {
    id: 4,
    question: "Do you charge service charge fee?",
    answer: "No we do not charge service charge for our services",
    category: "pricing",
    categoryLabel: "Pricing & Fees",
  },
  {
    id: 5,
    question: "Do you charge extra for delivery?",
    answer:
      "Yes. Delivery fees depend on your location and will be communicated before you confirm your order.",
    category: "delivery",
    categoryLabel: "Delivery",
  },
  {
    id: 6,
    question: "How soon will my order arrive?",
    answer:
      "Delivery takes 2 to 4 hours or less as this depends on order size, market conditions, and location. We’ll give you an estimated delivery time when confirming your order.",
    category: "delivery",
    categoryLabel: "Delivery Times",
  },
  {
    id: 7,
    question: "What payment methods do you accept?",
    answer:
      "We accept [bank transfer, mobile payments, etc.]. Payment is to be made before delivery.",
    category: "pricing",
    categoryLabel: "Payments",
  },
  {
    id: 8,
    question: "What if I’m not home when you deliver?",
    answer:
      "We recommend ensuring someone is available to receive your delivery. If not, extra delivery charges may apply for a second attempt.",
    category: "delivery",
    categoryLabel: "Delivery Policy",
  },
  {
    id: 9,
    question: "What if I’m unhappy with the items?",
    answer:
      "If any item is damaged or spoiled at the time of delivery, contact us within 2 hours with a photo, and we’ll review the case. Due to the perishable nature of fresh goods, returns are generally not accepted.",
    category: "general",
    categoryLabel: "Returns & Quality",
  },
  {
    id: 10,
    question: "Do you handle special or bulk orders?",
    answer:
      "Yes! For bulk orders please contact us at least three days in advance so we can prepare accordingly.",
    category: "ordering",
    categoryLabel: "Bulk Orders",
  },
  {
    id: 11,
    question: "Can you deliver to multiple addresses?",
    answer: "Yes, but each delivery location will have its own delivery fee.",
    category: "delivery",
    categoryLabel: "Delivery",
  },
];

export default function FaqPage() {
  const { settings } = useSettingsStore();

  // State for open accordion items (supports multiple open or toggle)
  const [openItems, setOpenItems] = useState<number[]>([1]); // First item open by default
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const contactEmail = settings?.company_email || settings?.contactEmail || "info@errandshop.com";
  const contactPhone = settings?.company_phone || settings?.contactPhone || "+1 800 123 4567";
  const waPhone = settings?.pay_whatsapp_phone_number || settings?.admin_notification_whatsapp_number || "";
  const cleanWaNumber = waPhone.replace(/[^0-9]/g, "");

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    if (openItems.length === filteredFaqs.length) {
      setOpenItems([]);
    } else {
      setOpenItems(filteredFaqs.map((f) => f.id));
    }
  };

  // Filter items by category & search query
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.categoryLabel.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const categories = [
    { id: "all", label: "All Questions", count: FAQ_DATA.length },
    { id: "services", label: "Services & Food", count: FAQ_DATA.filter(f => f.category === "services").length },
    { id: "ordering", label: "Ordering", count: FAQ_DATA.filter(f => f.category === "ordering").length },
    { id: "delivery", label: "Delivery", count: FAQ_DATA.filter(f => f.category === "delivery").length },
    { id: "pricing", label: "Pricing & Payment", count: FAQ_DATA.filter(f => f.category === "pricing").length },
    { id: "general", label: "Quality & Policy", count: FAQ_DATA.filter(f => f.category === "general").length },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 lg:pb-16 font-sans">
      {/* Breadcrumbs & Hero Header matching PHP App PageComponent.vue */}
      <div className="bg-gradient-to-b from-white via-primary-light/20 to-[#F7F7FC] border-b border-[#EFF0F6] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A0A3BD] mb-3">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#14142B]">FAQ</span>
          </div>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Help Center & Guide
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#14142B] tracking-tight mb-3">
              Frequently Asked Questions (FAQ)
            </h1>
            <p className="text-sm sm:text-base text-[#6E7191] leading-relaxed">
              Find quick answers to common questions about our fresh food market shopping, order placement, doorstep delivery, payment methods, and quality standards.
            </p>
          </div>

          {/* Search bar inside header */}
          <div className="mt-6 sm:mt-8 max-w-xl">
            <div className="relative flex items-center bg-white rounded-2xl border border-[#EFF0F6] shadow-xs px-4 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-4 h-4 text-[#A0A3BD] shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g., delivery, whatsapp, payment, bulk)..."
                className="w-full py-2 text-sm text-[#14142B] placeholder:text-[#A0A3BD] bg-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full hover:bg-[#F7F7FC] text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 space-y-8">
        {/* Category Pill Filters & Expand/Collapse Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-semibold">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white text-[#4E4B66] border border-[#EFF0F6] hover:bg-[#F7F7FC] hover:text-[#14142B]"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#EFF0F6] text-[#6E7191]"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredFaqs.length > 0 && (
            <button
              onClick={handleExpandAll}
              className="self-end sm:self-auto text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              {openItems.length === filteredFaqs.length
                ? "Collapse All"
                : "Expand All"}
            </button>
          )}
        </div>

        {/* Collapsible FAQ List */}
        <div className="space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-[#EFF0F6] text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#14142B]">
                No matching questions found
              </h3>
              <p className="text-xs text-[#6E7191] max-w-sm mx-auto">
                We couldn&apos;t find any questions matching &ldquo;{searchQuery}&rdquo;. Try using different keywords or clear your search filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:opacity-90 transition-opacity"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openItems.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "border-primary/40 shadow-xs ring-1 ring-primary/10"
                      : "border-[#EFF0F6] hover:border-[#D9DBE9] shadow-2xs"
                  }`}
                >
                  {/* Collapsible Header Button */}
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-5 py-4 sm:px-6 sm:py-4.5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Number Badge */}
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isOpen
                            ? "bg-primary text-white"
                            : "bg-[#F7F7FC] text-[#6E7191] group-hover:text-primary group-hover:bg-primary/10"
                        }`}
                      >
                        {faq.id < 10 ? `0${faq.id}` : faq.id}
                      </span>
                      <div>
                        <h3
                          className={`text-sm sm:text-base font-bold transition-colors ${
                            isOpen
                              ? "text-primary"
                              : "text-[#14142B] group-hover:text-primary"
                          }`}
                        >
                          {faq.question}
                        </h3>
                        <span className="text-[11px] font-medium text-[#A0A3BD] mt-0.5 block">
                          {faq.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Animated Chevron Indicator */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 bg-primary/10 text-primary"
                          : "bg-[#F7F7FC] text-[#6E7191] group-hover:text-[#14142B]"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-[#EFF0F6] bg-gradient-to-b from-white to-[#FAFAFC]">
                      <div className="pl-10 sm:pl-10.5 pr-2 pt-2">
                        <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed font-normal">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Support Box matching FoodAppi PHP App PageComponent.vue */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFF0F6] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Still have questions?
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#14142B]">
                We&apos;re Here to Help You
              </h2>
              <p className="text-xs sm:text-sm text-[#6E7191] mt-1 leading-relaxed">
                Cannot find the answer you are looking for? Reach out directly to our customer care team via WhatsApp, email, or telephone.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* WhatsApp Quick Chat */}
              {cleanWaNumber && (
                <a
                  href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
                    "Hello Errandshop, I have an inquiry about my order / groceries."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}

              {/* Direct Email */}
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F7FC] hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold text-[#14142B] border border-[#EFF0F6]"
              >
                <Mail className="w-4 h-4 text-primary" />
                <span>{contactEmail}</span>
              </a>

              {/* Direct Phone */}
              <a
                href={`tel:${contactPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F7FC] hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold text-[#14142B] border border-[#EFF0F6]"
              >
                <Phone className="w-4 h-4 text-primary" />
                <span>{contactPhone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Quick CTA to Start Shopping */}
        <div
          className="rounded-3xl p-6 sm:p-10 text-white text-center shadow-xl shadow-primary/20 relative overflow-hidden"
          style={{ backgroundColor: "var(--primary-hex, #2EB824)" }}
        >
          <div className="relative z-10 max-w-lg mx-auto space-y-3">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ready to Order Your Fresh Food Items?
            </h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Send us your shopping list today and let our market experts select, clean, and pack the freshest produce for your household.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/menu"
                className="h-11 px-7 rounded-xl bg-white text-primary font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-black/10 hover:bg-white/95 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>Browse Products</span>
              </Link>
              <Link
                href="/contact"
                className="h-11 px-6 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/30 active:scale-95"
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
