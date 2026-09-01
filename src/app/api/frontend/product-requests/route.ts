import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ProductRequest from "@/models/ProductRequest";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { productName, categoryOrBrand, customerName, customerPhone, customerEmail, notes, image } = body;

    if (!productName || !productName.trim()) {
      return NextResponse.json(
        { status: false, message: "Product name is required" },
        { status: 400 }
      );
    }

    const newRequest = await ProductRequest.create({
      productName: productName.trim(),
      categoryOrBrand: categoryOrBrand ? categoryOrBrand.trim() : undefined,
      customerName: customerName ? customerName.trim() : undefined,
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      image: image || undefined,
      status: "pending",
    });

    return NextResponse.json(
      {
        status: true,
        message: "Product request submitted successfully! We'll notify you as soon as it's in stock.",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Product Request Error:", error);
    return NextResponse.json(
      { status: false, message: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}
