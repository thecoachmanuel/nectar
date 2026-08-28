"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Mail, Phone } from "lucide-react";

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetchPage();
    fetchSettings();
  }, [slug]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/frontend/pages/${slug}`);
      const data = await res.json();
      if (data.status) {
        setPage(data.data || {});
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/frontend/settings`);
      const data = await res.json();
      if (data.status) {
        setSettings(data.data || {});
      }
    } catch {}
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="foodappi-loader"></div>
        </div>
      )}
      
      <section className="pt-8 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="mb-6">
            <h2 className="text-[26px] leading-10 font-semibold capitalize mb-2 text-[#14142b]">
              {page.title || "Loading..."}
            </h2>
            {page.image && (
              <div className="w-full mb-6">
                <img src={page.image} alt={page.title} className="w-full rounded-2xl object-cover shadow-sm" />
              </div>
            )}
            {page.description && (
              <div className="ql-editor prose max-w-none text-[#6e7191]" dangerouslySetInnerHTML={{ __html: page.description }}></div>
            )}
            {!page.description && !loading && (
              <div className="text-center py-12 text-[#6e7191]">
                <p>Page content not available.</p>
              </div>
            )}
          </div>
          
          {/* Support Section */}
          <div className="mb-12 md:mb-20">
            <h2 className="text-[22px] leading-[34px] font-medium capitalize mb-3 text-[#14142b]">Support</h2>
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#6e7191]" />
                <span className="text-sm leading-6 text-[#14142b]">{settings.company_email || "support@example.com"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#6e7191]" />
                <span className="text-sm font-medium leading-6 text-[#14142b]">{settings.company_phone || "+1234567890"}</span>
              </li>
            </ul>
          </div>
          
          {/* Mock Contact Form if template_id === 1 (from Vue app) */}
          {page.template_id === 1 && (
            <div className="bg-[#f7f7fc] p-6 rounded-2xl border border-[#eff0f6]">
              <h3 className="text-xl font-semibold mb-4 text-[#14142b]">Contact Us</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#14142b] mb-1">Name</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-white border border-[#eff0f6] rounded-xl text-sm focus:outline-none focus:border-[#ff006b] transition-colors" placeholder="Your Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#14142b] mb-1">Email</label>
                    <input type="email" className="w-full px-4 py-2.5 bg-white border border-[#eff0f6] rounded-xl text-sm focus:outline-none focus:border-[#ff006b] transition-colors" placeholder="Your Email" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#14142b] mb-1">Message</label>
                  <textarea rows={4} className="w-full px-4 py-2.5 bg-white border border-[#eff0f6] rounded-xl text-sm focus:outline-none focus:border-[#ff006b] transition-colors resize-none" placeholder="Your Message"></textarea>
                </div>
                <button type="button" className="w-full py-3 bg-[#ff006b] text-white rounded-xl font-medium hover:bg-rose-600 transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
