"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Loader2, User } from "lucide-react";
import { toast } from "sonner";

export default function AdminMessagesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !["admin", "waiter", "chef"].includes(user.role)) { router.push("/admin/login"); return; }
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) setConversations(data.data || []);
    } catch { toast.error("Failed to load conversations"); }
    finally { setLoading(false); }
  };

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    try {
      const res = await fetch(`/api/admin/messages/${conv._id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) setMessages(data.data || []);
    } catch {}
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");
    try {
      const res = await fetch(`/api/admin/messages/${activeConv._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.status) {
        setMessages(prev => [...prev, { ...data.data, isAdmin: true }]);
      }
    } catch { toast.error("Failed to send message"); setNewMessage(text); }
    finally { setSending(false); }
  };

  return (
    <div className="db-main min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="db-breadcrumb mb-6">
          <h1 className="db-breadcrumb-title">Messages</h1>
          <nav className="db-breadcrumb-list text-sm text-[#6e7191]">
            <span>Admin</span><span className="mx-1.5">/</span>
            <span style={{ color: "#ff006b" }}>Messages</span>
          </nav>
        </div>

        <div className="db-card overflow-hidden" style={{ height: "600px" }}>
          <div className="flex h-full">
            {/* Conversation List */}
            <div className="w-72 border-r border-[#eff0f6] flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-[#eff0f6]">
                <h3 className="text-sm font-semibold text-[#14142b]">Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#ff006b" }} />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#a0a3bd]">No conversations yet</div>
                ) : conversations.map(conv => (
                  <button key={conv._id} onClick={() => openConversation(conv)}
                    className={`w-full p-3.5 flex items-center gap-3 hover:bg-[#f7f7fc] transition-all border-b border-[#eff0f6] text-left ${activeConv?._id === conv._id ? "bg-[#fff0f6]" : ""}`}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: "#ff006b" }}>
                      {conv.customerName?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#14142b] truncate capitalize">{conv.customerName || "Customer"}</p>
                      <p className="text-xs text-[#a0a3bd] truncate">{conv.lastMessage || "No messages"}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#ff006b" }}>{conv.unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-[#eff0f6] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: "#ff006b" }}>
                      {activeConv.customerName?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#14142b] capitalize">{activeConv.customerName || "Customer"}</p>
                      <p className="text-xs text-[#a0a3bd]">Customer</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.isAdmin
                          ? "text-white rounded-br-sm"
                          : "bg-white border border-[#eff0f6] text-[#14142b] rounded-bl-sm"
                        }`}
                          style={msg.isAdmin ? { backgroundColor: "#ff006b" } : {}}>
                          {msg.message}
                          <p className={`text-[10px] mt-1 ${msg.isAdmin ? "opacity-70 text-right" : "text-[#a0a3bd]"}`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-[#eff0f6] flex items-center gap-3">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="db-field-control flex-1 h-10 text-sm" />
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-50"
                      style={{ backgroundColor: "#ff006b" }}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#fff0f6] flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8" style={{ color: "#ff006b" }} />
                  </div>
                  <p className="text-sm font-semibold text-[#14142b]">Select a conversation</p>
                  <p className="text-xs text-[#a0a3bd] mt-1">Choose from the list to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
