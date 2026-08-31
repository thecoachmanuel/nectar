import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PushNotification from "@/models/PushNotification";
import PushSubscription from "@/models/PushSubscription";
import User from "@/models/User";
import { sendBulkPushNotification, sendBulkWebPush } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const notifications = await PushNotification.find({}).sort({ createdAt: -1 });

    const [totalUsers, customersCount, sellersCount, ridersCount, webPushCount, userTokensCount] =
      await Promise.all([
        User.countDocuments({ status: true }),
        User.countDocuments({ role: "customer", status: true }),
        User.countDocuments({ role: { $in: ["store_manager", "chef", "waiter"] }, status: true }),
        User.countDocuments({ role: "delivery_boy", status: true }),
        PushSubscription.countDocuments({}),
        User.countDocuments({
          $or: [
            { pushSubscription: { $exists: true, $ne: null } },
            { deviceToken: { $exists: true, $ne: "" } },
          ],
          status: true,
        }),
      ]);

    const activeSubscribers = Math.max(webPushCount, userTokensCount);

    return NextResponse.json({
      status: true,
      data: notifications,
      audienceStats: {
        all: totalUsers,
        customer: customersCount,
        store_manager: sellersCount,
        delivery_boy: ridersCount,
        activeSubscribers,
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

    // ── 1. Build Query for Web Push Subscriptions ─────────────────────────
    let subFilter: any = {};
    if (targetRole === "customer") {
      subFilter.role = { $in: ["customer", "guest"] };
    } else if (targetRole === "store_manager") {
      subFilter.role = { $in: ["store_manager", "chef", "waiter"] };
    } else if (targetRole === "delivery_boy") {
      subFilter.role = "delivery_boy";
    }

    const dedicatedSubscriptions = await PushSubscription.find(subFilter).lean();

    // ── 2. Build Query for Users ──────────────────────────────────────────
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
    ).lean();
    const totalRecipients = targetUsers.length;

    // ── 3. Merge and Deduplicate Web Push Subscriptions ───────────────────
    const subMap = new Map<string, any>();

    // From dedicated subscriptions table
    dedicatedSubscriptions.forEach((sub: any) => {
      if (sub.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
        subMap.set(sub.endpoint, {
          endpoint: sub.endpoint,
          keys: sub.keys,
        });
      }
    });

    // From user documents
    targetUsers.forEach((u: any) => {
      if (u.pushSubscription?.endpoint && u.pushSubscription?.keys) {
        subMap.set(u.pushSubscription.endpoint, u.pushSubscription);
      }
    });

    const webPushSubscriptions = Array.from(subMap.values());

    // ── 4. Dispatch via Web Push Protocol (VAPID) ─────────────────────────
    let webPushResult: any = { success: false, sent: 0, failed: 0 };
    if (webPushSubscriptions.length > 0) {
      webPushResult = await sendBulkWebPush(webPushSubscriptions, title, description, {
        url: url || "/",
        image,
        targetRole,
        tag: `nectar-broadcast-${Date.now()}`,
      });
    }

    // ── 5. OneSignal / Legacy deviceToken dispatch ────────────────────────
    const deviceTokens = targetUsers
      .map((u: any) => u.deviceToken)
      .filter((t: any): t is string => !!t && typeof t === "string" && t.trim().length > 0);

    const pushResult = await sendBulkPushNotification(deviceTokens, title, description, {
      url: url || "/",
      targetRole,
      image,
    });

    const totalDevicesReached = webPushSubscriptions.length || deviceTokens.length;

    // ── 6. Save to DB history ─────────────────────────────────────────────
    const newRecord = new PushNotification({
      title,
      description,
      targetRole,
      image: image || undefined,
      url: url || "/",
      recipientsCount: totalRecipients,
      tokensCount: totalDevicesReached,
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

    const feedbackMsg =
      totalDevicesReached > 0
        ? `Push notification dispatched to ${roleName}! (${webPushSubscriptions.length} Web Push devices + ${deviceTokens.length} app tokens reached).`
        : `Push notification created for ${roleName}! Note: 0 subscriber devices registered yet. Open the app on your phone/browser and allow notifications to register your device.`;

    return NextResponse.json({
      status: true,
      message: feedbackMsg,
      data: newRecord,
      webPushResult,
      pushResult,
      devicesCount: totalDevicesReached,
    });
  } catch (error: any) {
    console.error("Send Push Notification error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
