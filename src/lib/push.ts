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

    if (config.push_enabled !== "Yes") {
      console.log("Push notifications are disabled in settings.");
      return { success: false, message: "Push notifications are disabled in settings." };
    }

    const appId = config.push_onesignal_app_id || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = config.push_onesignal_rest_api_key || process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      console.error("OneSignal credentials missing.");
      return { success: false, message: "OneSignal credentials missing in settings." };
    }

    const validTokens = (tokens || []).filter((t) => t && typeof t === "string" && t.trim().length > 0);

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
      console.log("Successfully sent OneSignal push message:", result);
      return { success: true, result, recipients: result.recipients || validTokens.length };
    } else {
      console.error("Error from OneSignal API:", result);
      return { success: false, message: result?.errors?.[0] || "OneSignal delivery failed", result };
    }
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return { success: false, message: error.message };
  }
}
