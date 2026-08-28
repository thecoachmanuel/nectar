import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";

export async function sendPushNotification(token: string, title: string, body: string, data?: any) {
  try {
    await dbConnect();
    const settings = await Setting.find({ key: { $in: ["push_onesignal_app_id", "push_onesignal_rest_api_key", "push_enabled"] } });
    const config: Record<string, string> = {};
    settings.forEach(s => config[s.key] = s.payload);

    if (config.push_enabled !== "Yes") {
      console.log("Push notifications are disabled in settings.");
      return false;
    }

    const appId = config.push_onesignal_app_id || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = config.push_onesignal_rest_api_key || process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      console.error("OneSignal credentials missing.");
      return false;
    }

    const payload = {
      app_id: appId,
      include_player_ids: [token],
      // OneSignal uses 'headings' and 'contents' instead of 'title' and 'body'
      headings: { en: title },
      contents: { en: body },
      data: data
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${restApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("Successfully sent OneSignal push message:", result);
      return true;
    } else {
      console.error("Error from OneSignal API:", result);
      return false;
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}
