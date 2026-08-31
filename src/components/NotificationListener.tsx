"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PushNotificationDetailModal, {
  PushNotificationData,
} from "@/components/frontend/PushNotificationDetailModal";

// ── Web Audio Chime Synthesizer ──────────────────────────────────────────────
function playNotificationChime(type: "admin_order" | "customer_update" | "broadcast" = "admin_order") {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "admin_order") {
      const notes = [587.33, 739.99, 880.0];
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
    } else if (type === "broadcast") {
      const notes = [440.0, 554.37, 659.25, 880.0];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.4);
      });
    } else {
      const notes = [523.25, 659.25];
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

// ── Trigger OS Background Notification ──────────────────────────────────────
async function triggerOsNotification(
  title: string,
  options: { body: string; url?: string; tag?: string; image?: string }
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    try {
      const res = await Notification.requestPermission();
      if (res !== "granted") return;
    } catch {
      return;
    }
  }

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        reg.showNotification(title, {
          body: options.body,
          icon: "/images/theme/theme-favicon-logo.png?v=3",
          badge: "/images/theme/theme-favicon-logo.png?v=3",
          image: options.image,
          vibrate: [200, 100, 200],
          data: { url: options.url || "/", body: options.body, title },
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

  try {
    const notif = new Notification(title, {
      body: options.body,
      icon: "/images/theme/theme-favicon-logo.png?v=3",
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

// ── Global event key for showing notification detail modal ──────────────────
export const NOTIF_MODAL_EVENT = "nectar:show-notification";

export default function NotificationListener() {
  const lastAdminOrderSerialRef = useRef<string | null>(null);
  const knownCustomerOrderStatusesRef = useRef<Record<string, string>>({});
  const isInitialFetchRef = useRef(true);
  const isInitialBroadcastRef = useRef(true);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [activeNotification, setActiveNotification] = useState<PushNotificationData | null>(null);

  // Helper to open the detail modal
  const openModal = (notif: PushNotificationData) => {
    setActiveNotification({ ...notif, receivedAt: notif.receivedAt ?? Date.now() });
  };

  // ── Helper: subscribe to Web Push via VAPID ─────────────────────────────
  const subscribeToWebPush = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;

      // Fetch the VAPID public key
      const keyRes = await fetch("/api/vapid-public-key");
      const { publicKey } = await keyRes.json();
      if (!publicKey) return;

      // Convert base64url VAPID key to Uint8Array
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawKey = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // Check if already subscribed or create new subscription
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: rawKey,
        });
      }

      // Read current logged-in user profile from localStorage
      let userId: string | undefined;
      let userRole: string = "customer";
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u._id) userId = u._id;
          if (u.role) userRole = u.role;
        } else {
          const authStorage = localStorage.getItem("nectar_auth_storage");
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            if (parsed?.state?.user?._id) userId = parsed.state.user._id;
            if (parsed?.state?.user?.role) userRole = parsed.state.user.role;
          }
        }
      } catch {
        // ignore
      }

      // Save the subscription to the server
      const token = document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/auth/subscribe-push", {
        method: "POST",
        headers,
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
          userRole,
        }),
      });

      console.log("✅ [Nectar] Web Push subscription successfully synced with server");
    } catch (err) {
      console.warn("[Nectar] Web Push subscription sync warning:", err);
    }
  };

  // ── 1. Register Service Worker, Request Permission & Listen for SW messages ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          console.log("✅ [Nectar] Service Worker active:", reg.scope);

          // If permission already granted, subscribe immediately
          if ("Notification" in window && Notification.permission === "granted") {
            await subscribeToWebPush();
          }
        })
        .catch((err) => {
          console.warn("⚠️ [Nectar] SW registration skipped:", err.message);
        });

      // Listen for messages from Service Worker (e.g. notification was tapped)
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "NOTIFICATION_TAPPED") {
          const { title, body, url, image } = event.data;
          openModal({ title, body, url, image, receivedAt: Date.now() });
        }
      });
    }

    // Check if there's a pending notification stored from when app was closed
    try {
      const pending = localStorage.getItem("nectar_pending_tap_notification");
      if (pending) {
        const parsed: PushNotificationData = JSON.parse(pending);
        // Only show if recent (within 5 minutes)
        if (parsed.receivedAt && Date.now() - parsed.receivedAt < 5 * 60 * 1000) {
          openModal(parsed);
        }
        localStorage.removeItem("nectar_pending_tap_notification");
      }
    } catch {
      // ignore
    }

    // SW redirects here with __notif_tap param when notification tapped & app was closed
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const notifTapParam = urlParams.get("__notif_tap");
      if (notifTapParam) {
        const tapData = JSON.parse(decodeURIComponent(notifTapParam));
        openModal({
          title: tapData.title,
          body: tapData.body,
          url: tapData.url,
          image: tapData.image,
          receivedAt: tapData.receivedAt || Date.now(),
        });
        // Clean the URL without a page reload
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("__notif_tap");
        window.history.replaceState({}, "", cleanUrl.toString());
      }
    } catch {
      // ignore malformed param
    }

    // Listen for in-app dispatched notification events
    const handleInAppNotif = (e: Event) => {
      const custom = e as CustomEvent<PushNotificationData>;
      openModal(custom.detail);
    };
    window.addEventListener(NOTIF_MODAL_EVENT, handleInAppNotif);

    // Auto-request notification permission on first user interaction
    // After granting, immediately subscribe to Web Push
    const requestPermission = async () => {
      if ("Notification" in window && Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          console.log("✅ [Nectar] Push notification permission granted");
          await subscribeToWebPush();
        }
      } else if ("Notification" in window && Notification.permission === "granted") {
        await subscribeToWebPush();
      }
    };
    window.addEventListener("click", requestPermission, { once: true });
    window.addEventListener("touchstart", requestPermission, { once: true });

    return () => {
      window.removeEventListener("click", requestPermission);
      window.removeEventListener("touchstart", requestPermission);
      window.removeEventListener(NOTIF_MODAL_EVENT, handleInAppNotif);
    };
  }, []);

  // ── 2. Real-Time Polling Engine ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkUpdates = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;

        // ── A. BROADCAST PUSH NOTIFICATIONS ──────────────────────────────
        try {
          const bRes = await fetch("/api/frontend/push-notifications", { cache: "no-store" });
          const bData = await bRes.json();

          if (bData.status && Array.isArray(bData.data) && bData.data.length > 0) {
            const seenMap: Record<string, boolean> = JSON.parse(
              localStorage.getItem("nectar_seen_broadcasts") || "{}"
            );

            bData.data.forEach((broadcast: any) => {
              const broadcastKey = `${broadcast._id}_${new Date(broadcast.updatedAt).getTime()}`;

              if (!seenMap[broadcastKey]) {
                seenMap[broadcastKey] = true;

                const sentTime = new Date(broadcast.updatedAt).getTime();
                const isRecent = Date.now() - sentTime < 10 * 60 * 1000;

                if (!isInitialBroadcastRef.current || isRecent) {
                  const notifData: PushNotificationData = {
                    title: broadcast.title,
                    body: broadcast.description,
                    url: broadcast.url || "/",
                    image: broadcast.image,
                    receivedAt: Date.now(),
                  };

                  playNotificationChime("broadcast");

                  triggerOsNotification(broadcast.title, {
                    body: broadcast.description,
                    url: broadcast.url || "/",
                    image: broadcast.image,
                    tag: `broadcast-${broadcastKey}`,
                  });

                  // Toast with "View" that opens the detail modal
                  toast(broadcast.title, {
                    description: broadcast.description,
                    duration: 8000,
                    action: {
                      label: "View",
                      onClick: () => openModal(notifData),
                    },
                  });
                }
              }
            });

            localStorage.setItem("nectar_seen_broadcasts", JSON.stringify(seenMap));
          }
          isInitialBroadcastRef.current = false;
        } catch {
          // Silent broadcast poll catch
        }

        // ── B. ADMIN / STORE MANAGER NEW ORDERS ──────────────────────────
        if (user && (user.role === "admin" || user.role === "store_manager")) {
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
              lastAdminOrderSerialRef.current = currentLatestSerial;

              const amountFormatted = `₦${Number(latestOrder.totalAmount || 0).toLocaleString()}`;
              const customerName = latestOrder.customerName || "Customer";
              const title = `🚨 New Order #${currentLatestSerial}!`;
              const body = `${customerName} placed an order for ${amountFormatted}. Tap to view and manage this order from the admin panel.`;

              const notifData: PushNotificationData = {
                title,
                body,
                url: "/admin/orders",
                receivedAt: Date.now(),
              };

              playNotificationChime("admin_order");

              triggerOsNotification(title, { body, url: "/admin/orders", tag: `admin-order-${currentLatestSerial}` });

              toast.success(title, {
                description: `${customerName} placed an order for ${amountFormatted}.`,
                duration: 8000,
                action: {
                  label: "View",
                  onClick: () => openModal(notifData),
                },
              });
            }
          }
        }

        // ── C. CUSTOMER ORDER STATUS UPDATES ─────────────────────────────
        if (user && user.role === "customer") {
          const res = await fetch("/api/frontend/orders", { credentials: "include", cache: "no-store" });
          const data = await res.json();

          if (data.status && Array.isArray(data.data)) {
            data.data.slice(0, 5).forEach((order: any) => {
              const orderId = order.orderSerialNo || order._id;
              const currentStatus = order.orderStatus;
              const prevStatus = knownCustomerOrderStatusesRef.current[orderId];

              if (!isInitialFetchRef.current && prevStatus && prevStatus !== currentStatus) {
                let statusLabel = currentStatus;
                let emoji = "📦";
                if (currentStatus === "accepted") { statusLabel = "Accepted by Store"; emoji = "✅"; }
                if (currentStatus === "preparing") { statusLabel = "Being Prepared"; emoji = "👨‍🍳"; }
                if (currentStatus === "out_for_delivery") { statusLabel = "Out for Delivery"; emoji = "🚚"; }
                if (currentStatus === "delivered") { statusLabel = "Delivered! Thank you for ordering with Nectar."; emoji = "🎉"; }
                if (currentStatus === "canceled") { statusLabel = "Canceled"; emoji = "❌"; }

                const title = `${emoji} Order #${order.orderSerialNo} Update`;
                const body = `Your order status has been updated to: ${statusLabel}.\n\nTap to view full order details.`;

                const notifData: PushNotificationData = {
                  title,
                  body,
                  url: "/account/orders",
                  receivedAt: Date.now(),
                };

                playNotificationChime("customer_update");

                triggerOsNotification(title, {
                  body,
                  url: "/account/orders",
                  tag: `cust-order-${orderId}-${currentStatus}`,
                });

                toast.info(title, {
                  description: `Status: ${statusLabel}`,
                  duration: 6000,
                  action: {
                    label: "View",
                    onClick: () => openModal(notifData),
                  },
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

    checkUpdates();
    const interval = setInterval(checkUpdates, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <PushNotificationDetailModal
        notification={activeNotification}
        onClose={() => setActiveNotification(null)}
      />
    </>
  );
}
