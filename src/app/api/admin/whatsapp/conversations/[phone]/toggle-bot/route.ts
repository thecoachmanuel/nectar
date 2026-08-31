import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ status: false, message: "Database not connected" }, { status: 500 });
    }

    const { phone } = await params;
    const cleanPhone = String(phone).replace(/\D/g, "");

    const body = await req.json();
    const action = body.action; // "pause" | "resume"

    if (!action || !["pause", "resume"].includes(action)) {
      return NextResponse.json({ status: false, message: 'Action must be "pause" or "resume"' }, { status: 400 });
    }

    const rawUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
    const waServiceUrl = rawUrl.replace(/\/+$/, "");
    const waSecret = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";

    // Call WhatsApp service /bot-mode
    const botRes = await fetch(`${waServiceUrl}/bot-mode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": waSecret,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        action,
        durationMinutes: action === "pause" ? 120 : undefined,
      }),
    });

    const botData = await botRes.json();

    // Update conversation in MongoDB
    await db.collection("whatsapp_conversations").updateOne(
      { phone: cleanPhone },
      {
        $set: {
          isBotPaused: action === "pause",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      status: true,
      isBotPaused: action === "pause",
      message: action === "pause" ? "Bot paused for 2 hours" : "Bot resumed",
      data: botData,
    });
  } catch (error: any) {
    console.error("Error toggling bot mode:", error);
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
