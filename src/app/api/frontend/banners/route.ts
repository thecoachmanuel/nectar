import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Banner from "@/models/Banner";

export async function GET() {
  try {
    await connectToDatabase();
    const banners = await Banner.find({ status: true }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ status: true, data: banners });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
