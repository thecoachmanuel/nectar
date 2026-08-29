"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, GripVertical } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import CategoryModal from "@/components/admin/CategoryModal";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { toast } from "sonner";

// Separate Row Component for Sortable
function SortableTableRow({ category, handleEdit, handleDeleteClick }: { category: any, handleEdit: any, handleDeleteClick: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as "relative",
  };

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-[#FAFAFC] transition-colors ${isDragging ? "bg-blue-50 shadow-lg border border-blue-200" : ""}`}>
      <td className="px-6 py-4 w-10">
        <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-700 p-1">
          <GripVertical className="w-5 h-5" />
        </button>
      </td>
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
  );
}

export default function ItemCategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  
  const { execute, data: categories, loading } = useApi();
  const { execute: deleteCategory } = useApi();
  const { execute: updateReorder } = useApi();

  const fetchCategories = () => {
    execute("/api/admin/item-categories");
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories) {
      // Sort by sortOrder locally if available, else fallback to name
      const sorted = [...categories].sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) return a.sortOrder - b.sortOrder;
        return 0;
      });
      setLocalCategories(sorted);
    }
  }, [categories]);

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

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = localCategories.findIndex(item => item._id === active.id);
      const newIndex = localCategories.findIndex(item => item._id === over.id);
      
      const newArray = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newArray);

      // Create payload mapping id to its new index
      const payload = newArray.map((item, index) => ({ _id: item._id, sortOrder: index }));

      // Save to backend silently
      try {
        await updateReorder("/api/admin/item-categories/reorder", {
          method: "PUT",
          body: { items: payload }
        });
      } catch (e) {
        toast.error("Failed to save category order.");
        fetchCategories(); // Revert
      }
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
                className="h-10 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#F7F7FC] text-sm focus:outline-none focus:border-primary w-full sm:w-48 transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0A3BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={handleAdd}
              className="h-10 px-4 rounded-xl bg-primary text-white flex items-center gap-2 hover:bg-[#e60060] transition-colors shadow-md shadow-primary/20"
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
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider w-10">Reorder</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#6E7191] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            
            {loading && localCategories.length === 0 ? (
              <tbody className="divide-y divide-[#EFF0F6]">
                <tr><td colSpan={4} className="p-8 text-center text-[#6E7191]">Loading...</td></tr>
              </tbody>
            ) : localCategories.length === 0 ? (
              <tbody className="divide-y divide-[#EFF0F6]">
                <tr><td colSpan={4} className="p-8 text-center text-[#6E7191]">No categories found</td></tr>
              </tbody>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <tbody className="divide-y divide-[#EFF0F6]">
                  <SortableContext 
                    items={localCategories.map(c => c._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localCategories.map((category) => (
                      <SortableTableRow 
                        key={category._id} 
                        category={category}
                        handleEdit={handleEdit}
                        handleDeleteClick={handleDeleteClick}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </DndContext>
            )}
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-[#EFF0F6] flex items-center justify-between">
          <span className="text-sm text-[#6E7191]">Showing {localCategories.length || 0} entries</span>
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
