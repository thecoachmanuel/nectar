import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Subscriber from "@/models/Subscriber";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: subscribers });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
