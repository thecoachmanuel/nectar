"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    if (!user) {
      // Fallback check if state not hydrated yet
      const authStorage = localStorage.getItem("nectar_auth_storage");
      if (!authStorage) {
        router.push("/admin/login");
      }
    }
    setLoading(false);
  }, [router, pathname, user]);

  if (pathname === "/admin/login") {
    return <main className="min-h-screen bg-[#f7f7fc]">{children}</main>;
  }

  const hideShell = pathname.includes("/admin/pos") || pathname.includes("/admin/kds");

  if (hideShell) {
    return <main className="min-h-screen bg-[#f7f7fc]">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-[260px]"}`}>
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={user} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
