"use client";

import React, { useState } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import CartDrawer from "@/components/frontend/CartDrawer";
import MobileBottomNav from "@/components/frontend/MobileBottomNav";
import CookiesConsent from "@/components/frontend/CookiesConsent";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7fc]">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileBottomNav onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <CookiesConsent />
    </div>
  );
}
