import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import ItemCategory from "@/models/ItemCategory";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function GET() {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let storeIdFilter = {};

    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === "store_manager" && payload.storeId) {
        storeIdFilter = { storeId: payload.storeId };
      }
    }

    const items = await Item.find(storeIdFilter)
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: items });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === "store_manager" && payload.storeId) {
        body.storeId = payload.storeId;
      }
    }

    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    if (body.offerId === "") {
      delete body.offerId;
    }

    const existing = await Item.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json(
        { status: false, message: "Item with this slug already exists" },
        { status: 400 }
      );
    }

    const item = await Item.create(body);
    await item.populate("categoryId", "name slug");

    return NextResponse.json(
      { status: true, message: "Item created successfully", data: item },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
