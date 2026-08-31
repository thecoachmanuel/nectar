"use client";

import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

// ── Web Audio Chime Synthesizer ──────────────────────────────────────────────
// Produces an instant, pleasant notification chime without relying on external MP3 files
function playNotificationChime(type: "admin_order" | "customer_update" = "admin_order") {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "admin_order") {
      // 3-tone urgent alert chime for Admin
      const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } else {
      // Gentle 2-tone chime for Customer
      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.35);
      });
    }
  } catch (e) {
    // AudioContext blocked before first user gesture
  }
}

// ── Trigger OS Background Notification ─────────────────────────────────────────
async function triggerOsNotification(title: string, options: { body: string; url?: string; tag?: string }) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    try {
      const res = await Notification.requestPermission();
      if (res !== "granted") return;
    } catch {
      return;
    }
  }

  // 1. Try displaying via Service Worker (Works perfectly when browser is minimized or tab is hidden)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        reg.showNotification(title, {
          body: options.body,
          icon: "/images/theme/theme-favicon-logo.png",
          badge: "/images/theme/theme-favicon-logo.png",
          vibrate: [200, 100, 200],
          data: { url: options.url || "/" },
          tag: options.tag || `nectar-${Date.now()}`,
          renotify: true,
          requireInteraction: true,
        } as any);
        return;
      }
    } catch (swErr) {
      console.warn("[SW Notification fallback]", swErr);
    }
  }

  // 2. Fallback to standard Notification API
  try {
    const notif = new Notification(title, {
      body: options.body,
      icon: "/images/theme/theme-favicon-logo.png",
      tag: options.tag,
    });
    notif.onclick = () => {
      window.focus();
      if (options.url) window.location.href = options.url;
      notif.close();
    };
  } catch (e) {
    console.error("[Notification Error]", e);
  }
}

export default function NotificationListener() {
  const lastAdminOrderSerialRef = useRef<string | null>(null);
  const knownCustomerOrderStatusesRef = useRef<Record<string, string>>({});
  const isInitialFetchRef = useRef(true);

  // ── 1. Register Service Worker & Request Notification Permission ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("✅ [Nectar] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("⚠️ [Nectar] SW registration skipped:", err.message);
        });
    }

    // Request notification permission if not yet decided
    if ("Notification" in window && Notification.permission === "default") {
      const requestTimer = setTimeout(() => {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            console.log("✅ [Nectar] Push notification permission granted");
          }
        });
      }, 3000);
      return () => clearTimeout(requestTimer);
    }
  }, []);

  // ── 2. Real-Time Order Polling & Background Dispatcher ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkUpdates = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);

        // ── Case A: ADMIN / STORE MANAGER ─────────────────────────────────
        if (user.role === "admin" || user.role === "store_manager") {
          const res = await fetch("/api/admin/orders?limit=5", { cache: "no-store" });
          const data = await res.json();

          if (data.status && Array.isArray(data.data) && data.data.length > 0) {
            const latestOrder = data.data[0];
            const currentLatestSerial = latestOrder.orderSerialNo;

            if (isInitialFetchRef.current) {
              lastAdminOrderSerialRef.current = currentLatestSerial;
            } else if (
              lastAdminOrderSerialRef.current &&
              currentLatestSerial !== lastAdminOrderSerialRef.current
            ) {
              // 🔔 NEW ORDER DETECTED!
              lastAdminOrderSerialRef.current = currentLatestSerial;

              const amountFormatted = `₦${Number(latestOrder.totalAmount || 0).toLocaleString()}`;
              const customerName = latestOrder.customerName || "Customer";
              const title = `🚨 New Order #${currentLatestSerial}!`;
              const body = `${customerName} placed an order for ${amountFormatted}. Tap to manage.`;

              // Play audible chime sound
              playNotificationChime("admin_order");

              // If minimized or hidden, fire OS-level notification
              triggerOsNotification(title, {
                body,
                url: "/admin/orders",
                tag: `admin-order-${currentLatestSerial}`,
              });

              // Toast in UI
              toast.success(title, {
                description: body,
                duration: 8000,
                action: {
                  label: "View",
                  onClick: () => {
                    window.location.href = "/admin/orders";
                  },
                },
              });
            }
          }
        }

        // ── Case B: CUSTOMER ──────────────────────────────────────────────
        if (user.role === "customer") {
          const res = await fetch("/api/frontend/orders", { credentials: "include", cache: "no-store" });
          const data = await res.json();

          if (data.status && Array.isArray(data.data)) {
            data.data.slice(0, 5).forEach((order: any) => {
              const orderId = order.orderSerialNo || order._id;
              const currentStatus = order.orderStatus;
              const prevStatus = knownCustomerOrderStatusesRef.current[orderId];

              if (!isInitialFetchRef.current && prevStatus && prevStatus !== currentStatus) {
                // Status changed!
                let statusLabel = currentStatus;
                let emoji = "📦";
                if (currentStatus === "accepted") { statusLabel = "Accepted by Store"; emoji = "✅"; }
                if (currentStatus === "preparing") { statusLabel = "Being Prepared"; emoji = "👨‍🍳"; }
                if (currentStatus === "out_for_delivery") { statusLabel = "Out for Delivery"; emoji = "🚚"; }
                if (currentStatus === "delivered") { statusLabel = "Delivered"; emoji = "🎉"; }
                if (currentStatus === "canceled") { statusLabel = "Canceled"; emoji = "❌"; }

                const title = `${emoji} Order #${order.orderSerialNo} Update`;
                const body = `Your order status is now: ${statusLabel}`;

                playNotificationChime("customer_update");

                triggerOsNotification(title, {
                  body,
                  url: "/account/orders",
                  tag: `cust-order-${orderId}-${currentStatus}`,
                });

                toast.info(title, {
                  description: body,
                  duration: 6000,
                });
              }

              knownCustomerOrderStatusesRef.current[orderId] = currentStatus;
            });
          }
        }

        isInitialFetchRef.current = false;
      } catch (err) {
        // Silent poll error
      }
    };

    // Initial check + recurring background polling interval every 5 seconds
    checkUpdates();
    const interval = setInterval(checkUpdates, 5000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
