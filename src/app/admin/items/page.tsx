"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import ItemModal from "@/components/admin/ItemModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

export default function ItemsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const { execute, data: items, loading } = useApi();
  const { execute: deleteItem } = useApi();

  const fetchItems = () => {
    execute("/api/admin/items");
  };

  useEffect(() => {
    fetchItems();
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
        successMessage: "Item deleted",
      });
      fetchItems();
    }
  };

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Menu Items</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search items..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-[#ff006b] w-full sm:w-48 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={handleAdd}
              className="h-10 px-4 rounded-xl bg-[#ff006b] text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Item</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !items ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              ) : items?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#6E7191]">No items found</td></tr>
              ) : (
                items?.map((item: any) => (
                  <tr key={item._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image || "/images/default/food.png"} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-lg object-cover border border-[#EFF0F6]" 
                        />
                        <div>
                          <span className="text-sm font-medium text-[#14142B] block">{item.name}</span>
                          {item.isFeatured && <span className="text-[10px] text-[#ff006b] font-medium bg-[#ff006b]/10 px-2 py-0.5 rounded-full mt-1 inline-block">Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66]">{item.categoryId?.name || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#14142B]">₦{item.price?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#4E4B66] flex items-center gap-1">
                        {item.itemType === 'veg' ? '🌱 Veg' : '🍗 Non-Veg'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                        {item.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#1AB759] flex items-center justify-center hover:bg-[#E0FFED] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(item)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors">
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
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {items?.length || 0} entries</span>
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
