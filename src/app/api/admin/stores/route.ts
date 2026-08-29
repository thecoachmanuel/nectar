import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();
    const stores = await Store.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ status: true, stores });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // Hash password if provided
    let hashedPassword = "";
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10);
    }

    // Ensure valid GeoJSON Polygon for zone
    if (!body.zone || !body.zone.coordinates || body.zone.coordinates.length === 0) {
      body.zone = {
        type: "Polygon",
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
      };
    }

    const newStore = await Store.create(body);

    // Auto-create Store Manager User
    if (hashedPassword) {
      await User.create({
        name: `${newStore.name} Manager`,
        email: newStore.email,
        password: hashedPassword,
        phone: newStore.phone,
        role: "store_manager",
        storeId: newStore._id.toString(),
        status: true,
      });
    }

    return NextResponse.json({ status: true, message: "Store created successfully", store: newStore }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
