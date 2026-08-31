import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ status: false, message: "Database connection not ready" }, { status: 500 });
    }

    const conversations = await db
      .collection("whatsapp_conversations")
      .find({})
      .sort({ lastMessageTimestamp: -1 })
      .limit(50)
      .toArray();

    // Map conversation data
    const formatted = conversations.map((c) => ({
      phone: c.phone,
      customerName: c.customerName || "Customer",
      lastMessage: c.lastMessage || "",
      lastMessageTimestamp: c.lastMessageTimestamp,
      lastSender: c.lastSender || "customer",
      isBotPaused: !!c.isBotPaused,
      unreadCount: c.unreadCount || 0,
    }));

    return NextResponse.json({
      status: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Error fetching WhatsApp conversations:", error);
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
