import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Setting from "@/models/Setting";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
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

    const settings = await Setting.find({ key: { $in: ["role_public_registration", "role_default_customer"] } });
    let allowPublic = "Yes";
    let defaultRole = "customer";
    
    settings.forEach(s => {
      if (s.key === "role_public_registration") allowPublic = s.payload;
      if (s.key === "role_default_customer") defaultRole = s.payload.toLowerCase(); // "Customer" -> "customer"
    });

    if (allowPublic === "No" && !isGuest) {
      return NextResponse.json({ status: false, message: "Public registration is currently disabled." }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: defaultRole as "admin" | "customer" | "chef" | "waiter" | "delivery_boy",
      storeId: 0,
      status: true,
      addresses: [],
      permissions: [],
    });

    const token = await new SignJWT({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      storeId: newUser.storeId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      status: true,
      message: "Account created successfully",
      token,
      user: {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        storeId: newUser.storeId,
        addresses: newUser.addresses,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
