import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

/**
 * POST /api/auth/subscribe-push
 * Saves the browser PushSubscription for the authenticated user.
 * Called from NotificationListener after user grants notification permission.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { status: false, message: "Invalid push subscription object" },
        { status: 400 }
      );
    }

    // Try to identify the user from JWT cookie
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      if (token) {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.id) userId = String(payload.id);
      }
    } catch {
      // Anonymous subscription — we'll still store it to a guest collection or skip
    }

    if (!userId) {
      // For non-logged-in visitors, we save by endpoint only so we can still broadcast to them
      // Find any existing user with this endpoint and update, or skip
      await User.findOneAndUpdate(
        { "pushSubscription.endpoint": subscription.endpoint },
        { $set: { pushSubscription: subscription } }
      );
      return NextResponse.json({ status: true, message: "Subscription updated (guest)" });
    }

    await User.findByIdAndUpdate(userId, {
      $set: { pushSubscription: subscription },
    });

    return NextResponse.json({
      status: true,
      message: "Push subscription saved successfully",
    });
  } catch (error: any) {
    console.error("Subscribe push error:", error);
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/subscribe-push
 * Removes the push subscription (called when user revokes permission).
 */
export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.id) {
      return NextResponse.json({ status: false, message: "Invalid token" }, { status: 401 });
    }

    await User.findByIdAndUpdate(payload.id, {
      $unset: { pushSubscription: 1 },
    });

    return NextResponse.json({ status: true, message: "Push subscription removed" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
