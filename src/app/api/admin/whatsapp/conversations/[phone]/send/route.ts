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
    const messageText = String(body.message || "").trim();

    if (!messageText) {
      return NextResponse.json({ status: false, message: "Message cannot be empty" }, { status: 400 });
    }

    const rawUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
    const waServiceUrl = rawUrl.replace(/\/+$/, "");
    const waSecret = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";

    // 1. Dispatch message to WhatsApp service
    const sendRes = await fetch(`${waServiceUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": waSecret,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: messageText,
      }),
    });

    const sendData = await sendRes.json();
    if (!sendData.status) {
      return NextResponse.json(
        { status: false, message: sendData.message || "Failed to send WhatsApp message" },
        { status: 502 }
      );
    }

    // 2. Pause bot for 2 hours so admin can chat with customer naturally
    fetch(`${waServiceUrl}/bot-mode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": waSecret,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        action: "pause",
        durationMinutes: 120,
      }),
    }).catch(() => {});

    // 3. Save to MongoDB chat messages & conversation
    const timestamp = new Date();
    const messageDoc = {
      phone: cleanPhone,
      sender: "business",
      text: messageText,
      messageId: `admin_${Date.now()}`,
      timestamp,
      createdAt: timestamp,
    };

    await db.collection("whatsapp_chat_messages").insertOne(messageDoc);

    await db.collection("whatsapp_conversations").updateOne(
      { phone: cleanPhone },
      {
        $set: {
          phone: cleanPhone,
          lastMessage: messageText.slice(0, 200),
          lastMessageTimestamp: timestamp,
          lastSender: "business",
          isBotPaused: true,
          updatedAt: timestamp,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      status: true,
      message: "Message sent successfully",
      data: {
        id: messageDoc.messageId,
        sender: "business",
        text: messageText,
        timestamp,
      },
    });
  } catch (error: any) {
    console.error("Error sending admin WhatsApp message:", error);
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
