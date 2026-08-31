import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PushNotification from "@/models/PushNotification";
import User from "@/models/User";
import { sendBulkPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Fetch history
    const notifications = await PushNotification.find({}).sort({ createdAt: -1 });

    // Fetch audience counts
    const [totalUsers, customersCount, sellersCount, ridersCount] = await Promise.all([
      User.countDocuments({ status: true }),
      User.countDocuments({ role: "customer", status: true }),
      User.countDocuments({ role: { $in: ["store_manager", "chef", "waiter"] }, status: true }),
      User.countDocuments({ role: "delivery_boy", status: true }),
    ]);

    const activeTokensCount = await User.countDocuments({
      deviceToken: { $exists: true, $ne: "" },
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

    // Build user filter query based on target role
    let userFilter: any = { status: true };
    if (targetRole === "customer") {
      userFilter.role = "customer";
    } else if (targetRole === "store_manager") {
      userFilter.role = { $in: ["store_manager", "chef", "waiter"] };
    } else if (targetRole === "delivery_boy") {
      userFilter.role = "delivery_boy";
    }

    // Query target users
    const targetUsers = await User.find(userFilter).select("deviceToken role email");
    const totalRecipients = targetUsers.length;
    const tokens = targetUsers
      .map((u) => u.deviceToken)
      .filter((t): t is string => !!t && typeof t === "string" && t.trim().length > 0);

    // Send push notification via OneSignal / Web Push service
    const pushResult = await sendBulkPushNotification(tokens, title, description, {
      url: url || "/",
      targetRole,
      image,
    });

    // Save record to DB history
    const newRecord = new PushNotification({
      title,
      description,
      targetRole,
      image: image || undefined,
      url: url || "/",
      recipientsCount: totalRecipients,
      tokensCount: tokens.length,
      status: pushResult.success ? "sent" : "failed",
      sentBy: "Admin",
    });

    await newRecord.save();

    return NextResponse.json({
      status: true,
      message: `Push notification dispatched successfully to ${targetRole === "all" ? "all users" : targetRole === "customer" ? "all customers" : targetRole === "store_manager" ? "all sellers" : "all delivery boys"} (${tokens.length} active device tokens reached).`,
      data: newRecord,
      pushResult,
    });
  } catch (error: any) {
    console.error("Send Push Notification error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
