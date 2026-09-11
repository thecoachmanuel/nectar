import { create } from "zustand";

export interface AdminBadgeCounts {
  orders: number;
  onlineOrders: number;
  posOrders: number;
  supportChat: number;
  whatsappChat: number;
  contactMessages: number;
}

interface AdminBadgeStore {
  counts: AdminBadgeCounts;
  loading: boolean;
  setCounts: (counts: Partial<AdminBadgeCounts>) => void;
  fetchCounts: () => Promise<AdminBadgeCounts | null>;
}

export const useAdminBadgeStore = create<AdminBadgeStore>((set) => ({
  counts: {
    orders: 0,
    onlineOrders: 0,
    posOrders: 0,
    supportChat: 0,
    whatsappChat: 0,
    contactMessages: 0,
  },
  loading: false,
  setCounts: (newCounts) =>
    set((state) => ({
      counts: { ...state.counts, ...newCounts },
    })),
  fetchCounts: async () => {
    try {
      const res = await fetch("/api/admin/sidebar-counts", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (data.status && data.counts) {
        set({ counts: data.counts });
        return data.counts;
      }
    } catch {
      // Silent catch
    }
    return null;
  },
}));
