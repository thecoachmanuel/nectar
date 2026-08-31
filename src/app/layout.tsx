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
      { url: "/images/theme/theme-favicon-logo.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/images/theme/theme-favicon-logo.png?v=2", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Nectar",
    "msapplication-TileImage": "/images/theme/theme-favicon-logo.png?v=2",
    "msapplication-TileColor": "#ff006b",
    "theme-color": "#ff006b",
    // iOS splash screens
    "apple-touch-startup-image-640x1136": "/images/icons/splash-640x1136.png?v=3",
    "apple-touch-startup-image-750x1334": "/images/icons/splash-750x1334.png?v=3",
    "apple-touch-startup-image-828x1792": "/images/icons/splash-828x1792.png?v=3",
    "apple-touch-startup-image-1125x2436": "/images/icons/splash-1125x2436.png?v=3",
    "apple-touch-startup-image-1242x2208": "/images/icons/splash-1242x2208.png?v=3",
    "apple-touch-startup-image-1242x2688": "/images/icons/splash-1242x2688.png?v=3",
    "apple-touch-startup-image-1536x2048": "/images/icons/splash-1536x2048.png?v=3",
    "apple-touch-startup-image-1668x2224": "/images/icons/splash-1668x2224.png?v=3",
    "apple-touch-startup-image-1668x2388": "/images/icons/splash-1668x2388.png?v=3",
    "apple-touch-startup-image-2048x2732": "/images/icons/splash-2048x2732.png?v=3",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff006b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";
import ClientThemeSetter from "@/components/ClientThemeSetter";
import NotificationListener from "@/components/NotificationListener";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let themeColor = "#ff006b";
  try {
    await dbConnect();
    const setting = await Setting.findOne({ key: "theme_primary_color" });
    if (setting && setting.payload) {
      themeColor = setting.payload;
    }
  } catch (err) {
    console.error("Failed to load theme setting", err);
  }

  return (
    <html lang="en">
      <head>
        {/* iOS splash screen link tags */}
        <link rel="apple-touch-startup-image" href="/images/icons/splash-640x1136.png?v=3" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-750x1334.png?v=3" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-828x1792.png?v=3" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1125x2436.png?v=3" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1242x2208.png?v=3" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1242x2688.png?v=3" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-1536x2048.png?v=3" media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/icons/splash-2048x2732.png?v=3" media="(min-device-width: 1024px) and (max-device-width: 1366px) and (-webkit-min-device-pixel-ratio: 2)" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary-hex: ${themeColor};
            --primary-slate: ${themeColor}e6;
            --primary-light: ${themeColor}1a;
          }
          .bg-primary { background-color: var(--primary-hex) !important; }
          .text-primary { color: var(--primary-hex) !important; }
          .border-primary { border-color: var(--primary-hex) !important; }
          .fill-primary { fill: var(--primary-hex) !important; }
        `}} />
      </head>
      <body className="antialiased bg-white text-[#14142b]" style={{ fontFamily: "'Rubik', sans-serif" }}>
        <ClientThemeSetter />
        <NotificationListener />
        <Toaster position="top-right" richColors />
        {children}

        {/* OneSignal SDK */}
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        <Script id="onesignal-init" strategy="lazyOnload">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
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
