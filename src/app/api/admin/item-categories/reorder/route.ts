import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ItemCategory from "@/models/ItemCategory";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin" && payload.role !== "store_manager") {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ status: false, message: "Invalid payload" }, { status: 400 });
    }

    // items should be [{ _id: string, sortOrder: number }]
    for (const item of items) {
      await ItemCategory.findByIdAndUpdate(item._id, { sortOrder: item.sortOrder });
    }

    return NextResponse.json({ status: true, message: "Categories reordered successfully" });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
