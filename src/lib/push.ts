import webpush from "web-push";
import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";

function getVapidKeys() {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    "BBqSh1B05Gx9Z5OgJACy4vEH1BCxpaXc9oFsWAnzEQbWECJqPcxO0-QK-iqQuWJwmQS2VBsGeZZUhHrD9maRRCc";
  const privateKey =
    process.env.VAPID_PRIVATE_KEY ||
    "NiBv88ZQBBUNRjH9IbeTyukTU1UQro6RN_TDi6Axv_w";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://nectar-app.vercel.app";
  return { publicKey, privateKey, appUrl };
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: any
) {
  return sendBulkPushNotification([token], title, body, data);
}

/**
 * Send Web Push Notifications using the Web Push Protocol (VAPID).
 *
 * @param subscriptions - Array of PushSubscription JSON objects saved from browsers
 * @param title         - Notification title
 * @param body          - Notification body text
 * @param data          - Extra data (url, image, etc.)
 */
export async function sendBulkWebPush(
  subscriptions: any[],
  title: string,
  body: string,
  data?: any
) {
  const { publicKey, privateKey, appUrl } = getVapidKeys();

  webpush.setVapidDetails(`mailto:admin@${new URL(appUrl).hostname}`, publicKey, privateKey);

  const payload = JSON.stringify({
    title,
    body,
    icon: "/images/theme/theme-favicon-logo.png?v=3",
    badge: "/images/theme/theme-favicon-logo.png?v=3",
    url: data?.url || "/",
    image: data?.image,
    data: data || {},
    requireInteraction: true,
    tag: data?.tag || `nectar-push-${Date.now()}`,
    renotify: true,
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(sub, payload).catch((err) => {
        // 410 Gone = subscription expired, 404 = not found → should be removed
        if (err.statusCode === 410 || err.statusCode === 404) {
          return { expired: true, endpoint: sub.endpoint };
        }
        throw err;
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  const expired = results
    .filter(
      (r) => r.status === "fulfilled" && (r.value as any)?.expired
    )
    .map((r) => (r as any).value?.endpoint);

  return { success: sent > 0 || failed === 0, sent, failed, expired };
}

/**
 * Legacy / OneSignal dispatch path.
 * Kept for backward-compat with deviceToken-based flows.
 */
export async function sendBulkPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: any
) {
  try {
    await dbConnect();
    const settings = await Setting.find({
      key: {
        $in: [
          "push_onesignal_app_id",
          "push_onesignal_rest_api_key",
          "push_enabled",
        ],
      },
    });
    const config: Record<string, string> = {};
    settings.forEach((s) => (config[s.key] = s.payload));

    const appId =
      config.push_onesignal_app_id ||
      process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey =
      config.push_onesignal_rest_api_key ||
      process.env.ONESIGNAL_REST_API_KEY;

    const validTokens = (tokens || []).filter(
      (t) => t && typeof t === "string" && t.trim().length > 0
    );

    if (appId && restApiKey && config.push_enabled !== "No") {
      try {
        const payload: any = {
          app_id: appId,
          headings: { en: title },
          contents: { en: body },
          data: data || {},
        };
        if (validTokens.length > 0) {
          payload.include_player_ids = validTokens;
        } else {
          payload.included_segments = ["Subscribed Users"];
        }
        const response = await fetch(
          "https://onesignal.com/api/v1/notifications",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${restApiKey}`,
            },
            body: JSON.stringify(payload),
          }
        );
        const result = await response.json();
        if (response.ok) {
          return {
            success: true,
            result,
            recipients: result.recipients || validTokens.length,
          };
        }
        console.warn("[OneSignal warning]:", result);
      } catch (osErr) {
        console.warn("[OneSignal dispatch error]:", osErr);
      }
    }

    return { success: true, recipients: validTokens.length, mode: "broadcast_sync" };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return { success: false, message: error.message };
  }
}
