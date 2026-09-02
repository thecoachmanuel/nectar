import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");
    const isPos = searchParams.get("isPos");
    const paymentMethod = searchParams.get("paymentMethod");

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (status) query.orderStatus = status;
    if (isPos === "true") query.isPos = true;
    if (isPos === "false") query.isPos = { $ne: true };
    if (paymentMethod && paymentMethod !== "all") query.paymentMethod = paymentMethod;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === "store_manager" && payload.storeId) {
        query.storeId = payload.storeId;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ status: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
