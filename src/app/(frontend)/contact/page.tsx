"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageSquare, 
  Store as StoreIcon, 
  Sparkles,
  ChevronRight,
  Headphones
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { toast } from "sonner";

export default function ContactPage() {
  const { settings, fetchSettings } = useSettingsStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
    // Fetch store branches
    fetch("/api/frontend/stores")
      .then((res) => res.json())
      .then((data) => {
        if (data.status && Array.isArray(data.data)) {
          setStores(data.data);
        }
      })
      .catch(() => {});
  }, [fetchSettings]);

  // Live Contact Info from Admin Settings (matching site footer)
  const contactEmail = settings?.company_email || settings?.contactEmail || "info@nectar.com";
  const contactPhone = settings?.company_phone || settings?.contactPhone || "+1 800 123 4567";
  const companyAddress = settings?.company_address ?? settings?.contactAddress ?? "";
  const workingHours = settings?.company_working_hours || "Mon - Sun: 8:00 AM - 10:00 PM";
  const waPhone = settings?.pay_whatsapp_phone_number || settings?.admin_notification_whatsapp_number || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/frontend/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim() || "General Customer Inquiry",
          message: formData.message.trim(),
        }),
      });

      const data = await res.json();
      if (data.status) {
        toast.success("Thank you! Your message has been sent to our customer care team.");
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        toast.error(data.message || "Failed to send message.");
      }
    } catch {
      toast.error("Network error. Please try again or chat with us on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 lg:pb-16">
      {/* Breadcrumbs & Header Hero */}
      <div className="bg-gradient-to-b from-white to-[#F7F7FC] border-b border-[#EFF0F6] py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#A0A3BD] mb-3">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#14142B]">Contact Us</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-3">
                <Headphones className="w-3.5 h-3.5" />
                24/7 Customer Care
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#14142B] tracking-tight">
                Let’s Get in Touch
              </h1>
              <p className="text-sm sm:text-base text-[#6E7191] mt-2 max-w-xl">
                Have questions about fresh grocery deliveries, order tracking, or special wholesale orders? We are here to help!
              </p>
            </div>

            {waPhone && (
              <a
                href={`https://wa.me/${waPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello Nectar, I need help with an order.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1AB759] hover:bg-[#159a4a] text-white font-bold text-sm transition-all shadow-md shadow-[#1AB759]/20 shrink-0"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-12">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[#A0A3BD] uppercase tracking-wider">Email Us</span>
              <a href={`mailto:${contactEmail}`} className="block text-sm font-bold text-[#14142B] hover:text-primary transition-colors truncate mt-0.5">
                {contactEmail}
              </a>
              <span className="block text-[11px] text-[#6E7191] mt-1">Direct support mailbox</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[#A0A3BD] uppercase tracking-wider">Call Us</span>
              <a href={`tel:${contactPhone}`} className="block text-sm font-bold text-[#14142B] hover:text-primary transition-colors truncate mt-0.5">
                {contactPhone}
              </a>
              <span className="block text-[11px] text-[#6E7191] mt-1">Instant voice support</span>
            </div>
          </div>

          {companyAddress && (
            <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-[#A0A3BD] uppercase tracking-wider">Head Office</span>
                <span className="block text-sm font-bold text-[#14142B] line-clamp-2 mt-0.5">
                  {companyAddress}
                </span>
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[#A0A3BD] uppercase tracking-wider">Hours</span>
              <span className="block text-sm font-bold text-[#14142B] mt-0.5">
                {workingHours}
              </span>
              <span className="block text-[11px] text-emerald-600 font-semibold mt-1">Open 7 days a week</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Form + Illustration Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EFF0F6] shadow-sm">
            <h2 className="text-xl font-bold text-[#14142B] mb-1">
              Send us a Message
            </h2>
            <p className="text-xs sm:text-sm text-[#6E7191] mb-6">
              Fill out the form below and we will get back to you within a few minutes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14142B] uppercase tracking-wider mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14142B] uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14142B] uppercase tracking-wider mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14142B] uppercase tracking-wider mb-1.5">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delivery Inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14142B] uppercase tracking-wider mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help you today? Please share order number if applicable..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-[#e60060] text-white font-bold text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Side Info & Grocery Promise Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-primary to-[#ff006b] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-primary/20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-4 border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                Nectar Fresh Guarantee
              </div>
              <h3 className="text-xl sm:text-2xl font-black leading-snug mb-3">
                Quality Groceries, On Time, Every Time.
              </h3>
              <p className="text-white/85 text-xs sm:text-sm leading-relaxed mb-6">
                If any item does not meet your quality expectations upon delivery, let our customer care team know immediately for a swift replacement or store credit.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
                <div>
                  <span className="block text-2xl font-black">30 min</span>
                  <span className="text-[11px] text-white/80">Average Delivery</span>
                </div>
                <div>
                  <span className="block text-2xl font-black">100%</span>
                  <span className="text-[11px] text-white/80">Fresh Guarantee</span>
                </div>
              </div>
            </div>

            {/* Quick App Link */}
            <div className="p-6 rounded-3xl bg-white border border-[#EFF0F6] shadow-sm flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#14142B]">Prefer WhatsApp Ordering?</h4>
                <p className="text-xs text-[#6E7191] mt-0.5">Order directly in your WhatsApp chat in seconds.</p>
              </div>
              <Link
                href="/menu"
                className="px-4 py-2 rounded-xl bg-[#F7F7FC] hover:bg-primary hover:text-white text-xs font-bold text-[#14142B] transition-colors shrink-0"
              >
                Order Now
              </Link>
            </div>
          </div>
        </div>

        {/* Our Branches Section (matching PHP app) */}
        {stores.length > 0 && (
          <div className="pt-6 border-t border-[#EFF0F6]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#14142B]">
                  Our Store Locations & Fulfillment Hubs
                </h2>
                <p className="text-xs sm:text-sm text-[#6E7191] mt-1">
                  Visit any of our local grocery fulfillment hubs or pick up your takeaway order in person.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {stores.map((store: any) => (
                <div
                  key={store._id}
                  className="p-5 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <StoreIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#14142B] truncate">{store.name}</h3>
                      <span className="text-[11px] text-emerald-600 font-semibold">● Active Hub</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-[#6E7191]">
                    <li className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#A0A3BD] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{store.address}</span>
                    </li>
                    {store.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#A0A3BD] shrink-0" />
                        <a href={`tel:${store.phone}`} className="hover:text-primary font-medium">{store.phone}</a>
                      </li>
                    )}
                    {store.estimatedDeliveryTime && (
                      <li className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#A0A3BD] shrink-0" />
                        <span>Delivery Speed: <strong className="text-[#14142B]">{store.estimatedDeliveryTime}</strong></span>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
