"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function ClientThemeSetter() {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Fetch settings on mount to ensure we have the latest on client
    if (Object.keys(settings).length === 0) {
      fetchSettings();
    }
  }, [fetchSettings, settings]);

  useEffect(() => {
    const color = settings.theme_primary_color;
    if (color) {
      document.documentElement.style.setProperty("--primary-hex", color);
      document.documentElement.style.setProperty("--primary-slate", color + "e6");
      document.documentElement.style.setProperty("--primary-light", color + "1a");
    }
  }, [settings.theme_primary_color]);

  return null;
}
