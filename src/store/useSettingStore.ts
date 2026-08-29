import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  setCurrency: (symbol: string, code: string) => void;
  setMultiStore: (isMulti: boolean) => void;
  setDefaultStoreId: (storeId: string) => void;
  setActiveStore: (store: StoreInfo | null) => void;

  setMenuViewMode: (mode: "grid" | "list") => void;
  setThemeColor: (color: string) => void;
  formatPrice: (amount: number) => string;
}

export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      currencySymbol: "₦",
      currencyCode: "NGN",
      siteName: "Nectar",
      isMultiStore: true,
      defaultStoreId: "",
      activeStore: null,

      menuViewMode: "grid",
      themeColor: "#FF4D4F",

      setCurrency: (currencySymbol, currencyCode) => set({ currencySymbol, currencyCode }),
      setMultiStore: (isMultiStore) => set({ isMultiStore }),
      setDefaultStoreId: (defaultStoreId) => set({ defaultStoreId }),
      setActiveStore: (activeStore) => set({ activeStore }),

      setMenuViewMode: (menuViewMode) => set({ menuViewMode }),
      setThemeColor: (themeColor) => set({ themeColor }),

      formatPrice: (amount: number) => {
        const symbol = get().currencySymbol || "₦";
        const val = (amount || 0).toFixed(2);
        return `${symbol}${val}`;
      },
    }),
    {
      name: "foodappi_settings_storage",
    }
  )
);
