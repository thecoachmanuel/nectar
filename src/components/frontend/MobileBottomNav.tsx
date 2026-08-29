"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Home, UtensilsCrossed, ShoppingBag, User, Tag } from "lucide-react";

interface MobileBottomNavProps {
  onCartOpen: () => void;
}

export default function MobileBottomNav({ onCartOpen }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { items } = useCartStore();
  const { user, isGuest } = useAuthStore();

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const isLoggedIn = !!user || isGuest;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/menu", icon: UtensilsCrossed, label: "Menu" },
    { href: null, icon: ShoppingBag, label: "Cart", isCart: true },
    { href: "/offers", icon: Tag, label: "Offers" },
    { href: isLoggedIn ? "/account/profile" : "/auth/login", icon: User, label: isLoggedIn ? "Account" : "Login" },
  ];

  return (
    <nav className="mobile-bottom-nav lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.07)]">
      {navItems.map((item, i) => {
        const isActive = item.href ? pathname === item.href || pathname?.startsWith(item.href + "/") : false;
        const Icon = item.icon;

        if (item.isCart) {
          return (
            <button key={i} onClick={onCartOpen} className="flex flex-col items-center gap-0.5 relative">
              <div className="relative">
                <div className="w-11 h-11 rounded-full flex items-center justify-center -mt-5 shadow-lg text-white"
                  style={{ backgroundColor: "var(--primary-hex)" }}>
                  <Icon className="w-5 h-5" />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#14142b] text-white text-[9px] font-bold flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-primary">Cart</span>
            </button>
          );
        }

        return (
          <Link key={i} href={item.href!}
            className={`flex flex-col items-center gap-0.5 transition-colors ${isActive ? "text-primary" : "text-[#a0a3bd] hover:text-[#6e7191]"}`}>
            <Icon className={`w-5 h-5 ${isActive ? "stroke-[#ff006b]" : ""}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--primary-hex)" }} />}
          </Link>
        );
      })}
    </nav>
  );
}
