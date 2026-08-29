import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Offer from "@/models/Offer";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;
    const offer = await Offer.findOne({ $or: [{ slug: slug }, { _id: slug }] });
    if (!offer) {
      return NextResponse.json(
        { status: false, message: "Offer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: true, data: offer });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
