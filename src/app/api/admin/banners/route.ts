import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Banner from "@/models/Banner";

export async function GET() {
  try {
    await connectToDatabase();
    const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ status: true, data: banners });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const newBanner = await Banner.create(body);
    return NextResponse.json({ status: true, message: "Banner created successfully", data: newBanner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
