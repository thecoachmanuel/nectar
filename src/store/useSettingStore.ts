import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BranchInfo {
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
  isMultiBranch: boolean; // Single vs Multi-branch mode toggle
  defaultBranchId: string;
  activeBranch: BranchInfo | null;
  activeFoodType: "all" | "veg" | "non_veg"; // Veg vs Non-Veg filter
  menuViewMode: "grid" | "list"; // Grid vs List view mode
  themeColor: string; // Primary brand color

  setCurrency: (symbol: string, code: string) => void;
  setMultiBranch: (isMulti: boolean) => void;
  setDefaultBranchId: (branchId: string) => void;
  setActiveBranch: (branch: BranchInfo | null) => void;
  setActiveFoodType: (type: "all" | "veg" | "non_veg") => void;
  setMenuViewMode: (mode: "grid" | "list") => void;
  setThemeColor: (color: string) => void;
  formatPrice: (amount: number) => string;
}

export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      currencySymbol: "$",
      currencyCode: "USD",
      siteName: "FoodAppi",
      isMultiBranch: true,
      defaultBranchId: "",
      activeBranch: null,
      activeFoodType: "all",
      menuViewMode: "grid",
      themeColor: "#FF4D4F",

      setCurrency: (currencySymbol, currencyCode) => set({ currencySymbol, currencyCode }),
      setMultiBranch: (isMultiBranch) => set({ isMultiBranch }),
      setDefaultBranchId: (defaultBranchId) => set({ defaultBranchId }),
      setActiveBranch: (activeBranch) => set({ activeBranch }),
      setActiveFoodType: (activeFoodType) => set({ activeFoodType }),
      setMenuViewMode: (menuViewMode) => set({ menuViewMode }),
      setThemeColor: (themeColor) => set({ themeColor }),

      formatPrice: (amount: number) => {
        const symbol = get().currencySymbol || "$";
        const val = (amount || 0).toFixed(2);
        return `${symbol}${val}`;
      },
    }),
    {
      name: "foodappi_settings_storage",
    }
  )
);
