"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSettingStore } from "@/store/useSettingStore";
import {
  ArrowLeft,
  Save,
  CreditCard,
  Building,
  Smartphone,
  Globe,
  Settings,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const {
    isMultiBranch,
    setMultiBranch,
    currencySymbol,
    setCurrency,
    siteName,
  } = useSettingStore();

  const [activeTab, setActiveTab] = useState<"site" | "paystack" | "whatsapp" | "pwa">("site");

  // Paystack Settings
  const [paystackPublicKey, setPaystackPublicKey] = useState(
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_paystack_public_key_123"
  );
  const [paystackSecretKey, setPaystackSecretKey] = useState(
    process.env.PAYSTACK_SECRET_KEY || "sk_test_paystack_secret_key_123"
  );
  const [paystackStatus, setPaystackStatus] = useState(true);

  // WhatsApp Setup
  const [whatsappPhone, setWhatsappPhone] = useState("+1234567890");
  const [whatsappMessage, setWhatsappMessage] = useState(
    "Hello FoodAppi! I would like to place an order."
  );

  // Currency
  const [symbol, setSymbol] = useState(currencySymbol);
  const [code, setCode] = useState("USD");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrency(symbol, code);
    toast.success("System Settings saved successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/admin/dashboard" className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-extrabold text-base text-white">System Settings & Gateway Config</h1>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto w-full space-y-6 flex-1">
        {/* Settings Tab Navigation */}
        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700/60 text-xs font-bold space-x-2">
          <button
            onClick={() => setActiveTab("site")}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === "site" ? "bg-red-500 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Site & Branch Mode
          </button>

          <button
            onClick={() => setActiveTab("paystack")}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === "paystack" ? "bg-red-500 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Paystack & Gateways
          </button>

          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === "whatsapp" ? "bg-red-500 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            WhatsApp Ordering
          </button>

          <button
            onClick={() => setActiveTab("pwa")}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === "pwa" ? "bg-red-500 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            PWA Mobile Config
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6">
          {activeTab === "site" && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <h3 className="font-bold text-white text-base border-b border-slate-700 pb-3 flex items-center space-x-2">
                <Building className="w-4 h-4 text-red-400" />
                <span>Single vs Multi-Branch Configuration</span>
              </h3>

              {/* Single / Multi Branch Mode Toggle */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">Enable Multi-Branch Mode</p>
                  <p className="text-xs text-slate-400">
                    Allows customers to choose nearest branch or auto-detect via Geolocation delivery zone polygons.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isMultiBranch}
                  onChange={(e) => setMultiBranch(e.target.checked)}
                  className="w-5 h-5 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Currency Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Site Settings</span>
              </button>
            </form>
          )}

          {activeTab === "paystack" && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <h3 className="font-bold text-white text-base border-b border-slate-700 pb-3 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Paystack Gateway Configuration</span>
              </h3>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">Enable Paystack Gateway</p>
                  <p className="text-xs text-slate-400">Accept Card, Bank Transfer, USSD, and Mobile Money payments</p>
                </div>
                <input
                  type="checkbox"
                  checked={paystackStatus}
                  onChange={(e) => setPaystackStatus(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Paystack Public Key</label>
                <input
                  type="text"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Paystack Secret Key</label>
                <input
                  type="password"
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Gateway Credentials</span>
              </button>
            </form>
          )}

          {activeTab === "whatsapp" && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h3 className="font-bold text-white text-base border-b border-slate-700 pb-3 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Direct Order Setup</span>
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Branch WhatsApp Number</label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Message Template</label>
                <textarea
                  rows={3}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save WhatsApp Setup</span>
              </button>
            </form>
          )}

          {activeTab === "pwa" && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base border-b border-slate-700 pb-3 flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Progressive Web App (PWA) Icons & Offline Status</span>
              </h3>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 space-y-2">
                <p className="text-sm font-bold text-white">Service Worker & A2HS Install Banner</p>
                <p className="text-xs text-slate-400">
                  Manifest file generated at <code className="text-cyan-400">/manifest.webmanifest</code> with icons (72x72, 96x96, 128x128, 192x192, 512x512).
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
