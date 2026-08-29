import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Subscriber from "@/models/Subscriber";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const subscriber = await Subscriber.findByIdAndDelete(resolvedParams.id);
    if (!subscriber) {
      return NextResponse.json({ status: false, message: "Subscriber not found" }, { status: 404 });
    }
    return NextResponse.json({ status: true, message: "Subscriber deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
