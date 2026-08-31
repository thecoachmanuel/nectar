import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(
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

    // Fetch conversation details
    const conversation = await db
      .collection("whatsapp_conversations")
      .findOne({ phone: cleanPhone });

    // Fetch message timeline
    const messages = await db
      .collection("whatsapp_chat_messages")
      .find({ phone: cleanPhone })
      .sort({ timestamp: 1 })
      .limit(150)
      .toArray();

    // Fetch customer's recent orders if available
    const orders = await db
      .collection("orders")
      .find({
        customerPhone: { $regex: cleanPhone.slice(-9), $options: "i" },
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      status: true,
      data: {
        phone: cleanPhone,
        customerName: conversation?.customerName || "Customer",
        isBotPaused: !!conversation?.isBotPaused,
        lastMessageTimestamp: conversation?.lastMessageTimestamp,
        messages: messages.map((m) => ({
          id: m._id?.toString() || m.messageId,
          sender: m.sender, // "customer" | "business" | "bot"
          text: m.text,
          timestamp: m.timestamp,
        })),
        recentOrders: orders.map((o) => ({
          id: o._id?.toString(),
          orderSerialNo: o.orderSerialNo,
          totalAmount: o.totalAmount,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching WhatsApp chat messages:", error);
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
