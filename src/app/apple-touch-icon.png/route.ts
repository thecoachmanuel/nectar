import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";
import { normalizeImageUrl } from "@/lib/imageUtils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  let faviconUrl = "/images/theme/theme-favicon-logo.png?v=4";

  try {
    await dbConnect();
    const settings = await Setting.find({
      key: { $in: ["theme_favicon", "site_favicon"] },
    }).lean();

    const map: Record<string, any> = {};
    settings.forEach((s: any) => { map[s.key] = s.payload; });

    const rawFavicon = map.theme_favicon || map.site_favicon;
    if (rawFavicon) {
      faviconUrl = normalizeImageUrl(rawFavicon);
    }
  } catch (err) {
    console.error("Error serving apple-touch-icon:", err);
  }

  const baseUrl = new URL(req.url).origin;
  const redirectUrl = faviconUrl.startsWith("http") ? faviconUrl : `${baseUrl}${faviconUrl}`;
  return NextResponse.redirect(redirectUrl, 307);
}
