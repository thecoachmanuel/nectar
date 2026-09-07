"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function ClientThemeSetter() {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Always fetch latest settings silently on mount to keep storefront in sync with DB
    fetchSettings();
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
