import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Setting from "@/models/Setting";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

const SETTING_KEY = "whatsapp_chat_paused";

async function getAdminPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin" && payload.role !== "store_manager") return null;
    return payload;
  } catch {
    return null;
  }
}

// GET — return current pause state (paused by default if not yet set)
export async function GET() {
  try {
    const payload = await getAdminPayload();
    if (!payload) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find or create the setting, defaulting to paused = true
    let setting = await Setting.findOne({ key: SETTING_KEY }).lean();

    if (!setting) {
      // First time — create the record defaulting to paused
      await Setting.create({
        group: "features",
        key: SETTING_KEY,
        payload: true,
        baseDeliveryFee: 0,
        feePerKm: 0,
        themeColor: "var(--primary-hex)",
      });
      return NextResponse.json({ status: true, paused: true });
    }

    return NextResponse.json({ status: true, paused: !!setting.payload });
  } catch (error: any) {
    console.error("[chat-toggle GET]", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

// POST — update pause state { paused: boolean }
export async function POST(req: Request) {
  try {
    const payload = await getAdminPayload();
    if (!payload) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    // Only super admin can toggle global chat feature
    if (payload.role !== "admin") {
      return NextResponse.json(
        { status: false, message: "Only admin can toggle the live chat feature" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    if (typeof body.paused !== "boolean") {
      return NextResponse.json(
        { status: false, message: "Field 'paused' must be a boolean" },
        { status: 400 }
      );
    }

    await Setting.findOneAndUpdate(
      { key: SETTING_KEY },
      {
        $set: { payload: body.paused, group: "features" },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      status: true,
      paused: body.paused,
      message: body.paused
        ? "WhatsApp Live Chat has been paused."
        : "WhatsApp Live Chat is now active.",
    });
  } catch (error: any) {
    console.error("[chat-toggle POST]", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
