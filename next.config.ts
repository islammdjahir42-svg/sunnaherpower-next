import type { NextConfig } from "next";

// সাইটের মূল সেটিং ব্রাউজারের কোডেও পৌঁছানো (lib/site.ts দেখুন)।
// Vercel-এ শুধু WP_URL আর FB_PIXEL_ID দিলেই হয়; দুটোই গোপন কিছু না (পেজেই দেখা যায়)।
const SITE_WP_URL = process.env.NEXT_PUBLIC_WP_URL || process.env.WP_URL || "";
const SITE_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || process.env.FB_PIXEL_ID || "";

const nextConfig: NextConfig = {
  env: { SITE_WP_URL, SITE_PIXEL_ID },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "sunnahertorch.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "wp.sunnahertorch.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.sunnahertorch.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "sunnahersopan.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "wp.sunnahersopan.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.sunnahersopan.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "wp.sunnaherpower.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "sunnaherpower.com", pathname: "/wp-content/**" },
    ],
  },
};

export default nextConfig;
