import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "sunnahertorch.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "wp.sunnahertorch.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.sunnahertorch.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "sunnahersopan.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "wp.sunnaherpower.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "sunnaherpower.com", pathname: "/wp-content/**" },
    ],
  },
};

export default nextConfig;
