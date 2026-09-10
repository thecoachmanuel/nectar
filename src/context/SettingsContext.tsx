"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { useSettingsStore, getHeaderLogo, getFooterLogo } from "@/store/useSettingsStore";
import { useSettingStore } from "@/store/useSettingStore";

export interface SettingsContextType {
  settings: Record<string, any>;
  headerLogo: string;
  footerLogo: string;
  themeColor: string;
  themeSecondaryColor: string;
  themeTertiaryColor: string;
  siteTitle: string;
  updateSettings: (newSettings: Record<string, any>) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({
  children,
  initialSettings = {},
}: {
  children: React.ReactNode;
  initialSettings?: Record<string, any>;
}) {
  const [settings, setSettings] = useState<Record<string, any>>(initialSettings);

  // Synchronously seed global bootstrap object & Zustand stores during render
  const seeded = useRef(false);
  if (!seeded.current && initialSettings && Object.keys(initialSettings).length > 0) {
    if (typeof window !== "undefined") {
      (window as any).__INITIAL_SETTINGS__ = {
        ...((window as any).__INITIAL_SETTINGS__ || {}),
        ...initialSettings,
      };
    }
    useSettingsStore.getState().setAllSettings(initialSettings);
    seeded.current = true;
  }

  // Derive logos directly from current settings
  const headerLogo = useMemo(() => {
    return getHeaderLogo(settings);
  }, [settings]);

  const footerLogo = useMemo(() => {
    return getFooterLogo(settings);
  }, [settings]);

  const themeColor = useMemo(() => {
    return settings.theme_primary_color || "#ff006b";
  }, [settings]);

  const themeSecondaryColor = useMemo(() => {
    return settings.theme_secondary_color || "#1E293B";
  }, [settings]);

  const themeTertiaryColor = useMemo(() => {
    return settings.theme_tertiary_color || "#FF6B00";
  }, [settings]);

  const siteTitle = useMemo(() => {
    return settings.site_title || settings.company_name || "Errandshop";
  }, [settings]);

  // Synchronize when settings are updated from admin or events
  useEffect(() => {
    const handleUpdate = (event: any) => {
      const data = event.detail;
      if (data && typeof data === "object") {
        setSettings((prev) => ({ ...prev, ...data }));
        useSettingsStore.getState().setAllSettings(data);
        
        // Also sync useSettingStore
        const settingStoreUpdates: any = {};
        if (data.theme_logo || data.site_logo) {
          settingStoreUpdates.logoUrl = normalizeImageUrl(data.theme_logo || data.site_logo);
        }
        if (data.theme_footer_logo || data.site_footer_logo) {
          settingStoreUpdates.footerLogoUrl = normalizeImageUrl(data.theme_footer_logo || data.site_footer_logo);
        }
        if (data.theme_primary_color) {
          settingStoreUpdates.themeColor = data.theme_primary_color;
        }
        if (data.theme_secondary_color) {
          settingStoreUpdates.themeSecondaryColor = data.theme_secondary_color;
        }
        if (data.theme_tertiary_color) {
          settingStoreUpdates.themeTertiaryColor = data.theme_tertiary_color;
        }
        if (data.site_title || data.company_name) {
          settingStoreUpdates.siteName = data.site_title || data.company_name;
        }
        if (Object.keys(settingStoreUpdates).length > 0) {
          useSettingStore.setState(settingStoreUpdates);
        }
      }
    };

    window.addEventListener("errandshop:settings-updated", handleUpdate);
    window.addEventListener("nectar:settings-updated", handleUpdate);

    return () => {
      window.removeEventListener("errandshop:settings-updated", handleUpdate);
      window.removeEventListener("nectar:settings-updated", handleUpdate);
    };
  }, []);

  const updateSettings = (newSettings: Record<string, any>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    useSettingsStore.getState().setAllSettings(newSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        headerLogo,
        footerLogo,
        themeColor,
        themeSecondaryColor,
        themeTertiaryColor,
        siteTitle,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    const zustandSettings = useSettingsStore.getState().settings;
    return {
      settings: zustandSettings,
      headerLogo: getHeaderLogo(zustandSettings),
      footerLogo: getFooterLogo(zustandSettings),
      themeColor: zustandSettings?.theme_primary_color || "#ff006b",
      themeSecondaryColor: zustandSettings?.theme_secondary_color || "#1E293B",
      themeTertiaryColor: zustandSettings?.theme_tertiary_color || "#FF6B00",
      siteTitle: zustandSettings?.site_title || zustandSettings?.company_name || "Errandshop",
      updateSettings: () => {},
    };
  }
  return context;
}
