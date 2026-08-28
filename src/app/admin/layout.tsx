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
    // A quick hack to get user role without API call if token holds it, 
    // but best is to hit a quick "me" endpoint or assume from localStorage
    // since the login API returns `user` object in response. 
    // Let's assume the user is saved in localStorage during login.
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [router]);

  const hideShell = pathname.includes("/admin/pos") || pathname.includes("/admin/kds");

  if (loading) return <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center">Loading...</div>;

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
