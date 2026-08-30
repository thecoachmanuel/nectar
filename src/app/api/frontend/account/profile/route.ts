import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
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

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, phone } = body;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    return NextResponse.json({
      status: true,
      message: "Profile updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeId: user.storeId,
        image: user.image,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
