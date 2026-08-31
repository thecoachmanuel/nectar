import React, { useState } from "react";
import Modal from "./Modal";
import { Users, ShoppingBag, Store, Bike, Send, Bell, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface SendPushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  audienceStats?: {
    all: number;
    customer: number;
    store_manager: number;
    delivery_boy: number;
    activeSubscribers?: number;
  };
}

export default function SendPushNotificationModal({
  isOpen,
  onClose,
  onSuccess,
  audienceStats = { all: 0, customer: 0, store_manager: 0, delivery_boy: 0 },
}: SendPushNotificationModalProps) {
  const [targetRole, setTargetRole] = useState<"all" | "customer" | "store_manager" | "delivery_boy">("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("/");
  const [loading, setLoading] = useState(false);

  const audienceOptions = [
    {
      id: "all",
      label: "All Users",
      description: "Broadcast to every registered user",
      icon: Users,
      count: audienceStats.all,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      activeBg: "bg-blue-50/70 border-blue-500",
    },
    {
      id: "customer",
      label: "Customers",
      description: "Shoppers and retail customers",
      icon: ShoppingBag,
      count: audienceStats.customer,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      activeBg: "bg-purple-50/70 border-purple-500",
    },
    {
      id: "store_manager",
      label: "Sellers & Stores",
      description: "Store managers, vendors & staff",
      icon: Store,
      count: audienceStats.store_manager,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      activeBg: "bg-amber-50/70 border-amber-500",
    },
    {
      id: "delivery_boy",
      label: "Delivery Boys",
      description: "Couriers and delivery riders",
      icon: Bike,
      count: audienceStats.delivery_boy,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      activeBg: "bg-emerald-50/70 border-emerald-500",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please enter a title and message.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/push-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetRole,
          url: url.trim() || "/",
        }),
      });

      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "Push notification sent successfully!");
        setTitle("");
        setDescription("");
        setUrl("/");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to dispatch push notification.");
      }
    } catch (err: any) {
      toast.error("Error sending push notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Push Notification">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Target Audience Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#6E7191] mb-2">
            1. Select Target Audience <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {audienceOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = targetRole === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTargetRole(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? `${opt.activeBg} border-2 shadow-sm`
                      : "bg-white border-[#EFF0F6] hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-white text-primary shadow-sm" : "bg-[#F7F7FC] text-[#6E7191]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-sm font-bold text-[#14142B] truncate">{opt.label}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#EFF0F6] text-[#4E4B66]">
                        {opt.count}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E7191] line-clamp-1">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Message Content */}
        <div className="space-y-3 pt-2 border-t border-[#EFF0F6]">
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">
              Notification Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g. 🔥 Flash Sale: 20% Off All Products Today!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 pl-4 pr-14 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#A0A3BD]">
                {title.length}/80
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">
              Message Body <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                maxLength={240}
                placeholder="Type your push notification message here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 pr-14 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <span className="absolute right-3 bottom-3 text-[11px] text-[#A0A3BD]">
                {description.length}/240
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1">
              Action Link / Deep Link URL (Optional)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. /menu or /account/orders"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="p-3.5 bg-[#F7F7FC] rounded-xl border border-[#EFF0F6]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E7191] uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5 text-primary" />
            Device Notification Preview
          </div>
          <div className="p-3 bg-white rounded-xl shadow-sm border border-[#EFF0F6] flex items-start gap-3">
            {/* Site logo — exactly how OS push notifications render on device */}
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 shadow-sm border border-[#EFF0F6]">
              <img
                src="/images/theme/theme-favicon-logo.png"
                alt="Nectar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#14142B] truncate">
                {title || "Nectar Notification Title"}
              </h4>
              <p className="text-[11px] text-[#6E7191] line-clamp-2 mt-0.5">
                {description || "Your custom notification message will appear on user devices."}
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-[#EFF0F6] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 h-11 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-medium hover:bg-[#F7F7FC] transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 h-11 rounded-xl bg-primary text-white font-medium hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-70 text-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Push</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
