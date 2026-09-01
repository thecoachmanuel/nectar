import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ShoppingWishlist from "@/models/ShoppingWishlist";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const body = await req.json();

    const updated = await ShoppingWishlist.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { status: false, message: "Wishlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Wishlist updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Failed to update wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();

    const deleted = await ShoppingWishlist.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { status: false, message: "Wishlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Wishlist deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Failed to delete wishlist" },
      { status: 500 }
    );
  }
}
