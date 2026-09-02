import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const mapSetting = await Setting.findOne({ key: "map_provider" }).lean();
    const keySetting = await Setting.findOne({
      key: { $in: ["google_maps_api_key", "google_map_key", "site_google_map_key", "map_api_key"] },
    }).lean();

    const apiKey =
      (keySetting as any)?.payload ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "";

    const provider =
      (mapSetting as any)?.payload === "openstreetmap" ? "openstreetmap" : "google";

    return NextResponse.json({ provider, apiKey });
  } catch {
    return NextResponse.json({
      provider: "openstreetmap",
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "",
    });
  }
}
