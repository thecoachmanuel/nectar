"use client";

import { useState, useEffect } from "react";

export function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Check if already marked on html tag
  if (
    document.documentElement.getAttribute("data-standalone") === "true" ||
    document.documentElement.classList.contains("standalone-mode")
  ) {
    return true;
  }

  // 2. W3C standard CSS display-mode media queries
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches
  ) {
    try {
      localStorage.setItem("is_installed_app", "true");
      sessionStorage.setItem("is_installed_app", "true");
    } catch {}
    return true;
  }

  // 3. iOS Safari standalone flag
  if ("standalone" in window.navigator && (window.navigator as any).standalone === true) {
    try {
      localStorage.setItem("is_installed_app", "true");
      sessionStorage.setItem("is_installed_app", "true");
    } catch {}
    return true;
  }

  // 4. Android TWA / Bubblewrap referrer
  if (
    typeof document !== "undefined" &&
    document.referrer &&
    document.referrer.startsWith("android-app://")
  ) {
    try {
      localStorage.setItem("is_installed_app", "true");
      sessionStorage.setItem("is_installed_app", "true");
    } catch {}
    return true;
  }

  // 5. Query parameters from manifest start_url or shortcuts
  if (typeof window !== "undefined" && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("source") === "pwa" ||
      params.get("utm_source") === "pwa" ||
      params.get("utm_source") === "homescreen" ||
      params.get("mode") === "standalone" ||
      params.get("twa") === "1"
    ) {
      try {
        localStorage.setItem("is_installed_app", "true");
        sessionStorage.setItem("is_installed_app", "true");
      } catch {}
      return true;
    }
  }

  // 6. User Agent check for Android TWA or WebView wrapper
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    const ua = navigator.userAgent;
    if (ua.includes("; wv)") || ua.includes("com.errandshop.app")) {
      try {
        localStorage.setItem("is_installed_app", "true");
        sessionStorage.setItem("is_installed_app", "true");
      } catch {}
      return true;
    }
  }

  // 7. Persistent storage memory from earlier app launch
  try {
    if (
      localStorage.getItem("is_installed_app") === "true" ||
      sessionStorage.getItem("is_installed_app") === "true"
    ) {
      return true;
    }
  } catch {}

  return false;
}

export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const update = () => {
      const standalone = checkIsStandalone();
      setIsStandalone(standalone);
      if (standalone) {
        document.documentElement.setAttribute("data-standalone", "true");
        document.documentElement.classList.add("standalone-mode");
      }
    };

    update();

    const mediaStandalone = window.matchMedia("(display-mode: standalone)");
    const mediaFullscreen = window.matchMedia("(display-mode: fullscreen)");
    const mediaMinimal = window.matchMedia("(display-mode: minimal-ui)");

    mediaStandalone.addEventListener?.("change", update);
    mediaFullscreen.addEventListener?.("change", update);
    mediaMinimal.addEventListener?.("change", update);

    return () => {
      mediaStandalone.removeEventListener?.("change", update);
      mediaFullscreen.removeEventListener?.("change", update);
      mediaMinimal.removeEventListener?.("change", update);
    };
  }, []);

  return isStandalone;
}
