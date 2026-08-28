import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "customer" | "chef" | "waiter" | "delivery_boy";
  branchId: string | number;
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

  setAuth: (token: string, user: UserProfile) => void;
  setGuest: (info: { name: string; email: string; phone: string }) => void;
  updateUser: (partialUser: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isGuest: false,
      guestInfo: null,

      setAuth: (token, user) => set({ token, user, isGuest: false, guestInfo: null }),

      setGuest: (info) => set({ isGuest: true, guestInfo: info, token: null, user: null }),

      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),

      logout: () => set({ token: null, user: null, isGuest: false, guestInfo: null }),
    }),
    {
      name: "foodappi_auth_storage",
    }
  )
);
