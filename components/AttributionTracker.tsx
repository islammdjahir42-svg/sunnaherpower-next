"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";

// প্রতিটা পেজে কাস্টমার কোথা থেকে এসেছে সেটা ধরে রাখে (WooCommerce Origin-এর জন্য)
export default function AttributionTracker() {
  const pathname = usePathname();
  useEffect(() => { captureAttribution(); }, [pathname]);
  return null;
}
