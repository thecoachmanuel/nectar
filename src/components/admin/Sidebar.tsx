"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  ShoppingCart, 
  Users, 
  Box, 
  BarChart3, 
  X,
  CreditCard,
  MessageSquare,
  Utensils,
  BellRing,
  Ticket,
  ChevronDown
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, path: "/admin/dashboard" },
    { name: "POS", icon: <CreditCard className="w-4 h-4" />, path: "/admin/pos" },
    { name: "Online Orders", icon: <ShoppingCart className="w-4 h-4" />, path: "/admin/orders" },
    { name: "Item Categories", icon: <Box className="w-4 h-4" />, path: "/admin/item-categories" },
    { name: "Items", icon: <Utensils className="w-4 h-4" />, path: "/admin/items" },
    { name: "Customers", icon: <Users className="w-4 h-4" />, path: "/admin/customers" },
    { name: "Kitchen Display", icon: <BarChart3 className="w-4 h-4" />, path: "/admin/kds" },
    { name: "Messages", icon: <MessageSquare className="w-4 h-4" />, path: "/admin/messages" },
    { name: "Coupons", icon: <Ticket className="w-4 h-4" />, path: "/admin/coupons" },
    { name: "Reports", icon: <BarChart3 className="w-4 h-4" />, path: "/admin/reports" },
    { 
      name: "Users", 
      icon: <Users className="w-4 h-4" />, 
      children: [
        { name: "Employees", path: "/admin/employees" },
        { name: "Waiters", path: "/admin/waiter" },
        { name: "Chefs", path: "/admin/chef" },
      ]
    },
    { name: "Settings", icon: <Settings className="w-4 h-4" />, path: "/admin/settings" },
  ];

  const handleMenuClick = (name: string, hasChildren: boolean) => {
    if (hasChildren) {
      setActiveMenu(activeMenu === name ? null : name);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#EFF0F6] transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}
      >
        <div className="flex items-center justify-between h-[70px] px-5 border-b border-[#EFF0F6]">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <img src="/images/default/logo.png" alt="FoodAppi" className="h-8" />
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-[#6E7191] hover:text-[#14142B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 hide-scrollbar">
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (item.children && item.children.some(child => pathname === child.path));
              const isExpanded = activeMenu === item.name || isActive;

              return (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <button 
                        onClick={() => handleMenuClick(item.name, true)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${isActive ? 'bg-[#ff006b] text-white shadow-md' : 'text-[#6E7191] hover:bg-[#F7F7FC] hover:text-[#ff006b]'}`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-[13px] font-medium">{item.name}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-1' : 'max-h-0'}`}>
                        <ul className="pl-9 space-y-1">
                          {item.children.map(child => (
                            <li key={child.name}>
                              <Link 
                                href={child.path}
                                className={`block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${pathname === child.path ? 'text-[#ff006b] bg-[#fff5f9]' : 'text-[#6E7191] hover:text-[#ff006b] hover:bg-[#F7F7FC]'}`}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <Link 
                      href={item.path}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive ? 'bg-[#ff006b] text-white shadow-md' : 'text-[#6E7191] hover:bg-[#F7F7FC] hover:text-[#ff006b]'}`}
                    >
                      {item.icon}
                      <span className="text-[13px] font-medium">{item.name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
