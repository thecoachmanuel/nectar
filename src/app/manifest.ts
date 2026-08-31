import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nectar - Online Groceries Delivery & WhatsApp Ordering",
    short_name: "Nectar",
    description: "Nectar - Online Groceries Delivery & WhatsApp Ordering with POS and instant home delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff006b",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    categories: ["shopping", "food", "lifestyle"],
    icons: [
      { src: "/images/theme/theme-favicon-logo.png?v=3", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/theme/theme-favicon-logo.png?v=3", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/images/theme/theme-favicon-logo.png?v=3", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/theme/theme-favicon-logo.png?v=3", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Order Groceries",
        short_name: "Order",
        description: "Browse products and order groceries",
        url: "/menu",
        icons: [{ src: "/images/theme/theme-favicon-logo.png?v=3", sizes: "96x96" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        description: "Track your current orders",
        url: "/account/orders",
        icons: [{ src: "/images/theme/theme-favicon-logo.png?v=3", sizes: "96x96" }],
      },
      {
        name: "Offers & Coupons",
        short_name: "Offers",
        description: "View current deals, coupons, and offers",
        url: "/offers",
        icons: [{ src: "/images/theme/theme-favicon-logo.png?v=3", sizes: "96x96" }],
      },
    ],
  };
}
