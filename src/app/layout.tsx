import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Nectar — Food & Grocery Delivery",
  description: "Order your favourite food and groceries online with instant delivery.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nectar",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/images/theme/theme-favicon-logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/images/theme/theme-favicon-logo.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Nectar",
    "msapplication-TileImage": "/images/theme/theme-favicon-logo.png",
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let themeColor = "#ff006b";
  try {
    await dbConnect();
    const setting = await Setting.findOne();
    if (setting && setting.themeColor) {
      themeColor = setting.themeColor;
    }
  } catch (err) {
    console.error("Failed to load theme setting", err);
  }

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
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary-color: ${themeColor};
          }
          /* Apply dynamic color to specific utility classes if needed, 
             or rely on Tailwind arbitrary values via inline styles elsewhere */
          .bg-primary { background-color: var(--primary-color) !important; }
          .text-primary { color: var(--primary-color) !important; }
          .border-primary { border-color: var(--primary-color) !important; }
        `}} />
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
                    console.log('[Nectar PWA] Service Worker registered:', reg.scope);
                  })
                  .catch(function(err) {
                    console.warn('[Nectar PWA] Service Worker registration failed:', err);
                  });
              });
            }
          `}
        </Script>

        {/* OneSignal SDK */}
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        <Script id="onesignal-init" strategy="lazyOnload">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
              // Note: The App ID will be set from MongoDB dynamically in a global setting,
              // but to initialize early, we try to load it from env or just initialize without it
              // and the frontend settings API will call OneSignal.init() if it's not initialized yet.
              // We'll initialize it here if an env var exists for fallback.
              if ("${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''}") {
                await OneSignal.init({
                  appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''}",
                });
              }
            });
          `}
        </Script>
      </body>
    </html>
  );
}
