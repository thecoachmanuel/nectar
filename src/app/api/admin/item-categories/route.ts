import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ItemCategory from "@/models/ItemCategory";

export async function GET() {
  try {
    await dbConnect();
    const categories = await ItemCategory.find().sort({ sortOrder: 1, createdAt: -1 });
    return NextResponse.json({ status: true, data: categories });
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

    // Create a slug if not provided
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const existing = await ItemCategory.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json(
        { status: false, message: "Category with this slug already exists" },
        { status: 400 }
      );
    }

    const category = await ItemCategory.create(body);

    return NextResponse.json(
      { status: true, message: "Category created successfully", data: category },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
