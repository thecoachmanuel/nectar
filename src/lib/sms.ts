import twilio from "twilio";
import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";

export async function sendSMS(to: string, message: string) {
  try {
    await dbConnect();
    
    // Fetch SMS settings from DB
    const settings = await Setting.find({ key: { $in: ["sms_twilio_sid", "sms_twilio_token", "sms_twilio_from", "sms_enabled"] } });
    const config: Record<string, string> = {};
    settings.forEach(s => config[s.key] = s.payload);

    if (config.sms_enabled !== "Yes") {
      console.log("SMS is disabled in settings. Skipping.");
      return false;
    }

    const accountSid = config.sms_twilio_sid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = config.sms_twilio_token || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = config.sms_twilio_from || process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio credentials not fully configured.");
      return false;
    }

    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to, // Must include country code, e.g. +1234567890
    });

    console.log("SMS sent successfully:", result.sid);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}
