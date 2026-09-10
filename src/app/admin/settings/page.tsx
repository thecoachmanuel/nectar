"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Globe, 
  Mail, 
  CreditCard,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  PaintBucket,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Check,
  MapPin,
  ChevronDown,
  ChevronUp,
  Palette,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { useSettingsStore, SettingItem } from "@/store/useSettingsStore";
import { toast } from "sonner";
import { normalizeImageUrl } from "@/lib/imageUtils";
import MapComponent from "@/components/frontend/MapComponent";

const COLOR_PRESETS = [
  {
    name: "Errandshop Signature",
    primary: "#008BBA",
    secondary: "#1E293B",
    accent: "#FF6B00",
    desc: "Teal CTA, slate foundation, vivid orange accents",
  },
  {
    name: "Fresh Organic Grocer",
    primary: "#059669",
    secondary: "#064E3B",
    accent: "#F59E0B",
    desc: "Emerald CTA, forest structure, amber discounts",
  },
  {
    name: "Berry & Charcoal",
    primary: "#FF006B",
    secondary: "#1E1B4B",
    accent: "#FF9900",
    desc: "Vibrant berry CTA, indigo structure, golden accents",
  },
  {
    name: "Citrus Market",
    primary: "#0284C7",
    secondary: "#0F172A",
    accent: "#EA580C",
    desc: "Ocean blue CTA, midnight navy, tangerine spark",
  },
  {
    name: "Earthy Harvest",
    primary: "#16A34A",
    secondary: "#374151",
    accent: "#D97706",
    desc: "Botanical green CTA, charcoal structure, warm bronze",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Company");
  
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  
  // Local state to hold form changes before saving
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadingHeaderLogo, setUploadingHeaderLogo] = useState(false);
  const [uploadingFooterLogo, setUploadingFooterLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Store-wide address state
  const [swAddressSuggestions, setSwAddressSuggestions] = useState<any[]>([]);
  const [swIsSearchingAddress, setSwIsSearchingAddress] = useState(false);
  const [swShowDropdown, setSwShowDropdown] = useState(false);
  const [swShowMap, setSwShowMap] = useState(false);
  const [swFetchingCoords, setSwFetchingCoords] = useState(false);
  const swDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const swContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (swContainerRef.current && !swContainerRef.current.contains(e.target as Node)) {
        setSwShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoUpload = async (file: File, fieldKey: "theme_logo" | "theme_footer_logo" | "theme_favicon") => {
    if (fieldKey === "theme_favicon") setUploadingFavicon(true);
    else if (fieldKey === "theme_footer_logo") setUploadingFooterLogo(true);
    else setUploadingHeaderLogo(true);

    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ 
          ...prev, 
          [fieldKey]: data.url,
          ...(fieldKey === "theme_logo" 
            ? { site_logo: data.url } 
            : fieldKey === "theme_footer_logo" 
            ? { site_footer_logo: data.url } 
            : { site_favicon: data.url })
        }));
        toast.success(
          fieldKey === "theme_favicon"
            ? "Site favicon uploaded! Click 'Save Changes' to update sitewide."
            : fieldKey === "theme_footer_logo" 
            ? "Footer logo uploaded! Click 'Save Changes' to update sitewide." 
            : "Navbar logo uploaded! Click 'Save Changes' to update sitewide."
        );
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (err: any) {
      console.error("Upload error", err);
      toast.error("Upload failed: " + err.message);
    } finally {
      if (fieldKey === "theme_favicon") setUploadingFavicon(false);
      else if (fieldKey === "theme_footer_logo") setUploadingFooterLogo(false);
      else setUploadingHeaderLogo(false);
    }
  };

  const handleRemoveLogo = (fieldKey: "theme_logo" | "theme_footer_logo" | "theme_favicon") => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: "",
      ...(fieldKey === "theme_logo" 
        ? { site_logo: "" } 
        : fieldKey === "theme_footer_logo" 
        ? { site_footer_logo: "" } 
        : { site_favicon: "" })
    }));
    toast.info(
      fieldKey === "theme_favicon"
        ? "Site favicon reset to default. Click 'Save Changes' to apply."
        : fieldKey === "theme_footer_logo"
        ? "Footer logo reset to fallback. Click 'Save Changes' to apply."
        : "Navbar logo reset to default. Click 'Save Changes' to apply."
    );
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      const initialForm = { ...settings };
      if (settings.company_address && !initialForm.store_wide_address) {
        initialForm.store_wide_address = settings.company_address;
      }
      if (settings.company_latitude && !initialForm.store_wide_latitude) {
        initialForm.store_wide_latitude = settings.company_latitude;
      }
      if (settings.company_longitude && !initialForm.store_wide_longitude) {
        initialForm.store_wide_longitude = settings.company_longitude;
      }
      if (settings.admin_notification_whatsapp_number || settings.wa_admin_notification_phone) {
        initialForm.admin_notification_whatsapp_number =
          settings.admin_notification_whatsapp_number || settings.wa_admin_notification_phone || "";
      }
      if (settings.wa_bank_account) {
        const bankObj = typeof settings.wa_bank_account === "string" ? JSON.parse(settings.wa_bank_account) : settings.wa_bank_account;
        initialForm.wa_bank_name = bankObj.bankName || initialForm.wa_bank_name || "";
        initialForm.wa_account_number = bankObj.accountNumber || initialForm.wa_account_number || "";
        initialForm.wa_account_name = bankObj.accountName || initialForm.wa_account_name || "";
      }
      setFormData(initialForm);
    }
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSwAddressChange = (newAddress: string) => {
    handleChange("store_wide_address", newAddress);
    if (swDebounceRef.current) clearTimeout(swDebounceRef.current);
    const trimmed = newAddress.trim();
    if (!trimmed || trimmed.length < 3) {
      setSwAddressSuggestions([]);
      setSwShowDropdown(false);
      setSwIsSearchingAddress(false);
      return;
    }
    setSwIsSearchingAddress(true);
    swDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSwAddressSuggestions(data);
            setSwShowDropdown(true);
            const top = data[0];
            if (top?.lat && top?.lon && (!formData.store_wide_latitude || Number(formData.store_wide_latitude) === 0)) {
              setFormData(prev => ({
                ...prev,
                store_wide_latitude: parseFloat(top.lat).toFixed(6),
                store_wide_longitude: parseFloat(top.lon).toFixed(6),
              }));
            }
          } else {
            setSwAddressSuggestions([]);
            setSwShowDropdown(false);
          }
        }
      } catch {} finally {
        setSwIsSearchingAddress(false);
      }
    }, 450);
  };

  const handleSelectSwSuggestion = (item: any) => {
    const lat = parseFloat(item.lat).toFixed(6);
    const lng = parseFloat(item.lon).toFixed(6);
    const addr = item.address || {};
    const city = addr.city || addr.town || addr.municipality || addr.suburb || addr.county || "";
    const state = addr.state || "";
    const zipCode = addr.postcode || "";

    setFormData(prev => ({
      ...prev,
      store_wide_address: item.display_name,
      store_wide_latitude: lat,
      store_wide_longitude: lng,
      ...(city && !prev.store_wide_city ? { store_wide_city: city } : {}),
      ...(state && !prev.store_wide_state ? { store_wide_state: state } : {}),
      ...(zipCode && !prev.store_wide_zipCode ? { store_wide_zipCode: zipCode } : {}),
    }));
    setSwShowDropdown(false);
    toast.success("Store-wide address and GPS coordinates set!");
  };

  const geocodeSwAddress = async () => {
    const q = (formData.store_wide_address || "").trim();
    if (!q) {
      toast.error("Please enter an address first");
      return;
    }
    setSwFetchingCoords(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const lat = parseFloat(data[0].lat).toFixed(6);
          const lng = parseFloat(data[0].lon).toFixed(6);
          const addr = data[0].address || {};
          const city = addr.city || addr.town || addr.municipality || addr.suburb || addr.county || "";
          const state = addr.state || "";
          const zipCode = addr.postcode || "";

          setFormData(prev => ({
            ...prev,
            store_wide_latitude: lat,
            store_wide_longitude: lng,
            ...(city && !prev.store_wide_city ? { store_wide_city: city } : {}),
            ...(state && !prev.store_wide_state ? { store_wide_state: state } : {}),
            ...(zipCode && !prev.store_wide_zipCode ? { store_wide_zipCode: zipCode } : {}),
          }));
          toast.success("GPS coordinates auto-detected!");
          return;
        }
      }
      toast.info("Could not auto-detect exact GPS coordinates. You can optionally pin on map.");
    } catch {} finally {
      setSwFetchingCoords(false);
    }
  };

  const handleSwLocationSelect = (lat: number, lng: number, addr: string) => {
    setFormData(prev => ({
      ...prev,
      store_wide_latitude: lat.toFixed(6),
      store_wide_longitude: lng.toFixed(6),
      ...(addr && !prev.store_wide_address ? { store_wide_address: addr } : {})
    }));
  };

  const handleSave = async () => {
    try {
      // Map all keys in formData to settings with correct groups
      const allSettings: SettingItem[] = Object.keys(formData).map(key => {
        let group = "Company";
        if (key.startsWith("site_") || key.startsWith("receipt_")) group = "Site";
        if (key.startsWith("mail_")) group = "Mail";
        if (key.startsWith("pay_")) group = "Payment Gateway";
        if (key.startsWith("sms_")) group = "SMS Gateway";
        if (key.startsWith("push_")) group = "Push Notification";
        if (
          key.startsWith("wa_") || 
          key === "admin_notification_whatsapp_number" || 
          key === "wa_admin_notification_phone"
        ) group = "WhatsApp Bot";
        if (key.startsWith("theme_")) group = "Theme";
        if (key.startsWith("role_")) group = "Roles & Permissions";
        if ([
          "store_wide_address",
          "store_wide_city",
          "store_wide_state",
          "store_wide_zipCode",
          "store_wide_latitude",
          "store_wide_longitude",
          "fixedDeliveryFee",
          "baseDeliveryFee",
          "feePerKm",
          "multiStoreExtraFee",
          "freeDeliveryThreshold",
          "orderValueFeePercent",
          "largeOrderThreshold",
          "largeOrderFeePercent",
          "takeaway_enabled"
        ].includes(key)) group = "Delivery";
        return { key, group, payload: formData[key] };
      });

      // Only send settings relevant to the currently active tab
      let tabSettings = allSettings.filter(s => s.group === activeTab);
      
      // For Company tab, also include non-prefixed keys
      if (activeTab === "Company") {
        tabSettings = allSettings.filter(s => s.group === "Company" || (!s.key.startsWith("site_") && !s.key.startsWith("mail_") && !s.key.startsWith("pay_") && !s.key.startsWith("sms_") && !s.key.startsWith("push_") && !s.key.startsWith("wa_") && !s.key.startsWith("theme_") && !s.key.startsWith("role_") && s.key !== "admin_notification_whatsapp_number" && s.key !== "wa_admin_notification_phone"));
      }

      // Sync store-wide address and company address bidirectionally
      if (activeTab === "Delivery") {
        if (formData.store_wide_address) {
          tabSettings.push({ key: "company_address", group: "Company", payload: formData.store_wide_address });
          tabSettings.push({ key: "contactAddress", group: "Company", payload: formData.store_wide_address });
        }
        if (formData.store_wide_latitude) {
          tabSettings.push({ key: "company_latitude", group: "Company", payload: formData.store_wide_latitude });
        }
        if (formData.store_wide_longitude) {
          tabSettings.push({ key: "company_longitude", group: "Company", payload: formData.store_wide_longitude });
        }
      }

      // Also sync alias keys for company info
      if (activeTab === "Company") {
        if (formData.company_email) tabSettings.push({ key: "contactEmail", group: "Company", payload: formData.company_email });
        if (formData.company_phone) tabSettings.push({ key: "contactPhone", group: "Company", payload: formData.company_phone });
        if (formData.company_address !== undefined) {
          tabSettings.push({ key: "contactAddress", group: "Company", payload: formData.company_address });
          if (!formData.store_wide_address) {
            tabSettings.push({ key: "store_wide_address", group: "Delivery", payload: formData.company_address });
          }
        }
        if (formData.company_latitude && !formData.store_wide_latitude) {
          tabSettings.push({ key: "store_wide_latitude", group: "Delivery", payload: formData.company_latitude });
        }
        if (formData.company_longitude && !formData.store_wide_longitude) {
          tabSettings.push({ key: "store_wide_longitude", group: "Delivery", payload: formData.company_longitude });
        }
      }

      // Sync combined bank account payload and admin notification phone for WhatsApp Bot
      if (activeTab === "WhatsApp Bot") {
        if (formData.admin_notification_whatsapp_number !== undefined) {
          const cleanPhone = String(formData.admin_notification_whatsapp_number).trim();
          tabSettings = tabSettings.filter(s => s.key !== "admin_notification_whatsapp_number" && s.key !== "wa_admin_notification_phone");
          tabSettings.push({
            key: "admin_notification_whatsapp_number",
            group: "WhatsApp Bot",
            payload: cleanPhone,
          });
          tabSettings.push({
            key: "wa_admin_notification_phone",
            group: "WhatsApp Bot",
            payload: cleanPhone,
          });
        }

        tabSettings.push({
          key: "wa_bank_account",
          group: "WhatsApp Bot",
          payload: {
            bankName: formData.wa_bank_name || "",
            accountNumber: formData.wa_account_number || "",
            accountName: formData.wa_account_name || "",
          },
        });
      }

      // Sync logo and favicon settings across Theme and Site tabs so MongoDB has both keys
      if (activeTab === "Theme" || activeTab === "Site") {
        if (formData.theme_logo !== undefined) {
          tabSettings = tabSettings.filter(s => s.key !== "theme_logo" && s.key !== "site_logo");
          tabSettings.push({ key: "theme_logo", group: "Theme", payload: formData.theme_logo });
          tabSettings.push({ key: "site_logo", group: "Site", payload: formData.theme_logo });
        }
        if (formData.theme_footer_logo !== undefined) {
          tabSettings = tabSettings.filter(s => s.key !== "theme_footer_logo" && s.key !== "site_footer_logo");
          tabSettings.push({ key: "theme_footer_logo", group: "Theme", payload: formData.theme_footer_logo });
          tabSettings.push({ key: "site_footer_logo", group: "Site", payload: formData.theme_footer_logo });
        }
        if (formData.theme_favicon !== undefined) {
          tabSettings = tabSettings.filter(s => s.key !== "theme_favicon" && s.key !== "site_favicon");
          tabSettings.push({ key: "theme_favicon", group: "Theme", payload: formData.theme_favicon });
          tabSettings.push({ key: "site_favicon", group: "Site", payload: formData.theme_favicon });
        }
      }

      if (tabSettings.length === 0) {
        toast.info("No settings to save for this tab.");
        return;
      }

      await updateSettings(tabSettings);
      toast.success(`${activeTab} Settings saved successfully!`);

      // Real-time broadcast so active tabs, navbar and footer update instantly
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("errandshop:settings-updated", { detail: formData })
        );
      }
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const settingsMenu = [
    { name: "Company", icon: Building2 },
    { name: "Site", icon: Globe },
    { name: "Mail", icon: Mail },
    { name: "Delivery", icon: Smartphone },
    { name: "Payment Gateway", icon: CreditCard },
    { name: "WhatsApp Bot", icon: MessageSquare },
    { name: "SMS Gateway", icon: MessageSquare },
    { name: "Push Notification", icon: Smartphone },
    { name: "Roles & Permissions", icon: ShieldCheck },
    { name: "Theme", icon: PaintBucket },
  ];

  return (
    <div className="pb-16 flex flex-col lg:flex-row gap-6">
      
      {/* Settings Menu Sidebar */}
      <div className="w-full lg:w-[280px] shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
          <div className="p-4 border-b border-[#EFF0F6] bg-[#FAFAFC]">
            <h3 className="font-semibold text-lg text-[#14142B]">Settings</h3>
          </div>
          <ul className="flex flex-col py-2">
            {settingsMenu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => setActiveTab(item.name)}
                    className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-primary-light text-primary border-r-2 border-primary" 
                        : "text-[#6E7191] hover:bg-[#FAFAFC] hover:text-[#14142B] border-r-2 border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] p-4 sm:p-6 lg:p-8 relative">
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Header */}
          <div className="mb-8 pb-4 border-b border-[#EFF0F6] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#14142B] mb-1">{activeTab} Settings</h2>
              <p className="text-sm text-[#6E7191]">Manage your {activeTab.toLowerCase()} configuration and preferences.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="h-11 px-6 rounded-xl bg-primary text-white flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save Changes</span>
            </button>
          </div>

          {/* Company */}
          {activeTab === "Company" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.company_name || ""} 
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  value={formData.company_email || ""} 
                  onChange={(e) => handleChange("company_email", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Phone <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.company_phone || ""} 
                  onChange={(e) => handleChange("company_phone", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company / Head Office Address</label>
                <textarea 
                  rows={3} 
                  placeholder="e.g. 123 Errandshop Fresh Market Way, Victoria Island (Leave blank to hide head office on contact page)"
                  value={formData.company_address || ""} 
                  onChange={(e) => handleChange("company_address", e.target.value)}
                  className="w-full p-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary resize-none"
                ></textarea>
                <span className="block text-[11px] text-[#A0A3BD] mt-1">This address appears on the Contact Us page and footer. Clear this field if you wish to remove the head office address.</span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.company_latitude || ""} 
                  onChange={(e) => handleChange("company_latitude", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.company_longitude || ""} 
                  onChange={(e) => handleChange("company_longitude", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Facebook URL</label>
                <input 
                  type="text" 
                  value={formData.facebookUrl || ""} 
                  onChange={(e) => handleChange("facebookUrl", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Twitter URL</label>
                <input 
                  type="text" 
                  value={formData.twitterUrl || ""} 
                  onChange={(e) => handleChange("twitterUrl", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Instagram URL</label>
                <input 
                  type="text" 
                  value={formData.instagramUrl || ""} 
                  onChange={(e) => handleChange("instagramUrl", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">YouTube URL</label>
                <input 
                  type="text" 
                  value={formData.youtubeUrl || ""} 
                  onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Operating / Working Hours</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mon - Sun: 8:00 AM - 10:00 PM"
                  value={formData.company_working_hours || ""} 
                  onChange={(e) => handleChange("company_working_hours", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
                <p className="text-xs text-[#6E7191] mt-1.5">Displayed on the Contact Us page and footer info.</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#14142B] mb-2">About Us Story / Description</label>
                <textarea 
                  rows={5} 
                  placeholder="Write your company's mission, story, and grocery delivery vision here..."
                  value={formData.company_about_us || formData.about_us_content || ""} 
                  onChange={(e) => {
                    handleChange("company_about_us", e.target.value);
                    handleChange("about_us_content", e.target.value);
                  }}
                  className="w-full p-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary resize-none"
                ></textarea>
                <p className="text-xs text-[#6E7191] mt-1.5">This content is dynamically rendered on the public About Us page.</p>
              </div>
            </div>
          )}

          {/* Site */}
          {activeTab === "Site" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Site Title</label>
                <input 
                  type="text" 
                  value={formData.site_title || ""} 
                  onChange={(e) => handleChange("site_title", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Copyright Text</label>
                <input 
                  type="text" 
                  value={formData.site_copyright || ""} 
                  onChange={(e) => handleChange("site_copyright", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Currency Symbol</label>
                <input 
                  type="text" 
                  value={formData.site_currency || ""} 
                  onChange={(e) => handleChange("site_currency", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Timezone</label>
                <select 
                  value={formData.site_timezone || "Africa/Lagos"}
                  onChange={(e) => handleChange("site_timezone", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {/* Brand Logos */}
              <div className="md:col-span-2 pt-4 border-t border-[#EFF0F6]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#14142B] mb-0.5 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Brand Assets (Navbar, Footer & Favicon)</span>
                    </h4>
                    <p className="text-xs text-[#6E7191]">
                      Quickly manage or preview the logos and browser favicon shown across your app.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Theme")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Theme & Colors Settings →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Navbar Logo */}
                  <div className="p-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-[#14142B] mb-2">Main / Navbar Logo</span>
                      <div className="h-16 w-full bg-white rounded-lg border border-[#EFF0F6] flex items-center justify-center p-2 mb-3">
                        {formData.theme_logo ? (
                          <img src={normalizeImageUrl(formData.theme_logo)} alt="Logo" className="max-h-12 max-w-full object-contain" />
                        ) : (
                          <img src="/images/theme/theme-logo.png?v=2" alt="Default Logo" className="max-h-12 max-w-full object-contain opacity-75" />
                        )}
                      </div>
                    </div>
                    <label className="h-9 px-3 rounded-lg bg-white border border-[#EFF0F6] hover:border-primary text-xs font-semibold text-[#14142B] hover:text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      {uploadingHeaderLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Upload className="w-3.5 h-3.5 text-primary" />}
                      <span>{uploadingHeaderLogo ? "Uploading..." : "Upload Navbar Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingHeaderLogo}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleLogoUpload(e.target.files[0], "theme_logo");
                        }}
                      />
                    </label>
                  </div>

                  {/* Footer Logo */}
                  <div className="p-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-[#14142B] mb-2">Footer Logo</span>
                      <div 
                        className="h-16 w-full rounded-lg border border-black/10 flex items-center justify-center p-2 mb-3"
                        style={{ backgroundColor: formData.theme_secondary_color || "var(--secondary-hex)" }}
                      >
                        {formData.theme_footer_logo ? (
                          <img src={normalizeImageUrl(formData.theme_footer_logo)} alt="Footer Logo" className="max-h-12 max-w-full object-contain" />
                        ) : formData.theme_logo ? (
                          <img src={normalizeImageUrl(formData.theme_logo)} alt="Fallback Logo" className="max-h-12 max-w-full object-contain" />
                        ) : (
                          <img src="/images/theme/theme-footer-logo.png" alt="Default Footer Logo" className="max-h-12 max-w-full object-contain opacity-90" />
                        )}
                      </div>
                    </div>
                    <label className="h-9 px-3 rounded-lg bg-white border border-[#EFF0F6] hover:border-primary text-xs font-semibold text-[#14142B] hover:text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      {uploadingFooterLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Upload className="w-3.5 h-3.5 text-primary" />}
                      <span>{uploadingFooterLogo ? "Uploading..." : "Upload Footer Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingFooterLogo}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleLogoUpload(e.target.files[0], "theme_footer_logo");
                        }}
                      />
                    </label>
                  </div>

                  {/* Browser Favicon */}
                  <div className="p-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-[#14142B] mb-2">Browser Favicon</span>
                      <div className="h-16 w-full bg-white rounded-lg border border-[#EFF0F6] flex items-center justify-center p-2 mb-3">
                        {formData.theme_favicon ? (
                          <img src={normalizeImageUrl(formData.theme_favicon)} alt="Favicon" className="max-h-8 max-w-full object-contain" />
                        ) : (
                          <img src="/images/theme/theme-favicon-logo.png?v=3" alt="Default Favicon" className="max-h-8 max-w-full object-contain opacity-75" />
                        )}
                      </div>
                    </div>
                    <label className="h-9 px-3 rounded-lg bg-white border border-[#EFF0F6] hover:border-primary text-xs font-semibold text-[#14142B] hover:text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      {uploadingFavicon ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>{uploadingFavicon ? "Uploading..." : "Upload Favicon"}</span>
                      <input
                        type="file"
                        accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploadingFavicon}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLogoUpload(e.target.files[0], "theme_favicon");
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-[#EFF0F6]">
                <h4 className="font-bold text-sm text-[#14142B] mb-1">POS & Thermal Receipt Configuration</h4>
                <p className="text-xs text-[#6E7191] mb-4">Customize the receipt footer signature printed across all POS stores and terminals.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#14142B] mb-2">Receipt Footer Signature</label>
                    <input 
                      type="text" 
                      placeholder="Powered by Errandshop App"
                      value={formData.receipt_footer_signature || ""} 
                      onChange={(e) => handleChange("receipt_footer_signature", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                    />
                    <p className="text-xs text-[#6E7191] mt-1.5">Printed at the bottom of customer receipts (default: Powered by Errandshop App).</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#14142B] mb-2">Receipt Header Tagline (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Fresh Groceries Delivered Daily"
                      value={formData.receipt_header_tagline || ""} 
                      onChange={(e) => handleChange("receipt_header_tagline", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                    />
                    <p className="text-xs text-[#6E7191] mt-1.5">Optional subtitle shown under the store name on receipts.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mail */}
          {activeTab === "Mail" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Mail Host</label>
                <input 
                  type="text" 
                  value={formData.mail_host || ""} 
                  onChange={(e) => handleChange("mail_host", e.target.value)}
                  placeholder="smtp.mailtrap.io"
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Mail Port</label>
                <input 
                  type="text" 
                  value={formData.mail_port || ""} 
                  onChange={(e) => handleChange("mail_port", e.target.value)}
                  placeholder="2525"
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Mail Username</label>
                <input 
                  type="text" 
                  value={formData.mail_username || ""} 
                  onChange={(e) => handleChange("mail_username", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Mail Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.mail_password || ""} 
                    onChange={(e) => handleChange("mail_password", e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Mail From Address</label>
                <input 
                  type="email" 
                  value={formData.mail_from_address || ""} 
                  onChange={(e) => handleChange("mail_from_address", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
            </div>
          )}

          {/* Delivery */}
          {activeTab === "Delivery" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store-Wide Default Address (Fulfillment Location) */}
              <div className="md:col-span-2 p-5 bg-white border border-[#EFF0F6] rounded-2xl shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-[#14142B]">
                        Store-Wide Default Address (Fulfillment Location)
                      </h3>
                    </div>
                    <p className="text-xs text-[#6E7191] mt-1.5 leading-relaxed">
                      Default platform fulfillment address when operating a single restaurant/store or when individual stores have not specified a custom address. Any store can override this by setting its own address.
                    </p>
                  </div>
                  {formData.store_wide_latitude && formData.store_wide_longitude ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 self-start shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      GPS Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 self-start shrink-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      No Coordinates Set
                    </span>
                  )}
                </div>

                {/* Street Address Input with Live Dropdown */}
                <div className="relative" ref={swContainerRef}>
                  <label className="block text-xs font-semibold text-[#14142B] mb-1.5">
                    Store-Wide Street Address
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="e.g. 123 Allen Avenue, Ikeja, Lagos"
                      value={formData.store_wide_address || ""}
                      onChange={(e) => handleSwAddressChange(e.target.value)}
                      onFocus={() => swAddressSuggestions.length > 0 && setSwShowDropdown(true)}
                      className="w-full h-11 pl-10 pr-36 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-medium"
                    />
                    <MapPin className="absolute left-3.5 w-4 h-4 text-[#A0A3BD] pointer-events-none" />
                    
                    <button
                      type="button"
                      onClick={geocodeSwAddress}
                      disabled={swFetchingCoords || !(formData.store_wide_address || "").trim()}
                      className="absolute right-1.5 px-3 py-1.5 bg-[#F7F7FC] hover:bg-primary hover:text-white text-[#14142B] text-xs font-semibold rounded-lg transition border border-[#EFF0F6] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {swFetchingCoords ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Auto-Detect GPS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {swShowDropdown && swAddressSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-[#EFF0F6] shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                      {swAddressSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSwSuggestion(item)}
                          className="w-full px-4 py-2.5 text-left text-xs hover:bg-[#F7F7FC] border-b border-[#F7F7FC] last:border-0 flex items-start gap-2 text-[#14142B] transition cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* City, State, Zip Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#14142B] mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Ikeja"
                      value={formData.store_wide_city || ""}
                      onChange={(e) => handleChange("store_wide_city", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#14142B] mb-1">State / Province</label>
                    <input
                      type="text"
                      placeholder="e.g. Lagos"
                      value={formData.store_wide_state || ""}
                      onChange={(e) => handleChange("store_wide_state", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#14142B] mb-1">Postal / Zip Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 100001"
                      value={formData.store_wide_zipCode || ""}
                      onChange={(e) => handleChange("store_wide_zipCode", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Coordinates & Map Pin Accordion */}
                <div className="pt-2 border-t border-[#EFF0F6]">
                  <button
                    type="button"
                    onClick={() => setSwShowMap(!swShowMap)}
                    className="flex items-center justify-between w-full p-2.5 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] hover:bg-[#EFF0F6] transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-[#14142B]">
                        {swShowMap ? "Hide Map & Coordinate Details" : "Pin Exact Location on Map / Fine-Tune Coordinates"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.store_wide_latitude && formData.store_wide_longitude && (
                        <span className="text-[11px] font-mono text-[#6E7191]">
                          ({formData.store_wide_latitude}, {formData.store_wide_longitude})
                        </span>
                      )}
                      {swShowMap ? <ChevronUp className="w-4 h-4 text-[#6E7191]" /> : <ChevronDown className="w-4 h-4 text-[#6E7191]" />}
                    </div>
                  </button>

                  {swShowMap && (
                    <div className="mt-3 space-y-3 p-3 border border-[#EFF0F6] rounded-xl bg-white animate-in fade-in duration-200">
                      <MapComponent
                        initialLat={formData.store_wide_latitude ? parseFloat(formData.store_wide_latitude) : undefined}
                        initialLng={formData.store_wide_longitude ? parseFloat(formData.store_wide_longitude) : undefined}
                        addressText={formData.store_wide_address}
                        onLocationSelect={handleSwLocationSelect}
                      />

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-[#14142B] mb-1">Latitude</label>
                          <input
                            type="text"
                            placeholder="e.g. 6.5244"
                            value={formData.store_wide_latitude || ""}
                            onChange={(e) => handleChange("store_wide_latitude", e.target.value)}
                            className="w-full h-9 px-3 border border-[#EFF0F6] rounded-xl text-xs font-mono outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#14142B] mb-1">Longitude</label>
                          <input
                            type="text"
                            placeholder="e.g. 3.3792"
                            value={formData.store_wide_longitude || ""}
                            onChange={(e) => handleChange("store_wide_longitude", e.target.value)}
                            className="w-full h-9 px-3 border border-[#EFF0F6] rounded-xl text-xs font-mono outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 p-4 bg-primary-light border border-primary/20 rounded-2xl">
                <label className="block text-sm font-bold text-[#14142B] mb-1">
                  Fixed Delivery Fee (Flat Rate Store-Wide) (₦) [Optional]
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 1500 (Leave 0 or empty for dynamic distance-based calculation)"
                  value={formData.fixedDeliveryFee || ""} 
                  onChange={(e) => handleChange("fixedDeliveryFee", e.target.value ? Number(e.target.value) : 0)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm font-medium focus:outline-none focus:border-primary shadow-2xs" 
                />
                <p className="text-xs text-[#6E7191] mt-1.5 leading-relaxed">
                  💡 When set to an amount greater than 0, this flat rate delivery fee is charged store-wide across all orders, instead of calculating by km distance (unless overridden by an individual store). Set to 0 to use distance-based pricing.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Base Delivery Fee (₦)</label>
                <input 
                  type="number" 
                  value={formData.baseDeliveryFee || 0} 
                  onChange={(e) => handleChange("baseDeliveryFee", Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Fee Per Km (₦)</label>
                <input 
                  type="number" 
                  value={formData.feePerKm || 0} 
                  onChange={(e) => handleChange("feePerKm", Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Multi-Store Extra Pickup Fee (₦)</label>
                <input 
                  type="number" 
                  value={formData.multiStoreExtraFee || 0} 
                  onChange={(e) => handleChange("multiStoreExtraFee", Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Free Delivery Threshold (₦) [Optional]</label>
                <input 
                  type="number" 
                  value={formData.freeDeliveryThreshold || ""} 
                  onChange={(e) => handleChange("freeDeliveryThreshold", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Order Value Fee Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.orderValueFeePercent ?? 2} 
                  onChange={(e) => handleChange("orderValueFeePercent", Number(e.target.value))}
                  placeholder="e.g. 2"
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
                <p className="text-xs text-[#6E7191] mt-1">Percentage of order subtotal added to handle order magnitude/packaging.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Large Order Threshold (₦)</label>
                <input 
                  type="number" 
                  value={formData.largeOrderThreshold ?? 20000} 
                  onChange={(e) => handleChange("largeOrderThreshold", Number(e.target.value))}
                  placeholder="e.g. 20000"
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
                <p className="text-xs text-[#6E7191] mt-1">Orders at or above this value are categorized as large/bulk orders.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Large Order Extra Surcharge (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.largeOrderFeePercent ?? 3} 
                  onChange={(e) => handleChange("largeOrderFeePercent", Number(e.target.value))}
                  placeholder="e.g. 3"
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
                <p className="text-xs text-[#6E7191] mt-1">Extra percentage added for large/bulk orders (special handling/bags).</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Enable Takeaway Option</label>
                <select 
                  value={formData.takeaway_enabled || "No"}
                  onChange={(e) => handleChange("takeaway_enabled", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          )}

          {/* Payment Gateway */}
          {activeTab === "Payment Gateway" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1">Paystack Public Key</label>
                <p className="text-xs text-[#6E7191] mb-2">Overrides NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY from .env when saved.</p>
                <input 
                  type="text" 
                  placeholder="pk_live_... or pk_test_... (leave empty to use .env)"
                  value={formData.pay_paystack_public || ""} 
                  onChange={(e) => handleChange("pay_paystack_public", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-1">Paystack Secret Key</label>
                <p className="text-xs text-[#6E7191] mb-2">Overrides PAYSTACK_SECRET_KEY from .env when saved.</p>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="sk_live_... or sk_test_... (leave empty to use .env)"
                    value={formData.pay_paystack_secret || ""} 
                    onChange={(e) => handleChange("pay_paystack_secret", e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Enable Paystack</label>
                <select 
                  value={formData.pay_paystack_enabled || "Yes"}
                  onChange={(e) => handleChange("pay_paystack_enabled", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Enable WhatsApp Checkout</label>
                <select 
                  value={formData.pay_whatsapp_enabled || "No"}
                  onChange={(e) => handleChange("pay_whatsapp_enabled", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">WhatsApp Phone Number</label>
                <input 
                  type="text" 
                  value={formData.pay_whatsapp_phone_number || ""} 
                  onChange={(e) => handleChange("pay_whatsapp_phone_number", e.target.value)}
                  placeholder="e.g. 2348000000000"
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
            </div>
          )}

          {/* Theme */}
          {activeTab === "Theme" && (
            <div className="space-y-8">
              {/* 3-Brand-Color System Studio */}
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base text-[#14142B]">3-Brand-Color UX System (60-30-10 Harmony)</h3>
                  </div>
                  <p className="text-xs text-[#6E7191] leading-relaxed">
                    Balance your customer storefront with 3 distinct brand colors to eliminate single-color dominance. Primary drives actions, Secondary grounds the layout, and Accent highlights deals and alerts.
                  </p>
                </div>

                {/* 3-Color Pickers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Primary Color Card */}
                  <div className="p-5 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-[#14142B]">1. Primary Color</label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#EFF0F6] text-primary">
                          60% Action
                        </span>
                      </div>
                      <p className="text-xs text-[#6E7191] mb-4">
                        Main conversion buttons (&quot;Add to Cart&quot;, &quot;Checkout&quot;), active nav tabs, and key focus rings.
                      </p>
                      <div className="flex gap-2.5 items-center mb-4">
                        <input 
                          type="color" 
                          value={formData.theme_primary_color || "#008BBA"} 
                          onChange={(e) => handleChange("theme_primary_color", e.target.value)}
                          className="h-12 w-12 rounded-xl border border-[#EFF0F6] cursor-pointer shrink-0 shadow-2xs" 
                        />
                        <input 
                          type="text" 
                          value={formData.theme_primary_color || "#008BBA"} 
                          onChange={(e) => handleChange("theme_primary_color", e.target.value)}
                          className="flex-1 h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-mono uppercase" 
                        />
                      </div>
                    </div>
                    {/* Live Chip */}
                    <div className="pt-3 border-t border-[#EFF0F6] flex items-center justify-between">
                      <span className="text-[11px] text-[#A0A3BD]">Preview CTA:</span>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-2xs"
                        style={{ backgroundColor: formData.theme_primary_color || "#008BBA" }}
                      >
                        Add to Cart
                      </span>
                    </div>
                  </div>

                  {/* Secondary Color Card */}
                  <div className="p-5 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-[#14142B]">2. Secondary Color</label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#EFF0F6] text-[#1E293B]">
                          30% Grounding
                        </span>
                      </div>
                      <p className="text-xs text-[#6E7191] mb-4">
                        Replaces the solid primary footer wall with a rich, grounded background and secondary framing.
                      </p>
                      <div className="flex gap-2.5 items-center mb-4">
                        <input 
                          type="color" 
                          value={formData.theme_secondary_color || "#1E293B"} 
                          onChange={(e) => handleChange("theme_secondary_color", e.target.value)}
                          className="h-12 w-12 rounded-xl border border-[#EFF0F6] cursor-pointer shrink-0 shadow-2xs" 
                        />
                        <input 
                          type="text" 
                          value={formData.theme_secondary_color || "#1E293B"} 
                          onChange={(e) => handleChange("theme_secondary_color", e.target.value)}
                          className="flex-1 h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-mono uppercase" 
                        />
                      </div>
                    </div>
                    {/* Live Chip */}
                    <div className="pt-3 border-t border-[#EFF0F6] flex items-center justify-between">
                      <span className="text-[11px] text-[#A0A3BD]">Preview Footer:</span>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-2xs"
                        style={{ backgroundColor: formData.theme_secondary_color || "#1E293B" }}
                      >
                        Footer & Contrast
                      </span>
                    </div>
                  </div>

                  {/* Tertiary / Accent Color Card */}
                  <div className="p-5 rounded-2xl border border-[#EFF0F6] bg-[#FAFAFC] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-[#14142B]">3. Accent Color</label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#EFF0F6] text-[#FF6B00]">
                          10% Highlight
                        </span>
                      </div>
                      <p className="text-xs text-[#6E7191] mb-4">
                        Creates urgency and delight on discount badges (-20% OFF), floating cart counts, and star ratings.
                      </p>
                      <div className="flex gap-2.5 items-center mb-4">
                        <input 
                          type="color" 
                          value={formData.theme_tertiary_color || "#FF6B00"} 
                          onChange={(e) => handleChange("theme_tertiary_color", e.target.value)}
                          className="h-12 w-12 rounded-xl border border-[#EFF0F6] cursor-pointer shrink-0 shadow-2xs" 
                        />
                        <input 
                          type="text" 
                          value={formData.theme_tertiary_color || "#FF6B00"} 
                          onChange={(e) => handleChange("theme_tertiary_color", e.target.value)}
                          className="flex-1 h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-mono uppercase" 
                        />
                      </div>
                    </div>
                    {/* Live Chip */}
                    <div className="pt-3 border-t border-[#EFF0F6] flex items-center justify-between">
                      <span className="text-[11px] text-[#A0A3BD]">Preview Badge:</span>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: formData.theme_tertiary_color || "#FF6B00" }}
                      >
                        -25% OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* One-Click Presets */}
                <div className="bg-[#FAFAFC] p-5 rounded-2xl border border-[#EFF0F6] mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-[#14142B] uppercase tracking-wider">Curated Palette Presets</span>
                    <span className="text-[11px] text-[#6E7191]">(Click any to instantly preview)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {COLOR_PRESETS.map((preset) => {
                      const isActive = 
                        (formData.theme_primary_color || "#ff006b").toLowerCase() === preset.primary.toLowerCase() &&
                        (formData.theme_secondary_color || "#1e293b").toLowerCase() === preset.secondary.toLowerCase() &&
                        (formData.theme_tertiary_color || "#ff6b00").toLowerCase() === preset.accent.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            handleChange("theme_primary_color", preset.primary);
                            handleChange("theme_secondary_color", preset.secondary);
                            handleChange("theme_tertiary_color", preset.accent);
                            toast.success(`Applied ${preset.name} palette! Click Save Settings to persist.`);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isActive 
                              ? "border-primary bg-white shadow-sm ring-2 ring-primary/20" 
                              : "border-[#EFF0F6] bg-white hover:border-[#D1D5DB] hover:shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.primary }} title={`Primary: ${preset.primary}`} />
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.secondary }} title={`Secondary: ${preset.secondary}`} />
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.accent }} title={`Accent: ${preset.accent}`} />
                          </div>
                          <div className="font-bold text-xs text-[#14142B] mb-0.5 truncate">{preset.name}</div>
                          <div className="text-[10px] text-[#6E7191] line-clamp-2 leading-tight">{preset.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Storefront Component Preview */}
                <div className="p-5 rounded-2xl border border-[#EFF0F6] bg-white shadow-2xs mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-sm text-[#14142B] flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                        <span>Live Storefront Visual Preview</span>
                      </h4>
                      <p className="text-xs text-[#6E7191]">
                        Here is how your chosen 3-color harmony balances conversion, structure, and promotional urgency in real time:
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-[#A0A3BD] bg-[#FAFAFC] px-2.5 py-1 rounded-full border border-[#EFF0F6]">
                      Interactive Preview
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#EFF0F6] overflow-hidden bg-[#F7F7FC]">
                    {/* Simulated Mini Navbar */}
                    <div className="bg-white px-4 py-3 border-b border-[#EFF0F6] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: formData.theme_primary_color || "#008BBA" }}>
                          E
                        </div>
                        <span className="font-bold text-xs text-[#14142B]">Errandshop Store</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-[#F7F7FC] flex items-center justify-center text-[#14142B]">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          {/* Accent Cart Bubble */}
                          <span 
                            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: formData.theme_tertiary_color || "#FF6B00" }}
                          >
                            3
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Content Area */}
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      {/* Product Card Demonstration */}
                      <div className="bg-white rounded-xl p-4 border border-[#EFF0F6] shadow-xs relative">
                        {/* Accent Discount Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span 
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs tracking-wide"
                            style={{ backgroundColor: formData.theme_tertiary_color || "#FF6B00" }}
                          >
                            -20% OFF
                          </span>
                          <span className="text-[11px] font-semibold" style={{ color: formData.theme_tertiary_color || "#FF6B00" }}>
                            ★ 4.9 (128)
                          </span>
                        </div>
                        
                        <div className="w-full h-20 bg-[#F8FAFC] rounded-lg mb-3 flex items-center justify-center text-xs text-[#94A3B8] font-medium">
                          Fresh Organic Strawberries 500g
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-sm font-bold text-[#14142B]">₦2,800</span>
                            <span className="text-xs text-[#94A3B8] line-through ml-1.5">₦3,500</span>
                          </div>
                          {/* Primary CTA Button */}
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                            style={{ backgroundColor: formData.theme_primary_color || "#008BBA" }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>

                      {/* Design Rule Explanation */}
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: formData.theme_primary_color || "#008BBA" }} />
                          <div>
                            <strong className="text-[#14142B]">Primary CTA (60%):</strong> Commands customer focus immediately for adding items and checkout.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: formData.theme_tertiary_color || "#FF6B00" }} />
                          <div>
                            <strong className="text-[#14142B]">Accent Alert (10%):</strong> Highlights limited-time discounts and alerts without competing with the primary action.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: formData.theme_secondary_color || "#1E293B" }} />
                          <div>
                            <strong className="text-[#14142B]">Secondary Grounding (30%):</strong> Anchors the footer and structural hierarchy with rich, comfortable depth.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Mini Footer */}
                    <div 
                      className="px-5 py-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                      style={{ backgroundColor: formData.theme_secondary_color || "#1E293B" }}
                    >
                      <div>
                        <div className="font-bold">Errandshop Nigeria</div>
                        <div className="text-[11px] text-white/70">© 2026 Errandshop Technologies Limited.</div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          placeholder="Your email address" 
                          disabled 
                          className="h-8 px-2.5 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 text-[11px] w-full sm:w-36 focus:outline-none" 
                        />
                        <button 
                          type="button" 
                          className="h-8 px-3 rounded text-[11px] font-semibold text-white shrink-0"
                          style={{ backgroundColor: formData.theme_primary_color || "#008BBA" }}
                        >
                          Subscribe
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sitewide Brand Logos */}
              <div className="pt-6 border-t border-[#EFF0F6]">
                <div className="mb-6">
                  <h3 className="font-bold text-base text-[#14142B] mb-1 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <span>Sitewide Brand Logos</span>
                  </h3>
                  <p className="text-xs text-[#6E7191]">
                    Changes here take effect sitewide across the customer storefront, mobile navigation, footer, and admin portal in real time.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Navbar / Header Logo */}
                  <div className="bg-[#FAFAFC] p-5 rounded-2xl border border-[#EFF0F6] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-bold text-[#14142B]">Main / Navbar Logo</label>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white border border-[#EFF0F6] text-[#6E7191] uppercase tracking-wider">
                          Header & Admin
                        </span>
                      </div>
                      <p className="text-xs text-[#6E7191] mb-4">
                        Shown on the website top navbar, mobile menu, and admin sidebar. Recommended: transparent PNG or WebP (approx. 240×60px).
                      </p>

                      {/* Preview Box */}
                      <div className="w-full h-24 bg-white rounded-xl border border-[#EFF0F6] flex items-center justify-center p-3 mb-4 shadow-2xs relative">
                        {formData.theme_logo ? (
                          <img 
                            src={normalizeImageUrl(formData.theme_logo)} 
                            alt="Navbar Logo Preview" 
                            className="max-h-16 max-w-full object-contain" 
                          />
                        ) : (
                          <img 
                            src="/images/theme/theme-logo.png?v=2" 
                            alt="Default Navbar Logo" 
                            className="max-h-16 max-w-full object-contain opacity-75" 
                          />
                        )}
                        <span className="absolute bottom-1.5 right-2 text-[10px] font-medium text-[#A0A3BD] bg-white/90 px-1.5 py-0.5 rounded">
                          {formData.theme_logo ? "Custom (MongoDB)" : "Default Asset"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 h-11 px-4 rounded-xl bg-white border border-[#EFF0F6] hover:border-primary text-[#14142B] hover:text-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                        {uploadingHeaderLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-4 h-4 text-primary" />
                        )}
                        <span>{uploadingHeaderLogo ? "Uploading..." : "Upload Navbar Logo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          disabled={uploadingHeaderLogo}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoUpload(e.target.files[0], "theme_logo");
                            }
                          }}
                        />
                      </label>

                      {formData.theme_logo && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLogo("theme_logo")}
                          className="h-11 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Reset to default logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer Logo */}
                  <div className="bg-[#FAFAFC] p-5 rounded-2xl border border-[#EFF0F6] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-bold text-[#14142B]">Footer Logo</label>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white border border-[#EFF0F6] text-[#6E7191] uppercase tracking-wider">
                          Dark / Brand BG
                        </span>
                      </div>
                      <p className="text-xs text-[#6E7191] mb-4">
                        Shown on the bottom brand-colored footer. A white or light transparent PNG is recommended. Falls back to Main Logo if left empty.
                      </p>

                      {/* Preview Box with live Secondary Brand BG */}
                      <div 
                        className="w-full h-24 rounded-xl border border-black/10 flex items-center justify-center p-3 mb-4 shadow-2xs relative"
                        style={{ backgroundColor: formData.theme_secondary_color || "var(--secondary-hex)" }}
                      >
                        {formData.theme_footer_logo ? (
                          <img 
                            src={normalizeImageUrl(formData.theme_footer_logo)} 
                            alt="Footer Logo Preview" 
                            className="max-h-16 max-w-full object-contain" 
                          />
                        ) : formData.theme_logo ? (
                          <img 
                            src={normalizeImageUrl(formData.theme_logo)} 
                            alt="Navbar Logo Fallback Preview" 
                            className="max-h-16 max-w-full object-contain" 
                          />
                        ) : (
                          <img 
                            src="/images/theme/theme-footer-logo.png" 
                            alt="Default Footer Logo" 
                            className="max-h-16 max-w-full object-contain opacity-90" 
                          />
                        )}
                        <span className="absolute bottom-1.5 right-2 text-[10px] font-medium text-white/85 bg-black/30 px-1.5 py-0.5 rounded">
                          {formData.theme_footer_logo 
                            ? "Custom (MongoDB)" 
                            : formData.theme_logo 
                            ? "Using Main Logo" 
                            : "Default Asset"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 h-11 px-4 rounded-xl bg-white border border-[#EFF0F6] hover:border-primary text-[#14142B] hover:text-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                        {uploadingFooterLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-4 h-4 text-primary" />
                        )}
                        <span>{uploadingFooterLogo ? "Uploading..." : "Upload Footer Logo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          disabled={uploadingFooterLogo}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoUpload(e.target.files[0], "theme_footer_logo");
                            }
                          }}
                        />
                      </label>

                      {formData.theme_footer_logo && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLogo("theme_footer_logo")}
                          className="h-11 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Reset footer logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Browser Favicon */}
                  <div className="bg-[#FAFAFC] p-5 rounded-2xl border border-[#EFF0F6] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-bold text-[#14142B]">Browser Favicon</label>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white border border-[#EFF0F6] text-[#6E7191] uppercase tracking-wider">
                          Tab & PWA Icon
                        </span>
                      </div>
                      <p className="text-xs text-[#6E7191] mb-4">
                        Displayed in browser tabs, bookmarks, and PWA shortcuts. Square PNG, ICO, or SVG recommended (approx. 192×192px).
                      </p>

                      {/* Simulated Browser Tab Preview */}
                      <div className="w-full h-24 bg-white rounded-xl border border-[#EFF0F6] flex flex-col justify-center px-4 mb-4 shadow-2xs relative">
                        <div className="flex items-center gap-2 max-w-full bg-[#EFF0F6]/80 px-3 py-2 rounded-lg border border-[#D9DBE9]/60">
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {formData.theme_favicon ? (
                              <img 
                                src={normalizeImageUrl(formData.theme_favicon)} 
                                alt="Favicon Preview" 
                                className="w-4 h-4 object-contain rounded-xs" 
                              />
                            ) : (
                              <img 
                                src="/images/theme/theme-favicon-logo.png?v=3" 
                                alt="Default Favicon" 
                                className="w-4 h-4 object-contain opacity-80" 
                              />
                            )}
                          </div>
                          <span className="text-xs font-medium text-[#14142B] truncate">
                            {formData.site_title || formData.company_name || "Errandshop - Groceries"}
                          </span>
                        </div>
                        <span className="absolute bottom-1.5 right-2 text-[10px] font-medium text-[#A0A3BD] bg-white/90 px-1.5 py-0.5 rounded">
                          {formData.theme_favicon ? "Custom (MongoDB)" : "Default Asset"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 h-11 px-4 rounded-xl bg-white border border-[#EFF0F6] hover:border-primary text-[#14142B] hover:text-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                        {uploadingFavicon ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-4 h-4 text-primary" />
                        )}
                        <span>{uploadingFavicon ? "Uploading..." : "Upload Favicon"}</span>
                        <input
                          type="file"
                          accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          disabled={uploadingFavicon}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoUpload(e.target.files[0], "theme_favicon");
                            }
                          }}
                        />
                      </label>

                      {formData.theme_favicon && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLogo("theme_favicon")}
                          className="h-11 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Reset to default favicon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SMS Gateway */}
          {activeTab === "SMS Gateway" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Twilio Account SID</label>
                <input 
                  type="text" 
                  value={formData.sms_twilio_sid || ""} 
                  onChange={(e) => handleChange("sms_twilio_sid", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Twilio Auth Token</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.sms_twilio_token || ""} 
                    onChange={(e) => handleChange("sms_twilio_token", e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Twilio From Number</label>
                <input 
                  type="text" 
                  value={formData.sms_twilio_from || ""} 
                  onChange={(e) => handleChange("sms_twilio_from", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Enable SMS</label>
                <select 
                  value={formData.sms_enabled || "No"}
                  onChange={(e) => handleChange("sms_enabled", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          )}

          {/* Push Notification */}
          {activeTab === "Push Notification" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Firebase Server Key</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.push_firebase_key || ""} 
                    onChange={(e) => handleChange("push_firebase_key", e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A3BD] hover:text-[#14142B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Firebase Sender ID</label>
                <input 
                  type="text" 
                  value={formData.push_firebase_sender || ""} 
                  onChange={(e) => handleChange("push_firebase_sender", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Enable Push Notifications</label>
                <select 
                  value={formData.push_enabled || "No"}
                  onChange={(e) => handleChange("push_enabled", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          )}

          {/* WhatsApp Bot */}
          {activeTab === "WhatsApp Bot" && (
            <div className="space-y-6">
              <div className="bg-[#FAFAFC] p-4 rounded-xl border border-[#EFF0F6] mb-4">
                <h4 className="font-semibold text-sm text-[#14142B] mb-1">🏦 Bank Account for WhatsApp Orders</h4>
                <p className="text-xs text-[#6E7191]">
                  This bank account is automatically sent to customers on WhatsApp when they choose &quot;Pay via Bank Transfer&quot;.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Bank Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Guaranty Trust Bank (GTBank), Access Bank, Zenith Bank"
                    value={formData.wa_bank_name || ""} 
                    onChange={(e) => {
                      const newBankName = e.target.value;
                      handleChange("wa_bank_name", newBankName);
                      handleChange("wa_bank_account", {
                        bankName: newBankName,
                        accountNumber: formData.wa_account_number || "",
                        accountName: formData.wa_account_name || "",
                      });
                    }}
                    className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Account Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0123456789"
                    value={formData.wa_account_number || ""} 
                    onChange={(e) => {
                      const newAccNum = e.target.value;
                      handleChange("wa_account_number", newAccNum);
                      handleChange("wa_bank_account", {
                        bankName: formData.wa_bank_name || "",
                        accountNumber: newAccNum,
                        accountName: formData.wa_account_name || "",
                      });
                    }}
                    className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#14142B] mb-2">Account Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Errandshop Groceries Ltd"
                    value={formData.wa_account_name || ""} 
                    onChange={(e) => {
                      const newAccName = e.target.value;
                      handleChange("wa_account_name", newAccName);
                      handleChange("wa_bank_account", {
                        bankName: formData.wa_bank_name || "",
                        accountNumber: formData.wa_account_number || "",
                        accountName: newAccName,
                      });
                    }}
                    className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                </div>
              </div>

              <div className="bg-[#FAFAFC] p-4 rounded-xl border border-[#EFF0F6] mt-6 mb-4">
                <h4 className="font-semibold text-sm text-[#14142B] mb-1">🔔 Admin Order Notification WhatsApp Number</h4>
                <p className="text-xs text-[#6E7191]">
                  This WhatsApp number receives instant order alert messages whenever a customer places an order on the website or via WhatsApp.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Admin Notification WhatsApp Phone</label>
                <input 
                  type="text" 
                  placeholder="e.g. 08012345678 or 2348012345678"
                  value={formData.admin_notification_whatsapp_number || ""} 
                  onChange={(e) => handleChange("admin_notification_whatsapp_number", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="bg-[#FAFAFC] p-4 rounded-xl border border-[#EFF0F6] mt-6 mb-4">
                <h4 className="font-semibold text-sm text-[#14142B] mb-1">🌐 Live Store Website URL</h4>
                <p className="text-xs text-[#6E7191]">
                  Where customers are redirected to view their order tracking & receipt after Paystack payment.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Website URL (Vercel Domain)</label>
                <input 
                  type="url" 
                  placeholder="https://your-store.vercel.app"
                  value={formData.wa_site_url || ""} 
                  onChange={(e) => handleChange("wa_site_url", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
            </div>
          )}

          {/* Roles & Permissions */}
          {activeTab === "Roles & Permissions" && (
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Default Customer Role</label>
                <select 
                  value={formData.role_default_customer || "Customer"}
                  onChange={(e) => handleChange("role_default_customer", e.target.value)}
                  className="w-full md:w-1/2 h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Customer">Customer</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Allow Public Registration</label>
                <select 
                  value={formData.role_public_registration || "Yes"}
                  onChange={(e) => handleChange("role_public_registration", e.target.value)}
                  className="w-full md:w-1/2 h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
