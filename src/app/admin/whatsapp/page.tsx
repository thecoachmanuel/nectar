"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

const WA_STATUS_URL = "/api/admin/whatsapp/status";
const WA_QR_URL = "/api/admin/whatsapp/qr";
const WA_LOGOUT_URL = "/api/admin/whatsapp/logout";

export default function WhatsAppBotPage() {
  const [status, setStatus] = useState<"loading" | "open" | "qr_pending" | "connecting" | "disconnected">("loading");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(WA_STATUS_URL, { cache: "no-store" });
      const data = await res.json();
      if (data.status) {
        setStatus(data.connection || "disconnected");
        if (data.qrReady && data.connection !== "open") {
          fetchQr();
        } else if (data.connection === "open") {
          setQrImage(null);
        }
      }
    } catch {
      setStatus("disconnected");
    }
  }, []);

  const fetchQr = async () => {
    try {
      const res = await fetch(WA_QR_URL);
      const data = await res.json();
      if (data.status && data.qr) {
        setQrImage(data.qr);
        setStatus("qr_pending");
      } else {
        setQrImage(null);
      }
    } catch {}
  };

  const handleLogout = async () => {
    if (!window.confirm("Disconnect WhatsApp? You'll need to scan QR again.")) return;
    try {
      const res = await fetch(WA_LOGOUT_URL, { method: "POST" });
      const data = await res.json();
      if (data.status) {
        toast.success("WhatsApp disconnected.");
        setStatus("disconnected");
        setQrImage(null);
      } else {
        toast.error(data.message || "Failed to logout.");
      }
    } catch {
      toast.error("Could not reach WhatsApp service.");
    }
  };

  // Poll status every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const isConnected = status === "open";
  const isConnecting = status === "connecting" || status === "loading";
  const needsQr = status === "qr_pending";

  return (
    <div className="pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1AB759]/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-[#1AB759]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#14142B]">WhatsApp Bot</h2>
              <p className="text-sm text-[#6E7191]">Automated order status notifications</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              className="h-9 px-4 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center gap-2 hover:bg-[#F7F7FC] text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            {isConnected && (
              <button
                onClick={handleLogout}
                className="h-9 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 flex items-center gap-2 hover:bg-red-100 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mt-5 p-4 rounded-xl flex items-center gap-3 ${
          isConnected ? "bg-green-50 border border-green-200" :
          needsQr ? "bg-amber-50 border border-amber-200" :
          isConnecting ? "bg-blue-50 border border-blue-200" :
          "bg-red-50 border border-red-200"
        }`}>
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          ) : isConnecting ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
          ) : needsQr ? (
            <QrCode className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-bold ${
              isConnected ? "text-green-700" :
              needsQr ? "text-amber-700" :
              isConnecting ? "text-blue-700" :
              "text-red-700"
            }`}>
              {isConnected ? "✅ WhatsApp Connected" :
               needsQr ? "📱 Scan QR Code to Connect" :
               isConnecting ? "🔄 Connecting to WhatsApp..." :
               "🔴 WhatsApp Disconnected"}
            </p>
            <p className={`text-xs mt-0.5 ${
              isConnected ? "text-green-600" :
              needsQr ? "text-amber-600" :
              isConnecting ? "text-blue-600" :
              "text-red-500"
            }`}>
              {isConnected
                ? "Bot is active — customers will receive WhatsApp updates automatically."
                : needsQr
                ? "Open WhatsApp on your phone → Linked Devices → Scan this QR."
                : isConnecting
                ? "Please wait while connecting..."
                : "Start the whatsapp-service and it will auto-connect."}
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Display */}
      {needsQr && qrImage && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 mb-6 text-center">
          <h3 className="text-base font-bold text-[#14142B] mb-1">Scan with WhatsApp</h3>
          <p className="text-xs text-[#6E7191] mb-5">
            Open WhatsApp → Menu (⋮) → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → Scan this QR
          </p>
          <div className="inline-block p-4 bg-white border-4 border-[#14142B] rounded-2xl shadow-lg">
            <img src={qrImage} alt="WhatsApp QR Code" className="w-56 h-56 object-contain" />
          </div>
          <p className="text-xs text-[#A0A3BD] mt-4">QR refreshes automatically. This page polls every 5 seconds.</p>
        </div>
      )}

      {/* Connected Info */}
      {isConnected && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6 mb-6">
          <h3 className="text-base font-bold text-[#14142B] mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#1AB759]" />
            What happens automatically
          </h3>
          <ul className="space-y-3 text-sm text-[#4E4B66]">
            {[
              { status: "accepted", label: "Order Accepted", emoji: "✅" },
              { status: "preparing", label: "Preparing", emoji: "👨‍🍳" },
              { status: "ready", label: "Ready for Delivery", emoji: "🎁" },
              { status: "out_for_delivery", label: "Out for Delivery", emoji: "🚚" },
              { status: "delivered", label: "Delivered", emoji: "🎉" },
              { status: "canceled", label: "Order Canceled", emoji: "😔" },
            ].map((item) => (
              <li key={item.status} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFC] border border-[#EFF0F6]">
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="font-semibold text-[#14142B] capitalize">{item.label}</p>
                  <p className="text-xs text-[#6E7191]">
                    Customer receives a personalized WhatsApp message automatically
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#1AB759] ml-auto shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Setup Instructions (if not connected) */}
      {!isConnected && !needsQr && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-6">
          <h3 className="text-base font-bold text-[#14142B] mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            How to Start the WhatsApp Bot
          </h3>
          <ol className="space-y-3 text-sm text-[#4E4B66]">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <p className="font-semibold text-[#14142B]">Navigate to the service folder</p>
                <code className="text-xs bg-[#F7F7FC] px-2 py-1 rounded block mt-1 font-mono">cd whatsapp-service</code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <p className="font-semibold text-[#14142B]">Install dependencies (first time only)</p>
                <code className="text-xs bg-[#F7F7FC] px-2 py-1 rounded block mt-1 font-mono">npm install</code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <p className="font-semibold text-[#14142B]">Copy and configure env</p>
                <code className="text-xs bg-[#F7F7FC] px-2 py-1 rounded block mt-1 font-mono">cp .env.example .env</code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <p className="font-semibold text-[#14142B]">Start the bot service</p>
                <code className="text-xs bg-[#F7F7FC] px-2 py-1 rounded block mt-1 font-mono">npm start</code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">5</span>
              <div>
                <p className="font-semibold text-[#14142B]">Come back here and scan the QR code</p>
                <p className="text-xs text-[#6E7191] mt-0.5">This page refreshes every 5 seconds — the QR will appear automatically.</p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
