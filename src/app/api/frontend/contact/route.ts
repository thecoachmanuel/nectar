import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ContactMessage from "@/models/ContactMessage";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json({ status: false, message: "All fields are required" }, { status: 400 });
    }

    const message = await ContactMessage.create(body);

    return NextResponse.json(
      { status: true, message: "Message sent successfully", data: message },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
