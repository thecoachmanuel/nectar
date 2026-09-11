import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import Message from "@/models/Message";
import ContactMessage from "@/models/ContactMessage";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "errandshop_secret_key_default_2026"
);

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const cookieStore = await cookies();
    let token = cookieStore.get("token")?.value;

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    const storeId = payload.storeId as string | undefined;
    const userId = payload.userId as string | undefined;

    if (role !== "admin" && role !== "store_manager") {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    // Build store filter for orders if store_manager
    const orderStoreFilter: any = {};
    if (role === "store_manager" && storeId) {
      orderStoreFilter.storeId = storeId;
    }

    // Parallel queries for fast response
    const [
      pendingOrdersCount,
      pendingOnlineOrdersCount,
      pendingPosOrdersCount,
      unreadSupportChatCount,
      unreadContactCount,
      latestSupportMessage,
      latestContactMessage,
      latestOrder,
    ] = await Promise.all([
      // Total pending orders
      Order.countDocuments({ ...orderStoreFilter, orderStatus: "pending" }),

      // Online pending orders
      Order.countDocuments({
        ...orderStoreFilter,
        orderStatus: "pending",
        isPos: { $ne: true },
      }),

      // POS pending orders
      Order.countDocuments({
        ...orderStoreFilter,
        orderStatus: "pending",
        isPos: true,
      }),

      // Unread support chat messages sent by customers/store managers (not admin)
      role === "admin"
        ? Message.countDocuments({
            status: { $ne: "deleted" },
            senderRole: { $in: ["customer", "store_manager"] },
            isRead: false,
          })
        : Message.countDocuments({
            threadId: userId,
            senderRole: "admin",
            isRead: false,
            status: { $ne: "deleted" },
          }),

      // Unread contact form messages (only visible to admin)
      role === "admin"
        ? ContactMessage.countDocuments({ isRead: false })
        : Promise.resolve(0),

      // Latest customer support message
      role === "admin"
        ? Message.findOne({
            status: { $ne: "deleted" },
            senderRole: { $in: ["customer", "store_manager"] },
          })
            .sort({ createdAt: -1 })
            .select("_id senderRole threadId message createdAt")
            .lean()
        : Message.findOne({
            threadId: userId,
            senderRole: "admin",
            status: { $ne: "deleted" },
          })
            .sort({ createdAt: -1 })
            .select("_id senderRole threadId message createdAt")
            .lean(),

      // Latest contact form message
      role === "admin"
        ? ContactMessage.findOne()
            .sort({ createdAt: -1 })
            .select("_id name email subject message createdAt")
            .lean()
        : Promise.resolve(null),

      // Latest order
      Order.findOne(orderStoreFilter)
        .sort({ createdAt: -1 })
        .select("_id orderSerialNo customerName totalAmount orderStatus createdAt")
        .lean(),
    ]);

    // Query WhatsApp conversations unread count if MongoDB collection exists
    let unreadWhatsAppCount = 0;
    try {
      const db = mongoose.connection.db;
      if (db) {
        const waCount = await db
          .collection("whatsapp_conversations")
          .countDocuments({ unreadCount: { $gt: 0 } });
        unreadWhatsAppCount = waCount || 0;
      }
    } catch {
      unreadWhatsAppCount = 0;
    }

    return NextResponse.json({
      status: true,
      counts: {
        orders: pendingOrdersCount || 0,
        onlineOrders: pendingOnlineOrdersCount || 0,
        posOrders: pendingPosOrdersCount || 0,
        supportChat: unreadSupportChatCount || 0,
        whatsappChat: unreadWhatsAppCount || 0,
        contactMessages: unreadContactCount || 0,
      },
      latest: {
        order: latestOrder || null,
        supportMessage: latestSupportMessage || null,
        contactMessage: latestContactMessage || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Failed to fetch counts" },
      { status: 500 }
    );
  }
}
