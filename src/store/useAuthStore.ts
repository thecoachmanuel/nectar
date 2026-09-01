import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "customer" | "chef" | "waiter" | "delivery_boy" | "store_manager";
  storeId: string | number;
  addresses?: {
    _id?: string;
    label?: string;
    address: string;
    apartment?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }[];
  permissions?: string[];
  image?: string;
  walletBalance?: number;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isGuest: boolean;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
  } | null;

  activeAdminStoreId: string;

  setAuth: (token: string, user: UserProfile) => void;
  setGuest: (info: { name: string; email: string; phone: string }) => void;
  updateUser: (partialUser: Partial<UserProfile>) => void;
  fetchUserProfile: () => Promise<UserProfile | null>;
  setActiveAdminStoreId: (storeId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isGuest: false,
      guestInfo: null,
      activeAdminStoreId: "0",

      setAuth: (token, user) => set({ token, user, isGuest: false, guestInfo: null }),

      setGuest: (info) => set({ isGuest: true, guestInfo: info, token: null, user: null }),

      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),

      fetchUserProfile: async () => {
        const state = get();
        if (!state.token) return null;
        try {
          const res = await fetch("/api/frontend/account/profile", {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
            cache: "no-store",
          });
          const data = await res.json();
          if (data.status && data.data) {
            set((s) => ({
              user: s.user ? { ...s.user, ...data.data } : data.data,
            }));
            return data.data as UserProfile;
          }
        } catch (err) {
          console.error("Failed to sync user profile", err);
        }
        return null;
      },

      setActiveAdminStoreId: (storeId) => set({ activeAdminStoreId: storeId }),

      logout: () => set({ token: null, user: null, isGuest: false, guestInfo: null, activeAdminStoreId: "0" }),
    }),
    {
      name: "nectar_auth_storage",
    }
  )
);
