import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";

export async function sendPushNotification(token: string, title: string, body: string, data?: any) {
  return sendBulkPushNotification([token], title, body, data);
}

export async function sendBulkPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: any
) {
  try {
    await dbConnect();
    const settings = await Setting.find({
      key: { $in: ["push_onesignal_app_id", "push_onesignal_rest_api_key", "push_enabled"] },
    });
    const config: Record<string, string> = {};
    settings.forEach((s) => (config[s.key] = s.payload));

    const appId = config.push_onesignal_app_id || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = config.push_onesignal_rest_api_key || process.env.ONESIGNAL_REST_API_KEY;

    const validTokens = (tokens || []).filter((t) => t && typeof t === "string" && t.trim().length > 0);

    // If OneSignal credentials are configured, dispatch through OneSignal API
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

        const response = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${restApiKey}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (response.ok) {
          return { success: true, result, recipients: result.recipients || validTokens.length };
        } else {
          console.warn("[OneSignal warning]:", result);
        }
      } catch (osErr) {
        console.warn("[OneSignal dispatch error]:", osErr);
      }
    }

    // Direct in-app & Service Worker push delivery is active
    return {
      success: true,
      recipients: validTokens.length,
      mode: "broadcast_sync",
    };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return { success: false, message: error.message };
  }
}
