"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSettingStore } from "@/store/useSettingStore";
import { normalizeImageUrl } from "@/lib/imageUtils";

interface ClientThemeSetterProps {
  initialSettings?: Record<string, any>;
}

export default function ClientThemeSetter({ initialSettings }: ClientThemeSetterProps) {
  const { settings, fetchSettings, setAllSettings } = useSettingsStore();
  const { setThemeColor, siteName } = useSettingStore();
  const bootstrapped = useRef(false);

  // Synchronize initial settings from Server Component before first effect
  if (!bootstrapped.current && initialSettings && Object.keys(initialSettings).length > 0) {
    if (typeof window !== "undefined") {
      (window as any).__INITIAL_SETTINGS__ = {
        ...((window as any).__INITIAL_SETTINGS__ || {}),
        ...initialSettings,
      };
    }
    setAllSettings(initialSettings);
    bootstrapped.current = true;
  }

  useEffect(() => {
    // Silently refresh settings on mount from MongoDB to guarantee freshest data
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const color = settings.theme_primary_color;
    if (color) {
      document.documentElement.style.setProperty("--primary-hex", color);
      document.documentElement.style.setProperty("--primary-slate", color + "e6");
      document.documentElement.style.setProperty("--primary-light", color + "1a");
      setThemeColor(color);
    }

    // Dynamic Favicon sync from MongoDB if available
    const customFavicon = settings.theme_favicon || settings.site_favicon;
    if (customFavicon) {
      const faviconUrl = normalizeImageUrl(customFavicon);
      const iconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (iconLink) {
        iconLink.href = faviconUrl;
      }
    }

    // Enforce brand page title
    const appTitle =
      settings.site_title ||
      settings.company_name ||
      settings.company_title ||
      "Errandshop - Online Groceries Delivery & WhatsApp Ordering";

    if (
      typeof document !== "undefined" &&
      (document.title.toLowerCase().includes("foodappi") ||
        document.title.toLowerCase().includes("fast food") ||
        !document.title ||
        document.title === "Errandshop")
    ) {
      document.title = appTitle;
    }
  }, [settings, setThemeColor]);

  return null;
}
