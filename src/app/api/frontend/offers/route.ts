import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Coupon from "@/models/Coupon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    // Return active coupons
    const coupons = await Coupon.find({ status: true }).sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: coupons });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
