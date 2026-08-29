import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Offer from "@/models/Offer";

export async function GET() {
  try {
    await dbConnect();
    const offers = await Offer.find().sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: offers });
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
    if (!body.slug && body.title) {
      body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const existing = await Offer.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json(
        { status: false, message: "Offer with this slug already exists" },
        { status: 400 }
      );
    }

    const offer = await Offer.create(body);

    return NextResponse.json(
      { status: true, message: "Offer created successfully", data: offer },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
