import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { SettingsProvider } from "@/context/SettingsContext";
import ClientThemeSetter from "@/components/ClientThemeSetter";
import NotificationListener from "@/components/NotificationListener";
import OfflineDetector from "@/components/OfflineDetector";
import HorizontalMouseScroll from "@/components/HorizontalMouseScroll";

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl = "/images/theme/theme-favicon-logo.png?v=3";
  let siteTitle = "Errandshop - Online Groceries Shopping";
  let themeColor = "#2eb824";

  try {
    await dbConnect();
    const settings = await Setting.find({
      key: { $in: ["theme_favicon", "site_favicon", "site_title", "company_name", "theme_primary_color", "theme_secondary_color", "theme_tertiary_color"] },
    }).lean();

    const map: Record<string, any> = {};
    settings.forEach((s: any) => { map[s.key] = s.payload; });

    const rawFavicon = map.theme_favicon || map.site_favicon;
    if (rawFavicon) {
      faviconUrl = normalizeImageUrl(rawFavicon);
    }
    if (map.site_title || map.company_name) {
      siteTitle = `${map.site_title || map.company_name} - Online Groceries Delivery & WhatsApp Ordering`;
    }
    if (map.theme_primary_color) {
      themeColor = map.theme_primary_color;
    }
  } catch (err) {
    console.error("Error generating dynamic metadata:", err);
  }

  return {
    title: {
      default: siteTitle,
      template: "%s | Errandshop",
    },
    applicationName: "Errandshop",
    description: "Errandshop - Online Groceries Delivery & WhatsApp Ordering. Order your favourite fresh groceries and food online with instant delivery.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Errandshop",
    },
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: faviconUrl, sizes: "192x192", type: "image/png" },
        { url: faviconUrl, sizes: "512x512", type: "image/png" },
        { url: faviconUrl, sizes: "32x32", type: "image/png" },
        { url: faviconUrl, sizes: "16x16", type: "image/png" },
      ],
      apple: [
        { url: faviconUrl, sizes: "180x180", type: "image/png" },
        { url: faviconUrl, sizes: "167x167", type: "image/png" },
        { url: faviconUrl, sizes: "152x152", type: "image/png" },
        { url: faviconUrl, sizes: "120x120", type: "image/png" },
      ],
      shortcut: [
        { url: faviconUrl },
      ],
    },
    other: {
      "application-name": "Errandshop",
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "Errandshop",
      "msapplication-TileImage": faviconUrl,
      "msapplication-TileColor": themeColor,
      "theme-color": themeColor,
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
}

export const viewport: Viewport = {
  themeColor: "#2eb824",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let themeColor = "#2eb824";
  let themeSecondaryColor = "#f70102";
  let themeTertiaryColor = "#ff840a";
  let themeFooterColor = "#2eb824";
  const initialSettings: Record<string, any> = {};

  try {
    await dbConnect();
    const settingsDocs = await Setting.find({}).lean();

    settingsDocs.forEach((doc: any) => {
      initialSettings[doc.key] = doc.payload;
    });

    if (initialSettings.theme_primary_color) {
      themeColor = initialSettings.theme_primary_color;
    }
    if (initialSettings.theme_secondary_color) {
      themeSecondaryColor = initialSettings.theme_secondary_color;
    }
    if (initialSettings.theme_tertiary_color) {
      themeTertiaryColor = initialSettings.theme_tertiary_color;
    }
    if (initialSettings.theme_footer_color) {
      themeFooterColor = initialSettings.theme_footer_color;
    } else if (initialSettings.theme_primary_color) {
      themeFooterColor = initialSettings.theme_primary_color;
    }
  } catch (err) {
    console.error("Failed to load settings in RootLayout", err);
  }

  const rawLogo = initialSettings.theme_logo || initialSettings.site_logo;
  const preloadLogoUrl = rawLogo ? normalizeImageUrl(rawLogo) : null;

  const rawFavicon = initialSettings.theme_favicon || initialSettings.site_favicon;
  const activeFaviconUrl = rawFavicon ? normalizeImageUrl(rawFavicon) : "/images/theme/theme-favicon-logo.png?v=3";

  return (
    <html lang="en">
      <head>
        {/* Dynamic Favicon rendered directly on SSR server output with zero flicker */}
        <link rel="icon" href={activeFaviconUrl} sizes="any" />
        <link rel="apple-touch-icon" href={activeFaviconUrl} />
        <link rel="apple-touch-icon" sizes="180x180" href={activeFaviconUrl} />
        <link rel="apple-touch-icon" sizes="167x167" href={activeFaviconUrl} />
        <link rel="apple-touch-icon" sizes="152x152" href={activeFaviconUrl} />
        <link rel="apple-touch-icon" sizes="120x120" href={activeFaviconUrl} />
        <link rel="apple-touch-icon-precomposed" href={activeFaviconUrl} />
        <link rel="shortcut icon" href={activeFaviconUrl} />

        {/* Preload admin uploaded favicon to eliminate network latency */}
        {rawFavicon && (
          <link rel="preload" as="image" href={activeFaviconUrl} fetchPriority="high" />
        )}

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
        {/* Preload admin uploaded logo to eliminate network latency */}
        {preloadLogoUrl && (
          <link rel="preload" as="image" href={preloadLogoUrl} fetchPriority="high" />
        )}
        {/* Synchronous bootstrap script ensuring zero-flicker logo/theme rendering */}
        <script
          id="errandshop-initial-settings"
          dangerouslySetInnerHTML={{
            __html: `window.__INITIAL_SETTINGS__ = ${JSON.stringify(initialSettings).replace(/</g, "\\u003c")};`,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
          :root {
            --primary-hex: ${themeColor};
            --primary-slate: ${themeColor}e6;
            --primary-light: ${themeColor}1a;
            --color-primary: ${themeColor};
            --color-primary-light: ${themeColor}1a;
            --secondary-hex: ${themeSecondaryColor};
            --secondary-hover: ${themeSecondaryColor}e6;
            --secondary-light: ${themeSecondaryColor}1a;
            --color-secondary: ${themeSecondaryColor};
            --color-secondary-light: ${themeSecondaryColor}1a;
            --accent-hex: ${themeTertiaryColor};
            --accent-hover: ${themeTertiaryColor}e6;
            --accent-light: ${themeTertiaryColor}1a;
            --color-accent: ${themeTertiaryColor};
            --color-accent-light: ${themeTertiaryColor}1a;
            --footer-hex: ${themeFooterColor};
            --footer-bg: ${themeFooterColor};
            --color-footer: ${themeFooterColor};
          }
          .bg-primary { background-color: var(--primary-hex) !important; }
          .text-primary { color: var(--primary-hex); }
          .border-primary { border-color: var(--primary-hex) !important; }
          .fill-primary { fill: var(--primary-hex) !important; }
          .stroke-primary { stroke: var(--primary-hex) !important; }
          .accent-primary { accent-color: var(--primary-hex) !important; }
          .bg-primary-light { background-color: var(--primary-light) !important; }
          .hover\\:bg-primary-light:hover { background-color: var(--primary-light) !important; }
          .hover\\:bg-primary:hover, .group:hover .group-hover\\:bg-primary { background-color: var(--primary-hex) !important; }
          .hover\\:text-white:hover, .group:hover .group-hover\\:text-white { color: #ffffff !important; }

          .bg-secondary { background-color: var(--secondary-hex) !important; }
          .text-secondary { color: var(--secondary-hex); }
          .border-secondary { border-color: var(--secondary-hex) !important; }
          .bg-secondary-light { background-color: var(--secondary-light) !important; }
          .hover\\:bg-secondary:hover { background-color: var(--secondary-hover) !important; }

          .bg-accent { background-color: var(--accent-hex) !important; }
          .text-accent { color: var(--accent-hex); }
          .border-accent { border-color: var(--accent-hex) !important; }
          .bg-accent-light { background-color: var(--accent-light) !important; }
          .hover\\:bg-accent:hover { background-color: var(--accent-hover) !important; }
          
          .bg-footer { background-color: var(--footer-hex) !important; }
          .text-footer { color: var(--footer-hex); }
          .border-footer { border-color: var(--footer-hex) !important; }
          .footer-part { background-color: var(--footer-hex) !important; border-top: 3px solid var(--secondary-hex) !important; }
        `}} />
      </head>
      <body className="antialiased bg-white text-[#14142b]" style={{ fontFamily: "'Rubik', sans-serif" }}>
        <SettingsProvider initialSettings={initialSettings}>
          <ClientThemeSetter initialSettings={initialSettings} />
          <NotificationListener />
          <OfflineDetector />
          <HorizontalMouseScroll />
          <Toaster position="top-right" richColors />
          {children}
        </SettingsProvider>

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
