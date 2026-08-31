import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PushNotification from "@/models/PushNotification";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Determine user role from auth token or header if present
    let userRole = "customer";
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      if (token) {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload && payload.role) {
          userRole = String(payload.role);
        }
      }
    } catch {
      // Unauthenticated visitor defaults to customer
      userRole = "customer";
    }

    // Match notifications targetted to "all" or specific role
    const roleMatches: ("all" | "customer" | "store_manager" | "delivery_boy")[] = ["all"];
    if (userRole === "customer") roleMatches.push("customer");
    if (["store_manager", "chef", "waiter"].includes(userRole)) {
      roleMatches.push("store_manager");
    }
    if (userRole === "delivery_boy") roleMatches.push("delivery_boy");
    if (userRole === "admin") {
      // Admin receives all
      roleMatches.push("customer", "store_manager", "delivery_boy");
    }

    // Fetch notifications from the last 72 hours
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const notifications = await PushNotification.find({
      targetRole: { $in: roleMatches },
      updatedAt: { $gte: threeDaysAgo },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      status: true,
      data: notifications,
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
