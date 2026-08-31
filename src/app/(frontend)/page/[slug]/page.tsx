"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, ChevronRight, Headphones } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import ContactPage from "@/app/(frontend)/contact/page";
import AboutPage from "@/app/(frontend)/about/page";

export default function DynamicPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || "";

  const { settings, fetchSettings } = useSettingsStore();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    if (slug && slug !== "contact-us" && slug !== "about-us" && slug !== "contact" && slug !== "about") {
      fetchPage();
    } else {
      setLoading(false);
    }
  }, [slug, fetchSettings]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/frontend/pages/${slug}`);
      const data = await res.json();
      if (data.status) {
        setPage(data.data || {});
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  // If slug is contact or about, render the dedicated rich components
  if (slug === "contact-us" || slug === "contact") {
    return <ContactPage />;
  }

  if (slug === "about-us" || slug === "about") {
    return <AboutPage />;
  }

  const contactEmail = settings?.company_email || settings?.contactEmail || "info@nectar.com";
  const contactPhone = settings?.company_phone || settings?.contactPhone || "+1 800 123 4567";

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 lg:pb-16">
      {/* Header & Breadcrumbs */}
      <div className="bg-gradient-to-b from-white to-[#F7F7FC] border-b border-[#EFF0F6] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A0A3BD] mb-3">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#14142B] capitalize">{page?.title || slug.replace(/-/g, " ")}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#14142B] tracking-tight">
            {page?.title || (loading ? "Loading..." : slug.replace(/-/g, " "))}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page Content */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFF0F6] shadow-sm">
              {page?.image && (
                <div className="w-full mb-8 overflow-hidden rounded-2xl">
                  <img src={page.image} alt={page.title} className="w-full object-cover shadow-sm max-h-80" />
                </div>
              )}

              {page?.description ? (
                <div
                  className="prose prose-slate max-w-none text-[#4E4B66] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: page.description }}
                />
              ) : (
                <div className="text-center py-12 text-[#6E7191]">
                  <p>Page content is currently being updated by the team.</p>
                </div>
              )}
            </div>

            {/* Support Box matching Footer & Admin Settings */}
            <div className="p-6 rounded-3xl bg-white border border-[#EFF0F6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                  <Headphones className="w-4 h-4" />
                  <span>Need Assistance?</span>
                </div>
                <h3 className="text-base font-bold text-[#14142B]">
                  Our Customer Support Team is Available Daily
                </h3>
                <p className="text-xs text-[#6E7191] mt-0.5">
                  Reach out to us via email or phone for any questions or order queries.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#F7F7FC] hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold text-[#14142B]"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{contactEmail}</span>
                </a>
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#F7F7FC] hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold text-[#14142B]"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{contactPhone}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
