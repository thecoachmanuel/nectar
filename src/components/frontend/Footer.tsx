"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thank you for subscribing to our newsletter!");
    setEmail("");
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Food<span className="text-red-500">Appi</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Order your favorite delicious food items online with instant delivery, WhatsApp menu ordering, and offline PWA capability.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
          <ul className="space-y-2 text-xs font-medium text-slate-400">
            <li>
              <Link href="/menu" className="hover:text-red-400 transition">
                Our Menu
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-red-400 transition">
                Active Offers
              </Link>
            </li>
            <li>
              <Link href="/page/about-us" className="hover:text-red-400 transition">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/page/contact-us" className="hover:text-red-400 transition">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Policies */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Policies</h4>
          <ul className="space-y-2 text-xs font-medium text-slate-400">
            <li>
              <Link href="/page/terms-and-conditions" className="hover:text-red-400 transition">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/page/privacy-policy" className="hover:text-red-400 transition">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Subscription */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Newsletter</h4>
          <p className="text-xs text-slate-400 mb-3">
            Subscribe to receive exclusive promo codes and discounts directly to your inbox.
          </p>
          <form onSubmit={handleSubscribe} className="flex items-center">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 text-white text-xs px-3 py-2.5 rounded-l-xl focus:outline-none focus:ring-1 focus:ring-red-500 w-full border border-slate-700"
            />
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-2.5 rounded-r-xl transition flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© {new Date().getFullYear()} FoodAppi. All Rights Reserved.</p>
        <p>PWA Online Food Delivery System with POS & Paystack Integration</p>
      </div>
    </footer>
  );
}
