"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, Send } from "lucide-react";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email."); return; }
    toast.success("Subscribed successfully!");
    setEmail("");
  };

  const pages = [
    { title: "About Us", slug: "about-us" },
    { title: "Contact Us", slug: "contact-us" },
    { title: "Terms & Conditions", slug: "terms-conditions" },
    { title: "Privacy Policy", slug: "privacy-policy" },
  ];

  return (
    <footer className="footer-part pt-12 mb-14 lg:mb-0 hidden sm:block" style={{ backgroundColor: "#ff006b" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-6">
          {/* Brand Column */}
          <div>
            <Link href="/">
              <img
                src="/images/theme/theme-footer-logo.png"
                alt="FoodAppi"
                className="mb-8 w-36 h-auto"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = "none";
                  const fallback = document.createElement("span");
                  fallback.className = "text-2xl font-black text-white";
                  fallback.textContent = "FoodAppi";
                  el.parentNode?.appendChild(fallback);
                }}
              />
            </Link>
            <p className="text-xs mb-3 text-white opacity-90">
              Subscribe to our newsletter for exclusive deals and updates.
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center rounded-lg max-w-xs w-full h-12 p-1.5 mb-8 bg-white">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-full pl-2 text-sm text-[#14142b] bg-transparent outline-none placeholder:text-[#a0a3bd]"
              />
              <button type="submit" className="capitalize text-xs font-medium rounded-md flex-shrink-0 p-2.5 text-white flex items-center gap-1.5" style={{ backgroundColor: "#ff006b" }}>
                <Send className="w-3.5 h-3.5" />
                Subscribe
              </button>
            </form>

            <h3 className="text-xs capitalize mb-4 text-white font-medium">Follow us on</h3>
            <nav className="flex items-center gap-4">
              {[
                { icon: <Facebook className="w-3.5 h-3.5" />, href: "#" },
                { icon: <Twitter className="w-3.5 h-3.5" />, href: "#" },
                { icon: <Instagram className="w-3.5 h-3.5" />, href: "#" },
                { icon: <Youtube className="w-3.5 h-3.5" />, href: "#" },
              ].map(({ icon, href }, i) => (
                <a key={i} href={href} className="w-7 h-7 rounded-full shadow-lg bg-white flex items-center justify-center text-[#ff006b] hover:scale-110 transition-transform">
                  {icon}
                </a>
              ))}
            </nav>
          </div>

          {/* Useful Links */}
          <div>
            <div className="sm:w-fit sm:mx-auto">
              <h3 className="capitalize text-lg font-semibold mb-6 text-white">Useful Links</h3>
              <nav className="flex flex-col items-start gap-3">
                {pages.map((page) => (
                  <Link
                    key={page.slug}
                    href={`/page/${page.slug}`}
                    className="capitalize text-white text-sm hover:underline opacity-90 hover:opacity-100 transition-all"
                  >
                    {page.title}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="capitalize text-lg font-semibold mb-4 text-white">Get in Touch</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-center gap-2.5 text-white">
                <Mail className="w-5 h-5 flex-shrink-0 opacity-80" />
                <span className="text-sm">info@foodappi.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-white">
                <Phone className="w-5 h-5 flex-shrink-0 opacity-80" />
                <span className="text-sm font-medium">+1 800 123 4567</span>
              </li>
            </ul>

            {/* App Store Links */}
            <div className="mt-6 flex flex-col gap-3">
              <a href="#" className="flex items-center gap-2 w-fit">
                <img src="/images/store/play-store.png" alt="Google Play" className="h-10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </a>
              <a href="#" className="flex items-center gap-2 w-fit">
                <img src="/images/store/app-store.png" alt="App Store" className="h-10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="py-8 mt-8 border-t border-white/20">
        <p className="text-sm text-center text-white opacity-90">
          © {new Date().getFullYear()} FoodAppi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
