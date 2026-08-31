"use client";

import React, { useEffect } from "react";
import { X, ExternalLink, Bell } from "lucide-react";

export interface PushNotificationData {
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
  receivedAt?: number;
}

interface PushNotificationDetailModalProps {
  notification: PushNotificationData | null;
  onClose: () => void;
}

export default function PushNotificationDetailModal({
  notification,
  onClose,
}: PushNotificationDetailModalProps) {
  const isOpen = !!notification;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !notification) return null;

  const hasActionUrl =
    notification.url && notification.url !== "/" && notification.url !== "";

  const formattedTime = notification.receivedAt
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(notification.receivedAt))
    : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Notification Details"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        className="relative w-full sm:max-w-md mx-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in"
        style={{
          animationDuration: "0.25s",
          animationTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
          animationFillMode: "both",
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#D9DBE9]" />
        </div>

        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-br from-primary to-[#ff006b]/80 px-5 pt-5 pb-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Site logo + badge */}
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg shrink-0">
              <img
                src="/images/theme/theme-favicon-logo.png"
                alt="Nectar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold mb-1.5 border border-white/20">
                <Bell className="w-2.5 h-2.5" />
                Nectar Notification
              </div>
              {formattedTime && (
                <p className="text-white/70 text-[10px]">{formattedTime}</p>
              )}
            </div>
          </div>
        </div>

        {/* Body content — slightly overlapping the header */}
        <div className="-mt-5 bg-white rounded-t-3xl px-5 pt-5 pb-6 space-y-4">
          {/* Optional notification image */}
          {notification.image && (
            <div className="w-full rounded-2xl overflow-hidden border border-[#EFF0F6]">
              <img
                src={notification.image}
                alt="Notification banner"
                className="w-full object-cover max-h-44"
              />
            </div>
          )}

          {/* Title */}
          <h2 className="text-[#14142B] font-bold text-lg leading-snug">
            {notification.title}
          </h2>

          {/* Full body / description */}
          <p className="text-[#6E7191] text-sm leading-relaxed whitespace-pre-wrap">
            {notification.body}
          </p>

          {/* Divider */}
          <div className="border-t border-[#EFF0F6]" />

          {/* Action buttons */}
          <div className="flex gap-3">
            {hasActionUrl && (
              <a
                href={notification.url}
                onClick={onClose}
                className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
              >
                <ExternalLink className="w-4 h-4" />
                View Details
              </a>
            )}
            <button
              onClick={onClose}
              className={`h-11 rounded-xl border border-[#EFF0F6] text-[#6E7191] text-sm font-medium hover:bg-[#F7F7FC] transition-colors ${
                hasActionUrl ? "px-5" : "flex-1"
              }`}
            >
              {hasActionUrl ? "Dismiss" : "Close"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation-name: slide-up;
        }
        @media (min-width: 640px) {
          .sm\\:animate-scale-in {
            animation-name: scale-in !important;
          }
        }
      `}</style>
    </div>
  );
}
