"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Calendar,
  ChevronRight,
  User,
  ShoppingBag,
  CreditCard,
  MapPin,
  Smartphone,
  CheckCircle2,
  Lock,
  FileText,
  AlertCircle,
  Mail,
  Phone,
  MessageCircle,
  Truck,
  Scale,
  RefreshCw
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function PrivacyPolicyPage() {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Dynamic admin-configured company email & phone (with fallbacks)
  const contactEmail = settings?.company_email || settings?.contactEmail || "support@errandshop.com";
  const contactPhone = settings?.company_phone || settings?.contactPhone || "+234 XXX XXX XXXX";
  const waPhone = settings?.pay_whatsapp_phone_number || settings?.admin_notification_whatsapp_number || "";
  const cleanWaNumber = waPhone.replace(/[^0-9]/g, "");

  const collectionItems = [
    {
      icon: User,
      title: "Personal Identification Information",
      desc: "Name, phone number, email address, and delivery address.",
    },
    {
      icon: ShoppingBag,
      title: "Order Information",
      desc: "Items purchased, order history, and delivery preferences.",
    },
    {
      icon: CreditCard,
      title: "Payment Information",
      desc: "Transaction details (we do not store your full payment card information).",
    },
    {
      icon: MapPin,
      title: "Location Data",
      desc: "If enabled, we use your approximate location only to facilitate deliveries to your address and to show delivery availability in your area.",
    },
    {
      icon: Smartphone,
      title: "Device Information",
      desc: "Device type, operating system, and app usage statistics for service improvement.",
    },
  ];

  const usagePoints = [
    "Process and deliver your grocery orders.",
    "Provide customer support.",
    "Improve and personalize our services.",
    "Send important service notices (marketing communications are optional).",
    "Detect and prevent fraud or misuse of our platform.",
  ];

  const sharingEntities = [
    {
      icon: Truck,
      name: "Delivery Services",
      desc: "To deliver your groceries to your address.",
    },
    {
      icon: CreditCard,
      name: "Payment Processors",
      desc: "To process your transactions securely.",
    },
    {
      icon: Scale,
      name: "Legal Authorities",
      desc: "When required by law or to protect our legal rights.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 lg:pb-16 font-sans">
      {/* Breadcrumbs & Hero Header matching PHP App PageComponent.vue */}
      <div className="bg-gradient-to-b from-white via-primary-light/20 to-[#F7F7FC] border-b border-[#EFF0F6] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A0A3BD] mb-3">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#14142B]">Privacy Policy</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
                Legal & Privacy
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F7F7FC] text-[#6E7191] border border-[#EFF0F6]">
                <Calendar className="w-3 h-3 text-[#A0A3BD]" />
                Effective Date: 13 August 2025
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#14142B] tracking-tight">
              Privacy Policy — Errand Shop
            </h1>

            <p className="text-sm sm:text-base text-[#6E7191] leading-relaxed pt-1">
              At Errand Shop, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 space-y-8">
        {/* Document Body Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFF0F6] shadow-sm space-y-10">

          {/* 1. Information We Collect */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Information We Collect
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              We may collect the following types of personal information when you use our services:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {collectionItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EFF0F6] flex items-start gap-3.5 hover:border-primary/30 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#EFF0F6] text-primary flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#14142B]">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#6E7191] mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                How We Use Your Information
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              We use your information to:
            </p>

            <div className="space-y-2.5 pt-1">
              {usagePoints.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#FAFAFC] border border-[#EFF0F6]"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-[#14142B] font-medium leading-relaxed">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Sharing of Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Sharing of Information
              </h2>
            </div>

            {/* No-Sale Guarantee Highlight Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3 text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs sm:text-sm font-bold">
                We do not sell your personal information.
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              We may share it only with:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {sharingEntities.map((entity, idx) => {
                const Icon = entity.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EFF0F6] space-y-2 hover:border-primary/30 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#EFF0F6] text-primary flex items-center justify-center shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#14142B]">
                      {entity.name}
                    </h3>
                    <p className="text-xs text-[#6E7191] leading-relaxed">
                      {entity.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Data Retention */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Data Retention
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              We keep your personal information only as long as necessary to fulfill your orders, comply with legal requirements, or resolve disputes.
            </p>
          </section>

          {/* 5. Security of Your Information */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                5
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Security of Your Information
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              We implement reasonable physical, electronic, and managerial procedures to safeguard your data against loss, theft, and unauthorized access.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                6
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Your Rights
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              You have the right to:
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAFAFC] border border-[#EFF0F6]">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#14142B]">
                  Update or correct your personal information.
                </span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAFAFC] border border-[#EFF0F6]">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#14142B]">
                  Delete your account and associated information.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/account/profile"
                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
              >
                <span>Manage your account & personal details in Profile Settings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* 7. Changes to This Policy */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                7
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Changes to This Policy
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on our app and/or website, with the updated date.
            </p>
          </section>

          {/* 8. Contact Us */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-3 pb-3 border-b border-[#EFF0F6]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                8
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14142B]">
                Contact Us
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E4B66] leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Dynamic Admin Email */}
              <a
                href={`mailto:${contactEmail}`}
                className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EFF0F6] flex items-center gap-3.5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#EFF0F6] text-primary flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#A0A3BD] uppercase tracking-wider block">
                    Email Inquiries
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#14142B] group-hover:text-primary transition-colors">
                    {contactEmail}
                  </span>
                </div>
              </a>

              {/* Dynamic Admin Phone */}
              <a
                href={`tel:${contactPhone}`}
                className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#EFF0F6] flex items-center gap-3.5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#EFF0F6] text-primary flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#A0A3BD] uppercase tracking-wider block">
                    Phone Inquiries
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#14142B] group-hover:text-primary transition-colors">
                    {contactPhone}
                  </span>
                </div>
              </a>
            </div>
          </section>

        </div>

        {/* Support Box matching FoodAppi PHP App PageComponent.vue */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFF0F6] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Customer Support & Privacy
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#14142B]">
                Have Questions or Concerns?
              </h2>
              <p className="text-xs sm:text-sm text-[#6E7191] mt-1 leading-relaxed">
                Our support team is available to assist you with any privacy questions, data requests, or account inquiries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {cleanWaNumber && (
                <a
                  href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
                    "Hello Errandshop, I have an inquiry regarding your Privacy Policy."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}

              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F7FC] hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold text-[#14142B] border border-[#EFF0F6]"
              >
                <Mail className="w-4 h-4 text-primary" />
                <span>{contactEmail}</span>
              </a>

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

        {/* Bottom CTA Banner with dynamic dark foundation */}
        <div
          className="rounded-3xl p-6 sm:p-8 text-white text-center shadow-lg relative overflow-hidden"
          style={{ backgroundColor: "var(--dark-hex, #14142B)" }}
        >
          <div className="relative z-10 max-w-lg mx-auto space-y-3">
            <h3 className="text-xl sm:text-2xl font-black">
              Safe & Trusted Grocery Delivery
            </h3>
            <p className="text-xs sm:text-sm text-white/80">
              Your data and grocery orders are processed with top-tier security standards and complete transparency.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/menu"
                className="h-10 px-6 rounded-xl bg-primary hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Fresh Groceries</span>
              </Link>
              <Link
                href="/contact"
                className="h-10 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 transition-all border border-white/20"
              >
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
