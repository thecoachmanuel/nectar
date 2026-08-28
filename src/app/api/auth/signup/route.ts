import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "foodappi_secret_key_default_2026"
);

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, phone, isGuest } = body;

    if (!name || !email) {
      return NextResponse.json({ status: false, message: "Name and email are required" }, { status: 400 });
    }

    if (isGuest) {
      // Guest Registration
      return NextResponse.json({
        status: true,
        message: "Guest session initialized",
        user: { name, email, phone, role: "customer" },
      });
    }

    if (!password) {
      return NextResponse.json({ status: false, message: "Password is required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ status: false, message: "Email is already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: "customer",
      branchId: 0,
      status: true,
      addresses: [],
      permissions: [],
    });

    const token = await new SignJWT({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      branchId: newUser.branchId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    return NextResponse.json({
      status: true,
      message: "Account created successfully",
      token,
      user: {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        branchId: newUser.branchId,
        addresses: newUser.addresses,
      },
    });
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
