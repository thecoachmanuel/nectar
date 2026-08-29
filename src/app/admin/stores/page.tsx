"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import StoreModal from "@/components/admin/StoreModal";
import { toast } from "sonner";

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<any>(null);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/admin/stores");
      const data = await res.json();
      if (data.status) {
        setStores(data.data || data.stores || []);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this store?")) return;
    try {
      const res = await fetch(`/api/admin/stores/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status) {
        toast.success("Store deleted successfully");
        fetchStores();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to delete store");
    }
  };

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#14142B] mb-1">Stores</h2>
          <p className="text-sm text-[#6E7191]">Manage your restaurant stores/branches</p>
        </div>
        <button
          onClick={() => { setStoreToEdit(null); setIsModalOpen(true); }}
          className="bg-primary hover:bg-[#e60060] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Store
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading stores...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7FC] border-b border-[#EFF0F6] text-xs uppercase tracking-wider text-[#6E7191]">
                  <th className="px-6 py-4 font-semibold">Store Details</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF0F6]">
                {stores.map((store) => (
                  <tr key={store._id} className="hover:bg-[#F7F7FC]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#14142B]">{store.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#4E4B66]">{store.email}</div>
                      <div className="text-xs text-[#6E7191] mt-0.5">{store.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm flex items-start gap-1 text-[#4E4B66]">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{store.address}, {store.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${store.status ? 'bg-[#E7FFF0] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                        {store.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setStoreToEdit(store); setIsModalOpen(true); }}
                          className="p-2 text-[#567DFF] bg-[#E9EEFF] hover:bg-[#dce4ff] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(store._id)}
                          className="p-2 text-[#FB4E4E] bg-[#FFEAEA] hover:bg-[#ffd6d6] rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#6E7191]">
                      No stores found. Click "Add Store" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStores}
        storeToEdit={storeToEdit}
      />
    </div>
  );
}
