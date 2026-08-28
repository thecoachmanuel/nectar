import React, { useState } from "react";
import Modal from "./Modal";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone."
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#FFEAEA] text-[#FB4E4E] flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-sm text-[#4E4B66] mb-6">{message}</p>
        
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl border border-[#EFF0F6] bg-white text-[#6E7191] font-medium hover:bg-[#F7F7FC] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl bg-[#FB4E4E] text-white font-medium hover:bg-[#e03a3a] transition-colors shadow-md shadow-[#FB4E4E]/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
