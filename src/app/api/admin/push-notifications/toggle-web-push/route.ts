import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const setting = await Setting.findOne({ key: "web_push_enabled" }).lean();
    return NextResponse.json({
      status: true,
      enabled: setting?.payload === true,
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    
    let enabled: boolean;
    if (typeof body.enabled === "boolean") {
      enabled = body.enabled;
    } else {
      const current = await Setting.findOne({ key: "web_push_enabled" }).lean();
      enabled = !(current?.payload === true);
    }

    await Setting.findOneAndUpdate(
      { key: "web_push_enabled" },
      { key: "web_push_enabled", group: "Push Notification", payload: enabled },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      status: true,
      enabled,
      message: enabled
        ? "Web Push Notifications (VAPID) is now ACTIVE"
        : "Web Push Notifications (VAPID) is now PAUSED",
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
