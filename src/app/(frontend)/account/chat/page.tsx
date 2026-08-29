"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function ChatPage() {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/frontend/chat", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.status) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMessages();
      // Short-polling every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
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
      const res = await fetch("/api/frontend/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: msgText })
      });
      const data = await res.json();
      if (data.status) {
        setMessages([...messages, data.data]);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden flex flex-col h-[600px] max-h-[80vh]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#EFF0F6] flex items-center gap-3 bg-[#FAFAFC]">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-[#14142B]">Support Chat</h2>
          <p className="text-xs text-[#6E7191]">We typically reply in a few minutes.</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#F7F7FC]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#6E7191]">
            <MessageCircle className="w-12 h-12 text-[#A0A3BD] mb-3 opacity-50" />
            <p className="text-sm">No messages yet. Send a message to start a conversation with support.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderRole === "customer";
            return (
              <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe 
                      ? "bg-primary text-white rounded-tr-sm" 
                      : "bg-white border border-[#EFF0F6] text-[#14142B] rounded-tl-sm shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/70" : "text-[#A0A3BD]"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-[#EFF0F6]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 h-12 rounded-xl bg-[#FAFAFC] border border-[#EFF0F6] px-4 text-sm focus:outline-none focus:border-primary text-[#14142B]"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-rose-600 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
        </form>
      </div>
    </div>
  );
}
