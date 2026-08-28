"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingStore } from "@/store/useSettingStore";
import { MessageSquare, Send, Building } from "lucide-react";
import { toast } from "sonner";

export default function CustomerChatPage() {
  const { user } = useAuthStore();
  const { activeBranch } = useSettingStore();

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([
    {
      _id: "1",
      senderRole: "branch_manager",
      message: "Hello! Welcome to FoodAppi. How can we assist you with your order today?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/frontend/branches");
      const data = await res.json();
      if (data.status && data.branches) {
        setBranches(data.branches);
        if (data.branches[0]) {
          setSelectedBranchId(activeBranch?._id || data.branches[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgObj = {
      _id: Date.now().toString(),
      senderRole: "customer",
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, msgObj]);
    setNewMessage("");
    toast.success("Message sent to Branch Manager!");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#eff0f6] shadow-sm space-y-4 flex flex-col h-[70vh]">
        {/* Header & Branch Select */}
        <div className="flex items-center justify-between border-b border-[#eff0f6] pb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[#ff006b]" />
            <h1 className="text-lg font-bold text-[#14142b]">Chat with Branch Manager</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-[#a0a3bd]" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-1.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-xs font-semibold text-[#6e7191]"
            >
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {messages.map((msg) => {
            const isCustomer = msg.senderRole === "customer";
            return (
              <div
                key={msg._id}
                className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-md p-3.5 rounded-2xl text-xs font-medium space-y-1 ${
                    isCustomer
                      ? "text-white rounded-tr-none"
                      : "bg-[#f7f7fc] text-[#14142b] border border-[#eff0f6] rounded-tl-none"
                  }`}
                  style={isCustomer ? { backgroundColor: "#ff006b" } : {}}
                >
                  <p className="font-bold text-[10px] opacity-80 capitalize">
                    {isCustomer ? "You" : "Branch Manager"}
                  </p>
                  <p>{msg.message}</p>
                  <p className="text-[9px] opacity-60 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Send Input Box */}
        <form onSubmit={handleSendMessage} className="border-t border-[#eff0f6] pt-3 flex space-x-2">
          <input
            type="text"
            placeholder="Type your message to branch manager..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#f7f7fc] border border-[#eff0f6] rounded-xl text-sm font-medium text-[#14142b] focus:outline-none focus:border-[#ff006b] focus:bg-white transition-all"
          />
          <button
            type="submit"
            className="text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center space-x-1"
            style={{ backgroundColor: "#ff006b" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
