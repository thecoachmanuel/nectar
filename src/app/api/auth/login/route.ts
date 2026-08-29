import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    let user;

    // 1. Check if ENV Admin Credentials match
    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      user = await User.findOne({ email: adminEmail });
      
      // Auto-upsert the admin in the database if they log in via ENV credentials
      if (!user) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        user = await User.create({
          name: "Super Admin",
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
          storeId: 0,
          status: true,
          permissions: ["all"],
        });
      } else {
        // Update DB password if ENV password changed
        const isMatch = await bcrypt.compare(adminPassword, user.password!);
        if (!isMatch) {
          user.password = await bcrypt.hash(adminPassword, 10);
          await user.save();
        }
      }
    } else {
      // 2. Normal Database Authentication
      user = await User.findOne({ email });
      if (!user || !user.password) {
        return NextResponse.json(
          { status: false, message: "Invalid email or password credentials" },
          { status: 401 }
        );
      }

      if (user.role === "admin") {
        return NextResponse.json(
          { status: false, message: "Admin login is restricted to environment credentials." },
          { status: 403 }
        );
      }

      if (!user.status) {
        return NextResponse.json(
          { status: false, message: "Your account has been deactivated" },
          { status: 403 }
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { status: false, message: "Invalid email or password credentials" },
          { status: 401 }
        );
      }
    }

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      storeId: user.storeId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      status: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeId: user.storeId,
        addresses: user.addresses,
        permissions: user.permissions,
        image: user.image,
      },
    });
    
    response.cookies.set("token", token, {
      httpOnly: false, // Allow client access if needed, but mainly for middleware
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
