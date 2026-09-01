import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ShoppingWishlist from "@/models/ShoppingWishlist";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      customerPhone,
      customerName,
      userId,
      items,
      rawInput,
      source = "whatsapp",
      adminNotes,
    } = body;

    if (!customerPhone || !String(customerPhone).trim()) {
      return NextResponse.json(
        { status: false, message: "Customer phone is required" },
        { status: 400 }
      );
    }

    // Format and parse items list
    let parsedItems: { name: string; brandOrSize?: string }[] = [];

    if (Array.isArray(items) && items.length > 0) {
      parsedItems = items
        .map((item: any) => {
          if (typeof item === "string") {
            return { name: item.trim() };
          }
          if (item && item.name) {
            return {
              name: String(item.name).trim(),
              brandOrSize: item.brandOrSize ? String(item.brandOrSize).trim() : undefined,
            };
          }
          return null;
        })
        .filter((item: any) => Boolean(item && item.name));
    } else if (rawInput && typeof rawInput === "string") {
      // Split by commas or newlines
      const split = rawInput
        .split(/[\n,;]+/)
        .map((s) => s.trim().replace(/^[-*•\d.)\s]+/, "")) // clean bullet points/numbers
        .filter((s) => s.length > 0);

      parsedItems = split.map((s) => ({ name: s }));
    }

    if (parsedItems.length === 0 && (!rawInput || !rawInput.trim())) {
      return NextResponse.json(
        { status: false, message: "At least one product item is required" },
        { status: 400 }
      );
    }

    const newWishlist = await ShoppingWishlist.create({
      customerPhone: String(customerPhone).trim(),
      customerName: customerName ? String(customerName).trim() : undefined,
      userId: userId || undefined,
      items: parsedItems,
      rawInput: rawInput ? String(rawInput).trim() : undefined,
      status: "new",
      source: source || "whatsapp",
      adminNotes: adminNotes || undefined,
    });

    return NextResponse.json(
      {
        status: true,
        message: "Shopping wishlist saved successfully!",
        data: newWishlist,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Shopping Wishlist POST Error:", error);
    return NextResponse.json(
      { status: false, message: error.message || "Failed to save wishlist" },
      { status: 500 }
    );
  }
}
