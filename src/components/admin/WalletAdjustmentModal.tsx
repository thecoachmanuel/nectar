"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Plus, Minus, Wallet, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { toast } from "sonner";

interface WalletAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    walletBalance?: number;
  } | null;
  initialAction?: "add" | "deduct";
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000, 50000];

export default function WalletAdjustmentModal({
  isOpen,
  onClose,
  user,
  initialAction = "add",
  onSuccess,
}: WalletAdjustmentModalProps) {
  const [action, setAction] = useState<"add" | "deduct">(initialAction);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAction(initialAction);
    setAmount("");
  }, [isOpen, initialAction, user]);

  if (!user) return null;

  const currentBalance = Number(user.walletBalance || 0);
  const numericAmount = Number(amount) || 0;
  const resultingBalance =
    action === "add"
      ? currentBalance + numericAmount
      : Math.max(0, currentBalance - numericAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          amount: numericAmount,
        }),
      });

      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "Wallet updated successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to update wallet");
      }
    } catch (err: any) {
      toast.error("Network error updating wallet balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <span>Manage Customer Wallet</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer & Current Balance Info Card */}
        <div className="p-4 rounded-2xl bg-[#F7F7FC] border border-[#EFF0F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Customer</p>
            <h4 className="text-base font-bold text-[#14142B]">{user.name}</h4>
            <p className="text-xs text-[#A0A3BD]">{user.phone || user.email || "No contact info"}</p>
          </div>
          <div className="sm:text-right border-t sm:border-t-0 border-[#EFF0F6] pt-2 sm:pt-0">
            <p className="text-xs font-semibold text-[#6E7191] uppercase tracking-wider">Current Balance</p>
            <p className="text-lg font-bold text-primary">{formatPrice(currentBalance)}</p>
          </div>
        </div>

        {/* Action Toggle (Add Credit vs Deduct) */}
        <div>
          <label className="block text-xs font-bold text-[#6E7191] uppercase tracking-wider mb-2">
            Action Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F7FC] border border-[#EFF0F6] rounded-xl">
            <button
              type="button"
              onClick={() => setAction("add")}
              className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                action === "add"
                  ? "bg-[#1AB759] text-white shadow-sm"
                  : "text-[#6E7191] hover:text-[#14142B]"
              }`}
            >
              <Plus className="w-4 h-4" />
              Add / Fund Credit
            </button>
            <button
              type="button"
              onClick={() => setAction("deduct")}
              className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                action === "deduct"
                  ? "bg-[#FB4E4E] text-white shadow-sm"
                  : "text-[#6E7191] hover:text-[#14142B]"
              }`}
            >
              <Minus className="w-4 h-4" />
              Deduct / Debit
            </button>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-xs font-bold text-[#6E7191] uppercase tracking-wider mb-2">
            Quick Select Amount
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  numericAmount === amt
                    ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                    : "border-[#EFF0F6] bg-white text-[#14142B] hover:border-primary/50 hover:bg-[#F7F7FC]"
                }`}
              >
                +₦{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div>
          <label className="block text-xs font-bold text-[#6E7191] uppercase tracking-wider mb-2">
            Amount to {action === "add" ? "Fund" : "Deduct"} (₦)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#14142B]">
              ₦
            </span>
            <input
              type="number"
              min="1"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-12 pl-9 pr-4 rounded-xl border border-[#EFF0F6] bg-white text-base font-bold text-[#14142B] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        {numericAmount > 0 && (
          <div className="p-3.5 rounded-xl bg-[#EBF8FF] border border-[#BDEFFF] flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-[#00749B]">
              <span className="font-semibold">{formatPrice(currentBalance)}</span>
              <span>{action === "add" ? "+" : "-"}</span>
              <span className="font-bold">{formatPrice(numericAmount)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-[#008BBA] flex items-center gap-1.5">
              <span>New Balance:</span>
              <span className="text-base text-[#14142B]">{formatPrice(resultingBalance)}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#EFF0F6] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-11 rounded-xl border border-[#EFF0F6] text-[#6E7191] font-semibold text-sm hover:bg-[#F7F7FC] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !numericAmount || numericAmount <= 0}
            className={`px-6 h-11 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              action === "add"
                ? "bg-[#1AB759] hover:bg-[#169d4c] shadow-[#1AB759]/20"
                : "bg-[#FB4E4E] hover:bg-[#e03b3b] shadow-[#FB4E4E]/20"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm {action === "add" ? "Credit" : "Debit"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
