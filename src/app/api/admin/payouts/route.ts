import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PayoutRequest from "@/models/PayoutRequest";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function GET() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let query: any = {};

    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        query.userId = payload.role === "store_manager" ? payload.storeId : payload.userId;
      }
    }

    const payouts = await PayoutRequest.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: payouts });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Auto-assign user ID based on role
    body.userId = payload.role === "store_manager" ? payload.storeId : payload.userId;
    body.userRole = payload.role;
    
    const payout = await PayoutRequest.create(body);

    return NextResponse.json({ status: true, message: "Payout requested successfully", data: payout }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
