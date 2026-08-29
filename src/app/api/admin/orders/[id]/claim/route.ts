import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "delivery_boy" && payload.role !== "admin") {
      return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
    }

    const deliveryBoyId = payload.role === "delivery_boy" ? payload.userId : (await req.json()).deliveryBoyId;
    
    if (!deliveryBoyId) {
      return NextResponse.json({ status: false, message: "Delivery Boy ID required" }, { status: 400 });
    }

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 });

    if (order.deliveryBoyId) {
      return NextResponse.json({ status: false, message: "Order already claimed/assigned" }, { status: 400 });
    }

    order.deliveryBoyId = deliveryBoyId;
    order.statusTimeline.push({
      status: "out_for_delivery",
      timestamp: new Date(),
      note: payload.role === "admin" ? "Assigned by Admin" : "Claimed by Delivery Boy"
    });
    order.orderStatus = "out_for_delivery";

    await order.save();

    return NextResponse.json({ status: true, message: "Order successfully claimed" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
