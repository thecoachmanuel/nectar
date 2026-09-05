"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ListPlus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  MessageSquare,
  Copy,
  RotateCcw,
  Tag,
  Phone,
  User,
  ExternalLink,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

// ─── Notify via WhatsApp Bot Modal ───────────────────────────────────────────
function NotifyModal({
  wishlist,
  onClose,
  onSuccess,
}: {
  wishlist: any;
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const buildDefaultMessage = (wl: any) => {
    const name = wl.customerName || "there";
    const items = (wl.items || [])
      .map((i: any) => (i.brandOrSize ? `${i.name} (${i.brandOrSize})` : i.name))
      .slice(0, 5)
      .join(", ");
    return `Hello ${name}! 👋 Great news! The items you requested on your shopping wishlist${items ? ` — *${items}*` : ""} — are now available in our store. 🛒\n\nVisit our app to order them now or simply reply here and we'll assist you right away! 🚀`;
  };

  const [message, setMessage] = useState(buildDefaultMessage(wishlist));
  const [sending, setSending] = useState(false);

  const rawPhone = wishlist.customerPhone || "";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
  const intlPhone = cleanPhone.startsWith("0") ? `234${cleanPhone.slice(1)}` : cleanPhone;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/whatsapp/conversations/${encodeURIComponent(cleanPhone)}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message.trim() }),
        }
      );
      const data = await res.json();
      if (data.status) {
        toast.success(`✅ WhatsApp notification sent to ${wishlist.customerName || cleanPhone}!`);
        onSuccess(wishlist._id);
        onClose();
      } else {
        const encoded = encodeURIComponent(message.trim());
        toast.error(`Bot unavailable: ${data.message || "Service error"}. Opening WhatsApp Web as fallback.`, { duration: 5000 });
        window.open(`https://wa.me/${intlPhone}?text=${encoded}`, "_blank");
        onClose();
      }
    } catch {
      const encoded = encodeURIComponent(message.trim());
      toast.warning("Bot service unreachable. Opening WhatsApp Web as fallback.", { duration: 5000 });
      window.open(`https://wa.me/${intlPhone}?text=${encoded}`, "_blank");
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-[#EFF0F6] bg-gradient-to-r from-[#1AB759]/10 to-emerald-50">
          <div className="w-10 h-10 rounded-xl bg-[#1AB759] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#14142B]">Send WhatsApp Notification</h3>
            <p className="text-xs text-[#6E7191] mt-0.5">Message will be sent via the WhatsApp bot directly</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 p-3 bg-[#F7F7FC] rounded-xl border border-[#EFF0F6]">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#14142B]">{wishlist.customerName || "Customer"}</p>
              <p className="text-xs text-[#6E7191] font-mono flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {rawPhone} → <span className="text-emerald-700 font-bold">+{intlPhone}</span>
              </p>
            </div>
          </div>

          {/* Wishlist items summary */}
          {(wishlist.items || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6E7191] mb-1.5">Requested Items</p>
              <div className="flex flex-wrap gap-1.5">
                {(wishlist.items || []).map((item: any, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    {item.name}{item.brandOrSize ? ` · ${item.brandOrSize}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message editor */}
          <div>
            <label className="block text-sm font-semibold text-[#14142B] mb-1.5">
              Notification Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-[#EFF0F6] text-sm text-[#14142B] focus:outline-none focus:border-[#1AB759] transition-colors resize-none leading-relaxed"
              placeholder="Type your message..."
            />
            <p className="text-[11px] text-[#A0A3BD] mt-1">Supports WhatsApp formatting: *bold*, _italic_, ~strikethrough~</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-[#EFF0F6] flex items-center justify-between gap-3">
          <a
            href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#6E7191] underline hover:text-[#14142B] flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Open in WhatsApp Web instead
          </a>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 h-10 rounded-xl border border-[#EFF0F6] text-[#6E7191] text-sm font-medium hover:bg-[#F7F7FC] transition-colors">Cancel</button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="px-5 h-10 rounded-xl bg-[#1AB759] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#159a4a] transition-colors disabled:opacity-60 shadow-md shadow-[#1AB759]/20"
            >
              {sending ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending...</>
              ) : (
                <><MessageSquare className="w-4 h-4" />Send via Bot</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ShoppingWishlistPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWishlist, setSelectedWishlist] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [notifyWishlist, setNotifyWishlist] = useState<any>(null);

  const { execute, data: wishlists, loading } = useApi();
  const { execute: updateWishlist } = useApi();
  const { execute: deleteWishlist } = useApi();

  const fetchWishlists = () => {
    execute("/api/admin/shopping-wishlist");
  };

  useEffect(() => {
    fetchWishlists();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateWishlist(`/api/admin/shopping-wishlist/${id}`, {
        method: "PUT",
        body: { status: newStatus },
        successMessage: `Wishlist marked as ${newStatus}`,
      });
      fetchWishlists();
    } catch {}
  };

  const handleDelete = (wl: any) => {
    setSelectedWishlist(wl);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedWishlist) {
      await deleteWishlist(`/api/admin/shopping-wishlist/${selectedWishlist._id}`, {
        method: "DELETE",
        successMessage: "Wishlist entry deleted",
      });
      fetchWishlists();
    }
  };

  const copyItemsToClipboard = (items: any[]) => {
    const text = items
      .map((i) => (i.brandOrSize ? `${i.name} (${i.brandOrSize})` : i.name))
      .join(", ");
    navigator.clipboard.writeText(text);
    toast.success("Items copied to clipboard!");
  };

  // Auto-mark wishlist as actioned after bot notification sent
  const handleNotifySuccess = async (id: string) => {
    try {
      await fetch(`/api/admin/shopping-wishlist/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "actioned" }),
      });
      fetchWishlists();
    } catch {}
  };

  const filteredWishlists = useMemo(() => {
    if (!wishlists || !Array.isArray(wishlists)) return [];

    return wishlists.filter((wl: any) => {
      if (selectedStatus !== "all" && wl.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nMatch = (wl.customerName || "").toLowerCase().includes(q);
        const pMatch = (wl.customerPhone || "").toLowerCase().includes(q);
        const rawMatch = (wl.rawInput || "").toLowerCase().includes(q);
        const itemMatch = (wl.items || []).some(
          (i: any) =>
            (i.name || "").toLowerCase().includes(q) ||
            (i.brandOrSize || "").toLowerCase().includes(q)
        );
        if (!nMatch && !pMatch && !rawMatch && !itemMatch) return false;
      }
      return true;
    });
  }, [wishlists, selectedStatus, searchQuery]);

  // Counts
  const totalCount = wishlists?.length || 0;
  const newCount = wishlists?.filter((w: any) => w.status === "new").length || 0;
  const reviewedCount = wishlists?.filter((w: any) => w.status === "reviewed").length || 0;
  const actionedCount = wishlists?.filter((w: any) => w.status === "actioned").length || 0;

  return (
    <div className="pb-16 space-y-6">
      {/* Metric Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ListPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">Total Lists</p>
            <h3 className="text-lg sm:text-xl font-bold text-[#14142B]">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">New Submissions</p>
            <h3 className="text-lg sm:text-xl font-bold text-amber-600">{newCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">In Review / Sourcing</p>
            <h3 className="text-lg sm:text-xl font-bold text-blue-600">{reviewedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">Stocked & Fulfilled</p>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-600">{actionedCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6]">
        {/* Header */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-[#14142B]">Customer Shopping Wishlists</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1AB759]/10 text-[#1AB759] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> WhatsApp Bot & Web
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6E7191] mt-0.5">
              Lists of frequently bought groceries submitted by prospective & registered customers to guide inventory restocking.
            </p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 sm:p-6 bg-[#FAFAFC] border-b border-[#EFF0F6] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Search by items, customer name, phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary w-full transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[160px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-medium text-[#14142B] w-full appearance-none cursor-pointer hover:border-primary/50 transition-colors"
              >
                <option value="all">All Statuses ({totalCount})</option>
                <option value="new">🟡 New Submissions ({newCount})</option>
                <option value="reviewed">🔵 Under Sourcing ({reviewedCount})</option>
                <option value="actioned">🟢 Stocked & Notified ({actionedCount})</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchQuery.trim() || selectedStatus !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setSelectedStatus("all"); }}
                className="h-10 px-3.5 rounded-xl border border-[#EFF0F6] bg-white hover:bg-gray-50 text-xs font-semibold text-[#6E7191] flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#6E7191] flex items-center gap-2">
            <span className="font-semibold text-[#14142B]">{filteredWishlists.length}</span>
            <span>of {totalCount} wishlists</span>
          </div>
        </div>

        {/* Wishlists Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Requested Items & Brands
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !wishlists ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6E7191]">
                    Loading wishlists...
                  </td>
                </tr>
              ) : filteredWishlists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#6E7191]">
                    <ShoppingBag className="w-12 h-12 text-[#D9DBE9] mx-auto mb-2" />
                    <p className="text-base font-semibold text-[#14142B] mb-1">No wishlists submitted yet</p>
                    <p className="text-xs text-[#A0A3BD]">
                      When customers text their often-bought items to the WhatsApp bot, they will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredWishlists.map((wl: any) => {
                  const items = Array.isArray(wl.items) ? wl.items : [];
                  return (
                    <tr key={wl._id} className="hover:bg-[#FAFAFC] transition-colors">
                      {/* Customer Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-[#14142B] flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span>{wl.customerName || "Prospective Customer"}</span>
                          </div>
                          {wl.customerPhone && (
                            <div className="text-xs text-[#6E7191] flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-[#A0A3BD]" />
                              <span>{wl.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Items & Brand specifics */}
                      <td className="px-6 py-4 whitespace-normal max-w-md">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((item: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F7F7FC] text-[#14142B] border border-[#EFF0F6]"
                              >
                                <span>{item.name}</span>
                                {item.brandOrSize && (
                                  <span className="text-[10px] text-[#6E7191] font-normal bg-white px-1.5 py-0.5 rounded border border-[#EFF0F6]">
                                    {item.brandOrSize}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                          {wl.rawInput && items.length === 0 && (
                            <p className="text-xs text-[#4E4B66] italic bg-[#FAFAFC] p-2 rounded-lg border border-[#EFF0F6]">
                              "{wl.rawInput}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            wl.source === "whatsapp"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {wl.source === "whatsapp" ? "📱 WhatsApp Bot" : "🌐 Web"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-[#6E7191]">
                        {new Date(wl.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={wl.status}
                          onChange={(e) => handleStatusChange(wl._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            wl.status === "actioned"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : wl.status === "reviewed"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <option value="new">🟡 New</option>
                          <option value="reviewed">🔵 Under Sourcing</option>
                          <option value="actioned">🟢 Stocked & Ready</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy List */}
                          {items.length > 0 && (
                            <button
                              onClick={() => copyItemsToClipboard(items)}
                              className="h-8 px-2.5 rounded-lg bg-[#F7F7FC] hover:bg-gray-100 text-[#4E4B66] text-xs font-semibold flex items-center gap-1 transition-colors border border-[#EFF0F6]"
                              title="Copy item list"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copy</span>
                            </button>
                          )}

                          {/* WhatsApp Notify Button */}
                          {wl.customerPhone && (
                            <button
                              onClick={() => setNotifyWishlist(wl)}
                              className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-200"
                              title="Send WhatsApp notification via bot"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Notify</span>
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(wl)}
                            className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors"
                            title="Delete Wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Shopping Wishlist"
        message={`Are you sure you want to delete this wishlist submission for ${selectedWishlist?.customerName || selectedWishlist?.customerPhone}?`}
      />

      {notifyWishlist && (
        <NotifyModal
          wishlist={notifyWishlist}
          onClose={() => setNotifyWishlist(null)}
          onSuccess={handleNotifySuccess}
        />
      )}
    </div>
  );
}
