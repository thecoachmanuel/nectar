import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "errandshop_secret_key_default_2026"
);

export const dynamic = "force-dynamic";

async function getUserFromToken(req: Request) {
  let token: string | undefined;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    } catch {}
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.userId || payload.id) as string;
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      data: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeId: user.storeId,
        image: user.image,
        walletBalance: user.walletBalance ?? 0,
        addresses: user.addresses || [],
      },
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
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
        _id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeId: user.storeId,
        image: user.image,
        walletBalance: user.walletBalance ?? 0,
        addresses: user.addresses || [],
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
