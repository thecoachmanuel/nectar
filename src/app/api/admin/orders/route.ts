import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const query: any = {};
    if (branchId) query.branchId = branchId;
    if (status) query.orderStatus = status;

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ status: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
