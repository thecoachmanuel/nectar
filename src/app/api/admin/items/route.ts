import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import ItemCategory from "@/models/ItemCategory";

export async function GET() {
  try {
    await dbConnect();
    const items = await Item.find()
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

    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
