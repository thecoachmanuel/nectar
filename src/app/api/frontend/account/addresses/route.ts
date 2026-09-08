import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "errandshop_secret_key_default_2026"
);

export const dynamic = "force-dynamic";

async function getUserFromToken(req: Request) {
  let token: string | undefined;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    } catch {}
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.userId || payload.id) as string;
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ 
      status: true, 
      data: user.addresses || [] 
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { _id, label, address, apartment, latitude, longitude, isDefault } = body;

    if (!address || !address.trim()) {
      return NextResponse.json({ status: false, message: "Address is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });

    if (!user.addresses) user.addresses = [];

    // If this address is set as default, unset existing default flags
    if (isDefault) {
      user.addresses.forEach((a: any) => { a.isDefault = false; });
    }

    const addressData: any = {
      label: label || "Home",
      address: address.trim(),
      apartment: apartment ? apartment.trim() : "",
      latitude: latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : undefined,
      longitude: longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : undefined,
      isDefault: Boolean(isDefault || user.addresses.length === 0),
    };

    if (_id) {
      const addressIndex = user.addresses.findIndex((a: any) => a._id.toString() === _id);
      if (addressIndex > -1) {
        user.addresses[addressIndex].label = addressData.label;
        user.addresses[addressIndex].address = addressData.address;
        user.addresses[addressIndex].apartment = addressData.apartment;
        user.addresses[addressIndex].latitude = addressData.latitude;
        user.addresses[addressIndex].longitude = addressData.longitude;
        if (isDefault !== undefined) user.addresses[addressIndex].isDefault = addressData.isDefault;
      } else {
        user.addresses.push(addressData);
      }
    } else {
      user.addresses.push(addressData);
    }
    
    await user.save();

    return NextResponse.json({ 
      status: true, 
      message: _id ? "Address updated successfully" : "Address added successfully", 
      data: user.addresses 
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserFromToken(req);
    if (!userId) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return NextResponse.json({ status: false, message: "Address ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });

    user.addresses = user.addresses.filter((a: any) => a._id.toString() !== addressId);
    await user.save();

    return NextResponse.json({ 
      status: true, 
      message: "Address removed successfully", 
      data: user.addresses 
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
