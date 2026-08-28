import { create } from 'zustand';

export interface SettingItem {
  key: string;
  group: string;
  payload: any;
}

interface SettingsState {
  settings: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: SettingItem[]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      
      if (data.success) {
        // Convert array of settings to a key-value map for easier UI access
        const settingsMap: Record<string, any> = {};
        data.data.forEach((item: any) => {
          settingsMap[item.key] = item.payload;
        });
        
        set({ settings: settingsMap, isLoading: false });
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
        // Optimistically update local state
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings };
        newSettings.forEach(setting => {
          updatedSettings[setting.key] = setting.payload;
        });
        
        set({ settings: updatedSettings, isLoading: false });
      } else {
        set({ error: data.message, isLoading: false });
        throw new Error(data.message);
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));
