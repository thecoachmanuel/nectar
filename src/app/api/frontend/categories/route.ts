import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ItemCategory from "@/models/ItemCategory";
import { normalizeImageUrl } from "@/lib/imageUtils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await ItemCategory.find({ status: true }).sort({ sortOrder: 1 }).lean();
    const mapped = categories.map((cat: any) => ({
      ...cat,
      image: cat.image ? normalizeImageUrl(cat.image) : cat.image,
    }));
    return NextResponse.json({ status: true, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
