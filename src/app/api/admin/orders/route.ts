import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "foodappi_secret_key_default_2026"
);

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (status) query.orderStatus = status;

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
