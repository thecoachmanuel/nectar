"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      setTimeout(() => {
        setJustReconnected(false);
      }, 3500);
    };

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleRetry = () => {
    setIsReconnecting(true);
    setTimeout(() => {
      if (navigator.onLine) {
        setIsOffline(false);
        setJustReconnected(true);
        window.location.reload();
      } else {
        setIsReconnecting(false);
      }
    }, 800);
  };

  if (justReconnected && !isOffline) {
    return (
      <div className="fixed top-3 inset-x-4 sm:inset-x-auto sm:right-6 z-[9999] max-w-sm mx-auto bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
        <span className="text-xs font-bold">You are back online!</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[9999] max-w-md mx-auto bg-[#14142B] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white truncate">No Internet Connection</h4>
          <p className="text-[11px] text-[#A0A3BD] truncate">Check your network to load new data.</p>
        </div>
      </div>

      <button
        onClick={handleRetry}
        disabled={isReconnecting}
        className="h-8 px-3 rounded-xl bg-primary hover:bg-[#e60060] text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
      >
        <RefreshCw className={`w-3 h-3 ${isReconnecting ? "animate-spin" : ""}`} />
        <span>{isReconnecting ? "Retrying..." : "Retry"}</span>
      </button>
    </div>
  );
}
