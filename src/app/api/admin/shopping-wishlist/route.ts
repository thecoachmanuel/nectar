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

    // Auto-heal any existing records with the reported LID identifier
    try {
      await ShoppingWishlist.updateMany(
        {
          customerPhone: {
            $in: [
              "+33372130783232",
              "33372130783232",
              "WA:33372130783232",
              "WA:+33372130783232",
            ],
          },
        },
        { $set: { customerPhone: "+2348100918189" } }
      );
    } catch (_) {}

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
