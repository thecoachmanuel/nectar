import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { formatDate, formatTime, formatDateTime, NIGERIAN_TIMEZONE } from "@/lib/formatters";

export interface StoreInfo {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface SettingState {
  currencySymbol: string;
  currencyCode: string;
  siteName: string;
  isMultiStore: boolean; // Single vs Multi-store mode toggle
  defaultStoreId: string;
  activeStore: StoreInfo | null;

  menuViewMode: "grid" | "list"; // Grid vs List view mode
  themeColor: string; // Primary brand color
  themeSecondaryColor: string; // Secondary brand color
  themeTertiaryColor: string; // Accent / Tertiary brand color
  themeFooterColor: string; // Footer & foundation color
  themeDarkColor: string; // Dark blue / Action foundation color
  logoUrl: string; // Dynamic header logo URL
  footerLogoUrl: string; // Dynamic footer logo URL

  setCurrency: (symbol: string, code: string) => void;
  setMultiStore: (isMulti: boolean) => void;
  setDefaultStoreId: (storeId: string) => void;
  setActiveStore: (store: StoreInfo | null) => void;

  setMenuViewMode: (mode: "grid" | "list") => void;
  setThemeColor: (color: string) => void;
  setThemeSecondaryColor: (color: string) => void;
  setThemeTertiaryColor: (color: string) => void;
  setThemeFooterColor: (color: string) => void;
  setThemeDarkColor: (color: string) => void;
  setLogoUrl: (url: string) => void;
  setFooterLogoUrl: (url: string) => void;
  formatPrice: (amount: number | string) => string;
  timeZone: string;
  formatDate: (dateInput: Date | string | number | undefined | null) => string;
  formatTime: (dateInput: Date | string | number | undefined | null) => string;
  formatDateTime: (dateInput: Date | string | number | undefined | null) => string;
}

const getInitialLogo = () => {
  if (typeof window !== "undefined" && (window as any).__INITIAL_SETTINGS__) {
    const s = (window as any).__INITIAL_SETTINGS__;
    if (s.theme_logo || s.site_logo) {
      return normalizeImageUrl(s.theme_logo || s.site_logo);
    }
  }
  return "/images/theme/theme-logo.png?v=2";
};

const getInitialFooterLogo = () => {
  if (typeof window !== "undefined" && (window as any).__INITIAL_SETTINGS__) {
    const s = (window as any).__INITIAL_SETTINGS__;
    if (s.theme_footer_logo || s.site_footer_logo) {
      return normalizeImageUrl(s.theme_footer_logo || s.site_footer_logo);
    }
    if (s.theme_logo || s.site_logo) {
      return normalizeImageUrl(s.theme_logo || s.site_logo);
    }
  }
  return "/images/theme/theme-footer-logo.png";
};

export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      currencySymbol: "₦",
      currencyCode: "NGN",
      siteName: "Errandshop",
      isMultiStore: true,
      defaultStoreId: "",
      activeStore: null,

      menuViewMode: "grid",
      themeColor: "#2eb824",
      themeSecondaryColor: "#f70102",
      themeTertiaryColor: "#ff840a",
      themeFooterColor: "#2eb824",
      themeDarkColor: "#14142b",
      logoUrl: getInitialLogo(),
      footerLogoUrl: getInitialFooterLogo(),

      setCurrency: (currencySymbol, currencyCode) => set({ currencySymbol, currencyCode }),
      setMultiStore: (isMultiStore) => set({ isMultiStore }),
      setDefaultStoreId: (defaultStoreId) => set({ defaultStoreId }),
      setActiveStore: (activeStore) => set({ activeStore }),

      setMenuViewMode: (menuViewMode) => set({ menuViewMode }),
      setThemeColor: (themeColor) => set({ themeColor }),
      setThemeSecondaryColor: (themeSecondaryColor) => set({ themeSecondaryColor }),
      setThemeTertiaryColor: (themeTertiaryColor) => set({ themeTertiaryColor }),
      setThemeFooterColor: (themeFooterColor) => set({ themeFooterColor }),
      setThemeDarkColor: (themeDarkColor) => set({ themeDarkColor }),
      setLogoUrl: (logoUrl) => set({ logoUrl: normalizeImageUrl(logoUrl) }),
      setFooterLogoUrl: (footerLogoUrl) => set({ footerLogoUrl: normalizeImageUrl(footerLogoUrl) }),

      formatPrice: (amount: number | string) => {
        const symbol = get().currencySymbol || "₦";
        const num = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
        if (isNaN(num)) return `${symbol}0.00`;
        const val = num.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${symbol}${val}`;
      },

      timeZone: NIGERIAN_TIMEZONE,
      formatDate: (dateInput) => formatDate(dateInput),
      formatTime: (dateInput) => formatTime(dateInput),
      formatDateTime: (dateInput) => formatDateTime(dateInput),
    }),
    {
      name: "errandshop_settings_storage",
    }
  )
);

// Backward-compatible local storage migration
if (typeof window !== "undefined") {
  try {
    const legacySettings = localStorage.getItem("nectar_settings_storage");
    if (legacySettings && !localStorage.getItem("errandshop_settings_storage")) {
      localStorage.setItem("errandshop_settings_storage", legacySettings);
    }
  } catch {}
}

// Synchronize with broadcast updates from admin or other tabs
if (typeof window !== "undefined") {
  const handleSettingsUpdate = (event: any) => {
    const data = event.detail;
    if (data) {
      const updates: Partial<SettingState> = {};
      if (data.theme_logo || data.site_logo) {
        updates.logoUrl = normalizeImageUrl(data.theme_logo || data.site_logo);
      }
      if (data.theme_footer_logo || data.site_footer_logo) {
        updates.footerLogoUrl = normalizeImageUrl(data.theme_footer_logo || data.site_footer_logo);
      }
      if (data.theme_primary_color) {
        updates.themeColor = data.theme_primary_color;
      }
      if (data.theme_secondary_color) {
        updates.themeSecondaryColor = data.theme_secondary_color;
      }
      if (data.theme_tertiary_color) {
        updates.themeTertiaryColor = data.theme_tertiary_color;
      }
      if (data.theme_footer_color) {
        updates.themeFooterColor = data.theme_footer_color;
      }
      if (data.theme_dark_color) {
        updates.themeDarkColor = data.theme_dark_color;
      }
      if (data.site_title || data.company_name) {
        updates.siteName = data.site_title || data.company_name;
      }
      if (Object.keys(updates).length > 0) {
        useSettingStore.setState(updates);
      }
    }
  };

  window.addEventListener("errandshop:settings-updated", handleSettingsUpdate);
  window.addEventListener("nectar:settings-updated", handleSettingsUpdate);
}
