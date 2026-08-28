import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Coupon from "@/models/Coupon";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;
    const coupon = await Coupon.findOne({ $or: [{ code: slug }, { _id: slug }] });
    if (!coupon) {
      return NextResponse.json(
        { status: false, message: "Offer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: true, data: coupon });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
