import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
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
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    
    // Auth is optional for Guest checkouts, but if authenticated, we could restrict it
    // For now, anyone with the Order ID can view the status (similar to tracking links)
    
    const { id } = await params;

    const order = await Order.findById(id).lean();
    
    if (!order) {
      return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ status: true, data: order });

  } catch (error: any) {
    console.error("Order Fetch Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
