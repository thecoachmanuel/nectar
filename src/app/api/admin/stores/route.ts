import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";
import Setting from "@/models/Setting";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();
    const stores = await Store.find({}).sort({ createdAt: -1 }).lean();

    const storeSettings = await Setting.find({
      key: {
        $in: [
          "store_wide_address",
          "store_wide_city",
          "store_wide_state",
          "store_wide_zipCode",
          "store_wide_latitude",
          "store_wide_longitude",
          "company_address",
          "company_latitude",
          "company_longitude"
        ]
      }
    }).lean();

    let swAddress = "";
    let swCity = "";
    let swState = "";
    let swZip = "";
    let swLat: number | undefined;
    let swLng: number | undefined;

    storeSettings.forEach((s: any) => {
      if (s.key === "store_wide_address" && s.payload) swAddress = s.payload;
      if (s.key === "store_wide_city" && s.payload) swCity = s.payload;
      if (s.key === "store_wide_state" && s.payload) swState = s.payload;
      if (s.key === "store_wide_zipCode" && s.payload) swZip = s.payload;
      if (s.key === "store_wide_latitude" && s.payload) swLat = parseFloat(s.payload);
      if (s.key === "store_wide_longitude" && s.payload) swLng = parseFloat(s.payload);
      if (!swAddress && s.key === "company_address" && s.payload) swAddress = s.payload;
      if (swLat === undefined && s.key === "company_latitude" && s.payload) swLat = parseFloat(s.payload);
      if (swLng === undefined && s.key === "company_longitude" && s.payload) swLng = parseFloat(s.payload);
    });

    const enrichedStores = stores.map((store: any) => {
      const hasCustomAddress = Boolean(store.address && store.address.trim());
      const hasCustomCoords = Boolean(store.latitude && store.longitude && Number(store.latitude) !== 0 && Number(store.longitude) !== 0);

      return {
        ...store,
        rawAddress: store.address || "",
        address: hasCustomAddress ? store.address : (swAddress || store.address || ""),
        city: store.city || swCity || "",
        state: store.state || swState || "",
        zipCode: store.zipCode || swZip || "",
        latitude: hasCustomCoords ? store.latitude : (swLat ?? store.latitude ?? 0),
        longitude: hasCustomCoords ? store.longitude : (swLng ?? store.longitude ?? 0),
        isUsingStoreWideAddress: !hasCustomAddress && Boolean(swAddress)
      };
    });

    return NextResponse.json({ status: true, data: enrichedStores, stores: enrichedStores });
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

    // Ensure coordinates are numeric or default to 0
    body.latitude = (body.latitude !== undefined && body.latitude !== "" && !isNaN(Number(body.latitude))) ? Number(body.latitude) : 0;
    body.longitude = (body.longitude !== undefined && body.longitude !== "" && !isNaN(Number(body.longitude))) ? Number(body.longitude) : 0;

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
