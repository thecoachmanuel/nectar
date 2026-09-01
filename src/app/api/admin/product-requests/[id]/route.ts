import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ProductRequest from "@/models/ProductRequest";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const body = await req.json();

    const updated = await ProductRequest.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { status: false, message: "Product request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Product request updated successfully",
      data: updated,
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

    const deleted = await ProductRequest.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { status: false, message: "Product request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Product request deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
