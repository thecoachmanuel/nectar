import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Subscriber from "@/models/Subscriber";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json({ status: false, message: "Email is required" }, { status: 400 });
    }

    const existing = await Subscriber.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ status: false, message: "Email already subscribed" }, { status: 400 });
    }

    const subscriber = await Subscriber.create({ email: body.email });

    return NextResponse.json(
      { status: true, message: "Subscribed successfully", data: subscriber },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
