"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#EFF0F6] shadow-sm max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#FFF0F6] text-primary flex items-center justify-center mx-auto relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <WifiOff className="w-10 h-10 relative z-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#14142B]">No Internet Connection</h1>
          <p className="text-sm text-[#6E7191] leading-relaxed">
            We couldn't connect to our servers. Please verify your internet connection and tap retry below.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-[#e60060] text-white text-sm font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Reconnecting..." : "Retry Connection"}</span>
          </button>

          <Link
            href="/"
            className="w-full h-11 rounded-2xl bg-[#F7F7FC] hover:bg-[#eff0f6] text-[#14142B] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
