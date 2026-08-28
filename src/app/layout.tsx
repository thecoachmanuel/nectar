import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodAppi - PWA Food Delivery System and WhatsApp Ordering with Admin Panel & POS",
  description: "Order your favorite delicious food items online with instant delivery, WhatsApp ordering, and offline PWA capability.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
