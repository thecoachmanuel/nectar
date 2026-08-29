import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ContactMessage from "@/models/ContactMessage";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: messages });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
