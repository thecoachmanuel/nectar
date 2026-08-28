"use client";

import React, { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { useSettingStore } from "@/store/useSettingStore";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaViewed, setIsPwaViewed] = useState(true);
  const { siteName } = useSettingStore();

  useEffect(() => {
    // Check if user has already dismissed it
    const viewed = localStorage.getItem("pwa_viewed");
    if (!viewed) {
      setIsPwaViewed(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    closePwaModal();
  };

  // Only show if we caught the prompt and the user hasn't dismissed it
  if (isPwaViewed || !deferredPrompt) return null;

  return (
    <>
      {/* Desktop View Modal (Hidden on mobile) */}
      <div className="hidden lg:block fixed inset-0 z-[100] bg-black/50" onClick={closePwaModal} />
      <div className="hidden lg:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[360px] p-6 bg-white rounded-2xl shadow-xl text-center">
        <button 
          className="absolute top-4 right-4 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
          onClick={closePwaModal}
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-[18px] font-semibold leading-8 mb-6 text-[#14142B]">
          Install App ?
        </h3>
        
        <div className="flex gap-3 justify-center text-center">
          <button 
            type="button" 
            className="h-10 px-4 rounded-3xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center gap-1 hover:bg-[#F7F7FC] transition-colors font-medium text-sm"
            onClick={closePwaModal}
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
          
          <button 
            className="h-10 px-6 rounded-3xl bg-[#ff006b] text-white flex items-center justify-center gap-1 hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20 font-medium text-sm"
            onClick={installPWA}
          >
            <Download className="w-4 h-4" />
            <span>Install</span>
          </button>
        </div>
      </div>

      {/* Mobile Sticky Footer View (Hidden on desktop) */}
      <div className="lg:hidden bg-white p-4 fixed bottom-0 left-0 w-full z-[100] rounded-tl-3xl rounded-tr-3xl shadow-[0_-4px_10px_rgba(0,0,0,0.1)] pb-safe animate-in slide-in-from-bottom">
        <div className="flex items-start gap-3 mb-3">
          <img
            src={"/images/icons/icon-72x72.png"}
            alt="App Icon"
            className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm object-cover"
          />
          <h3 className="text-sm flex-auto text-[#008BBA] font-medium leading-tight">
            Add {siteName || "FoodAppi"} app to your home screen ?
          </h3>
        </div>
        <div className="flex items-center justify-end gap-2 mt-1">
          <button
            onClick={closePwaModal}
            className="py-2 px-3 rounded-md capitalize text-sm border border-gray-200 text-[#ff006b] hover:bg-[#F7F7FC] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={installPWA}
            className="py-2 px-3 rounded-md capitalize text-sm bg-[#ff006b] text-white hover:bg-[#e60060] transition-colors shadow-sm"
          >
            Install
          </button>
        </div>
      </div>
    </>
  );
}
