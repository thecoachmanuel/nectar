import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";
import Setting from "@/models/Setting";

// Ray-casting algorithm for Point in Polygon checking
function isPointInPolygon(latitude: number, longitude: number, polygon: number[][]) {
  let inside = false;
  const x = longitude;
  const y = latitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("latitude");
    const lng = searchParams.get("longitude");

    let stores = await Store.find({ status: true }).lean();

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

    // Populate fallback address & coordinates for any store that has them empty or 0
    stores = stores.map((store: any) => {
      const hasCustomAddress = Boolean(store.address && store.address.trim());
      const hasCustomCoords = Boolean(store.latitude && store.longitude && Number(store.latitude) !== 0 && Number(store.longitude) !== 0);

      return {
        ...store,
        address: hasCustomAddress ? store.address : (swAddress || store.address || ""),
        city: store.city || swCity || "",
        state: store.state || swState || "",
        zipCode: store.zipCode || swZip || "",
        latitude: hasCustomCoords ? store.latitude : (swLat ?? store.latitude ?? 0),
        longitude: hasCustomCoords ? store.longitude : (swLng ?? store.longitude ?? 0),
        isUsingStoreWideAddress: !hasCustomAddress && Boolean(swAddress)
      };
    });

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // Sort by haversine distance and map distance property
      stores = stores.map((store: any) => {
        const dist = store.latitude !== undefined && store.longitude !== undefined && Number(store.latitude) !== 0 && Number(store.longitude) !== 0
          ? haversineDistance(latitude, longitude, Number(store.latitude), Number(store.longitude)) 
          : Infinity;
        return { ...store, distance: dist };
      }).sort((a: any, b: any) => a.distance - b.distance);

      // Find if location falls inside any store zone polygon (optional context)
      let matchedStore = null;
      for (const store of stores) {
        if (store.zone && store.zone.coordinates && store.zone.coordinates[0]) {
          const polygon = store.zone.coordinates[0];
          if (isPointInPolygon(latitude, longitude, polygon)) {
            matchedStore = store;
            break;
          }
        }
      }

      return NextResponse.json({
        status: true,
        matchedStore: matchedStore || stores[0] || null,
        stores,
        data: stores,
      });
    }

    return NextResponse.json({
      status: true,
      matchedStore: stores[0] || null,
      stores,
      data: stores,
    });
  } catch (error: any) {
    console.error("Stores API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
