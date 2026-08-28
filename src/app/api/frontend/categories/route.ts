import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ItemCategory from "@/models/ItemCategory";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await ItemCategory.find({ status: true }).sort({ sortOrder: 1 });
    return NextResponse.json({ status: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
