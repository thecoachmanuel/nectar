import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const body = await req.json();

    if (body.name && !body.slug) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const item = await Item.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("categoryId", "name slug");

    if (!item) {
      return NextResponse.json(
        { status: false, message: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
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
    
    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      return NextResponse.json(
        { status: false, message: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Item deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
