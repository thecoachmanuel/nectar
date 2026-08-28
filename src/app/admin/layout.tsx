"use client";

import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Certain screens like POS or KDS might want to hide the sidebar and navbar completely
  const hideShell = pathname.includes("/admin/pos") || pathname.includes("/admin/kds");

  if (hideShell) {
    return <main className="min-h-screen bg-[#f7f7fc]">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex">
      {/* Persistent Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-[260px]"}`}>
        {/* Persistent Navbar */}
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
