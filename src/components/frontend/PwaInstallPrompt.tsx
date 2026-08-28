"use client";

import React, { useEffect, useState } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { useSettingStore } from "@/store/useSettingStore";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as any).standalone === true)
  );
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaViewed, setIsPwaViewed] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { siteName } = useSettingStore();

  useEffect(() => {
    // Don't show if already installed as standalone app
    if (isInStandaloneMode()) return;

    const viewed = localStorage.getItem("pwa_viewed");
    if (viewed) return;

    if (isIOS()) {
      // iOS doesn't fire beforeinstallprompt — show manual guide instead
      setShowIOSGuide(true);
      setIsPwaViewed(false);
    } else {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsPwaViewed(false);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      const handleAppInstalled = () => {
        setDeferredPrompt(null);
        closePwaModal();
      };
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const closePwaModal = () => {
    setIsPwaViewed(true);
    setShowIOSGuide(false);
    localStorage.setItem("pwa_viewed", "true");
  };

  const installPWA = async () => {
    if (!deferredPrompt) {
      closePwaModal();
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    closePwaModal();
  };

  if (isPwaViewed) return null;

  // ─── iOS Safari: Manual guide banner ─────────────────────────────────────
  if (showIOSGuide) {
    return (
      <div className="lg:hidden bg-white p-4 fixed bottom-0 left-0 w-full z-[100] rounded-tl-3xl rounded-tr-3xl shadow-[0_-4px_10px_rgba(0,0,0,0.12)]">
        <div className="flex items-start gap-3 mb-3">
          <img
            src="/images/icons/icon-72x72.png"
            alt="App Icon"
            className="w-9 h-9 rounded-xl flex-shrink-0 shadow-sm object-cover"
          />
          <div className="flex-auto">
            <h3 className="text-sm font-semibold text-[#14142B] leading-tight">
              Add {siteName || "FoodAppi"} to your home screen
            </h3>
            <p className="text-xs text-[#6E7191] mt-0.5">
              Install this app on your iPhone for the best experience.
            </p>
          </div>
          <button onClick={closePwaModal} className="text-[#A0A3BD] hover:text-[#14142B] transition-colors flex-shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step-by-step iOS instructions */}
        <div className="bg-[#F7F7FC] rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#007AFF] rounded-lg flex items-center justify-center flex-shrink-0">
              <Share className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-[#14142B]">
              Tap the <span className="font-semibold">Share</span> button at the bottom of Safari
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff006b] rounded-lg flex items-center justify-center flex-shrink-0">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-[#14142B]">
              Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Android / Chrome: Standard install banner ────────────────────────────
  return (
    <>
      {/* Desktop Modal */}
      <div className="hidden lg:block fixed inset-0 z-[100] bg-black/50" onClick={closePwaModal} />
      <div className="hidden lg:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[360px] p-6 bg-white rounded-2xl shadow-xl text-center">
        <button className="absolute top-4 right-4 text-[#A0A3BD] hover:text-[#14142B] transition-colors" onClick={closePwaModal}>
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-[18px] font-semibold leading-8 mb-6 text-[#14142B]">Install App ?</h3>
        <div className="flex gap-3 justify-center">
          <button type="button" className="h-10 px-4 rounded-3xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center gap-1 hover:bg-[#F7F7FC] transition-colors font-medium text-sm" onClick={closePwaModal}>
            <X className="w-4 h-4" /><span>Close</span>
          </button>
          <button className="h-10 px-6 rounded-3xl bg-[#ff006b] text-white flex items-center gap-1 hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20 font-medium text-sm" onClick={installPWA}>
            <Download className="w-4 h-4" /><span>Install</span>
          </button>
        </div>
      </div>

      {/* Mobile Sticky Footer Banner */}
      <div className="lg:hidden bg-white p-4 fixed bottom-0 left-0 w-full z-[100] rounded-tl-3xl rounded-tr-3xl shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <div className="flex items-start gap-3 mb-3">
          <img src="/images/icons/icon-72x72.png" alt="App Icon" className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm object-cover" />
          <h3 className="text-sm flex-auto text-[#008BBA] font-medium leading-tight">
            Add {siteName || "FoodAppi"} app to your home screen ?
          </h3>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={closePwaModal} className="py-2 px-3 rounded-md capitalize text-sm border border-gray-200 text-[#ff006b] hover:bg-[#F7F7FC] transition-colors">Cancel</button>
          <button onClick={installPWA} className="py-2 px-3 rounded-md capitalize text-sm bg-[#ff006b] text-white hover:bg-[#e60060] transition-colors shadow-sm">Install</button>
        </div>
      </div>
    </>
  );
}
