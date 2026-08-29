import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Message from "@/models/Message";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
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
    if (!user) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const threadId = user.userId as string; // Customer thread ID is their user ID
    
    // Fetch only open or resolved messages. But prompt says "Make sure the chat automatically clear from users end when the issue is resolved."
    // So if the latest message in the thread is 'resolved' or 'deleted', we shouldn't show it?
    // Actually, we can fetch all messages for this threadId that are not 'deleted'.
    // If ANY message in the thread is 'resolved', we clear it.
    // Let's check the status of the thread based on any message having status = resolved.
    
    // To simplify: if any message has 'resolved', the user sees nothing.
    const hasResolved = await Message.exists({ threadId, status: { $in: ["resolved", "deleted"] } });
    if (hasResolved) {
      // If resolved, we return empty so it clears from user's end.
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
    if (!user) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { message } = body;
    if (!message) return NextResponse.json({ status: false, message: "Message is required" }, { status: 400 });

    const threadId = user.userId as string;
    
    // If there is a resolved/deleted thread for this user, they are starting a NEW thread.
    // We should delete old ones or just let them create new messages with "open" status.
    // Because threadId is fixed to userId, we must update all previous resolved messages to 'deleted' so they don't block the new thread.
    await Message.updateMany({ threadId, status: "resolved" }, { $set: { status: "deleted" } });

    const newMessage = await Message.create({
      senderId: threadId,
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
