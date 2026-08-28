import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "foodappi_secret_key_default_2026"
);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "delivery_boy" && payload.role !== "admin") {
      return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
    }

    const { pin } = await req.json();
    if (!pin) {
      return NextResponse.json({ status: false, message: "PIN is required" }, { status: 400 });
    }

    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 });

    if (order.deliveryPin !== pin) {
      return NextResponse.json({ status: false, message: "Invalid PIN" }, { status: 400 });
    }

    if (order.orderStatus === "delivered") {
      return NextResponse.json({ status: false, message: "Order is already delivered" }, { status: 400 });
    }

    // Verify PIN and mark delivered
    order.orderStatus = "delivered";
    order.statusTimeline.push({
      status: "delivered",
      timestamp: new Date(),
      note: "PIN Verified. Order successfully delivered."
    });

    // Handle Delivery Boy Earnings
    if (order.deliveryBoyId) {
      const deliveryBoy = await User.findById(order.deliveryBoyId);
      if (deliveryBoy) {
        let earned = 0;
        if (deliveryBoy.deliveryCommissionType === "percentage") {
          earned = (order.deliveryCharge * (deliveryBoy.deliveryCommissionValue || 0)) / 100;
        } else {
          // fixed
          earned = deliveryBoy.deliveryCommissionValue || 0;
        }
        
        order.deliveryBoyEarned = earned;
        deliveryBoy.walletBalance = (deliveryBoy.walletBalance || 0) + earned;
        await deliveryBoy.save();
      }
    }

    await order.save();

    return NextResponse.json({ status: true, message: "Order delivered successfully" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
