import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nectar — Food & Grocery Delivery",
    short_name: "Nectar",
    description: "Multi-store Food and Grocery Ordering System with POS, WhatsApp ordering, and offline support.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff006b",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    categories: ["food", "shopping", "lifestyle"],
    icons: [
      { src: "/images/theme/theme-favicon-logo.png?v=2", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/images/theme/theme-favicon-logo.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/theme/theme-favicon-logo.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Order Food",
        short_name: "Order",
        description: "Browse our menu and order food",
        url: "/menu",
        icons: [{ src: "/images/theme/theme-favicon-logo.png?v=2", sizes: "96x96" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        description: "Track your current orders",
        url: "/account/orders",
        icons: [{ src: "/images/theme/theme-favicon-logo.png?v=2", sizes: "96x96" }],
      },
      {
        name: "Offers",
        short_name: "Offers",
        description: "View current deals and offers",
        url: "/offers",
        icons: [{ src: "/images/theme/theme-favicon-logo.png?v=2", sizes: "96x96" }],
      },
    ],
  };
}
