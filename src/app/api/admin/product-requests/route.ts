import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ProductRequest from "@/models/ProductRequest";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { productName: regex },
        { categoryOrBrand: regex },
        { customerName: regex },
        { customerPhone: regex },
        { customerEmail: regex },
      ];
    }

    const requests = await ProductRequest.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ status: true, data: requests });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
