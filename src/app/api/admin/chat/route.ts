import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Message from "@/models/Message";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import User from "@/models/User";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

// GET all active chat threads for admin
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin" && payload.role !== "store_manager") {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    if (threadId) {
      // Get messages for a specific thread
      // If store_manager, they can only view their own thread
      if (payload.role === "store_manager" && threadId !== payload.userId) {
        return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
      }
      const messages = await Message.find({ threadId, status: { $ne: "deleted" } }).sort({ createdAt: 1 }).lean();
      return NextResponse.json({ status: true, data: messages });
    } else {
      // Get threads
      let matchQuery: any = { status: { $ne: "deleted" } };
      if (payload.role === "store_manager") {
        matchQuery.threadId = payload.userId; // Store managers only see their own chat thread with admin
      }

      const threads = await Message.aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        { 
          $group: { 
            _id: "$threadId", 
            lastMessage: { $first: "$message" },
            lastMessageTime: { $first: "$createdAt" },
            status: { $first: "$status" },
            senderRole: { $first: "$senderRole" },
            senderId: { $first: "$senderId" }
          } 
        },
        { $sort: { lastMessageTime: -1 } }
      ]);
      
      // Populate user info for customers
      for (const t of threads) {
        if (t.senderRole === "customer" && t.senderId) {
          const u = await User.findById(t.senderId).select("name email");
          if (u) {
            t.customerName = u.name;
            t.customerEmail = u.email;
          }
        }
      }
      
      return NextResponse.json({ status: true, data: threads });
    }
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin" && payload.role !== "store_manager") {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, threadId } = body;
    
    if (!message || !threadId) {
      return NextResponse.json({ status: false, message: "Missing fields" }, { status: 400 });
    }

    const newMessage = await Message.create({
      senderId: payload.userId,
      senderRole: payload.role, // "admin" or "store_manager"
      storeId: "admin",
      message,
      threadId,
      status: "open"
    });

    return NextResponse.json({ status: true, data: newMessage });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin" && payload.role !== "store_manager") {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, action } = body; // action can be "resolve" or "delete"
    
    if (!threadId || !action) {
      return NextResponse.json({ status: false, message: "Missing fields" }, { status: 400 });
    }

    if (payload.role === "store_manager" && threadId !== payload.userId) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    if (action === "resolve") {
      await Message.updateMany({ threadId, status: { $ne: "deleted" } }, { $set: { status: "resolved" } });
    } else if (action === "delete") {
      await Message.updateMany({ threadId }, { $set: { status: "deleted" } });
    }

    return NextResponse.json({ status: true, message: `Thread ${action}d successfully` });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
