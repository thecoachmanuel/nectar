"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Maximize2, Minimize2, ChevronDown, Store, Globe, LogOut, User, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";

interface NavbarProps {
  toggleSidebar: () => void;
  user?: any;
}

export default function Navbar({ toggleSidebar, user }: NavbarProps) {
  const router = useRouter();
  const { activeAdminStoreId, setActiveAdminStoreId } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "store_manager") {
      fetch("/api/admin/stores")
        .then(res => res.json())
        .then(data => {
          if (data.status) setStores(data.stores || []);
          if (user.role === "store_manager") {
            setActiveAdminStoreId(user.storeId as string);
          }
        })
        .catch(() => {});
    }
  }, [user, setActiveAdminStoreId]);

  const activeStoreName = activeAdminStoreId === "0" 
    ? "All Stores (Global)" 
    : (stores || []).find(s => s._id === activeAdminStoreId)?.name || "Store";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
  };

  return (
    <header className="h-[70px] bg-white border-b border-[#EFF0F6] flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="w-10 h-10 rounded-xl bg-[#F7F7FC] text-primary flex items-center justify-center hover:bg-[#fff5f9] transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Store Selector */}
        {(user?.role === "admin" || user?.role === "store_manager") && (
          <div className="relative hidden sm:block">
            <button 
              onClick={() => { 
                if (user?.role === "admin") setStoreOpen(!storeOpen); 
                setProfileOpen(false); 
                setLangOpen(false); 
              }}
              className={`flex items-center gap-3 ${user?.role === "store_manager" ? "cursor-default" : ""}`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#fff5f9] text-primary flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-[#6E7191] uppercase tracking-wider font-semibold">
                  {user?.role === "store_manager" ? "My Store" : "Store Context"}
                </span>
                <span className="block text-xs font-bold text-[#14142B] -mt-0.5 whitespace-nowrap">
                  {activeStoreName}
                </span>
              </div>
              {user?.role === "admin" && <ChevronDown className="w-4 h-4 text-[#A0A3BD]" />}
            </button>
            
            {storeOpen && user?.role === "admin" && (
              <div className="absolute top-12 left-0 w-56 max-h-64 overflow-y-auto custom-scrollbar bg-white border border-[#EFF0F6] rounded-xl shadow-lg py-2 z-50">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#fff5f9] cursor-pointer text-sm text-[#14142B] font-medium transition-colors">
                  <input 
                    type="radio" 
                    name="admin_store"
                    checked={activeAdminStoreId === "0"} 
                    onChange={() => { setActiveAdminStoreId("0"); setStoreOpen(false); }}
                    className="accent-[#ff006b]" 
                  /> 
                  All Stores (Global)
                </label>
                {(stores || []).map(store => (
                  <label key={store._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#fff5f9] cursor-pointer text-sm text-[#14142B] font-medium transition-colors">
                    <input 
                      type="radio" 
                      name="admin_store"
                      checked={activeAdminStoreId === store._id} 
                      onChange={() => { setActiveAdminStoreId(store._id); setStoreOpen(false); }}
                      className="accent-[#ff006b]" 
                    /> 
                    {store.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        
        <button 
          onClick={toggleFullscreen}
          className="hidden sm:flex w-10 h-10 rounded-xl bg-[#E0FFED] text-[#1AB759] items-center justify-center transition-colors hover:bg-[#cbf7dc]"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button 
            onClick={() => { setLangOpen(!langOpen); setProfileOpen(false); setStoreOpen(false); }}
            className="flex items-center gap-2 h-10 px-3 rounded-xl bg-[#fff5f9] text-primary hover:bg-rose-100 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">EN</span>
          </button>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setProfileOpen(!profileOpen); setStoreOpen(false); setLangOpen(false); }}
            className="flex items-center gap-2"
          >
            <img src={user?.image || "/images/default/admin.png"} alt="User" className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
            <div className="text-left hidden md:block">
              <span className="block text-[10px] text-[#6E7191] font-medium">Hello,</span>
              <span className="block text-xs font-bold text-[#14142B] -mt-0.5">{user?.name?.split(" ")[0] || "User"}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#A0A3BD] hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute top-14 right-0 w-72 bg-white border border-[#EFF0F6] rounded-2xl shadow-xl py-4 z-50">
              <div className="px-6 pb-4 border-b border-[#EFF0F6] text-center">
                <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-[#ff006b] to-orange-400 mb-3">
                  <img src={user?.image || "/images/default/admin.png"} alt="Admin" className="w-full h-full rounded-full border-2 border-white object-cover bg-white" />
                </div>
                <h3 className="font-bold text-[#14142B] text-base">{user?.name || "Admin"}</h3>
                <p className="text-[#6E7191] text-xs">{user?.email || "admin@example.com"}</p>
                <p className="text-primary font-semibold text-[10px] uppercase mt-1 tracking-wider">{user?.role || "Administrator"}</p>
              </div>
              <div className="pt-2">
                <Link href="/admin/profile" className="flex items-center gap-3 px-6 py-3 text-sm text-[#14142B] hover:bg-[#F7F7FC] transition-colors">
                  <User className="w-4 h-4 text-[#A0A3BD]" /> Edit Profile
                </Link>
                <Link href="/admin/change-password" className="flex items-center gap-3 px-6 py-3 text-sm text-[#14142B] hover:bg-[#F7F7FC] transition-colors">
                  <Key className="w-4 h-4 text-[#A0A3BD]" /> Change Password
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
