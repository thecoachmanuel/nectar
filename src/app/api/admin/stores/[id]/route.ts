import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const id = (await params).id;
    const body = await req.json();

    const updatedStore = await Store.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updatedStore) return NextResponse.json({ status: false, message: "Store not found" }, { status: 404 });

    return NextResponse.json({ status: true, message: "Store updated successfully", store: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const id = (await params).id;

    const deletedStore = await Store.findByIdAndDelete(id);
    if (!deletedStore) return NextResponse.json({ status: false, message: "Store not found" }, { status: 404 });

    return NextResponse.json({ status: true, message: "Store deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
