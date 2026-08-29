import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";

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

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // Sort by haversine distance and map distance property
      stores = stores.map((store: any) => {
        const dist = store.latitude !== undefined && store.longitude !== undefined 
          ? haversineDistance(latitude, longitude, store.latitude, store.longitude) 
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
      });
    }

    return NextResponse.json({
      status: true,
      matchedStore: stores[0] || null,
      stores,
    });
  } catch (error: any) {
    console.error("Stores API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
