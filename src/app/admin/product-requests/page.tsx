"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PackageSearch,
  Search,
  CheckCircle2,
  Clock,
  Check,
  X,
  Trash2,
  MessageSquare,
  Plus,
  ExternalLink,
  RotateCcw,
  Tag,
  Phone,
  Mail,
  User,
  Filter,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import ItemModal from "@/components/admin/ItemModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

export default function ProductRequestsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [catalogPrefill, setCatalogPrefill] = useState<any>(null);

  const { execute, data: requests, loading } = useApi();
  const { execute: updateRequest } = useApi();
  const { execute: deleteRequest } = useApi();

  const fetchRequests = () => {
    execute("/api/admin/product-requests");
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await updateRequest(`/api/admin/product-requests/${requestId}`, {
        method: "PUT",
        body: { status: newStatus },
        successMessage: `Request marked as ${newStatus}`,
      });
      fetchRequests();
    } catch {}
  };

  const handleDelete = (req: any) => {
    setSelectedRequest(req);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedRequest) {
      await deleteRequest(`/api/admin/product-requests/${selectedRequest._id}`, {
        method: "DELETE",
        successMessage: "Product request deleted",
      });
      fetchRequests();
    }
  };

  const handleAddToCatalog = (req: any) => {
    setCatalogPrefill({
      name: req.productName,
      description: req.notes || req.categoryOrBrand || "",
      image: req.image || "",
    });
    setIsItemModalOpen(true);
  };

  const filteredRequests = useMemo(() => {
    if (!requests || !Array.isArray(requests)) return [];

    return requests.filter((req: any) => {
      if (selectedStatus !== "all" && req.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pMatch = (req.productName || "").toLowerCase().includes(q);
        const bMatch = (req.categoryOrBrand || "").toLowerCase().includes(q);
        const nMatch = (req.customerName || "").toLowerCase().includes(q);
        const phMatch = (req.customerPhone || "").toLowerCase().includes(q);
        if (!pMatch && !bMatch && !nMatch && !phMatch) return false;
      }
      return true;
    });
  }, [requests, selectedStatus, searchQuery]);

  // Counts
  const totalCount = requests?.length || 0;
  const pendingCount = requests?.filter((r: any) => r.status === "pending").length || 0;
  const reviewedCount = requests?.filter((r: any) => r.status === "reviewed").length || 0;
  const stockedCount = requests?.filter((r: any) => r.status === "stocked").length || 0;

  const getWhatsAppLink = (phone: string, productName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `234${cleanPhone.slice(1)}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello! Regarding your request for "${productName}" on Nectar, we are pleased to let you know that it is now stocked and available for order!`
    );
    return `https://wa.me/${formattedPhone}?text=${msg}`;
  };

  return (
    <div className="pb-16 space-y-6">
      {/* Metric Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">Total Requests</p>
            <h3 className="text-lg sm:text-xl font-bold text-[#14142B]">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">Pending Review</p>
            <h3 className="text-lg sm:text-xl font-bold text-amber-600">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">Under Review</p>
            <h3 className="text-lg sm:text-xl font-bold text-blue-600">{reviewedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EFF0F6] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6E7191] font-medium">Stocked & Fulfilled</p>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-600">{stockedCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6]">
        {/* Header */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div>
            <h3 className="font-semibold text-lg text-[#14142B]">Customer Product Requests</h3>
            <p className="text-xs sm:text-sm text-[#6E7191] mt-0.5">
              Review what customers are searching for that is missing in your grocery catalog.
            </p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 sm:p-6 bg-[#FAFAFC] border-b border-[#EFF0F6] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Search by product, brand, customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary w-full transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[160px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3.5 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-medium text-[#14142B] w-full appearance-none cursor-pointer hover:border-primary/50 transition-colors"
              >
                <option value="all">All Statuses ({totalCount})</option>
                <option value="pending">Pending Review ({pendingCount})</option>
                <option value="reviewed">Under Review ({reviewedCount})</option>
                <option value="stocked">Stocked / Fulfilled ({stockedCount})</option>
                <option value="rejected">Declined / Not Possible</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchQuery.trim() || selectedStatus !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setSelectedStatus("all"); }}
                className="h-10 px-3.5 rounded-xl border border-[#EFF0F6] bg-white hover:bg-gray-50 text-xs font-semibold text-[#6E7191] flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#6E7191] flex items-center gap-2">
            <span className="font-semibold text-[#14142B]">{filteredRequests.length}</span>
            <span>of {totalCount} requests</span>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Requested Product
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Brand / Category
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Customer Contact
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Date Requested
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !requests ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6E7191]">
                    Loading product requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#6E7191]">
                    <PackageSearch className="w-12 h-12 text-[#D9DBE9] mx-auto mb-2" />
                    <p className="text-base font-semibold text-[#14142B] mb-1">No product requests found</p>
                    <p className="text-xs text-[#A0A3BD]">
                      Customer search requests will automatically appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req: any) => {
                  return (
                    <tr key={req._id} className="hover:bg-[#FAFAFC] transition-colors">
                      {/* Product Name & Photo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {req.image ? (
                            <img
                              src={req.image}
                              alt={req.productName}
                              className="w-11 h-11 rounded-xl object-cover border border-[#EFF0F6] shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#F7F7FC] border border-[#EFF0F6] flex items-center justify-center text-[#A0A3BD] shrink-0">
                              <PackageSearch className="w-5 h-5" />
                            </div>
                          )}
                          <div className="max-w-xs">
                            <span className="text-sm font-semibold text-[#14142B] block truncate" title={req.productName}>
                              {req.productName}
                            </span>
                            {req.notes && (
                              <span className="text-xs text-[#6E7191] line-clamp-1 break-words mt-0.5" title={req.notes}>
                                📝 {req.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Brand / Category */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F7F7FC] text-[#4E4B66] border border-[#EFF0F6]">
                          {req.categoryOrBrand || "Any Brand / Standard"}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-[#14142B]">
                            {req.customerName || "Anonymous Customer"}
                          </div>
                          {req.customerPhone && (
                            <div className="text-[11px] text-[#6E7191] flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-[#A0A3BD]" />
                              <span>{req.customerPhone}</span>
                            </div>
                          )}
                          {req.customerEmail && (
                            <div className="text-[11px] text-[#6E7191] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#A0A3BD]" />
                              <span className="truncate max-w-[150px]">{req.customerEmail}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-[#6E7191]">
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            req.status === "stocked"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : req.status === "reviewed"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : req.status === "rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <option value="pending">🟡 Pending</option>
                          <option value="reviewed">🔵 Under Review</option>
                          <option value="stocked">🟢 Stocked / Available</option>
                          <option value="rejected">🔴 Declined</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Notify Button */}
                          {req.customerPhone && (
                            <a
                              href={getWhatsAppLink(req.customerPhone, req.productName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Message Customer on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Notify</span>
                            </a>
                          )}

                          {/* Add to Catalog button */}
                          <button
                            onClick={() => handleAddToCatalog(req)}
                            className="h-8 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Add directly to Products Catalog"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Item</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(req)}
                            className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product Request"
        description={`Are you sure you want to delete the request for "${selectedRequest?.productName}"?`}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setCatalogPrefill(null);
        }}
        item={catalogPrefill}
        onSuccess={() => {
          setIsItemModalOpen(false);
          setCatalogPrefill(null);
          toast.success("Product added to catalog!");
        }}
      />
    </div>
  );
}
