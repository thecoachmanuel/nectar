"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, Loader2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !["admin"].includes(user.role)) { router.push("/admin/login"); return; }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) setCategories(data.data || []);
    } catch { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) { toast.success("Category deleted"); setCategories(prev => prev.filter(c => c._id !== id)); }
      else toast.error(data.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
  };

  const filtered = categories.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="db-main min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="db-breadcrumb mb-6">
          <h1 className="db-breadcrumb-title">Item Categories</h1>
          <nav className="db-breadcrumb-list text-sm text-[#6e7191]">
            <span>Admin</span><span className="mx-1.5">/</span>
            <span style={{ color: "#ff006b" }}>Categories</span>
          </nav>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" style={{ color: "#ff006b" }} />
              All Categories
            </h2>
            <div className="db-card-filter">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3bd]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
                  className="db-field-control pl-10 h-9 text-sm w-48" />
              </div>
              <button onClick={() => router.push("/admin/item-categories/create")}
                className="db-btn text-white text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#ff006b" }}>
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#ff006b" }} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5">
              {filtered.length === 0 ? (
                <div className="col-span-full text-center py-12 text-[#a0a3bd] text-sm">No categories found</div>
              ) : filtered.map(cat => (
                <div key={cat._id} className="relative group bg-white rounded-xl border border-[#eff0f6] hover:shadow-md transition-all overflow-hidden">
                  <img src={cat.image || "/images/category/thumb.png"} alt={cat.name}
                    className="w-full h-28 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/category/thumb.png"; }} />
                  <div className="p-3 text-center">
                    <h3 className="text-sm font-semibold text-[#14142b] capitalize truncate">{cat.name}</h3>
                    <span className={`text-xs mt-1 inline-block db-badge ${cat.status ? "db-badge-green" : "db-badge-red"}`}>
                      {cat.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => router.push(`/admin/item-categories/${cat._id}/edit`)}
                      className="w-7 h-7 rounded-md bg-white shadow text-emerald-600 flex items-center justify-center hover:bg-emerald-50 transition-all">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteCategory(cat._id)} disabled={deleting === cat._id}
                      className="w-7 h-7 rounded-md bg-white shadow text-red-500 flex items-center justify-center hover:bg-red-50 transition-all disabled:opacity-50">
                      {deleting === cat._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
