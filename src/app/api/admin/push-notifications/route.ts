import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PushNotification from "@/models/PushNotification";
import User from "@/models/User";
import { sendBulkPushNotification, sendBulkWebPush } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const notifications = await PushNotification.find({}).sort({ createdAt: -1 });

    const [totalUsers, customersCount, sellersCount, ridersCount] = await Promise.all([
      User.countDocuments({ status: true }),
      User.countDocuments({ role: "customer", status: true }),
      User.countDocuments({ role: { $in: ["store_manager", "chef", "waiter"] }, status: true }),
      User.countDocuments({ role: "delivery_boy", status: true }),
    ]);

    const activeTokensCount = await User.countDocuments({
      pushSubscription: { $exists: true, $ne: null },
      status: true,
    });

    return NextResponse.json({
      status: true,
      data: notifications,
      audienceStats: {
        all: totalUsers,
        customer: customersCount,
        store_manager: sellersCount,
        delivery_boy: ridersCount,
        activeSubscribers: activeTokensCount,
      },
    });
  } catch (error: any) {
    console.error("Fetch Push Notifications error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { title, description, targetRole = "all", image, url = "/" } = body;

    if (!title || !description) {
      return NextResponse.json(
        { status: false, message: "Title and description are required." },
        { status: 400 }
      );
    }

    // Build user filter based on targetRole
    let userFilter: any = { status: true };
    if (targetRole === "customer") {
      userFilter.role = "customer";
    } else if (targetRole === "store_manager") {
      userFilter.role = { $in: ["store_manager", "chef", "waiter"] };
    } else if (targetRole === "delivery_boy") {
      userFilter.role = "delivery_boy";
    }

    const targetUsers = await User.find(userFilter).select(
      "deviceToken pushSubscription role email"
    );
    const totalRecipients = targetUsers.length;

    // ── 1. Web Push Protocol (VAPID) — Works on Android & iOS PWA even when minimized ──
    const webPushSubscriptions = targetUsers
      .map((u) => u.pushSubscription)
      .filter((s): s is Record<string, any> => !!s && !!s.endpoint);

    let webPushResult: any = { success: false, sent: 0 };
    if (webPushSubscriptions.length > 0) {
      webPushResult = await sendBulkWebPush(webPushSubscriptions, title, description, {
        url: url || "/",
        image,
        targetRole,
        tag: `nectar-broadcast-${Date.now()}`,
      });
    }

    // ── 2. OneSignal / Legacy deviceToken dispatch ──────────────────────────
    const deviceTokens = targetUsers
      .map((u) => u.deviceToken)
      .filter((t): t is string => !!t && typeof t === "string" && t.trim().length > 0);

    await sendBulkPushNotification(deviceTokens, title, description, {
      url: url || "/",
      targetRole,
      image,
    });

    // ── 3. Save to DB history ────────────────────────────────────────────────
    const newRecord = new PushNotification({
      title,
      description,
      targetRole,
      image: image || undefined,
      url: url || "/",
      recipientsCount: totalRecipients,
      tokensCount: webPushSubscriptions.length,
      status: "sent",
      sentBy: "Admin",
    });
    await newRecord.save();

    const roleName =
      targetRole === "all"
        ? "all users"
        : targetRole === "customer"
        ? "all customers"
        : targetRole === "store_manager"
        ? "all sellers"
        : "all delivery boys";

    return NextResponse.json({
      status: true,
      message: `Push notification dispatched to ${roleName}! (${webPushSubscriptions.length} web push + ${deviceTokens.length} device tokens).`,
      data: newRecord,
      webPushResult,
    });
  } catch (error: any) {
    console.error("Send Push Notification error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
