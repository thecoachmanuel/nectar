"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Trash2,
  Send,
  Eye,
  Mail,
  User,
  Calendar,
  X,
  Reply,
  CheckCircle2,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (data.status && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (data.status) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === id ? { ...msg, isRead: true } : msg))
        );
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage({ ...selectedMessage, isRead: true });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status) {
        toast.success("Message deleted successfully");
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
        if (selectedMessage?._id === id) {
          setSelectedMessage(null);
        }
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const q = searchQuery.toLowerCase();
    return (
      msg.name?.toLowerCase().includes(q) ||
      msg.email?.toLowerCase().includes(q) ||
      msg.subject?.toLowerCase().includes(q) ||
      msg.message?.toLowerCase().includes(q)
    );
  });

  const handleView = (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      handleMarkRead(msg._id);
    }
  };

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div>
            <h3 className="font-bold text-lg text-[#14142B]">Customer Contact Messages</h3>
            <p className="text-xs text-[#6E7191] mt-0.5">
              Messages received through the Contact Us form on your website.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-60 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Sender</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Subject & Message</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Received</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {filteredMessages.map((message) => (
                <tr 
                  key={message._id} 
                  className={`hover:bg-[#FAFAFC] transition-colors cursor-pointer ${!message.isRead ? 'bg-[#fff5f9]/40' : ''}`}
                  onClick={() => handleView(message)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${!message.isRead ? 'bg-primary text-white' : 'bg-[#EFF0F6] text-[#4E4B66]'}`}>
                        {message.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span className={`text-sm ${!message.isRead ? 'font-bold text-[#14142B]' : 'font-medium text-[#4E4B66]'}`}>
                        {message.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{message.email}</span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <span className={`block text-sm truncate ${!message.isRead ? 'font-bold text-[#14142B]' : 'font-medium text-[#4E4B66]'}`}>
                      {message.subject}
                    </span>
                    <p className="text-xs text-[#6E7191] truncate max-w-xs">{message.message}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[#6E7191]">{new Date(message.createdAt).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${!message.isRead ? 'bg-[#FFF4E5] text-[#FF9F43]' : 'bg-[#E0FFED] text-[#1AB759]'}`}>
                      {!message.isRead ? 'Unread' : 'Read'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleView(message)}
                        className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] inline-flex items-center justify-center hover:bg-[#e5ebff] transition-colors"
                        title="View Message"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(message._id)}
                        className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] inline-flex items-center justify-center hover:bg-[#FFEAEA] transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMessages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6E7191]">
                    {loading ? "Loading messages..." : "No messages found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#EFF0F6] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFF0F6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#14142B]">Message Details</h3>
                  <span className="text-xs text-[#6E7191] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-8 h-8 rounded-full bg-[#F7F7FC] text-[#6E7191] hover:text-[#14142B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F7F7FC]">
                <div>
                  <span className="block text-[11px] font-semibold text-[#A0A3BD] uppercase tracking-wider">From</span>
                  <span className="text-sm font-bold text-[#14142B]">{selectedMessage.name}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-[#A0A3BD] uppercase tracking-wider">Email</span>
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm font-bold text-primary hover:underline truncate block">
                    {selectedMessage.email}
                  </a>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#14142B] uppercase tracking-wider mb-1">Subject</span>
                <p className="text-sm font-semibold text-[#14142B] bg-[#FAFAFC] p-3 rounded-xl border border-[#EFF0F6]">
                  {selectedMessage.subject}
                </p>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#14142B] uppercase tracking-wider mb-1">Message</span>
                <div className="text-sm text-[#4E4B66] bg-[#FAFAFC] p-4 rounded-xl border border-[#EFF0F6] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#EFF0F6]">
              <button
                onClick={() => handleDelete(selectedMessage._id)}
                className="px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#e60060] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply by Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
