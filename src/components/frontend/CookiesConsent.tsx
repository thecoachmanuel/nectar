"use client";

import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export default function CookiesConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("foodappi_cookies_accepted");
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("foodappi_cookies_accepted", "true");
    setVisible(false);
  };

  const decline = () => {
    setVisible(false);
  };

  return (
    <div className={`cookie-paper fixed bottom-16 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-6 lg:max-w-sm z-50 transition-all duration-500 ease-linear ${visible ? "translate-y-0 opacity-100 visible" : "translate-y-full opacity-0 invisible"}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-[#eff0f6] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fff0f6" }}>
            <Cookie className="w-5 h-5" style={{ color: "#ff006b" }} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[#14142b] mb-1">We Use Cookies 🍪</h4>
            <p className="text-xs text-[#6e7191] leading-relaxed">
              We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={accept}
                className="flex-1 h-9 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ backgroundColor: "#ff006b" }}>
                Accept All
              </button>
              <button onClick={decline}
                className="h-9 px-4 rounded-xl text-xs font-medium text-[#6e7191] border border-[#e2e8f0] hover:bg-[#f7f7fc] transition-all">
                Decline
              </button>
            </div>
          </div>
          <button onClick={decline}
            className="w-6 h-6 rounded-full bg-[#f7f7fc] flex items-center justify-center text-[#a0a3bd] hover:text-[#ff006b] transition-all flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
