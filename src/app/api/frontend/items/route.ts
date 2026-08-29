import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Item from "@/models/Item";
import ItemCategory from "@/models/ItemCategory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const categoryId = searchParams.get("categoryId");

    const search = searchParams.get("search");
    const isFeatured = searchParams.get("isFeatured") || searchParams.get("featured");

    const query: any = { status: true };

    if (categoryId) {
      query.categoryId = categoryId;
    }



    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const lat = searchParams.get("latitude");
    const lng = searchParams.get("longitude");

    let items = await Item.find(query)
      .populate("categoryId", "name slug")
      .populate("addonIds", "name price")
      .lean();

    const Store = (await import("@/models/Store")).default;
    const stores = await Store.find({ status: true }).lean();

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Helper inside endpoint
      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      };

      const storeDistances: Record<string, number> = {};
      stores.forEach((s: any) => {
        if (s.latitude !== undefined && s.longitude !== undefined) {
          storeDistances[s._id.toString()] = haversine(latitude, longitude, s.latitude, s.longitude);
        } else {
          storeDistances[s._id.toString()] = Infinity;
        }
      });

      items = items.sort((a, b) => {
        const distA = storeDistances[a.storeId?.toString()] ?? Infinity;
        const distB = storeDistances[b.storeId?.toString()] ?? Infinity;
        // if same distance, fallback to createdAt
        if (distA === distB) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return distA - distB;
      });
    } else {
      items = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Map store name
    items = items.map(item => {
      let storeName = "Nectar Online Groceries"; // Default for unassigned / global
      if (item.storeId && item.storeId !== "0" && item.storeId !== "admin") {
        const store = stores.find((s: any) => s._id.toString() === item.storeId.toString());
        if (store) storeName = store.name;
      }
      return { ...item, storeName };
    });

    return NextResponse.json({ status: true, data: items });
  } catch (error: any) {
    console.error("Items API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
