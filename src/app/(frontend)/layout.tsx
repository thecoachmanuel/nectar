"use client";

import React, { useState } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import CartDrawer from "@/components/frontend/CartDrawer";
import MobileBottomNav from "@/components/frontend/MobileBottomNav";
import CookiesConsent from "@/components/frontend/CookiesConsent";
import PwaInstallPrompt from "@/components/frontend/PwaInstallPrompt";

import { useCartStore } from "@/store/useCartStore";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { isCartOpen, openCart, closeCart } = useCartStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7fc]">
      <Navbar onCartOpen={openCart} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileBottomNav onCartOpen={openCart} />
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <PwaInstallPrompt />
      <CookiesConsent />
    </div>
  );
}
