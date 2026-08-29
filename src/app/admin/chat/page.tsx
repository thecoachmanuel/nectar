"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, CheckCircle, Trash2, Search, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function AdminChatPage() {
  const { token, activeAdminStoreId } = useAuthStore();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // We can filter by store id if needed, but for now we fetch all open/resolved threads
  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/admin/chat", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status) {
        setThreads(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThreads(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/admin/chat?threadId=${threadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchThreads();
      const interval = setInterval(() => {
        fetchThreads();
        if (activeThread) fetchMessages(activeThread._id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token, activeThread]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSelectThread = (thread: any) => {
    setActiveThread(thread);
    setLoadingMessages(true);
    fetchMessages(thread._id).finally(() => setLoadingMessages(false));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeThread) return;

    const msgText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: msgText, threadId: activeThread._id })
      });
      const data = await res.json();
      if (data.status) {
        setMessages([...messages, data.data]);
        fetchThreads(); // update last message in list
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSending(false);
    }
  };

  const handleAction = async (action: "resolve" | "delete") => {
    if (!activeThread) return;
    
    if (action === "delete" && !confirm("Are you sure you want to permanently delete this chat thread?")) {
      return;
    }
    
    try {
      const res = await fetch("/api/admin/chat", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ threadId: activeThread._id, action })
      });
      const data = await res.json();
      if (data.status) {
        toast.success(data.message);
        setActiveThread(null);
        fetchThreads();
      } else {
        toast.error(data.message || `Failed to ${action} thread`);
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden flex h-[700px] max-h-[85vh]">
      
      {/* Sidebar - Threads List */}
      <div className={`w-full md:w-[320px] lg:w-[380px] border-r border-[#EFF0F6] flex flex-col ${activeThread ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[#EFF0F6] bg-[#FAFAFC]">
          <h2 className="font-bold text-[#14142B] text-lg mb-3">Support Chats</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {loadingThreads ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center p-8 text-[#6E7191] text-sm">
              No active conversations.
            </div>
          ) : (
            threads.map((t) => (
              <div 
                key={t._id}
                onClick={() => handleSelectThread(t)}
                className={`p-4 border-b border-[#EFF0F6] cursor-pointer hover:bg-[#FAFAFC] transition-colors ${activeThread?._id === t._id ? 'bg-[#fff5f9] border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-[#14142B] text-sm truncate pr-2">
                    {t.customerName || "Customer"} 
                    <span className="text-xs font-normal text-[#6E7191] ml-1">({t.senderRole})</span>
                  </h4>
                  <span className="text-[10px] text-[#A0A3BD] whitespace-nowrap">
                    {new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#6E7191] truncate">{t.lastMessage}</p>
                
                {t.status === "resolved" && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-[#E0FFED] text-[#1AB759]">
                    Resolved
                  </span>
                )}
                {t.status === "open" && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FFF4E5] text-[#FF9F43]">
                    Open
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#F7F7FC] ${!activeThread ? 'hidden md:flex' : 'flex'}`}>
        {!activeThread ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#6E7191]">
            <MessageCircle className="w-16 h-16 text-[#A0A3BD] mb-4 opacity-30" />
            <p className="text-[#14142B] font-medium mb-1">Select a conversation</p>
            <p className="text-sm">Choose a chat from the left panel to view and reply.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-[72px] p-4 border-b border-[#EFF0F6] bg-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveThread(null)}
                  className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-[#FAFAFC] text-[#14142B]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {activeThread.customerName?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <h3 className="font-bold text-[#14142B] text-sm">
                    {activeThread.customerName || "Customer"}
                  </h3>
                  <p className="text-xs text-[#6E7191]">{activeThread.customerEmail || "No email"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleAction("resolve")}
                  className="px-3 py-1.5 rounded-lg border border-[#EFF0F6] bg-white text-[#14142B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E0FFED] hover:border-[#1AB759] hover:text-[#1AB759] transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resolve</span>
                </button>
                <button 
                  onClick={() => handleAction("delete")}
                  className="px-3 py-1.5 rounded-lg border border-[#EFF0F6] bg-white text-[#14142B] text-xs font-semibold flex items-center gap-1.5 hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAdmin = msg.senderRole === "admin" || msg.senderRole === "store_manager";
                  return (
                    <div key={idx} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div 
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isAdmin 
                            ? "bg-primary text-white rounded-tr-sm" 
                            : "bg-white border border-[#EFF0F6] text-[#14142B] rounded-tl-sm shadow-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isAdmin ? "text-white/70" : "text-[#A0A3BD]"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-[#EFF0F6]">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
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
          </>
        )}
      </div>

    </div>
  );
}
