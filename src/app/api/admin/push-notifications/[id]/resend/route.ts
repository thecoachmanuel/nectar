import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PushNotification from "@/models/PushNotification";
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

    // Build audience filter based on targetRole
    let userFilter: any = { status: true };
    if (notification.targetRole === "customer") {
      userFilter.role = "customer";
    } else if (notification.targetRole === "store_manager") {
      userFilter.role = { $in: ["store_manager", "chef", "waiter"] };
    } else if (notification.targetRole === "delivery_boy") {
      userFilter.role = "delivery_boy";
    }

    // Query target audience with pushSubscription and deviceToken
    const targetUsers = await User.find(userFilter).select("deviceToken pushSubscription role email");
    const totalRecipients = targetUsers.length;

    // ── 1. Web Push Protocol (VAPID) ── Real background push for Android and iPhone PWA
    const webPushSubscriptions = targetUsers
      .map((u) => u.pushSubscription)
      .filter((s): s is Record<string, any> => !!s && !!s.endpoint);

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

    // ── 2. OneSignal / Native push fallback
    const tokens = targetUsers
      .map((u) => u.deviceToken)
      .filter((t): t is string => !!t && typeof t === "string" && t.trim().length > 0);

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

    // Update notification record with fresh timestamp and counts
    notification.updatedAt = new Date();
    notification.recipientsCount = totalRecipients;
    notification.tokensCount = webPushSubscriptions.length || tokens.length;
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

    return NextResponse.json({
      status: true,
      message: `Push notification re-sent successfully to ${roleName}! (${webPushSubscriptions.length} web push + ${tokens.length} device tokens).`,
      data: notification,
      webPushResult,
      pushResult,
    });
  } catch (error: any) {
    console.error("Resend push notification error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
