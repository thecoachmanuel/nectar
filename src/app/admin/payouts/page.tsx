"use client";

import React, { useEffect, useState } from "react";
import { Plus, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/admin/payouts");
      const data = await res.json();
      if (data.status) setPayouts(data.data);
    } catch (err) {
      toast.error("Failed to fetch payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchPayouts();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(requestAmount), paymentDetails }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success("Payout requested!");
        setIsModalOpen(false);
        fetchPayouts();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to request payout");
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#14142B]">Payout Requests</h1>
          <p className="text-sm text-[#6E7191] mt-1">Manage withdrawal requests</p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-[#e60060] transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Request Payout
          </button>
        )}
      </div>

      <div className="bg-white border border-[#EFF0F6] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F7FC] border-b border-[#EFF0F6] text-[13px] font-semibold text-[#6E7191] uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                {isAdmin && <th className="px-6 py-4">Action</th>}
              </tr>
            </thead>
            <tbody className="text-sm text-[#14142B]">
              {payouts.map((p) => (
                <tr key={p._id} className="border-b border-[#EFF0F6] hover:bg-[#F7F7FC] transition-colors">
                  <td className="px-6 py-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-mono text-xs">{p.userId}</td>
                  <td className="px-6 py-4 capitalize">{p.userRole.replace("_", " ")}</td>
                  <td className="px-6 py-4 font-bold">₦{p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {p.status === "pending" && <span className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-2.5 py-1 rounded-md text-xs font-semibold w-max"><Clock className="w-3.5 h-3.5"/> Pending</span>}
                    {p.status === "approved" && <span className="flex items-center gap-1.5 text-green-500 bg-green-50 px-2.5 py-1 rounded-md text-xs font-semibold w-max"><CheckCircle className="w-3.5 h-3.5"/> Approved</span>}
                    {p.status === "rejected" && <span className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2.5 py-1 rounded-md text-xs font-semibold w-max"><XCircle className="w-3.5 h-3.5"/> Rejected</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {p.status === "pending" && (
                        <div className="flex gap-2">
                          <button className="text-green-500 hover:bg-green-50 px-2 py-1 rounded text-xs font-bold">Approve</button>
                          <button className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold">Reject</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-[#6E7191]">No payout requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold">Request Payout</h2>
            </div>
            <form onSubmit={handleRequestPayout} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Amount (₦)</label>
                <input required type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Bank / Payment Details</label>
                <textarea required value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} className="w-full px-3 py-2 border rounded-xl" rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-semibold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
