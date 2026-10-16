"use client";
import { useEffect } from "react";
import { newEventId, refCode, sendServerEvent } from "@/lib/fb";
import { useCart } from "@/lib/cart";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __spProduct?: string; // এখন যে প্রোডাক্ট পেজ খোলা আছে তার নাম (ViewContentTracker বসায়)
  }
}

// সাইটের যেকোনো কল (tel:) আর WhatsApp (wa.me) লিংকে ক্লিক ধরে:
// ১) WhatsApp হলে চ্যাটে আগে থেকে মেসেজ বসায়: প্রোডাক্ট/কার্টের নাম + কোড (যেমন T-8F3K2Q)
// ২) Facebook-এ Contact ইভেন্ট পাঠায় — ব্রাউজার পিক্সেল আর সার্ভার (CAPI) দুই জায়গায় একই event_id
// কোডের প্রথম অক্ষর সাইট (P = Power, S = Sopan, T = Torch), বাকিটা ভিজিটরের স্থায়ী আইডি থেকে।

function whatsappMessage(code: string): string {
  const product = (window.__spProduct || "").trim();
  if (product) return `আমি "${product.slice(0, 200)}" অর্ডার করতে চাই।\nকোড: ${code}`;
  let items: { name: string; qty: number }[] = [];
  try { items = useCart.getState().items || []; } catch {}
  if (items.length) {
    const list = items.map((i) => (i.qty > 1 ? `${i.name} ×${i.qty}` : i.name)).join(", ").slice(0, 300);
    return `আমি ${list} অর্ডার করতে চাই।\nকোড: ${code}`;
  }
  return `আমি অর্ডার করতে চাই।\nকোড: ${code}`;
}

function waNumber(href: string): string | null {
  try {
    const u = new URL(href);
    if (u.hostname === "wa.me") return u.pathname.replace(/\D/g, "") || null;
    if (/(^|\.)whatsapp\.com$/.test(u.hostname)) return (u.searchParams.get("phone") || "").replace(/\D/g, "") || null;
  } catch {}
  return null;
}

export default function ContactTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const isCall = /^tel:/i.test(href);
      const number = isCall ? null : waNumber(a.href);
      if (!isCall && !number) return;

      const method = isCall ? "call" : "whatsapp";
      let code = "";
      try { code = refCode(); } catch {}

      // WhatsApp: ক্লিকের মুহূর্তে লিংক বদলে মেসেজসহ খোলা
      if (number) {
        a.href = `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage(code))}`;
      }

      const eventId = newEventId("ct");
      const product = window.__spProduct;
      try {
        window.fbq?.("track", "Contact", {
          contact_method: method,
          ...(code ? { ref_code: code } : {}),
          ...(product ? { content_name: product } : {}),
        }, { eventID: eventId });
      } catch {}
      // পেজ ছেড়ে WhatsApp/ফোনে চলে যায়, তাই অপেক্ষা ছাড়া সাথে সাথে পাঠানো (keepalive)
      void sendServerEvent("Contact", eventId, { contact_method: method, ref_code: code }, { waitForFbp: false });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
