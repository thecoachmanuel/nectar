"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Undo2, Image as ImageIcon, Send } from "lucide-react";

export default function ChatPage() {
  const [branches] = useState([
    { id: 1, name: "Central Branch" },
    { id: 2, name: "Downtown Branch" }
  ]);
  const [activeBranch, setActiveBranch] = useState(1);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can we help you?", isUser: false, time: "10:00 AM", senderName: "Central Branch" },
    { id: 2, text: "I have a question about my order.", isUser: true, time: "10:05 AM" }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setMessages([
      ...messages,
      {
        id: Date.now(),
        text: inputText,
        isUser: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputText("");
  };

  return (
    <section className="pt-5 sm:py-6 bg-[#f7f7fc] min-h-screen flex flex-col">
      <div className="container mx-auto max-w-3xl px-0 sm:px-4 flex-1 flex flex-col h-[calc(100vh-100px)]">
        
        <div className="px-4 sm:px-0 mb-3">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-rose-600 transition-colors">
            <Undo2 className="w-4 h-4" />
            <span className="text-xs font-medium leading-6">Back to home</span>
          </Link>
        </div>

        <div className="sm:rounded-2xl sm:shadow-sm bg-white border border-[#eff0f6] flex-1 flex flex-col overflow-hidden">
          
          {/* Branches Swiper */}
          {branches.length > 1 && (
            <div className="p-3 border-b border-[#eff0f6] flex gap-3 overflow-x-auto hide-scrollbar">
              {branches.map(branch => (
                <button 
                  key={branch.id}
                  onClick={() => setActiveBranch(branch.id)}
                  className={`py-2 px-4 rounded-xl text-center text-sm whitespace-nowrap transition-colors ${activeBranch === branch.id ? 'bg-primary text-white shadow-md' : 'bg-[#f7f7fc] text-[#14142b] hover:bg-[#fff5f9] hover:text-primary'}`}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                {!msg.isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#D6F5FF] flex-shrink-0 mr-3 flex items-center justify-center text-[#008BBA] font-bold text-xs">
                    {msg.senderName?.charAt(0) || "A"}
                  </div>
                )}
                
                <div className={`max-w-[75%] flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl ${msg.isUser ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-[#eff0f6] text-[#14142b] rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {!msg.isUser && msg.senderName && (
                      <span className="text-[10px] text-[#6e7191]">Reply from {msg.senderName}</span>
                    )}
                    <span className="text-[10px] text-[#a0a3bd]">{msg.time}</span>
                  </div>
                </div>

                {msg.isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#fff5f9] border border-primary/20 flex-shrink-0 ml-3 flex items-center justify-center text-primary font-bold text-xs">
                    U
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-[#eff0f6] bg-white flex items-center gap-3">
            <button type="button" className="text-[#a0a3bd] hover:text-primary transition-colors p-2 bg-[#f7f7fc] rounded-full">
              <ImageIcon className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 bg-[#f7f7fc] border border-[#eff0f6] rounded-full px-5 text-sm focus:outline-none focus:border-primary transition-colors text-[#14142b]"
            />
            <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20">
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>

        </div>
      </div>
    </section>
  );
}
