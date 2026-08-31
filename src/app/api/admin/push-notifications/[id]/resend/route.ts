import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PushNotification from "@/models/PushNotification";
import PushSubscription from "@/models/PushSubscription";
import User from "@/models/User";
import { sendBulkPushNotification, sendBulkWebPush } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const notification = await PushNotification.findById(id);
    if (!notification) {
      return NextResponse.json(
        { status: false, message: "Push notification not found" },
        { status: 404 }
      );
    }

    // ── 1. Build Query for Web Push Subscriptions ─────────────────────────
    let subFilter: any = {};
    if (notification.targetRole === "customer") {
      subFilter.role = { $in: ["customer", "guest"] };
    } else if (notification.targetRole === "store_manager") {
      subFilter.role = { $in: ["store_manager", "chef", "waiter"] };
    } else if (notification.targetRole === "delivery_boy") {
      subFilter.role = "delivery_boy";
    }

    const dedicatedSubscriptions = await PushSubscription.find(subFilter).lean();

    // ── 2. Build Query for Users ──────────────────────────────────────────
    let userFilter: any = { status: true };
    if (notification.targetRole === "customer") {
      userFilter.role = "customer";
    } else if (notification.targetRole === "store_manager") {
      userFilter.role = { $in: ["store_manager", "chef", "waiter"] };
    } else if (notification.targetRole === "delivery_boy") {
      userFilter.role = "delivery_boy";
    }

    const targetUsers = await User.find(userFilter).select(
      "deviceToken pushSubscription role email"
    ).lean();
    const totalRecipients = targetUsers.length;

    // ── 3. Merge and Deduplicate Web Push Subscriptions ───────────────────
    const subMap = new Map<string, any>();

    dedicatedSubscriptions.forEach((sub: any) => {
      if (sub.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
        subMap.set(sub.endpoint, {
          endpoint: sub.endpoint,
          keys: sub.keys,
        });
      }
    });

    targetUsers.forEach((u: any) => {
      if (u.pushSubscription?.endpoint && u.pushSubscription?.keys) {
        subMap.set(u.pushSubscription.endpoint, u.pushSubscription);
      }
    });

    const webPushSubscriptions = Array.from(subMap.values());

    // ── 4. Dispatch via Web Push Protocol (VAPID) ─────────────────────────
    let webPushResult: any = { success: false, sent: 0 };
    if (webPushSubscriptions.length > 0) {
      webPushResult = await sendBulkWebPush(
        webPushSubscriptions,
        notification.title,
        notification.description,
        {
          url: notification.url || "/",
          targetRole: notification.targetRole,
          image: notification.image,
          tag: `nectar-broadcast-${Date.now()}`,
        }
      );
    }

    // ── 5. OneSignal / Legacy fallback ────────────────────────────────────
    const tokens = targetUsers
      .map((u: any) => u.deviceToken)
      .filter((t: any): t is string => !!t && typeof t === "string" && t.trim().length > 0);

    const pushResult = await sendBulkPushNotification(
      tokens,
      notification.title,
      notification.description,
      {
        url: notification.url || "/",
        targetRole: notification.targetRole,
        image: notification.image,
      }
    );

    const totalDevicesReached = webPushSubscriptions.length || tokens.length;

    // ── 6. Update notification record ─────────────────────────────────────
    notification.updatedAt = new Date();
    notification.recipientsCount = totalRecipients;
    notification.tokensCount = totalDevicesReached;
    notification.status = "sent";
    await notification.save();

    const roleName =
      notification.targetRole === "all"
        ? "all users"
        : notification.targetRole === "customer"
        ? "all customers"
        : notification.targetRole === "store_manager"
        ? "all sellers & stores"
        : "all delivery boys";

    const feedbackMsg =
      totalDevicesReached > 0
        ? `Push notification re-sent to ${roleName}! (${webPushSubscriptions.length} Web Push devices + ${tokens.length} app tokens reached).`
        : `Push notification re-sent to ${roleName}! Note: 0 subscriber devices registered yet. Open the app on your phone/browser and allow notifications to register.`;

    return NextResponse.json({
      status: true,
      message: feedbackMsg,
      data: notification,
      webPushResult,
      pushResult,
      devicesCount: totalDevicesReached,
    });
  } catch (error: any) {
    console.error("Resend push notification error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
