import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ShoppingWishlist from "@/models/ShoppingWishlist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { customerName: regex },
        { customerPhone: regex },
        { "items.name": regex },
        { "items.brandOrSize": regex },
        { rawInput: regex },
        { adminNotes: regex },
      ];
    }

    const wishlists = await ShoppingWishlist.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ status: true, data: wishlists });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Failed to fetch wishlists" },
      { status: 500 }
    );
  }
}
