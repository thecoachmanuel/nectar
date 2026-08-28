import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";

export async function GET() {
  try {
    await connectToDatabase();
    const stores = await Store.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ status: true, stores });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const newStore = await Store.create(body);
    return NextResponse.json({ status: true, message: "Store created successfully", store: newStore }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
