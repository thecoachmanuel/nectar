import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FoodAppi - PWA Food Delivery & POS",
    short_name: "FoodAppi",
    description: "PWA Online Food Ordering System and Restaurant Management System with POS",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF4D4F",
    icons: [
      {
        src: "/images/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/images/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/images/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/images/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
