import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Coupon from "@/models/Coupon";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const body = await req.json();
    
    const coupon = await Coupon.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return NextResponse.json(
        { status: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
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

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return NextResponse.json(
        { status: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Coupon deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
