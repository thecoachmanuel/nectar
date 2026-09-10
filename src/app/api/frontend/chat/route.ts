import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Message from "@/models/Message";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "errandshop_secret_key_default_2026"
);

async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const user = await getUserFromToken(req);
    
    let threadId = "";
    if (user) {
      threadId = user.userId as string; // Customer thread ID is their user ID
    } else {
      const { searchParams } = new URL(req.url);
      const guestId = searchParams.get("guestId") || req.headers.get("x-guest-id");
      if (guestId) {
        threadId = guestId.startsWith("guest_") ? guestId : `guest_${guestId}`;
      }
    }

    if (!threadId) {
      return NextResponse.json({ status: false, message: "Unauthorized or missing session" }, { status: 401 });
    }

    // To simplify: if any message has 'resolved' or 'deleted', the user sees nothing (cleared from user's end).
    const hasResolved = await Message.exists({ threadId, status: { $in: ["resolved", "deleted"] } });
    if (hasResolved) {
      return NextResponse.json({ status: true, data: [] });
    }

    const messages = await Message.find({ threadId, status: "open" }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ status: true, data: messages });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const user = await getUserFromToken(req);
    const body = await req.json();
    const { message, guestId: bodyGuestId } = body;
    if (!message) return NextResponse.json({ status: false, message: "Message is required" }, { status: 400 });

    let threadId = "";
    let senderId = "";
    if (user) {
      threadId = user.userId as string;
      senderId = threadId;
    } else {
      const gId = bodyGuestId || req.headers.get("x-guest-id");
      if (gId) {
        threadId = gId.startsWith("guest_") ? gId : `guest_${gId}`;
        senderId = threadId;
      }
    }

    if (!threadId) {
      return NextResponse.json({ status: false, message: "Unauthorized or missing session" }, { status: 401 });
    }
    
    // If there is a resolved/deleted thread for this user, they are starting a NEW thread.
    await Message.updateMany({ threadId, status: "resolved" }, { $set: { status: "deleted" } });

    const newMessage = await Message.create({
      senderId,
      senderRole: "customer",
      storeId: "admin", // Chat with admin
      message,
      threadId,
      status: "open"
    });

    return NextResponse.json({ status: true, data: newMessage });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

