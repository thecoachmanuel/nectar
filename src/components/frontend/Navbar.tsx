"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useSettingStore } from "@/store/useSettingStore";
import {
  Search, ShoppingBag, User, LogOut, MapPin, MessageCircle,
  Lock, ClipboardList, Menu, X, ChevronDown, Leaf, Drumstick,
  ShoppingBasket, Download, Smartphone, Wallet, LayoutGrid
} from "lucide-react";
import PwaInstallModal from "./PwaInstallModal";
import { toast } from "sonner";

interface NavbarProps { onCartOpen?: () => void; }
export default function Navbar({ onCartOpen }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { menuViewMode, setMenuViewMode } = useSettingStore();

  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("search") || "");
  const profileRef = useRef<HTMLDivElement>(null);

  const cartCount = cartItems.reduce((sum: number, i: any) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum: number, i: any) => sum + i.itemTotal, 0);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    toast.success("Logged out successfully.");
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className={`ff-header bg-white transition-all duration-300 ${scrolled ? "fixed top-0 left-0 w-full z-50 shadow-md" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top Row: Logo + Search + Actions */}
          <div className="flex items-center justify-between h-[74px] gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <img
                src="/images/theme/theme-logo.png?v=2"
                alt="Nectar"
                className="w-24 sm:w-32 h-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style");
                }}
              />
              <span className="hidden text-2xl font-black" style={{ color: "var(--primary-hex)" }}>
                Nectar
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/" className={`capitalize text-sm font-medium transition-colors ${isActive("/") ? "text-primary" : "text-[#14142b] hover:text-primary"}`}>
                Home
              </Link>
              <Link href="/menu" className={`capitalize text-sm font-medium transition-colors ${isActive("/menu") ? "text-primary" : "text-[#14142b] hover:text-primary"}`}>
                Groceries
              </Link>
              <Link href="/offers" className={`capitalize text-sm font-medium transition-colors ${isActive("/offers") ? "text-primary" : "text-[#14142b] hover:text-primary"}`}>
                Offers
              </Link>
            </nav>

            {/* Search Bar (Visible on both desktop and mobile in PHP app) */}
            <form onSubmit={handleSearch} className="flex flex-1 lg:flex-none items-center border rounded-3xl px-3 gap-2 h-9 lg:w-52 border-[#eff0f6] bg-[#eff0f6] focus-within:bg-white focus-within:border-primary transition-all">
              <button type="submit">
                <Search className="w-4 h-4 text-[#6e7191]" />
              </button>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim()) {
                    router.replace(`/menu?search=${encodeURIComponent(val.trim())}`);
                  } else if (pathname === '/menu') {
                    router.replace(`/menu`);
                  }
                }}
                placeholder="Search groceries"
                className="w-full h-full bg-transparent text-xs text-[#14142b] placeholder:text-[#a0a3bd] outline-none"
              />
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart Button */}
              <button
                onClick={onCartOpen}
                className="hidden lg:flex items-center gap-1.5 rounded-3xl h-9 px-4 text-sm font-medium text-white bg-[#14142b] hover:bg-primary transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="whitespace-nowrap">₦{cartTotal.toFixed(2)}</span>
                {cartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold ml-1">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Auth */}
              {!user ? (
                <Link
                  href="/auth/login"
                  className="hidden lg:flex items-center gap-1.5 rounded-3xl h-9 px-4 text-sm font-medium text-white bg-primary hover:bg-[#ff3b8e] transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              ) : (
                <div ref={profileRef} className="relative hidden lg:block">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-1.5 rounded-3xl h-9 px-4 text-sm font-medium text-white bg-primary hover:bg-[#ff3b8e] transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="capitalize">{user.name?.split(" ")[0] || "Account"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div className="absolute top-12 right-0 z-50 w-72 rounded-xl shadow-xl bg-white border border-[#eff0f6] overflow-hidden">
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 p-4 bg-[#fff5f9] border-b border-[#eff0f6]">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#14142b] capitalize">{user.name}</p>
                          <p className="text-xs text-[#6e7191]">{user.email}</p>
                          {(user.role === "admin" || user.role === "chef" || user.role === "waiter") && (
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{user.role}</span>
                          )}
                        </div>
                      </div>

                      <nav className="px-2 py-2">
                        {(user.role === "admin" || user.role === "chef" || user.role === "waiter") && (
                          <Link href="/admin/dashboard" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#14142b] hover:text-primary hover:bg-[#fff5f9] transition-all capitalize">
                            <LayoutGrid className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link href="/account/orders" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#14142b] hover:text-primary hover:bg-[#fff5f9] transition-all border-b border-[#eff0f6] capitalize">
                          <ClipboardList className="w-4 h-4" />
                          <span>My Orders</span>
                        </Link>
                        <Link href="/account/wallet" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#14142b] hover:text-primary hover:bg-[#fff5f9] transition-all border-b border-[#eff0f6] capitalize">
                          <Wallet className="w-4 h-4" />
                          <span>Wallet</span>
                        </Link>
                        <Link href="/account/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#14142b] hover:text-primary hover:bg-[#fff5f9] transition-all border-b border-[#eff0f6] capitalize">
                          <User className="w-4 h-4" />
                          <span>Edit Profile</span>
                        </Link>
                        <Link href="/account/chat" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#14142b] hover:text-primary hover:bg-[#fff5f9] transition-all border-b border-[#eff0f6] capitalize">
                          <MessageCircle className="w-4 h-4" />
                          <span>Chat</span>
                        </Link>
                        <Link href="/account/addresses" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#14142b] hover:text-primary hover:bg-[#fff5f9] transition-all border-b border-[#eff0f6] capitalize">
                          <MapPin className="w-4 h-4" />
                          <span>Addresses</span>
                        </Link>
                         <button 
                          onClick={() => { setProfileOpen(false); setPwaModalOpen(true); }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-primary hover:bg-[#fff5f9] transition-all border-b border-[#eff0f6] font-semibold"
                        >
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-4 h-4 text-primary" />
                            <span>Download App</span>
                          </div>
                          <span className="text-[9px] uppercase font-bold bg-primary text-white px-1.5 py-0.5 rounded-md">PWA</span>
                        </button>
                        <Link href="/account/profile?tab=security" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#14142b] hover:text-primary hover:bg-[#fff5f9] transition-all border-b border-[#eff0f6] capitalize">
                          <Lock className="w-4 h-4" />
                          <span>Change Password</span>
                        </Link>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all capitalize">
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-[#14142b]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#eff0f6] bg-white px-4 py-4 space-y-3">


            <nav className="flex flex-col gap-1">
              {[{ href: "/", label: "Home" }, { href: "/menu", label: "Groceries" }, { href: "/offers", label: "Offers" }].map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${isActive(href) ? "text-primary bg-[#fff5f9]" : "text-[#14142b] hover:bg-[#f7f7fc]"}`}>
                  {label}
                </Link>
              ))}
              {/* PWA Download App Option in Mobile Hamburger Menu */}
              <button
                onClick={() => { setMobileMenuOpen(false); setPwaModalOpen(true); }}
                className="mt-1 flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-rose-600 shadow-md shadow-primary/20 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4.5 h-4.5 text-white" />
                  <span>Download Nectar App</span>
                </div>
                <span className="text-[10px] uppercase font-extrabold bg-white text-primary px-2 py-0.5 rounded-full shadow-2xs">PWA</span>
              </button>
            </nav>

            {!user ? (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-medium text-white bg-primary">
                <User className="w-4 h-4" />
                Login / Sign Up
              </Link>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#a0a3bd] uppercase tracking-wider px-3 py-1">Account</p>
                {[
                  { href: "/account/orders", label: "My Orders", icon: <ClipboardList className="w-4 h-4" /> },
                  { href: "/account/wallet", label: "Wallet", icon: <Wallet className="w-4 h-4" /> },
                  { href: "/account/profile", label: "Edit Profile", icon: <User className="w-4 h-4" /> },
                  { href: "/account/addresses", label: "Addresses", icon: <MapPin className="w-4 h-4" /> },
                  { href: "/account/chat", label: "Chat", icon: <MessageCircle className="w-4 h-4" /> },
                ].map(({ href, label, icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#14142b] hover:bg-[#fff5f9] hover:text-primary transition-all">
                    {icon}<span>{label}</span>
                  </Link>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all">
                  <LogOut className="w-4 h-4" /><span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
        {/* PWA Installer Modal */}
        <PwaInstallModal
          isOpen={pwaModalOpen}
          onClose={() => setPwaModalOpen(false)}
          deferredPrompt={deferredPrompt}
        />
      </header>
    </>
  );
}
