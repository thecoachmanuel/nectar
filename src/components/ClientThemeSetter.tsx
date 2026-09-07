"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function ClientThemeSetter() {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Fetch fresh settings on mount — bypasses any cache (no-store on API)
    fetchSettings();

    // Cross-tab sync: when admin saves in another tab, localStorage changes and
    // this storage event fires here — re-fetch so frontend updates immediately
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nectar_app_settings_cache") {
        fetchSettings();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Also re-fetch when user switches back to this tab (e.g., from admin tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSettings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchSettings]);

  useEffect(() => {
    const color = settings.theme_primary_color;
    if (color) {
      document.documentElement.style.setProperty("--primary-hex", color);
      document.documentElement.style.setProperty("--primary-slate", color + "e6");
      document.documentElement.style.setProperty("--primary-light", color + "1a");
    }

    // Propagate logo URL globally so Sidebar/Navbar can pick it up reactively
    // without needing additional fetches. Stored on <html> as a data attribute
    // so it survives SSR hydration without a mismatch.
    const logoUrl = settings.theme_logo || "";
    document.documentElement.setAttribute("data-site-logo", logoUrl);
    // Dispatch a custom event so any component listening can update immediately
    window.dispatchEvent(new CustomEvent("siteLogoUpdated", { detail: { logoUrl } }));

    // Enforce Nectar app branding on page title
    const appTitle =
      settings.site_title ||
      settings.company_title ||
      "Nectar - Online Groceries Delivery & WhatsApp Ordering";
    if (
      typeof document !== "undefined" &&
      (document.title.toLowerCase().includes("foodappi") ||
        document.title.toLowerCase().includes("fast food") ||
        !document.title ||
        document.title === "Nectar")
    ) {
      document.title = appTitle;
    }
  }, [settings]);

  return null;
}
