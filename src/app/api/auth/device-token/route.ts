import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { deviceToken } = body;

    if (!deviceToken) {
      return NextResponse.json({ status: false, message: "deviceToken is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.id) {
      return NextResponse.json({ status: false, message: "Invalid token" }, { status: 401 });
    }

    await User.findByIdAndUpdate(payload.id, {
      $set: { deviceToken: String(deviceToken).trim() }
    });

    return NextResponse.json({ status: true, message: "Device token registered successfully" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
