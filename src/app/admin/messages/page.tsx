"use client";

import React, { useState } from "react";
import { 
  Search, 
  Trash2,
  Send,
  Eye
} from "lucide-react";

export default function MessagesPage() {

  // Mock data
  const messages = [
    { id: 1, name: "Customer Service", subject: "Refund Request", email: "john@example.com", date: "Oct 12, 2026", status: "Unread" },
    { id: 2, name: "Partnership", subject: "Vendor Inquiry", email: "vendor@example.com", date: "Oct 10, 2026", status: "Read" },
  ];

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Messages</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Subject..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-48 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button className="h-10 px-4 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20">
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Compose</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {messages.map((message) => (
                <tr key={message.id} className={`hover:bg-[#FAFAFC] transition-colors ${message.status === 'Unread' ? 'bg-[#fff5f9]/30' : ''}`}>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${message.status === 'Unread' ? 'font-bold text-[#14142B]' : 'font-medium text-[#4E4B66]'}`}>{message.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{message.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${message.status === 'Unread' ? 'font-bold text-[#14142B]' : 'font-medium text-[#4E4B66]'}`}>{message.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#4E4B66]">{message.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.status === 'Unread' ? 'bg-[#FFF4E5] text-[#FF9F43]' : 'bg-[#E0FFED] text-[#1AB759]'}`}>
                      {message.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#567DFF] inline-flex items-center justify-center hover:bg-[#e5ebff] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] inline-flex items-center justify-center hover:bg-[#FFEAEA] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing 1 to 2 of 2 entries</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">«</button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium shadow-md shadow-primary/20">1</button>
            <button className="w-8 h-8 rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#6E7191] hover:bg-[#F7F7FC] disabled:opacity-50">»</button>
          </div>
        </div>

      </div>

    </div>
  );
}
