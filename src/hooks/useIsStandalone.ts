"use client";

import { useState, useEffect } from "react";

export function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // 1. W3C standard CSS display-mode media queries
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  ) {
    return true;
  }

  // 2. iOS Safari standalone flag
  if ("standalone" in window.navigator && (window.navigator as any).standalone === true) {
    return true;
  }

  // 3. Android TWA / Bubblewrap referrer
  if (
    typeof document !== "undefined" &&
    document.referrer &&
    document.referrer.startsWith("android-app://")
  ) {
    try {
      sessionStorage.setItem("is_installed_app", "true");
    } catch {}
    return true;
  }

  // 4. Session memory from earlier app launch
  try {
    if (sessionStorage.getItem("is_installed_app") === "true") return true;
  } catch {}

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
        sessionStorage.setItem("is_installed_app", "true");
      } catch {}
      return true;
    }
  }

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

    mediaStandalone.addEventListener?.("change", update);
    mediaFullscreen.addEventListener?.("change", update);

    return () => {
      mediaStandalone.removeEventListener?.("change", update);
      mediaFullscreen.removeEventListener?.("change", update);
    };
  }, []);

  return isStandalone;
}
