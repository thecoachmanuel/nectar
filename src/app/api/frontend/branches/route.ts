import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Branch from "@/models/Branch";

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

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("latitude");
    const lng = searchParams.get("longitude");

    const branches = await Branch.find({ status: true });

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // Check if location falls inside any branch zone polygon
      for (const branch of branches) {
        if (branch.zone && branch.zone.coordinates && branch.zone.coordinates[0]) {
          const polygon = branch.zone.coordinates[0];
          if (isPointInPolygon(latitude, longitude, polygon)) {
            return NextResponse.json({
              status: true,
              matchedBranch: branch,
              branches,
            });
          }
        }
      }
    }

    return NextResponse.json({
      status: true,
      matchedBranch: branches[0] || null,
      branches,
    });
  } catch (error: any) {
    console.error("Branches API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
