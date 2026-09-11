import { MetadataRoute } from "next";
import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";
import { normalizeImageUrl } from "@/lib/imageUtils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let faviconUrl = "/images/theme/theme-favicon-logo.png?v=4";
  let appName = "Errandshop - Online Groceries Shopping";
  let shortName = "Errandshop";
  let themeColor = "#ff006b";

  try {
    await dbConnect();
    const settings = await Setting.find({
      key: { $in: ["theme_favicon", "site_favicon", "site_name", "company_name", "site_title", "theme_primary_color"] }
    }).lean();

    const map: Record<string, any> = {};
    settings.forEach((s: any) => { map[s.key] = s.payload; });

    const rawFavicon = map.theme_favicon || map.site_favicon;
    if (rawFavicon) {
      faviconUrl = normalizeImageUrl(rawFavicon);
    }
    if (map.company_name || map.site_name || map.site_title) {
      shortName = map.company_name || map.site_name || map.site_title;
      appName = `${shortName} - Online Groceries Shopping`;
    }
    if (map.theme_primary_color) {
      themeColor = map.theme_primary_color;
    }
  } catch (err) {
    console.error("Error generating dynamic manifest:", err);
  }

  const cleanFavicon = faviconUrl.split("?")[0].toLowerCase();
  let iconType = "image/png";
  if (cleanFavicon.endsWith(".svg")) iconType = "image/svg+xml";
  else if (cleanFavicon.endsWith(".webp")) iconType = "image/webp";
  else if (cleanFavicon.endsWith(".jpg") || cleanFavicon.endsWith(".jpeg")) iconType = "image/jpeg";
  else if (cleanFavicon.endsWith(".ico")) iconType = "image/x-icon";

  return {
    name: appName,
    short_name: shortName,
    description: `${shortName} - Order your fresh food items and have them delivered to your doorstep same day.`,
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    orientation: "portrait",
    scope: "/",
    lang: "en",
    categories: ["shopping", "food", "lifestyle"],
    icons: [
      { src: faviconUrl, sizes: "192x192", type: iconType, purpose: "any" },
      { src: faviconUrl, sizes: "192x192", type: iconType, purpose: "maskable" },
      { src: faviconUrl, sizes: "512x512", type: iconType, purpose: "any" },
      { src: faviconUrl, sizes: "512x512", type: iconType, purpose: "maskable" },
      { src: faviconUrl, sizes: "96x96", type: iconType, purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Order Groceries",
        short_name: "Order",
        description: "Browse products and order groceries",
        url: "/menu",
        icons: [{ src: faviconUrl, sizes: "96x96" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        description: "Track your current orders",
        url: "/account/orders",
        icons: [{ src: faviconUrl, sizes: "96x96" }],
      },
      {
        name: "Offers & Coupons",
        short_name: "Offers",
        description: "View current deals, coupons, and offers",
        url: "/offers",
        icons: [{ src: faviconUrl, sizes: "96x96" }],
      },
    ],
  };
}
