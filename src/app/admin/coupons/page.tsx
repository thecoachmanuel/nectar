"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Search, Tag, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/admin/login"); return; }
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) setCoupons(data.data || []);
    } catch { toast.error("Failed to load coupons"); }
    finally { setLoading(false); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) { toast.success("Coupon deleted"); setCoupons(prev => prev.filter(c => c._id !== id)); }
      else toast.error(data.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
  };

  const filtered = coupons.filter(c => !search || c.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="db-main min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="db-breadcrumb mb-6">
          <h1 className="db-breadcrumb-title">Coupons</h1>
          <nav className="db-breadcrumb-list text-sm text-[#6e7191]">
            <span>Admin</span><span className="mx-1.5">/</span>
            <span style={{ color: "#ff006b" }}>Coupons</span>
          </nav>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title flex items-center gap-2">
              <Tag className="w-4 h-4" style={{ color: "#ff006b" }} />
              All Coupons
            </h2>
            <div className="db-card-filter">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3bd]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupon code..."
                  className="db-field-control pl-10 h-9 text-sm w-48" />
              </div>
              <button onClick={() => router.push("/admin/coupons/create")}
                className="db-btn text-white text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#ff006b" }}>
                <Plus className="w-4 h-4" /> Add Coupon
              </button>
            </div>
          </div>

          <div className="db-table-responsive">
            <table className="db-table">
              <thead className="db-table-head">
                <tr>
                  {["Code", "Type", "Discount", "Min Order", "Expires", "Uses", "Status", "Actions"].map(h => (
                    <th key={h} className="db-table-head-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="db-table-body">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#ff006b" }} />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-[#a0a3bd] text-sm">No coupons found</td></tr>
                ) : filtered.map(coupon => (
                  <tr key={coupon._id} className="db-table-body-tr hover:bg-[#f9fafb]">
                    <td className="db-table-body-td">
                      <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg bg-[#fff0f6]" style={{ color: "#ff006b" }}>
                        {coupon.code}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <span className="db-badge db-badge-blue capitalize">{coupon.discountType || "fixed"}</span>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-sm font-bold text-[#14142b]">
                        {coupon.discountType === "percent" ? `${coupon.discount}%` : `₦${coupon.discount}`}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-sm text-[#6e7191]">₦{coupon.minimumOrder || 0}</span>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-xs text-[#6e7191]">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-sm text-[#6e7191]">{coupon.usedCount || 0} / {coupon.usageLimit || "∞"}</span>
                    </td>
                    <td className="db-table-body-td">
                      <span className={`db-badge ${coupon.status ? "db-badge-green" : "db-badge-red"}`}>
                        {coupon.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => router.push(`/admin/coupons/${coupon._id}/edit`)}
                          className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteCoupon(coupon._id)} disabled={deleting === coupon._id}
                          className="w-7 h-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-all disabled:opacity-50">
                          {deleting === coupon._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
