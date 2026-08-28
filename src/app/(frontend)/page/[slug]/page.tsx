"use client";

import React, { useState } from "react";
import Navbar from "@/components/frontend/Navbar";
import Footer from "@/components/frontend/Footer";
import { useParams } from "next/navigation";
import { Send, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function StaticOtherPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for contacting us! We will reply shortly.");
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  };

  const getPageTitle = () => {
    if (slug === "contact-us") return "Contact Us";
    if (slug === "about-us") return "About Us";
    if (slug === "terms-and-conditions") return "Terms & Conditions";
    if (slug === "privacy-policy") return "Privacy Policy";
    return "FoodAppi";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
          <h1 className="text-2xl font-black text-slate-800 border-b border-slate-100 pb-4">
            {getPageTitle()}
          </h1>

          {slug === "contact-us" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Have questions about your order, delivery zones, or WhatsApp ordering? Feel free to reach out to our team.
                </p>

                <div className="space-y-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-red-500" />
                    <span>+1 (800) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-red-500" />
                    <span>support@foodappi.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>FoodAppi Headquarters, City Center</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendContact} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                />
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                ></textarea>

                <button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4 text-slate-600">
              <p>
                Welcome to FoodAppi. We provide progressive web application (PWA) food delivery, POS, and WhatsApp menu ordering systems.
              </p>
              <p>
                All orders are processed with high quality control, instant realtime status updates, and secure payment processing.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
