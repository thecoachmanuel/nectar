import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import PushSubscription from "@/models/PushSubscription";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

/**
 * POST /api/auth/subscribe-push
 * Saves the browser Web Push PushSubscription for push delivery.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { subscription, userRole: bodyRole, userId: bodyUserId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { status: false, message: "Invalid push subscription object (endpoint and keys required)" },
        { status: 400 }
      );
    }

    let userId: string | null = bodyUserId || null;
    let userRole: "admin" | "customer" | "store_manager" | "delivery_boy" | "guest" | "all" =
      bodyRole || "customer";

    // Try to extract from Authorization header
    const authHeader = req.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    // Fallback to cookie
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get("token")?.value || null;
      } catch {
        // ignore
      }
    }

    // Verify JWT if token is present
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const resolvedId = (payload.userId || payload.id || payload.sub) as string;
        if (resolvedId) userId = resolvedId;
        if (payload.role) userRole = payload.role as any;
      } catch {
        // Token invalid or expired, continue as guest or body role
      }
    }

    // Upsert into dedicated PushSubscription collection
    const userAgent = req.headers.get("user-agent") || "";
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userId: userId || undefined,
          role: userRole,
          userAgent,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // If a valid userId is present, also update User model
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: {
            pushSubscription: subscription,
            deviceToken: subscription.endpoint,
          },
        });
      } catch (userUpdateErr) {
        console.warn("[subscribe-push] User model update warning:", userUpdateErr);
      }
    }

    return NextResponse.json({
      status: true,
      message: "Web Push subscription registered successfully",
      role: userRole,
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
 */
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const endpoint = body?.subscription?.endpoint || body?.endpoint;

    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint });
    }

    return NextResponse.json({ status: true, message: "Subscription removed" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
