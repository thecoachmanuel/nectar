"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, Undo2, Headphones, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore, getWhatsAppNumber } from "@/store/useSettingsStore";
import { toast } from "sonner";
import Link from "next/link";
import { formatTime } from "@/lib/formatters";

// Official WhatsApp icon SVG component
const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`fill-current shrink-0 ${className}`} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function ChatPage() {
  const { user, token, isGuest, guestInfo } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Determine Customer Name:
  // Properly captured for registered users, or welcomed as "Guest" if not registered
  const customerName =
    user?.name?.trim() ||
    (isGuest && guestInfo?.name && guestInfo.name.toLowerCase() !== "guest"
      ? guestInfo.name.trim()
      : "Guest");

  // Fetch business settings for WhatsApp number
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Clean WhatsApp phone number formatting (defaults to 2348144611443)
  const cleanWaNumber = getWhatsAppNumber(settings);

  // Pre-filled WhatsApp message
  const waPreFillMessage =
    customerName !== "Guest"
      ? `Hello Errandshop Support, my name is ${customerName}. I need assistance with my order / inquiry.`
      : `Hello Errandshop Support, I need assistance with an inquiry.`;

  const waLink = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waPreFillMessage)}`;

  // Guest identifier stored in localStorage to maintain continuous chat thread for visitors
  const getGuestId = () => {
    if (typeof window === "undefined") return "";
    let gid = localStorage.getItem("errandshop_guest_chat_id");
    if (!gid) {
      gid = "guest_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem("errandshop_guest_chat_id", gid);
    }
    return gid;
  };

  const fetchMessages = async () => {
    try {
      const headers: Record<string, string> = {};
      let url = "/api/frontend/chat";

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        const guestId = getGuestId();
        headers["x-guest-id"] = guestId;
        url = `/api/frontend/chat?guestId=${encodeURIComponent(guestId)}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.status && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 5 seconds for replies from admin/support agent
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const msgText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const bodyPayload: any = { message: msgText };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        const guestId = getGuestId();
        headers["x-guest-id"] = guestId;
        bodyPayload.guestId = guestId;
      }

      const res = await fetch("/api/frontend/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data.status) {
        setMessages((prev) => [...prev, data.data]);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again or chat on WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs text-[#6E7191]">Connecting to Errandshop Support...</p>
      </div>
    );
  }

  return (
    <section className="pt-6 pb-16 bg-[#f7f7fc] min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            <span>Back to home</span>
          </Link>

          <span className="text-xs text-[#6E7191]">
            Chatting as:{" "}
            <strong className="text-[#14142B] capitalize">
              {customerName}
            </strong>
          </span>
        </div>

        {/* Main Support Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#EFF0F6] overflow-hidden flex flex-col h-[calc(100vh-140px)] max-h-[820px]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#EFF0F6] flex items-center justify-between bg-[#FAFAFC]">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Headphones className="w-5 h-5" />
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#1AB759] border-2 border-white"
                  title="Online"
                />
              </div>
              <div>
                <h2 className="font-bold text-[#14142B] text-base leading-tight">
                  Contact Support
                </h2>
                <p className="text-xs text-[#6E7191] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1AB759] inline-block animate-ping" />
                  Live Chat Agent • Errandshop Support Team
                </p>
              </div>
            </div>

            {/* Header WhatsApp Quick Access */}
            {cleanWaNumber && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] text-[#0d7335] hover:text-white font-bold text-xs transition-all border border-[#25D366]/30 shadow-xs"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp DM</span>
              </a>
            )}
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#F7F7FC]">
            {/* 1. Official Automated Live Support Welcome Message */}
            <div className="flex justify-start">
              <div className="max-w-[95%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-[#EFF0F6] p-4 sm:p-5 shadow-sm text-[#14142B] space-y-3.5">
                {/* Agent Header Identity */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#EFF0F6]">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#14142B] flex items-center gap-1.5">
                      <span>Errandshop Support</span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        Agent
                      </span>
                    </p>
                    <p className="text-[11px] text-[#6E7191]">Live Support Agent • Auto Greeting</p>
                  </div>
                </div>

                {/* Welcome Message Text exactly as requested */}
                <div className="space-y-2.5 text-sm text-[#14142B] leading-relaxed">
                  <p className="font-bold text-base text-[#14142B]">
                    Hello, {customerName}! 👋
                  </p>
                  <p className="text-[#323447]">
                    Welcome to Errandshop Support. A customer service representative will attend to you shortly.
                  </p>
                  <p className="text-[#323447]">
                    If your enquiry is urgent, you can chat with us directly on WhatsApp for faster assistance.
                  </p>
                  <p className="font-semibold text-primary">
                    Thank you for choosing Errandshop!
                  </p>
                </div>

                {/* Prominent WhatsApp Button */}
                {cleanWaNumber && (
                  <div className="pt-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm shadow-md shadow-[#25D366]/25 hover:shadow-lg hover:shadow-[#25D366]/35 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <WhatsAppIcon className="w-5 h-5 text-white" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Customer & Agent Chat History */}
            {messages.map((msg, idx) => {
              const isMe = msg.senderRole === "customer";
              return (
                <div
                  key={idx}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-white rounded-tr-sm shadow-sm"
                        : "bg-white border border-[#EFF0F6] text-[#14142B] rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {!isMe && (
                      <div className="text-[11px] font-bold text-primary mb-1 flex items-center gap-1">
                        <span>Customer Service Agent</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p
                      className={`text-[10px] mt-1.5 text-right ${
                        isMe ? "text-white/70" : "text-[#A0A3BD]"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>

          {/* Chat Input & Prompt */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-[#EFF0F6]">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message to Errandshop Support..."
                className="flex-1 h-12 rounded-xl bg-[#FAFAFC] border border-[#EFF0F6] px-4 text-sm focus:outline-none focus:border-primary text-[#14142B] placeholder:text-[#A0A3BD] transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-sm shadow-primary/20"
                title="Send Message"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </form>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#A0A3BD] px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Live representative available
              </span>
              {cleanWaNumber && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <WhatsAppIcon className="w-3 h-3" />
                  Urgent? WhatsApp DM
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
