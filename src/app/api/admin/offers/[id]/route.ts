import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Offer from "@/models/Offer";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const id = params.id;
    const body = await req.json();

    // Create a slug if not provided
    if (!body.slug && body.title) {
      body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    if (body.slug) {
      const existing = await Offer.findOne({ slug: body.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { status: false, message: "Offer with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const offer = await Offer.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!offer) {
      return NextResponse.json(
        { status: false, message: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, message: "Offer updated successfully", data: offer });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const id = params.id;
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) {
      return NextResponse.json(
        { status: false, message: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, message: "Offer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
