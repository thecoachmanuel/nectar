"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useSettingStore } from "@/store/useSettingStore";
import {
  MapPin,
  ShoppingBag,
  User,
  Search,
  Globe,
  ChevronDown,
  LogOut,
  Clock,
  MessageSquare,
  Building,
  ShieldAlert,
  Leaf,
  Drumstick,
} from "lucide-react";
import { toast } from "sonner";

export default function Navbar() {
  const { user, isGuest, logout } = useAuthStore();
  const { items, getSubtotal, setBranchId } = useCartStore();
  const {
    siteName,
    isMultiBranch,
    activeBranch,
    setActiveBranch,
    activeFoodType,
    setActiveFoodType,
    formatPrice,
  } = useSettingStore();

  const [branches, setBranches] = useState<any[]>([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [currentLang, setCurrentLang] = useState("English");
  const [searchQuery, setSearchQuery] = useState("");

  const totalCartItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/frontend/branches");
      const data = await res.json();
      if (data.status) {
        setBranches(data.branches || []);
        if (!activeBranch && data.matchedBranch) {
          setActiveBranch(data.matchedBranch);
          setBranchId(data.matchedBranch._id);
        }
      }
    } catch (e) {
      console.error("Error fetching branches:", e);
    }
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading("Detecting your location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          toast.dismiss();
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `/api/frontend/branches?latitude=${latitude}&longitude=${longitude}`
            );
            const data = await res.json();
            if (data.status && data.matchedBranch) {
              setActiveBranch(data.matchedBranch);
              setBranchId(data.matchedBranch._id);
              toast.success(`Connected to nearest branch: ${data.matchedBranch.name}`);
            } else {
              toast.info("Location detected. Default branch selected.");
            }
          } catch (e) {
            toast.error("Failed to resolve branch by location.");
          }
        },
        () => {
          toast.dismiss();
          toast.error("Location access denied or unavailable.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      {/* Top Banner Bar */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={requestLocation}
              className="flex items-center space-x-1.5 hover:text-red-400 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Allow Location Access</span>
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-slate-300">
              {activeBranch ? `Branch: ${activeBranch.name}` : "Select a Branch"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center space-x-1 hover:text-red-400 transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white text-slate-800 rounded-lg shadow-lg py-1 border border-slate-100 z-50 text-xs font-medium">
                  <button
                    onClick={() => {
                      setCurrentLang("English");
                      setShowLangDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 hover:text-red-600"
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLang("Español");
                      setShowLangDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 hover:text-red-600"
                  >
                    Español
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLang("Français");
                      setShowLangDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 hover:text-red-600"
                  >
                    Français
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 font-black text-xl">
            F
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Food<span className="text-red-500">Appi</span>
          </span>
        </Link>

        {/* Multi-Branch Switcher */}
        {isMultiBranch && branches.length > 0 && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="flex items-center space-x-2 bg-slate-50 border border-slate-200 hover:border-red-400 text-slate-700 text-sm font-semibold px-3 py-2 rounded-xl transition"
            >
              <Building className="w-4 h-4 text-red-500" />
              <span>{activeBranch ? activeBranch.name : "Select Branch"}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showBranchDropdown && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Available Branches
                </div>
                {branches.map((b) => (
                  <button
                    key={b._id}
                    onClick={() => {
                      setActiveBranch(b);
                      setBranchId(b._id);
                      setShowBranchDropdown(false);
                      toast.success(`Switched to ${b.name}`);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-medium flex items-center justify-between hover:bg-red-50 hover:text-red-600 transition ${
                      activeBranch?._id === b._id ? "text-red-600 bg-red-50/50" : "text-slate-700"
                    }`}
                  >
                    <span>{b.name}</span>
                    {activeBranch?._id === b._id && <MapPin className="w-4 h-4 text-red-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search & Food Type Filter Bar */}
        <div className="flex-1 max-w-md hidden lg:flex items-center space-x-2">
          {/* Veg / Non-Veg Filter Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveFoodType("all")}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeFoodType === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFoodType("veg")}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition ${
                activeFoodType === "veg" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Leaf className="w-3 h-3" />
              <span>Veg</span>
            </button>
            <button
              onClick={() => setActiveFoodType("non_veg")}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition ${
                activeFoodType === "non_veg" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-rose-600"
              }`}
            >
              <Drumstick className="w-3 h-3" />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Right Actions (Cart & Profile) */}
        <div className="flex items-center space-x-3">
          {/* Cart Icon & Button */}
          <Link
            href="/checkout"
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 rounded-xl shadow-sm shadow-red-500/30 transition text-sm font-semibold"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {totalCartItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-bold">{formatPrice(getSubtotal())}</span>
          </Link>

          {/* User Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <User className="w-5 h-5" />
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    {user.role === "admin" && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 transition"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Admin Backoffice</span>
                      </Link>
                    )}

                    <Link
                      href="/account/orders"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      href="/account/addresses"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>Manage Addresses</span>
                    </Link>

                    <Link
                      href="/account/chat"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>Chat with Manager</span>
                    </Link>

                    <Link
                      href="/account/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Edit Profile</span>
                    </Link>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                        toast.success("Logged out successfully");
                      }}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">Welcome to FoodAppi</p>
                      <p className="text-xs text-slate-400">Login or order as Guest</p>
                    </div>

                    <Link
                      href="/auth/login"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <User className="w-4 h-4" />
                      <span>Login / Signup</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
