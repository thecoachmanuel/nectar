"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Search, Users, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCustomersPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/admin/login"); return; }
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) setCustomers(data.data || []);
    } catch { toast.error("Failed to load customers"); }
    finally { setLoading(false); }
  };

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="db-main min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="db-breadcrumb mb-6">
          <h1 className="db-breadcrumb-title">Customers</h1>
          <nav className="db-breadcrumb-list text-sm text-[#6e7191]">
            <span>Admin</span><span className="mx-1.5">/</span>
            <span style={{ color: "#ff006b" }}>Customers</span>
          </nav>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#ff006b" }} />
              All Customers ({customers.length})
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3bd]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
                className="db-field-control pl-10 h-9 text-sm w-56" />
            </div>
          </div>

          <div className="db-table-responsive">
            <table className="db-table">
              <thead className="db-table-head">
                <tr>
                  {["#", "Name", "Email", "Phone", "Orders", "Joined", "Actions"].map(h => (
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
                  <tr><td colSpan={7} className="py-12 text-center text-[#a0a3bd] text-sm">No customers found</td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c._id} className="db-table-body-tr hover:bg-[#f9fafb]">
                    <td className="db-table-body-td text-[#a0a3bd] text-xs">{i + 1}</td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: "#ff006b" }}>
                          {c.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <span className="text-sm font-medium text-[#14142b] capitalize">{c.name}</span>
                      </div>
                    </td>
                    <td className="db-table-body-td"><span className="text-sm text-[#6e7191]">{c.email}</span></td>
                    <td className="db-table-body-td"><span className="text-sm text-[#6e7191]">{c.phone || "—"}</span></td>
                    <td className="db-table-body-td">
                      <span className="db-badge db-badge-blue">{c.orderCount || 0} orders</span>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-xs text-[#a0a3bd]">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <button onClick={() => router.push(`/admin/customers/${c._id}`)}
                        className="w-7 h-7 rounded-md bg-[#fff0f6] text-[#ff006b] flex items-center justify-center hover:bg-[#ff006b] hover:text-white transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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
