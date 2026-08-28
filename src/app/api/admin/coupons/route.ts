import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Coupon from "@/models/Coupon";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: coupons });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const newCoupon = new Coupon(body);
    await newCoupon.save();
    return NextResponse.json(
      { status: true, message: "Coupon created successfully", data: newCoupon },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ status: false, message: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
