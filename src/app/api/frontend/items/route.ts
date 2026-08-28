import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Item from "@/models/Item";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const categoryId = searchParams.get("categoryId");
    const itemType = searchParams.get("itemType"); // "veg" | "non_veg"
    const search = searchParams.get("search");
    const isFeatured = searchParams.get("isFeatured");

    const query: any = { status: true };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (itemType && itemType !== "all") {
      query.itemType = itemType;
    }

    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const items = await Item.find(query)
      .populate("categoryId", "name slug")
      .populate("addonIds", "name price")
      .sort({ createdAt: -1 });

    return NextResponse.json({ status: true, data: items });
  } catch (error: any) {
    console.error("Items API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
