"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Filter, Store as StoreIcon, Layers, RotateCcw } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { formatPrice } from "@/lib/formatters";
import ItemModal from "@/components/admin/ItemModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

export default function ItemsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStore, setSelectedStore] = useState("all");

  const { execute, data: items, loading } = useApi();
  const { execute: deleteItem } = useApi();
  const { execute: fetchCategories, data: categories } = useApi();
  const { execute: fetchStores, data: stores } = useApi();

  const fetchItems = () => {
    execute("/api/admin/items");
  };

  useEffect(() => {
    fetchItems();
    fetchCategories("/api/admin/item-categories");
    fetchStores("/api/admin/stores");
  }, []);

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item: any) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      await deleteItem(`/api/admin/items/${selectedItem._id}`, {
        method: "DELETE",
        successMessage: "Product deleted",
      });
      fetchItems();
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStore("all");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== "all" || selectedStore !== "all";

  // Filtered Items Computation
  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];

    return items.filter((item: any) => {
      // 1. Search Query Filter (name, category, or store)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (item.name || "").toLowerCase().includes(q);
        const catMatch = (item.categoryId?.name || "").toLowerCase().includes(q);
        const storeMatch = (item.storeName || "").toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !storeMatch) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        const itemCatId = (item.categoryId?._id || item.categoryId)?.toString();
        if (itemCatId !== selectedCategory) return false;
      }

      // 3. Store Filter
      if (selectedStore !== "all") {
        const rawStoreId = item.storeId ? item.storeId.toString() : "0";
        const isUnassigned = !rawStoreId || rawStoreId === "0" || rawStoreId === "admin" || rawStoreId === "null" || rawStoreId === "undefined" || item.isUnassignedStore;

        if (selectedStore === "unassigned") {
          if (!isUnassigned) return false;
        } else {
          if (isUnassigned || rawStoreId !== selectedStore) return false;
        }
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStore]);

  // Quick stats counts
  const totalCount = items?.length || 0;
  const unassignedCount = useMemo(() => {
    if (!items || !Array.isArray(items)) return 0;
    return items.filter((item: any) => {
      const rawStoreId = item.storeId ? item.storeId.toString() : "0";
      return !rawStoreId || rawStoreId === "0" || rawStoreId === "admin" || rawStoreId === "null" || rawStoreId === "undefined" || item.isUnassignedStore;
    }).length;
  }, [items]);

  return (
    <div className="pb-16 space-y-6">
      
      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6]">
        
        {/* Header Title & Add Button */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <div>
            <h3 className="font-semibold text-lg text-[#14142B]">Products Catalog</h3>
            <p className="text-xs sm:text-sm text-[#6E7191] mt-0.5">
              Manage all groceries, inventory, assigned stores, and categories.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleAdd}
              className="h-10 px-4 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-4 sm:p-6 bg-[#FAFAFC] border-b border-[#EFF0F6] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <input 
                type="text" 
                placeholder="Search products by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary w-full transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6E7191]">
                <Layers className="w-4 h-4 text-[#A0A3BD]" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 pl-9 pr-8 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-medium text-[#14142B] w-full appearance-none cursor-pointer hover:border-primary/50 transition-colors"
              >
                <option value="all">All Categories</option>
                {categories?.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>
                    📁 {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Store Filter Dropdown */}
            <div className="relative min-w-[190px] flex-1 sm:flex-initial">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6E7191]">
                <StoreIcon className="w-4 h-4 text-[#A0A3BD]" />
              </div>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="h-10 pl-9 pr-8 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary font-medium text-[#14142B] w-full appearance-none cursor-pointer hover:border-primary/50 transition-colors"
              >
                <option value="all">All Stores ({totalCount})</option>
                <option value="unassigned">🌐 Unassigned / Global ({unassignedCount})</option>
                {stores?.map((store: any) => (
                  <option key={store._id} value={store._id}>
                    🏪 {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-10 px-3.5 rounded-xl border border-[#EFF0F6] bg-white hover:bg-gray-50 text-xs font-semibold text-[#6E7191] hover:text-[#14142B] flex items-center gap-1.5 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Active Filter Pill Summary */}
          <div className="text-xs text-[#6E7191] flex items-center gap-2 self-start lg:self-center">
            <span className="font-semibold text-[#14142B]">{filteredItems.length}</span>
            <span>of {totalCount} products</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Store Assignment</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !items ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">Loading products...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#6E7191]">
                    <p className="text-base font-semibold text-[#14142B] mb-1">No products found</p>
                    <p className="text-xs text-[#A0A3BD]">
                      {hasActiveFilters ? "Try adjusting or clearing your search / category / store filters." : "No products have been added yet."}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-3 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-[#e60060] transition-colors inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item._id} className="hover:bg-[#FAFAFC] transition-colors">
                    
                    {/* Product Name & Image */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image || "/images/default/food.png"} 
                          alt={item.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-[#EFF0F6] shrink-0" 
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/default/food.png"; }}
                        />
                        <div className="max-w-xs">
                          <span className="text-sm font-semibold text-[#14142B] block truncate" title={item.name}>
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-xs text-[#6E7191] line-clamp-1 break-words mt-0.5">
                              {item.description}
                            </span>
                          )}
                          {item.isFeatured && (
                            <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F7F7FC] text-[#4E4B66] border border-[#EFF0F6]">
                        {item.categoryId?.name || "General"}
                      </span>
                    </td>

                    {/* Store Assignment */}
                    <td className="px-6 py-4">
                      {item.isUnassignedStore ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span>🌐</span>
                          <span>Unassigned (Global)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <StoreIcon className="w-3.5 h-3.5" />
                          <span>{item.storeName || "Assigned Store"}</span>
                        </span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      {item.discountPrice && Number(item.discountPrice) > 0 && Number(item.discountPrice) < Number(item.price) ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-primary">{formatPrice(item.discountPrice)}</span>
                            <span className="text-xs text-[#A0A3BD] line-through">{formatPrice(item.price)}</span>
                          </div>
                          <span className="inline-block text-[10px] font-bold text-[#1AB759] bg-[#E0FFED] px-1.5 py-0.5 rounded w-fit">
                            -{Math.round(((item.price - item.discountPrice) / item.price) * 100)}% Sale
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-[#14142B]">{formatPrice(item.price)}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                        {item.status ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#1AB759] flex items-center justify-center hover:bg-[#E0FFED] transition-colors" title="Edit Product">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(item)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors" title="Delete Product">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination & Summary Footer */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[#6E7191]">
          <span>Showing {filteredItems.length} of {totalCount} entries</span>
          {hasActiveFilters && (
            <span className="text-xs text-primary font-medium">Filtered results active</span>
          )}
        </div>
      </div>

      <ItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onSuccess={fetchItems}
      />

      <DeleteConfirmationModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

