"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Send,
  RefreshCw,
  User,
  Bot,
  UserCheck,
  PauseCircle,
  PlayCircle,
  ShoppingBag,
  ExternalLink,
  Phone,
  Check,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  PowerOff,
  Power,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Conversation {
  phone: string;
  customerName: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  lastSender: "customer" | "business" | "bot";
  isBotPaused: boolean;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  sender: "customer" | "business" | "bot";
  text: string;
  timestamp: string;
}

interface RecentOrder {
  id: string;
  orderSerialNo: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export default function WhatsAppChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [activeCustomerName, setActiveCustomerName] = useState<string>("Customer");
  const [isBotPaused, setIsBotPaused] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [togglingBot, setTogglingBot] = useState<boolean>(false);

  // ─── Global Chat Feature Pause State ───────────────────────────────────────
  /** true  = admin has paused the entire WhatsApp Live Chat Inbox globally */
  const [globalChatPaused, setGlobalChatPaused] = useState<boolean>(true);
  const [loadingGlobalState, setLoadingGlobalState] = useState<boolean>(true);
  const [togglingGlobal, setTogglingGlobal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Fetch global pause state on mount ─────────────────────────────────────
  const fetchGlobalChatState = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/chat-toggle", { cache: "no-store" });
      const data = await res.json();
      if (data.status) {
        setGlobalChatPaused(!!data.paused);
      }
    } catch {
      // default stays paused on error
    } finally {
      setLoadingGlobalState(false);
    }
  }, []);

  // ─── Toggle global chat pause ───────────────────────────────────────────────
  const handleToggleGlobalChat = async () => {
    if (togglingGlobal) return;
    const nextPaused = !globalChatPaused;
    setTogglingGlobal(true);
    try {
      const res = await fetch("/api/admin/whatsapp/chat-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: nextPaused }),
      });
      const data = await res.json();
      if (data.status) {
        setGlobalChatPaused(data.paused);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to toggle chat feature");
      }
    } catch (err: any) {
      toast.error(err.message || "Error toggling chat feature");
    } finally {
      setTogglingGlobal(false);
    }
  };

  // Fetch list of conversations
  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const res = await fetch("/api/admin/whatsapp/conversations");
      const data = await res.json();
      if (data.status && Array.isArray(data.data)) {
        setConversations(data.data);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load conversations");
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, []);

  // Fetch message history for selected customer phone
  const fetchMessages = useCallback(async (phone: string, silent = false) => {
    if (!phone) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${phone}`);
      const data = await res.json();
      if (data.status && data.data) {
        setMessages(data.data.messages || []);
        setActiveCustomerName(data.data.customerName || "Customer");
        setIsBotPaused(!!data.data.isBotPaused);
        setRecentOrders(data.data.recentOrders || []);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load messages");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGlobalChatState();
  }, [fetchGlobalChatState]);

  useEffect(() => {
    // Only load conversations when feature is active
    if (!loadingGlobalState && !globalChatPaused) {
      fetchConversations();
    } else if (!loadingGlobalState && globalChatPaused) {
      setLoadingConversations(false);
    }
  }, [loadingGlobalState, globalChatPaused, fetchConversations]);

  // Load messages when active phone changes
  useEffect(() => {
    if (activePhone && !globalChatPaused) {
      fetchMessages(activePhone);
    }
  }, [activePhone, fetchMessages, globalChatPaused]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Live polling every 4 seconds — only when feature is active
  useEffect(() => {
    if (globalChatPaused) return; // don't poll when paused
    const interval = setInterval(() => {
      fetchConversations(true);
      if (activePhone) {
        fetchMessages(activePhone, true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activePhone, fetchConversations, fetchMessages, globalChatPaused]);

  // Send admin message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activePhone || sending || globalChatPaused) return;

    const text = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${activePhone}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.status) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.data?.id || `temp_${Date.now()}`,
            sender: "business",
            text,
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsBotPaused(true);
        fetchConversations(true);
        inputRef.current?.focus();
      } else {
        toast.error(data.message || "Failed to send message");
        setMessageInput(text); // restore
      }
    } catch (err: any) {
      toast.error(err.message || "Error sending message");
      setMessageInput(text);
    } finally {
      setSending(false);
    }
  };

  // Toggle Bot Pause / Resume (per-conversation)
  const handleToggleBot = async () => {
    if (!activePhone || togglingBot) return;
    const action = isBotPaused ? "resume" : "pause";
    setTogglingBot(true);

    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${activePhone}/toggle-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.status) {
        setIsBotPaused(data.isBotPaused);
        toast.success(
          data.isBotPaused
            ? "Bot paused for 2 hours (Human reply mode)"
            : "Bot resumed (Automated ordering active)"
        );
        fetchConversations(true);
      } else {
        toast.error(data.message || "Failed to toggle bot");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating bot mode");
    } finally {
      setTogglingBot(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="pb-12 space-y-4 animate-in fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#14142B] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            WhatsApp Live Chat Inbox
          </h2>
          <p className="text-sm text-[#6E7191]">
            Chat with customers in real-time. The bot auto-pauses when you reply so you can chat naturally.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/whatsapp"
            className="px-3.5 py-2 rounded-xl border border-[#EFF0F6] bg-white text-xs font-semibold text-[#14142B] hover:bg-[#F7F7FC] transition-colors flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-primary" />
            Bot Connection &amp; QR
          </Link>

          {/* ── Global Chat Pause/Unpause Toggle ── */}
          <button
            onClick={handleToggleGlobalChat}
            disabled={togglingGlobal || loadingGlobalState}
            title={
              globalChatPaused
                ? "Click to enable the WhatsApp Live Chat Inbox"
                : "Click to pause the WhatsApp Live Chat Inbox (order notifications unaffected)"
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm border ${
              globalChatPaused
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20"
                : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {togglingGlobal ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : globalChatPaused ? (
              <Power className="w-3.5 h-3.5" />
            ) : (
              <PowerOff className="w-3.5 h-3.5" />
            )}
            {globalChatPaused ? "Enable Live Chat" : "Pause Live Chat"}
          </button>

          <button
            onClick={() => {
              fetchConversations();
              if (activePhone) fetchMessages(activePhone);
            }}
            disabled={globalChatPaused}
            className="p-2 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] hover:text-[#14142B] hover:bg-[#F7F7FC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Refresh Chats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Global Paused Banner ─────────────────────────────────────────────── */}
      {!loadingGlobalState && globalChatPaused && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center shadow-sm">
          {/* Decorative glow blobs */}
          <div className="pointer-events-none absolute -top-8 -left-8 w-40 h-40 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-orange-200/40 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-600 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-1">
                WhatsApp Live Chat is Paused
              </h3>
              <p className="text-sm text-amber-700 max-w-md mx-auto">
                The admin Live Chat inbox is currently <strong>disabled</strong>. Customers&apos; automated
                order updates &amp; WhatsApp notifications continue to work normally.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Order notifications: Active
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Live chat inbox: Paused
              </div>
            </div>

            <button
              onClick={handleToggleGlobalChat}
              disabled={togglingGlobal}
              className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60"
            >
              {togglingGlobal ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              Enable Live Chat Inbox
            </button>

            <p className="text-[11px] text-amber-600 mt-1">
              Only super admins can enable or pause the live chat feature.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Chat Interface (only shown when feature is active) ─────────── */}
      {!loadingGlobalState && !globalChatPaused && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden flex flex-col md:flex-row h-[75vh] min-h-[550px]">

          {/* LEFT COLUMN: Conversations List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-[#EFF0F6] flex flex-col bg-white ${activePhone ? 'hidden md:flex' : 'flex'}`}>

            {/* Search Header */}
            <div className="p-3.5 border-b border-[#EFF0F6] bg-[#FAFAFC]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name, phone, or text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#EFF0F6] bg-white text-xs focus:outline-none focus:border-primary transition-colors"
                />
                <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#EFF0F6] custom-scrollbar">
              {loadingConversations ? (
                <div className="p-8 text-center text-xs text-[#6E7191] space-y-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading chats...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[#6E7191]">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">No WhatsApp chats found yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">When customers message your WhatsApp, chats will appear here automatically.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = activePhone === conv.phone;
                  return (
                    <button
                      key={conv.phone}
                      onClick={() => setActivePhone(conv.phone)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 hover:bg-[#F7F7FC] ${
                        isActive ? "bg-emerald-50/70 border-l-4 border-emerald-500" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                        {conv.customerName ? conv.customerName.charAt(0).toUpperCase() : "C"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-semibold text-xs text-[#14142B] truncate">
                            {conv.customerName || conv.phone}
                          </h4>
                          <span className="text-[10px] text-[#A0A3BD] shrink-0">
                            {formatTimeAgo(conv.lastMessageTimestamp)}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#6E7191] font-mono mb-1">
                          +{conv.phone}
                        </p>

                        <p className="text-xs text-[#4E4B66] truncate flex items-center gap-1">
                          {conv.lastSender === "business" && (
                            <span className="text-emerald-600 font-medium">You: </span>
                          )}
                          {conv.lastSender === "bot" && (
                            <span className="text-purple-600 font-medium">Bot: </span>
                          )}
                          <span>{conv.lastMessage || "No message content"}</span>
                        </p>

                        {/* Bot Status Badge */}
                        <div className="mt-1.5 flex items-center gap-2">
                          {conv.isBotPaused ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Human Mode (Paused)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Bot Active
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Chat Window */}
          <div className={`flex-1 flex flex-col bg-[#F7F7FC]/40 ${!activePhone ? 'hidden md:flex' : 'flex'}`}>
            {activePhone ? (
              <>
                {/* Chat Window Header */}
                <div className="p-3.5 sm:p-4 bg-white border-b border-[#EFF0F6] flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setActivePhone(null)}
                      className="p-1.5 rounded-lg border border-[#EFF0F6] hover:bg-[#F7F7FC] md:hidden text-[#6E7191]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {activeCustomerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#14142B] truncate">
                        {activeCustomerName}
                      </h3>
                      <p className="text-xs text-[#6E7191] font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-500" />
                        +{activePhone}
                      </p>
                    </div>
                  </div>

                  {/* Right controls: Bot Mode Toggle Switch */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleBot}
                      disabled={togglingBot}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                        isBotPaused
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                          : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                      }`}
                      title={isBotPaused ? "Click to resume automated ordering bot" : "Click to pause bot so you can chat freely"}
                    >
                      {isBotPaused ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Resume Bot</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Pause Bot (Chat)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Recent Orders Bar (Customer Context) */}
                {recentOrders.length > 0 && (
                  <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-medium">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Recent Order:</span>
                      <span className="font-bold">#{recentOrders[0].orderSerialNo}</span>
                      <span>(₦{Number(recentOrders[0].totalAmount || 0).toLocaleString()})</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-emerald-200 font-semibold uppercase">
                        {recentOrders[0].orderStatus}
                      </span>
                    </div>

                    <Link
                      href="/admin/orders"
                      className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      View All Orders <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* Chat Messages Timeline */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {loadingMessages ? (
                    <div className="p-8 text-center text-xs text-[#6E7191] space-y-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-8 text-center text-[#6E7191]">
                      <p className="text-xs">No chat messages yet for this customer.</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isCustomer = msg.sender === "customer";
                      const isBot = msg.sender === "bot";
                      const isBusiness = msg.sender === "business";

                      return (
                        <div
                          key={msg.id || i}
                          className={`flex flex-col ${
                            isCustomer ? "items-start" : "items-end"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                              isCustomer
                                ? "bg-white text-[#14142B] border border-[#EFF0F6] rounded-tl-sm"
                                : isBot
                                ? "bg-purple-50 text-purple-950 border border-purple-200 rounded-tr-sm"
                                : "bg-emerald-600 text-white rounded-tr-sm shadow-emerald-600/10"
                            }`}
                          >
                            {/* Sender Label */}
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold opacity-75">
                              {isCustomer && (
                                <>
                                  <User className="w-3 h-3" />
                                  <span>{activeCustomerName}</span>
                                </>
                              )}
                              {isBot && (
                                <>
                                  <Bot className="w-3 h-3 text-purple-600" />
                                  <span className="text-purple-700">🤖 Automated Bot</span>
                                </>
                              )}
                              {isBusiness && (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>Store Admin (You)</span>
                                </>
                              )}
                            </div>

                            <p>{msg.text}</p>
                          </div>

                          <span className="text-[10px] text-[#A0A3BD] mt-1 px-1">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Emoji Bar */}
                <div className="px-4 py-1.5 bg-white border-t border-[#EFF0F6] flex items-center gap-1 overflow-x-auto">
                  <span className="text-[11px] text-[#A0A3BD] mr-1">Quick:</span>
                  {["👍", "✅", "🥦", "🥑", "📦", "🚚", "🙏", "❤️"].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => addEmoji(em)}
                      className="p-1 hover:bg-slate-100 rounded text-sm transition-transform active:scale-125"
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Reply Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3.5 bg-white border-t border-[#EFF0F6] flex items-end gap-2"
                >
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a reply to customer on WhatsApp... (Enter to send)"
                    rows={2}
                    className="flex-1 p-2.5 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-xs focus:outline-none focus:border-emerald-500 focus:bg-white resize-none transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#6E7191]">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-[#14142B] mb-1">
                  Select a Conversation
                </h3>
                <p className="text-xs max-w-sm">
                  Choose a customer from the left sidebar to view their WhatsApp chat history and reply directly.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Loading skeleton while fetching global state */}
      {loadingGlobalState && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] h-[75vh] min-h-[550px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#6E7191]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading chat settings...</p>
          </div>
        </div>
      )}

    </div>
  );
}
