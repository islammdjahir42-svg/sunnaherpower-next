import type { MetadataRoute } from "next";

// /robots.txt — Google-কে sitemap দেখায়, আর ব্যক্তিগত/চেকআউট পেজ সার্চে আসা বন্ধ রাখে
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://sunnaherpower.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cart", "/checkout", "/login", "/register", "/profile"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
