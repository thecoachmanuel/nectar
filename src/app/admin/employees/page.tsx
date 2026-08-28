"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Search, Users, Plus, Pencil, Trash2, Loader2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["all", "admin", "waiter", "chef", "delivery_boy"];

export default function AdminEmployeesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/admin/login"); return; }
    fetchEmployees();
  }, [roleFilter]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = roleFilter !== "all" ? `?role=${roleFilter}` : "";
      const res = await fetch(`/api/admin/employees${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) setEmployees(data.data || []);
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status) { toast.success("Employee deleted"); setEmployees(prev => prev.filter(e => e._id !== id)); }
      else toast.error(data.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: "db-badge-purple", waiter: "db-badge-blue",
    chef: "db-badge-yellow", delivery_boy: "db-badge-green",
  };

  const filtered = employees.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="db-main min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="db-breadcrumb mb-6">
          <h1 className="db-breadcrumb-title">Employees</h1>
          <nav className="db-breadcrumb-list text-sm text-[#6e7191]">
            <span>Admin</span><span className="mx-1.5">/</span>
            <span style={{ color: "#ff006b" }}>Employees</span>
          </nav>
        </div>

        {/* Role filter tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${roleFilter === r ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
              style={roleFilter === r ? { backgroundColor: "#ff006b", borderColor: "#ff006b" } : {}}>
              {r.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#ff006b" }} /> Employees ({filtered.length})
            </h2>
            <div className="db-card-filter">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3bd]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
                  className="db-field-control pl-10 h-9 text-sm w-52" />
              </div>
              <button onClick={() => router.push("/admin/employees/create")}
                className="db-btn text-white text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#ff006b" }}>
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>
          </div>

          <div className="db-table-responsive">
            <table className="db-table">
              <thead className="db-table-head">
                <tr>{["#", "Name", "Role", "Email", "Phone", "Branch", "Status", "Actions"].map(h => (
                  <th key={h} className="db-table-head-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="db-table-body">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#ff006b" }} />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-[#a0a3bd] text-sm">No employees found</td></tr>
                ) : filtered.map((emp, i) => (
                  <tr key={emp._id} className="db-table-body-tr hover:bg-[#f9fafb]">
                    <td className="db-table-body-td text-xs text-[#a0a3bd]">{i + 1}</td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: "#ff006b" }}>
                          {emp.name?.[0]?.toUpperCase() || "E"}
                        </div>
                        <span className="text-sm font-medium text-[#14142b] capitalize">{emp.name}</span>
                      </div>
                    </td>
                    <td className="db-table-body-td">
                      <span className={`db-badge capitalize ${ROLE_COLORS[emp.role] || "db-badge-blue"}`}>
                        {emp.role?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-1 text-xs text-[#6e7191]">
                        <Mail className="w-3 h-3" />{emp.email}
                      </div>
                    </td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-1 text-xs text-[#6e7191]">
                        <Phone className="w-3 h-3" />{emp.phone || "—"}
                      </div>
                    </td>
                    <td className="db-table-body-td">
                      <span className="text-xs text-[#6e7191] capitalize">{emp.branchName || "All Branches"}</span>
                    </td>
                    <td className="db-table-body-td">
                      <span className={`db-badge ${emp.status ? "db-badge-green" : "db-badge-red"}`}>
                        {emp.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="db-table-body-td">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => router.push(`/admin/employees/${emp._id}/edit`)}
                          className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteEmployee(emp._id)} disabled={deleting === emp._id}
                          className="w-7 h-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-all disabled:opacity-50">
                          {deleting === emp._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
