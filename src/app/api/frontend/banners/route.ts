import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Banner from "@/models/Banner";
import { normalizeImageUrl } from "@/lib/imageUtils";

export async function GET() {
  try {
    await connectToDatabase();
    const banners = await Banner.find({ status: true }).sort({ order: 1, createdAt: -1 }).lean();
    const mapped = banners.map((banner: any) => ({
      ...banner,
      image: banner.image ? normalizeImageUrl(banner.image) : banner.image,
    }));
    return NextResponse.json({ status: true, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
