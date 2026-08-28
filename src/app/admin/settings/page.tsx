"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Globe, 
  Mail, 
  CreditCard,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  PaintBucket,
  Save
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Company");

  const settingsMenu = [
    { name: "Company", icon: Building2 },
    { name: "Site", icon: Globe },
    { name: "Mail", icon: Mail },
    { name: "Payment Gateway", icon: CreditCard },
    { name: "SMS Gateway", icon: MessageSquare },
    { name: "Push Notification", icon: Smartphone },
    { name: "Roles & Permissions", icon: ShieldCheck },
    { name: "Theme", icon: PaintBucket },
  ];

  return (
    <div className="pb-16 flex flex-col lg:flex-row gap-6">
      
      {/* Settings Menu Sidebar */}
      <div className="w-full lg:w-[280px] shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
          <div className="p-4 border-b border-[#EFF0F6] bg-[#FAFAFC]">
            <h3 className="font-semibold text-lg text-[#14142B]">Settings</h3>
          </div>
          <ul className="flex flex-col py-2">
            {settingsMenu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => setActiveTab(item.name)}
                    className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-[#fff5f9] text-[#ff006b] border-r-2 border-[#ff006b]" 
                        : "text-[#6E7191] hover:bg-[#FAFAFC] hover:text-[#14142B] border-r-2 border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-4 sm:p-6 lg:p-8">
          
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-[#EFF0F6] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#14142B] mb-1">{activeTab} Settings</h2>
              <p className="text-sm text-[#6E7191]">Manage your {activeTab.toLowerCase()} configuration and preferences.</p>
            </div>
            <button className="h-11 px-6 rounded-xl bg-[#ff006b] text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20">
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save Changes</span>
            </button>
          </div>

          {/* Dynamic Content based on activeTab */}
          {activeTab === "Company" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Name <span className="text-red-500">*</span></label>
                <input type="text" defaultValue="FoodAppi" className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Email <span className="text-red-500">*</span></label>
                <input type="email" defaultValue="admin@foodappi.com" className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Phone <span className="text-red-500">*</span></label>
                <input type="text" defaultValue="+234 800 000 0000" className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Address <span className="text-red-500">*</span></label>
                <textarea rows={3} defaultValue="123 Food Street, Lagos, Nigeria" className="w-full p-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b] resize-none"></textarea>
              </div>
            </div>
          )}

          {activeTab === "Site" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Site Title</label>
                <input type="text" defaultValue="FoodAppi - Delivery & POS" className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Copyright Text</label>
                <input type="text" defaultValue="© 2026 FoodAppi. All rights reserved." className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Currency Symbol</label>
                <input type="text" defaultValue="₦" className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Timezone</label>
                <select className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]">
                  <option>Africa/Lagos</option>
                  <option>UTC</option>
                </select>
              </div>
            </div>
          )}

          {activeTab !== "Company" && activeTab !== "Site" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-[#F7F7FC] rounded-full flex items-center justify-center mb-4">
                <PaintBucket className="w-10 h-10 text-[#A0A3BD]" />
              </div>
              <h3 className="text-lg font-bold text-[#14142B] mb-2">{activeTab} Settings</h3>
              <p className="text-[#6E7191] max-w-sm">Configuration options for {activeTab.toLowerCase()} will appear here.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
