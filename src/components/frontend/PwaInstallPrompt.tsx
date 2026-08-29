"use client";

import React, { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
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
  const { siteName } = useSettingStore();

  useEffect(() => {
    // Don't show if already installed as standalone app
    if (isInStandaloneMode()) return;

    const viewed = localStorage.getItem("pwa_viewed");
    if (viewed) return;

    setIsPwaViewed(false); // Show the prompt matching PHP app exactly

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
  }, []);

  const closePwaModal = () => {
    setIsPwaViewed(true);
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

  return (
    <>
      {/* iOS Specific Instruction Prompt */}
      {isIOS() && !deferredPrompt && (
        <div className="fixed bottom-0 left-0 w-full z-[100] bg-white p-4 pb-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-t border-[#eff0f6] animate-in slide-in-from-bottom-full duration-300">
          <button className="absolute top-3 right-3 text-[#A0A3BD] hover:text-[#14142B]" onClick={closePwaModal}>
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <img src="/images/theme/theme-favicon-logo.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-sm object-cover" />
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[#14142B] mb-1">Install {siteName || "Nectar"} App</h3>
              <p className="text-[13px] text-[#4E4B66] leading-snug">
                Install this application on your home screen for quick and easy access.
              </p>
              <div className="mt-3 bg-[#F7F7FC] p-3 rounded-lg border border-[#EFF0F6]">
                <p className="text-[13px] text-[#4E4B66] flex items-center gap-2">
                  1. Tap <span className="inline-flex items-center justify-center w-6 h-6 bg-white rounded shadow-sm border border-gray-200"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zaGFyZSI+PHBhdGggZD0iTTRgIDEydjhhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yem00LTgtNC00LSA0LTEwaDR6Ii8+PC9zdmc+" alt="Share" className="w-4 h-4 opacity-70"/></span> below
                </p>
                <p className="text-[13px] text-[#4E4B66] mt-1.5 flex items-center gap-2">
                  2. Select <strong className="font-semibold text-[#14142B]">Add to Home Screen</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Modal (Exactly like PHP FrontendNavBarComponent) */}
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
          <button className="h-10 px-6 rounded-3xl bg-primary text-white flex items-center gap-1 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 font-medium text-sm" onClick={installPWA}>
            <Download className="w-4 h-4" /><span>Install</span>
          </button>
        </div>
      </div>

      {/* Mobile Sticky Footer Banner (Exactly like PHP FrontendMobileNavBarComponent) - Only show if NOT iOS */}
      {!isIOS() && (
        <div className="lg:hidden bg-white p-4 fixed bottom-0 left-0 w-full z-[100] rounded-tl-3xl rounded-tr-3xl shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
          <div className="flex items-start gap-3 mb-3">
            <img src="/images/theme/theme-favicon-logo.png" alt="App Icon" className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm object-cover" />
            <h3 className="text-sm flex-auto text-[#008BBA] font-medium leading-tight">
              Add {siteName || "Nectar"} app to your home screen ?
            </h3>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={closePwaModal} className="py-2 px-3 rounded-md capitalize text-sm border border-gray-200 text-primary hover:bg-[#F7F7FC] transition-colors">Cancel</button>
            <button onClick={installPWA} className="py-2 px-3 rounded-md capitalize text-sm bg-primary text-white hover:bg-[#e60060] transition-colors shadow-sm">Install</button>
          </div>
        </div>
      )}
    </>
  );
}
