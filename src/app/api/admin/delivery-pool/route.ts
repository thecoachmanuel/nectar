import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

// Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (!lat || !lng) {
      return NextResponse.json({ status: false, message: "Location coordinates required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "delivery_boy") {
      return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
    }

    // Find orders that are ready/preparing and not yet assigned
    const openOrders = await Order.find({
      orderType: "delivery",
      orderStatus: { $in: ["pending", "preparing", "ready"] },
      // deliveryBoyId: { $exists: false } // Assuming we add this field to Order
    }).lean();

    // Fetch stores to get their coordinates
    const storeIds = [...new Set(openOrders.map(o => o.storeId?.toString()).filter(Boolean))];
    const stores = await Store.find({ _id: { $in: storeIds } }).lean();
    const storeMap = stores.reduce((acc: any, s: any) => {
      acc[s._id.toString()] = s;
      return acc;
    }, {});

    // Filter by distance
    const nearbyOrders = openOrders.filter((order: any) => {
      const store = storeMap[order.storeId?.toString()];
      if (!store || !store.latitude || !store.longitude) return false;

      const distance = getDistanceFromLatLonInKm(
        lat, lng, 
        Number(store.latitude), Number(store.longitude)
      );

      // 5km radius logic (or store's delivery radius)
      return distance <= (store.deliveryRadius || 5);
    });

    return NextResponse.json({ status: true, data: nearbyOrders });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
