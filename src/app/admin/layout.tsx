"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import { usePathname, useRouter } from "next/navigation";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    let storedUser = localStorage.getItem("user");
    if (!storedUser) {
      const authStorage = localStorage.getItem("foodappi_auth_storage");
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state?.user) {
            storedUser = JSON.stringify(parsed.state.user);
          }
        } catch (e) {}
      }
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/admin/login");
    }
    setLoading(false);
  }, [router, pathname]);

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
