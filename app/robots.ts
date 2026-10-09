import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// /robots.txt — Google-কে sitemap দেখায়, আর ব্যক্তিগত/চেকআউট পেজ সার্চে আসা বন্ধ রাখে
const SITE_URL = SITE.url;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cart", "/checkout", "/login", "/register", "/profile"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
