"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Send,
  Users,
  ShoppingBag,
  Store,
  Bike,
  Bell,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import SendPushNotificationModal from "@/components/admin/SendPushNotificationModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

export default function PushNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [audienceStats, setAudienceStats] = useState({
    all: 0,
    customer: 0,
    store_manager: 0,
    delivery_boy: 0,
    activeSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isWebPushActive, setIsWebPushActive] = useState(false);
  const [togglingWebPush, setTogglingWebPush] = useState(false);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const fetchWebPushStatus = async () => {
    try {
      const res = await fetch("/api/admin/push-notifications/toggle-web-push");
      const data = await res.json();
      if (data.status) {
        setIsWebPushActive(data.enabled);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleWebPush = async () => {
    setTogglingWebPush(true);
    try {
      const res = await fetch("/api/admin/push-notifications/toggle-web-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !isWebPushActive }),
      });
      const data = await res.json();
      if (data.status) {
        setIsWebPushActive(data.enabled);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to toggle Web Push");
      }
    } catch {
      toast.error("Error updating Web Push status");
    } finally {
      setTogglingWebPush(false);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/push-notifications", { cache: "no-store" });
      const data = await res.json();
      if (data.status) {
        setNotifications(data.data || []);
        if (data.audienceStats) {
          setAudienceStats(data.audienceStats);
        }
      }
    } catch (err) {
      console.error("Error loading push notifications:", err);
      toast.error("Failed to load push notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchWebPushStatus();
  }, []);

  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleDeleteClick = (item: any) => {
    setSelectedNotification(item);
    setIsDeleteOpen(true);
  };

  const handleResend = async (item: any) => {
    setResendingId(item._id);
    try {
      const res = await fetch(`/api/admin/push-notifications/${item._id}/resend`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "Notification re-sent successfully!");
        fetchNotifications();
      } else {
        toast.error(data.message || "Failed to resend notification");
      }
    } catch {
      toast.error("Error resending notification");
    } finally {
      setResendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedNotification) return;
    try {
      const res = await fetch(`/api/admin/push-notifications/${selectedNotification._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status) {
        toast.success("Notification record removed");
        fetchNotifications();
        setIsDeleteOpen(false);
      } else {
        toast.error(data.message || "Failed to delete record");
      }
    } catch {
      toast.error("Error deleting record");
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || item.targetRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "customer":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShoppingBag className="w-3 h-3" /> Customers
          </span>
        );
      case "store_manager":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Store className="w-3 h-3" /> Sellers & Stores
          </span>
        );
      case "delivery_boy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Bike className="w-3 h-3" /> Delivery Boys
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-3 h-3" /> All Users
          </span>
        );
    }
  };

  return (
    <div className="pb-16 space-y-6">
      {/* Audience Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-[#6E7191]">All Users</span>
            <span className="text-lg sm:text-xl font-bold text-[#14142B]">{audienceStats.all}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-[#6E7191]">Customers</span>
            <span className="text-lg sm:text-xl font-bold text-[#14142B]">{audienceStats.customer}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-[#6E7191]">Sellers</span>
            <span className="text-lg sm:text-xl font-bold text-[#14142B]">{audienceStats.store_manager}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-[#6E7191]">Delivery</span>
            <span className="text-lg sm:text-xl font-bold text-[#14142B]">{audienceStats.delivery_boy}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EFF0F6] shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-primary flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-[#6E7191]">Active Devices</span>
            <span className="text-lg sm:text-xl font-bold text-primary">{audienceStats.activeSubscribers || 0}</span>
          </div>
        </div>
      </div>

      {/* Web Push Control Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isWebPushActive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-[#FAFAFC] border-[#EFF0F6]'}`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${isWebPushActive ? 'bg-emerald-600 text-white' : 'bg-[#EFF0F6] text-[#A0A3BD]'}`}>
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#14142B]">Web Push Notifications (VAPID)</h4>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isWebPushActive ? 'bg-emerald-600 text-white' : 'bg-[#E2E8F0] text-[#6E7191]'}`}>
                {isWebPushActive ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-[#6E7191] mt-0.5">
              {isWebPushActive
                ? 'Web Push is active. Broadcasts will be sent directly to registered browser & PWA devices.'
                : 'Web Push is currently PAUSED. Notifications will be stored in-app without sending background OS alerts.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleWebPush}
          disabled={togglingWebPush}
          className={`h-10 px-5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 ${
            isWebPushActive
              ? 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
              : 'bg-primary hover:bg-[#e60060] text-white shadow-md shadow-primary/20'
          }`}
        >
          {togglingWebPush ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isWebPushActive ? (
            <span>Pause Web Push</span>
          ) : (
            <span>Activate Web Push</span>
          )}
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6]">
        {/* Header */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg text-[#14142B]">Push Notifications Broadcast</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-44 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-xs font-semibold text-[#4E4B66] focus:outline-none focus:border-primary"
            >
              <option value="all">All Audiences</option>
              <option value="customer">Customers Only</option>
              <option value="store_manager">Sellers Only</option>
              <option value="delivery_boy">Delivery Boys Only</option>
            </select>

            <button
              onClick={fetchNotifications}
              className="h-10 w-10 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] flex items-center justify-center hover:bg-[#F7F7FC] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setIsSendModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-semibold">Send Notification</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Target Audience
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Recipients Reached
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Date Sent
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6E7191]">
                    Loading notification history...
                  </td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6E7191]">
                    No push notifications sent yet. Click &quot;Send Notification&quot; to broadcast.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <span className="block text-sm font-bold text-[#14142B] truncate">
                          {item.title}
                        </span>
                        <p className="text-xs text-[#6E7191] line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(item.targetRole)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#14142B]">
                          {item.tokensCount || item.recipientsCount || 0} devices
                        </span>
                        <span className="text-[11px] text-[#6E7191]">
                          ({item.recipientsCount || 0} registered users)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#4E4B66] font-medium">
                        {new Date(item.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleResend(item)}
                          disabled={resendingId === item._id}
                          className="h-8 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          title="Push this notification to users again"
                        >
                          {resendingId === item._id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{resendingId === item._id ? "Pushing..." : "Push Again"}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="w-8 h-8 rounded-xl bg-[#F7F7FC] text-[#FB4E4E] inline-flex items-center justify-center hover:bg-[#FFEAEA] transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-xs font-medium text-[#6E7191]">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </span>
        </div>
      </div>

      {/* Send Notification Modal */}
      <SendPushNotificationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={fetchNotifications}
        audienceStats={audienceStats}
      />

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
