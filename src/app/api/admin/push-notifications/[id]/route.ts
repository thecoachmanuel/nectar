import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PushNotification from "@/models/PushNotification";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const deleted = await PushNotification.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ status: false, message: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ status: true, message: "Notification record deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
