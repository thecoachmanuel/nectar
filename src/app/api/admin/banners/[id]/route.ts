import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Banner from "@/models/Banner";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const body = await req.json();
    const updatedBanner = await Banner.findByIdAndUpdate(resolvedParams.id, body, { new: true, runValidators: true });
    if (!updatedBanner) {
      return NextResponse.json({ status: false, message: "Banner not found" }, { status: 404 });
    }
    return NextResponse.json({ status: true, message: "Banner updated successfully", data: updatedBanner });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const deletedBanner = await Banner.findByIdAndDelete(resolvedParams.id);
    if (!deletedBanner) {
      return NextResponse.json({ status: false, message: "Banner not found" }, { status: 404 });
    }
    return NextResponse.json({ status: true, message: "Banner deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
