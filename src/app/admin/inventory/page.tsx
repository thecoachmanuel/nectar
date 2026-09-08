"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Store as StoreIcon, 
  RotateCcw, 
  Edit, 
  Plus, 
  Minus, 
  Save, 
  Loader2, 
  TrendingDown, 
  Check, 
  Tag 
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import ItemModal from "@/components/admin/ItemModal";
import { toast } from "sonner";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { useAuthStore } from "@/store/useAuthStore";

export default function InventoryPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    trackedProducts: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Edit / Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<any>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Local quantity inputs for quick inline editing
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedStore !== "all") params.set("storeId", selectedStore);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedCategory !== "all") params.set("categoryId", selectedCategory);

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();

      if (data.status) {
        setItems(data.data || []);
        if (data.metrics) setMetrics(data.metrics);

        // Initialize local quantities
        const qMap: Record<string, number> = {};
        (data.data || []).forEach((itm: any) => {
          qMap[itm._id] = itm.stockQuantity || 0;
        });
        setLocalQuantities(qMap);
      } else {
        toast.error(data.message || "Failed to load inventory");
      }
    } catch (err: any) {
      console.error("Inventory fetch error:", err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [catRes, storeRes] = await Promise.all([
        fetch("/api/admin/item-categories").catch(() => null),
        fetch("/api/admin/stores").catch(() => null),
      ]);
      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        if (catData.status) setCategories(catData.data || []);
      }
      if (storeRes && storeRes.ok) {
        const storeData = await storeRes.json();
        if (storeData.status) setStores(storeData.data || storeData.stores || []);
      }
    } catch (err) {
      console.error("Error fetching filter data", err);
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedStore, selectedStatus, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  // Quick inline update for an item
  const updateItemInventory = async (
    itemId: string,
    updates: { stockQuantity?: number; manageStock?: boolean; isOutOfStock?: boolean; lowStockThreshold?: number }
  ) => {
    setUpdatingItemId(itemId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, ...updates }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "Inventory updated");
        // Update item in local list
        setItems((prev) =>
          prev.map((itm) => {
            if (itm._id === itemId) {
              const updated = { ...itm, ...updates };
              if (updates.manageStock !== undefined) updated.manageStock = updates.manageStock;
              if (updates.stockQuantity !== undefined) {
                updated.stockQuantity = updates.stockQuantity;
                if (updated.manageStock && updates.stockQuantity === 0) {
                  updated.effectiveOutOfStock = true;
                  updated.stockStatus = "out_of_stock";
                } else if (updated.manageStock && updates.stockQuantity <= (updated.lowStockThreshold || 5)) {
                  updated.effectiveOutOfStock = false;
                  updated.stockStatus = "low_stock";
                } else if (updated.manageStock) {
                  updated.effectiveOutOfStock = false;
                  updated.stockStatus = "in_stock";
                }
              }
              if (updates.isOutOfStock !== undefined) {
                updated.effectiveOutOfStock = updates.isOutOfStock;
                if (updates.isOutOfStock) updated.stockStatus = "out_of_stock";
              }
              return updated;
            }
            return itm;
          })
        );
      } else {
        toast.error(data.message || "Failed to update inventory");
      }
    } catch (err: any) {
      toast.error("Error updating inventory: " + err.message);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleStepQuantity = (itemId: string, delta: number) => {
    const current = localQuantities[itemId] ?? 0;
    const nextVal = Math.max(0, current + delta);
    setLocalQuantities((prev) => ({ ...prev, [itemId]: nextVal }));
    updateItemInventory(itemId, { stockQuantity: nextVal });
  };

  const handleSaveTypedQuantity = (itemId: string) => {
    const qty = localQuantities[itemId] ?? 0;
    updateItemInventory(itemId, { stockQuantity: qty });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStore("all");
    setSelectedStatus("all");
    setSelectedCategory("all");
  };

  const hasActiveFilters = searchQuery !== "" || selectedStore !== "all" || selectedStatus !== "all" || selectedCategory !== "all";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EFF0F6] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14142B] tracking-tight">
              Inventory Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6E7191]">
            {isSuperAdmin 
              ? "Monitor and manage product stock levels sitewide across all stores or by branch." 
              : "Monitor and manage stock quantities for your store branch."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] hover:bg-[#EFF0F6] text-[#14142B] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tracked Products */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFF0F6] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Tracked Items</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#14142B]">{metrics.trackedProducts}</span>
            <span className="text-xs text-[#A0A3BD]">of {metrics.totalProducts} total</span>
          </div>
        </div>

        {/* In Stock */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFF0F6] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">In Stock</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{metrics.inStockCount}</span>
            <span className="text-xs text-emerald-700/70 font-medium">healthy supply</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFF0F6] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{metrics.lowStockCount}</span>
            <span className="text-xs text-amber-700/70 font-medium">need replenishment</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFF0F6] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Out of Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{metrics.outOfStockCount}</span>
            <span className="text-xs text-rose-700/70 font-medium">unavailable</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EFF0F6] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A3BD]" />
            <input
              type="text"
              placeholder="Search product name, category, or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] text-xs sm:text-sm font-medium focus:outline-none focus:border-primary bg-white transition"
            />
          </form>

          {/* Store Filter (Super Admin only) */}
          {isSuperAdmin && (
            <div className="w-full md:w-56">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#EFF0F6] text-xs font-semibold focus:outline-none focus:border-primary bg-white text-[#14142B]"
              >
                <option value="all">🏬 All Stores (Sitewide)</option>
                <option value="unassigned">🏢 Unassigned (Global)</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    📍 {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#EFF0F6] text-xs font-semibold focus:outline-none focus:border-primary bg-white text-[#14142B]"
            >
              <option value="all">📁 All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#EFF0F6] no-scrollbar">
          {[
            { key: "all", label: "All Products" },
            { key: "in_stock", label: "✓ In Stock" },
            { key: "low_stock", label: "⚠️ Low Stock Alert" },
            { key: "out_of_stock", label: "🛑 Out of Stock" },
            { key: "untracked", label: "📦 Untracked" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedStatus === tab.key
                  ? "bg-[#14142B] text-white shadow-sm"
                  : "bg-[#F7F7FC] text-[#6E7191] hover:bg-[#EFF0F6] hover:text-[#14142B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-[#EFF0F6] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-semibold text-[#14142B]">Loading inventory catalog...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#F7F7FC] text-[#A0A3BD] flex items-center justify-center mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#14142B] mb-1">No products found</h3>
            <p className="text-xs text-[#6E7191] max-w-sm mx-auto mb-4">
              No products match your active search or filter criteria. Try resetting filters to view all products.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFF0F6] bg-[#FAFAFC] text-[11px] font-extrabold uppercase text-[#6E7191] tracking-wider">
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Store</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4 text-center">Track Stock</th>
                  <th className="py-3.5 px-4">Available Quantity</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF0F6] text-xs">
                {items.map((item) => {
                  const isUpdating = updatingItemId === item._id;
                  const currentQty = localQuantities[item._id] ?? (item.stockQuantity || 0);

                  return (
                    <tr key={item._id} className="hover:bg-[#FAFAFC]/70 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={normalizeImageUrl(item.image, "/images/item/thumb.png")}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#EFF0F6] shadow-2xs shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/images/item/thumb.png"; }}
                          />
                          <div>
                            <span className="font-bold text-[#14142B] text-sm block leading-tight line-clamp-1">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-[#6E7191] mt-0.5 block">
                              {item.categoryId?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F7F7FC] text-[#14142B] border border-[#EFF0F6]">
                          <StoreIcon className="w-3 h-3 text-primary" />
                          {item.storeName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#14142B]">
                          ₦{Number(item.price || 0).toLocaleString()}
                        </div>
                        {item.discountPrice && item.discountPrice > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Sale: ₦{Number(item.discountPrice).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Track Stock Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.manageStock}
                            onChange={(e) =>
                              updateItemInventory(item._id, { manageStock: e.target.checked })
                            }
                            disabled={isUpdating}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#D9DBE9] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </td>

                      {/* Available Quantity Stepper */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.manageStock ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStepQuantity(item._id, -1)}
                              disabled={isUpdating || currentQty <= 0}
                              className="w-7 h-7 rounded-lg border border-[#EFF0F6] bg-[#F7F7FC] hover:bg-primary hover:text-white text-[#14142B] flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={currentQty}
                              onChange={(e) =>
                                setLocalQuantities((prev) => ({
                                  ...prev,
                                  [item._id]: Math.max(0, parseInt(e.target.value) || 0),
                                }))
                              }
                              onBlur={() => handleSaveTypedQuantity(item._id)}
                              className="w-16 h-8 px-2 text-center rounded-lg border border-[#EFF0F6] font-bold text-xs focus:outline-none focus:border-primary bg-white"
                            />

                            <button
                              type="button"
                              onClick={() => handleStepQuantity(item._id, 1)}
                              disabled={isUpdating}
                              className="w-7 h-7 rounded-lg border border-[#EFF0F6] bg-[#F7F7FC] hover:bg-primary hover:text-white text-[#14142B] flex items-center justify-center transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            {isUpdating && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin ml-1" />}
                          </div>
                        ) : (
                          <span className="text-[#A0A3BD] italic text-xs">Unlimited</span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.stockStatus === "out_of_stock" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Out of Stock (0)
                          </span>
                        ) : item.stockStatus === "low_stock" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low Stock ({item.stockQuantity})
                          </span>
                        ) : item.stockStatus === "in_stock" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            In Stock ({item.stockQuantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                            Untracked
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Out of stock toggle */}
                          {item.manageStock && (
                            <button
                              type="button"
                              onClick={() =>
                                updateItemInventory(item._id, {
                                  isOutOfStock: !item.effectiveOutOfStock,
                                })
                              }
                              disabled={isUpdating}
                              title={item.effectiveOutOfStock ? "Mark as In Stock" : "Mark as Out of Stock"}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                                item.effectiveOutOfStock
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              {item.effectiveOutOfStock ? "Mark In Stock" : "Mark Out of Stock"}
                            </button>
                          )}

                          {/* Full Edit Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemToEdit(item);
                              setIsItemModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-[#EFF0F6] bg-[#F7F7FC] hover:bg-[#EFF0F6] text-[#14142B] transition cursor-pointer"
                            title="Edit Product Details"
                          >
                            <Edit className="w-4 h-4 text-[#6E7191]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Item Modal */}
      {isItemModalOpen && (
        <ItemModal
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setSelectedItemToEdit(null);
          }}
          item={selectedItemToEdit}
          onSuccess={() => {
            fetchInventory();
          }}
        />
      )}
    </div>
  );
}
