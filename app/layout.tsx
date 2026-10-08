import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import ProgressBar from "@/components/ProgressBar";
import { getCategories } from "@/lib/woo";
import FacebookPixel from "@/components/FacebookPixel";
import AttributionTracker from "@/components/AttributionTracker";

export const metadata: Metadata = {
  icons: { icon: "/favicon.jpeg", apple: "/favicon.jpeg" },
  title: { default: "sunnaherpower.com", template: "%s – sunnaherpower.com" },
  description: "রিচার্জেবল টর্চ, সোলার লাইট, হারিকেন ও লাম্প লাইট। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
};

export const viewport: Viewport = { themeColor: "#1d4a2a" };



export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const menu = categories.filter((c) => c.slug !== "uncategorized" && c.slug !== "all-products");

  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        
      </head>
      <body className="min-h-dvh flex flex-col">
        <AttributionTracker />
        <FacebookPixel />
        <Suspense><ProgressBar /></Suspense>
        <Header categories={menu} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
