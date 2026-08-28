import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ItemCategory from "@/models/ItemCategory";

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

    const category = await ItemCategory.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json(
        { status: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Category updated successfully",
      data: category,
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
    
    const category = await ItemCategory.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { status: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
