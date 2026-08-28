import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

export const metadata: Metadata = {
  title: "FoodAppi — Fast Food Delivery & WhatsApp Ordering",
  description: "Order your favourite delicious food online with instant delivery, WhatsApp ordering, and offline PWA capability.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FoodAppi",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/images/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/images/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/images/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/images/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/images/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/images/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/images/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "FoodAppi",
    "msapplication-TileImage": "/images/icons/icon-144x144.png",
    "msapplication-TileColor": "#ff006b",
    "theme-color": "#ff006b",
    // iOS splash screens
    "apple-touch-startup-image-640x1136": "/images/icons/splash-640x1136.png",
    "apple-touch-startup-image-750x1334": "/images/icons/splash-750x1334.png",
    "apple-touch-startup-image-828x1792": "/images/icons/splash-828x1792.png",
    "apple-touch-startup-image-1125x2436": "/images/icons/splash-1125x2436.png",
    "apple-touch-startup-image-1242x2208": "/images/icons/splash-1242x2208.png",
    "apple-touch-startup-image-1242x2688": "/images/icons/splash-1242x2688.png",
    "apple-touch-startup-image-1536x2048": "/images/icons/splash-1536x2048.png",
    "apple-touch-startup-image-1668x2224": "/images/icons/splash-1668x2224.png",
    "apple-touch-startup-image-1668x2388": "/images/icons/splash-1668x2388.png",
    "apple-touch-startup-image-2048x2732": "/images/icons/splash-2048x2732.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff006b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* iOS splash screen link tags */}
        <link rel="apple-touch-startup-image" href="/images/icons/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1536x2048.png" media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-2048x2732.png" media="(min-device-width: 1024px) and (max-device-width: 1366px) and (-webkit-min-device-pixel-ratio: 2)" />
      </head>
      <body className="antialiased bg-white text-[#14142b]" style={{ fontFamily: "'Rubik', sans-serif" }}>
        <Toaster position="top-right" richColors />
        {children}

        {/* PWA Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/serviceworker.js')
                  .then(function(reg) {
                    console.log('[FoodAppi PWA] Service Worker registered:', reg.scope);
                  })
                  .catch(function(err) {
                    console.warn('[FoodAppi PWA] Service Worker registration failed:', err);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
