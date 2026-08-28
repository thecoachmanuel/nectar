import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "foodappi_secret_key_default_2026"
);

async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ status: true, data: user.addresses || [] });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { label, address, apartment, latitude, longitude } = body;

    if (!address) {
      return NextResponse.json({ status: false, message: "Address is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });

    const newAddress = { label, address, apartment, latitude, longitude };
    user.addresses.push(newAddress);
    await user.save();

    return NextResponse.json({ status: true, message: "Address added successfully", data: user.addresses });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return NextResponse.json({ status: false, message: "Address ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });

    user.addresses = user.addresses.filter((a: any) => a._id.toString() !== addressId);
    await user.save();

    return NextResponse.json({ status: true, message: "Address removed successfully", data: user.addresses });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
