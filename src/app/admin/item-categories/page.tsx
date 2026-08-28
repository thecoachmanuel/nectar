"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import CategoryModal from "@/components/admin/CategoryModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

export default function ItemCategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  const { execute, data: categories, loading } = useApi();
  const { execute: deleteCategory } = useApi();

  const fetchCategories = () => {
    execute("/api/admin/item-categories");
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCategory) {
      await deleteCategory(`/api/admin/item-categories/${selectedCategory._id}`, {
        method: "DELETE",
        successMessage: "Category deleted",
      });
      fetchCategories();
    }
  };

  return (
    <div className="pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EFF0F6] mb-6">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF0F6]">
          <h3 className="font-semibold text-lg text-[#14142B]">Item Categories</h3>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-[#ff006b] w-full sm:w-48 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={handleAdd}
              className="h-10 px-4 rounded-xl bg-[#ff006b] text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-[#ff006b]/20"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Category</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F7F7FC] border-b border-[#EFF0F6]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF0F6]">
              {loading && !categories ? (
                <tr><td colSpan={3} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              ) : categories?.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-[#6E7191]">No categories found</td></tr>
              ) : (
                categories?.map((category: any) => (
                  <tr key={category._id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#14142B]">{category.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.status ? 'bg-[#E0FFED] text-[#1AB759]' : 'bg-[#FFEAEA] text-[#FB4E4E]'}`}>
                        {category.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(category)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#1AB759] flex items-center justify-center hover:bg-[#E0FFED] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(category)} className="w-8 h-8 rounded-lg bg-[#F7F7FC] text-[#FB4E4E] flex items-center justify-center hover:bg-[#FFEAEA] transition-colors">
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
          <span className="text-sm text-[#6E7191]">Showing {categories?.length || 0} entries</span>
        </div>
      </div>

      <CategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      <DeleteConfirmationModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
