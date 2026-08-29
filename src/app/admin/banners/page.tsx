"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import BannerModal from "@/components/admin/BannerModal";
import { toast } from "sonner";

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bannerToEdit, setBannerToEdit] = useState<any>(null);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      if (data.status) {
        setBanners(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status) {
        toast.success("Banner deleted successfully");
        fetchBanners();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#14142B] mb-1">Home Banners</h2>
          <p className="text-sm text-[#6E7191]">Manage the sliders that appear on the homepage</p>
        </div>
        <button
          onClick={() => { setBannerToEdit(null); setIsModalOpen(true); }}
          className="bg-primary hover:bg-[#e60060] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#EFF0F6] overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
                  <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Image & Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Link</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6E7191] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF0F6]">
                {banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-[#F7F7FC]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {banner.image ? (
                          <img src={banner.image} alt={banner.title} className="w-16 h-10 object-cover rounded-lg border border-[#EFF0F6]" />
                        ) : (
                          <div className="w-16 h-10 bg-[#F7F7FC] rounded-lg border border-[#EFF0F6] flex items-center justify-center text-[#A0A3BD]">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#14142B]">{banner.title}</div>
                          {banner.subtitle && <div className="text-xs text-[#6E7191] mt-0.5 line-clamp-1">{banner.subtitle}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4E4B66]">
                      {banner.link || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4E4B66]">
                      {banner.order}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${banner.status ? 'bg-[#E7FFF0] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                        {banner.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setBannerToEdit(banner); setIsModalOpen(true); }}
                          className="p-2 text-[#567DFF] bg-[#E9EEFF] hover:bg-[#dce4ff] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="p-2 text-[#FB4E4E] bg-[#FFEAEA] hover:bg-[#ffd6d6] rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#6E7191]">
                      No banners found. Click "Add Banner" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBanners}
        banner={bannerToEdit}
      />
    </div>
  );
}
