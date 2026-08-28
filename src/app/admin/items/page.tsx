"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, Loader2, Star, Leaf } from "lucide-react";
import { toast } from "sonner";

export default function AdminItemsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !["admin"].includes(user.role)) { router.push("/admin/login"); return; }
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/items", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) setItems(data.data || []);
    } catch { toast.error("Failed to load items"); }
    finally { setLoading(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) { toast.success("Item deleted"); setItems(prev => prev.filter(i => i._id !== id)); }
      else toast.error(data.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
  };

  const filtered = items.filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="db-main min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="db-breadcrumb mb-6">
          <h1 className="db-breadcrumb-title">Items</h1>
          <nav className="db-breadcrumb-list text-sm text-[#6e7191]">
            <span>Admin</span><span className="mx-1.5">/</span>
            <span style={{ color: "#ff006b" }}>Items</span>
          </nav>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title">All Items</h2>
            <div className="db-card-filter">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3bd]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
                  className="db-field-control pl-10 h-9 text-sm w-52" />
              </div>
              <button onClick={() => router.push("/admin/items/create")}
                className="db-btn text-white text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#ff006b" }}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>

          <div className="db-table-responsive">
            <table className="db-table">
              <thead className="db-table-head">
                <tr>
                  {["Image", "Name", "Category", "Price", "Type", "Status", "Actions"].map(h => (
                    <th key={h} className="db-table-head-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="db-table-body">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#ff006b" }} />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-[#a0a3bd] text-sm">No items found</td></tr>
                ) : filtered.map(item => (
                  <tr key={item._id} className="db-table-body-tr hover:bg-[#f9fafb]">
                    <td className="db-table-body-td">
                      <img src={item.image || "/images/item/thumb.png"} alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-[#eff0f6]"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }} />
                    </td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#14142b] capitalize">{item.name}</span>
                        {item.isFeatured && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />}
                      </div>
                      <p className="text-xs text-[#a0a3bd] truncate max-w-[200px]">{item.description}</p>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-sm text-[#6e7191] capitalize">{item.categoryName || "—"}</span>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-sm font-bold text-[#14142b]">₦{item.price?.toFixed(2)}</span>
                    </td>
                    <td className="db-table-body-td">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${item.itemType === "veg" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        <Leaf className="w-3 h-3" />
                        {item.itemType === "veg" ? "Veg" : "Non-Veg"}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <span className={`db-badge ${item.status ? "db-badge-green" : "db-badge-red"}`}>
                        {item.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => router.push(`/admin/items/${item._id}/edit`)}
                          className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item._id)} disabled={deleting === item._id}
                          className="w-7 h-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-all disabled:opacity-50">
                          {deleting === item._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
