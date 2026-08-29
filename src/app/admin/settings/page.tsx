"use client";

import React, { useState, useEffect } from "react";
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
  EyeOff
} from "lucide-react";
import { useSettingsStore, SettingItem } from "@/store/useSettingsStore";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Company");
  
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  
  // Local state to hold form changes before saving
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      // Map formData to SettingItem array format based on the active tab
      const settingsToUpdate: SettingItem[] = Object.keys(formData).map(key => {
        // Simple heuristic to assign group based on key prefix or name
        let group = "Company";
        if (key.startsWith("site_")) group = "Site";
        if (key.startsWith("mail_")) group = "Mail";
        if (key.startsWith("pay_")) group = "Payment Gateway";
        if (key.startsWith("sms_")) group = "SMS Gateway";
        if (key.startsWith("push_")) group = "Push Notification";
        if (key.startsWith("theme_")) group = "Theme";
        if (["baseDeliveryFee", "feePerKm", "multiStoreExtraFee", "freeDeliveryThreshold", "orderValueFeePercent", "largeOrderThreshold", "largeOrderFeePercent", "takeaway_enabled"].includes(key)) group = "Delivery";
        
        return {
          key,
          group,
          payload: formData[key]
        };
      });

      // Filter to only send settings that belong to the currently active tab (optional, but cleaner)
      const tabSettings = settingsToUpdate.filter(s => s.group === activeTab || (activeTab === 'Company' && !s.key.includes('_')));
      
      // If we are modifying everything at once, we just send settingsToUpdate.
      // Let's send the specific ones that changed. For now, sending all mapped.
      await updateSettings(settingsToUpdate);
      toast.success(`${activeTab} Settings saved successfully!`);
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
                        ? "bg-[#fff5f9] text-primary border-r-2 border-primary" 
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
              className="h-11 px-6 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
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
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Company Address <span className="text-red-500">*</span></label>
                <textarea 
                  rows={3} 
                  value={formData.company_address || ""} 
                  onChange={(e) => handleChange("company_address", e.target.value)}
                  className="w-full p-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary resize-none"
                ></textarea>
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
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Paystack Public Key</label>
                <input 
                  type="text" 
                  value={formData.pay_paystack_public || ""} 
                  onChange={(e) => handleChange("pay_paystack_public", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Paystack Secret Key</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
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
                  value={formData.pay_paystack_enabled || "No"}
                  onChange={(e) => handleChange("pay_paystack_enabled", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          )}

          {/* Theme */}
          {activeTab === "Theme" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={formData.theme_primary_color || "#ff006b"} 
                    onChange={(e) => handleChange("theme_primary_color", e.target.value)}
                    className="h-12 w-12 rounded-xl border border-[#EFF0F6] cursor-pointer" 
                  />
                  <input 
                    type="text" 
                    value={formData.theme_primary_color || "#ff006b"} 
                    onChange={(e) => handleChange("theme_primary_color", e.target.value)}
                    className="flex-1 h-12 px-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14142B] mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {formData.theme_logo && (
                    <img src={formData.theme_logo} alt="Site Logo" className="h-12 w-auto object-contain rounded-lg border border-[#EFF0F6]" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadingLogo(true);
                        const file = e.target.files[0];
                        const body = new FormData();
                        body.append("file", file);
                        try {
                          const res = await fetch("/api/admin/upload", { method: "POST", body });
                          const data = await res.json();
                          if (data.url) setFormData({...formData, theme_logo: data.url});
                        } catch (err) {
                          console.error("Upload error", err);
                        }
                        setUploadingLogo(false);
                      }
                    }}
                    className="flex-1 h-12 px-4 py-2.5 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                  />
                  {uploadingLogo && <span className="w-5 h-5 border-2 border-primary/40 border-t-[#ff006b] rounded-full animate-spin"></span>}
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
