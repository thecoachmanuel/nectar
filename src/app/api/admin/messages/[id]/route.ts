import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ContactMessage from "@/models/ContactMessage";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const message = await ContactMessage.findByIdAndDelete(resolvedParams.id);
    if (!message) {
      return NextResponse.json({ status: false, message: "Message not found" }, { status: 404 });
    }
    return NextResponse.json({ status: true, message: "Message deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const message = await ContactMessage.findById(resolvedParams.id);
    if (!message) {
      return NextResponse.json({ status: false, message: "Message not found" }, { status: 404 });
    }
    message.isRead = true;
    await message.save();
    return NextResponse.json({ status: true, message: "Message marked as read" });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
