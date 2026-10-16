"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PIXEL_ID, matchingData, newEventId, rememberFbclid, sendServerEvent } from "@/lib/fb";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

function loadPixel() {
  if (typeof window === "undefined" || window.fbq != null) return;
  const n: any = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  };
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  window.fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  // Advanced Matching init-এর সময়েই দিতে হয় (track-এর ৪র্থ আর্গুমেন্টে দিলে Facebook উপেক্ষা করে)
  window.fbq?.("init", PIXEL_ID, matchingData());
}

export default function FacebookPixel() {
  const pathname = usePathname();

  useEffect(() => {
    rememberFbclid(); // এড লিংকের fbclid রেখে দেওয়া (পিক্সেল ব্লক থাকলেও অর্ডারে যাবে)
    if (!PIXEL_ID) return; // এই সাইটে পিক্সেল সেট করা নেই (Vercel-এ FB_PIXEL_ID দিন)
    loadPixel();
    // ব্রাউজার pixel আর সার্ভার (Conversions API) দুই জায়গায় একই event_id।
    // ad-blocker বা ITP-এ pixel ব্লক হলেও সার্ভার থেকে ইভেন্ট Meta-তে পৌঁছাবে।
    const eventId = newEventId("pv");
    try { window.fbq?.("track", "PageView", {}, { eventID: eventId }); } catch {}
    // _fbp কুকির জন্য সর্বোচ্চ ১.৫ সেকেন্ড অপেক্ষা (প্রথম ভিজিটে পিক্সেল কুকি বানাতে একটু সময় নেয়)।
    // ad-blocker থাকলে কুকি আসবে না — তখন অপেক্ষার পর fbp ছাড়াই যায়; ভিজিটর এর মধ্যে
    // পেজ ছাড়লে সাথে সাথে পাঠানো হয়, তাই ইভেন্ট হারায় না।
    void sendServerEvent("PageView", eventId, {}, { fbpWaitMs: 1500 });
  }, [pathname]);

  if (!PIXEL_ID) return null;
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
