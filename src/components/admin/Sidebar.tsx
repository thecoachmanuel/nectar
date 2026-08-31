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
  MessageCircle,
  Utensils,
  BellRing,
  Ticket,
  ChevronDown,
  Image as ImageIcon,
  Tag,
  Send,
  Mail,
  Bell,
  ExternalLink
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: any;
}

export default function Sidebar({ isOpen, setIsOpen, user }: SidebarProps) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const role = user?.role || "admin";

  // Define full menu items, then filter based on role
  const allMenuItems = [
    { name: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, path: "/admin/dashboard", roles: ["admin", "store_manager"] },
    { name: "Delivery Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, path: "/admin/delivery-dashboard", roles: ["delivery_boy"] },
    { name: "POS", icon: <CreditCard className="w-4 h-4" />, path: "/admin/pos", roles: ["admin", "store_manager"] },
    { 
      name: "Orders", 
      icon: <ShoppingCart className="w-4 h-4" />, 
      roles: ["admin", "store_manager"],
      children: [
        { name: "Online Orders", path: "/admin/online-orders" },
        { name: "POS Orders", path: "/admin/pos-orders" },
        { name: "Status Screen", path: "/admin/order-status-screen" },
      ]
    },
    { name: "Product Categories", icon: <Box className="w-4 h-4" />, path: "/admin/item-categories", roles: ["admin", "store_manager"] },
    { name: "Products", icon: <Utensils className="w-4 h-4" />, path: "/admin/items", roles: ["admin", "store_manager"] },
    { name: "Push Notifications", icon: <Send className="w-4 h-4" />, path: "/admin/push-notifications", roles: ["admin", "store_manager"] },
    { name: "Coupons", icon: <Ticket className="w-4 h-4" />, path: "/admin/coupons", roles: ["admin"] },
    { name: "Offers", icon: <Tag className="w-4 h-4" />, path: "/admin/offers", roles: ["admin", "store_manager"] },
    { name: "Banners", icon: <ImageIcon className="w-4 h-4" />, path: "/admin/banners", roles: ["admin"] },
    { name: "Kitchen Display", icon: <BarChart3 className="w-4 h-4" />, path: "/admin/kds", roles: ["admin", "store_manager"] },
    { name: "Transactions", icon: <CreditCard className="w-4 h-4" />, path: "/admin/transactions", roles: ["admin"] },
    { name: "Payouts", icon: <CreditCard className="w-4 h-4" />, path: "/admin/payouts", roles: ["admin", "store_manager", "delivery_boy"] },
    { name: "WhatsApp Live Chat", icon: <MessageCircle className="w-4 h-4" />, path: "/admin/whatsapp-chat", roles: ["admin", "store_manager"] },
    { name: "Support Chat", icon: <MessageSquare className="w-4 h-4" />, path: "/admin/chat", roles: ["admin", "store_manager"] },
    { name: "Contact Messages", icon: <Mail className="w-4 h-4" />, path: "/admin/messages", roles: ["admin"] },
    { name: "Subscribers", icon: <BellRing className="w-4 h-4" />, path: "/admin/subscribers", roles: ["admin"] },
    { 
      name: "Reports", 
      icon: <BarChart3 className="w-4 h-4" />, 
      roles: ["admin", "store_manager"],
      children: [
        { name: "Financial Summary", path: "/admin/financial-summary" },
        { name: "Sales Report", path: "/admin/sales-report" },
        { name: "Products Report", path: "/admin/items-report" },
        { name: "Credit Balance", path: "/admin/credit-balance-report" },
      ]
    },
    { 
      name: "Users", 
      icon: <Users className="w-4 h-4" />, 
      roles: ["admin"],
      children: [
        { name: "Administrators", path: "/admin/administrators" },
        { name: "Customers", path: "/admin/customers" },
        { name: "Employees", path: "/admin/employees" },
        { name: "Waiters", path: "/admin/waiter" },
        { name: "Chefs", path: "/admin/chef" },
        { name: "Delivery Boys", path: "/admin/delivery-boys" },
      ]
    },
    { 
      name: "Settings", 
      icon: <Settings className="w-4 h-4" />, 
      roles: ["admin"],
      children: [
        { name: "Stores", path: "/admin/stores" },
        { name: "General Settings", path: "/admin/settings" },
        { name: "WhatsApp Bot 🤖", path: "/admin/whatsapp" },
      ]
    },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

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
            <img 
              src="/images/theme/theme-logo.png?v=2" 
              alt="Nectar" 
              className="h-8 w-auto object-contain" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-md' : 'text-[#6E7191] hover:bg-[#F7F7FC] hover:text-primary'}`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-[13px] font-medium">{item.name}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] mt-1' : 'max-h-0'}`}>
                        <ul className="pl-9 space-y-1">
                          {item.children.map(child => (
                            <li key={child.name}>
                              <Link 
                                href={child.path}
                                className={`block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${pathname === child.path ? 'text-primary bg-[#fff5f9]' : 'text-[#6E7191] hover:text-primary hover:bg-[#F7F7FC]'}`}
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-md' : 'text-[#6E7191] hover:bg-[#F7F7FC] hover:text-primary'}`}
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

        {/* Quick Navigate to Main Site */}
        <div className="p-3 border-t border-[#EFF0F6] bg-[#FAFAFC]">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#EFF0F6] text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-sm group"
          >
            <ExternalLink className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
            <span>Visit Live Store</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
