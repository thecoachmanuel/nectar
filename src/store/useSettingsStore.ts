import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { normalizeImageUrl } from '@/lib/imageUtils';

export interface SettingItem {
  key: string;
  group: string;
  payload: any;
}

interface SettingsState {
  settings: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  fetchSettings: (force?: boolean) => Promise<void>;
  updateSettings: (newSettings: SettingItem[]) => Promise<void>;
  setAllSettings: (settingsMap: Record<string, any>) => void;
}

// Read bootstrap settings injected into HTML from MongoDB during SSR (eliminates hydration flicker)
const getBootstrapSettings = (): Record<string, any> => {
  if (typeof window !== 'undefined' && (window as any).__INITIAL_SETTINGS__) {
    return (window as any).__INITIAL_SETTINGS__;
  }
  return {};
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: getBootstrapSettings(),
      isLoading: false,
      error: null,

      setAllSettings: (settingsMap: Record<string, any>) => {
        set((state: SettingsState) => ({
          settings: { ...state.settings, ...settingsMap },
        }));
      },

      fetchSettings: async (force = false) => {
        // If we already have settings and not forced, keep existing to avoid re-renders
        if (!force && Object.keys(get().settings).length > 0) {
          // fetch in background silently without turning on full-page loading spinner
        } else {
          set({ isLoading: true, error: null });
        }

        try {
          const res = await fetch('/api/settings', { cache: 'no-store' });
          const data = await res.json();
          
          if (data.success) {
            const settingsMap: Record<string, any> = {};
            data.data.forEach((item: any) => {
              settingsMap[item.key] = item.payload;
            });
            
            set((state: SettingsState) => ({ 
              settings: { ...state.settings, ...settingsMap }, 
              isLoading: false 
            }));

            // Sync with global bootstrap window object
            if (typeof window !== 'undefined') {
              (window as any).__INITIAL_SETTINGS__ = {
                ...((window as any).__INITIAL_SETTINGS__ || {}),
                ...settingsMap,
              };
            }
          } else {
            set({ error: data.message, isLoading: false });
          }
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      updateSettings: async (newSettings: SettingItem[]) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: newSettings }),
          });
          const data = await res.json();
          
          if (data.success) {
            // Optimistically update local state immediately
            const currentSettings = get().settings;
            const updatedSettings = { ...currentSettings };
            newSettings.forEach(setting => {
              updatedSettings[setting.key] = setting.payload;
            });
            
            set({ settings: updatedSettings, isLoading: false });

            // Broadcast update event so all open pages/tabs and components update without page reload
            if (typeof window !== 'undefined') {
              (window as any).__INITIAL_SETTINGS__ = updatedSettings;
              window.dispatchEvent(
                new CustomEvent('errandshop:settings-updated', { detail: updatedSettings })
              );
            }
          } else {
            set({ error: data.message, isLoading: false });
            throw new Error(data.message);
          }
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      }
    }),
    {
      name: 'errandshop_app_settings_cache', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }), // Only cache settings map
      merge: (persistedState: any, currentState: any) => {
        const persisted = (persistedState as any)?.settings || {};
        const current = (currentState as any)?.settings || {};
        return {
          ...currentState,
          ...persistedState,
          settings: {
            ...persisted,
            ...current, // Fresh settings from server take precedence
          },
        };
      },
    }
  )
);

// Listen for settings-updated events across components or other tabs with legacy fallback
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem("errandshop_app_settings_cache") && localStorage.getItem("nectar_app_settings_cache")) {
      localStorage.setItem("errandshop_app_settings_cache", localStorage.getItem("nectar_app_settings_cache")!);
    }
  } catch {}

  const handleUpdate = (event: any) => {
    if (event.detail) {
      useSettingsStore.getState().setAllSettings(event.detail);
    }
  };
  window.addEventListener('errandshop:settings-updated', handleUpdate);
  window.addEventListener('nectar:settings-updated', handleUpdate);
}

/**
 * Helper to get the active header/navbar logo URL with fallback
 */
export function getHeaderLogo(settings?: Record<string, any>): string {
  const custom = settings?.theme_logo || settings?.site_logo;
  return normalizeImageUrl(custom, '/images/theme/theme-logo.png');
}

/**
 * Helper to get the active footer logo URL with fallback to default footer logo (theme-footer-logo.png)
 */
export function getFooterLogo(settings?: Record<string, any>): string {
  const footerCustom = settings?.theme_footer_logo || settings?.site_footer_logo;
  if (footerCustom && typeof footerCustom === "string" && footerCustom.trim() !== "") {
    return normalizeImageUrl(footerCustom);
  }
  return '/images/theme/theme-footer-logo.png';
}

/**
 * Helper to get the active favicon / app icon URL with fallback
 */
export function getFaviconUrl(settings?: Record<string, any>): string {
  const custom = settings?.theme_favicon || settings?.site_favicon;
  return normalizeImageUrl(custom, '/images/theme/theme-favicon-logo.png?v=4');
}

/**
 * Helper to get the active WhatsApp phone number with fallback to default (2348144611443)
 */
export function getWhatsAppNumber(settings?: Record<string, any>): string {
  const custom =
    settings?.pay_whatsapp_phone_number ||
    settings?.admin_notification_whatsapp_number ||
    settings?.wa_admin_notification_phone ||
    settings?.whatsapp_number;

  if (custom && typeof custom === "string" && custom.trim() !== "") {
    let clean = custom.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = "234" + clean.slice(1);
    if (clean.length >= 8) return clean;
  }
  return "2348144611443";
}

/**
 * Helper to generate a direct wa.me link with fallback number (2348144611443)
 */
export function getWhatsAppLink(settings?: Record<string, any>, message = ""): string {
  const phone = getWhatsAppNumber(settings);
  return message
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${phone}`;
}

/**
 * The hardcoded fallback when admin hasn't configured a market order minimum.
 * This value is used at every layer — client and server — so it is always ₦20,000
 * even if the setting is cleared or never saved.
 */
export const MARKET_ORDER_MIN_DEFAULT = 20000;

/**
 * Helper to get the minimum cart total required when a market item is in the cart.
 * Falls back to ₦20,000 if the admin hasn't set market_order_min_amount,
 * or if the saved value is 0, negative, or not a valid number.
 *
 * Usage (client): getMarketOrderMin(settings)
 * Usage (server): getMarketOrderMin(settingsMap)
 */
export function getMarketOrderMin(settings?: Record<string, any>): number {
  const val = Number(settings?.market_order_min_amount);
  return val && val > 0 ? val : MARKET_ORDER_MIN_DEFAULT;
}
