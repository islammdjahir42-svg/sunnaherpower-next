"use client";
import { useEffect } from "react";
import { newEventId, sendServerEvent } from "@/lib/fb";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void; }
}

type Props = { id: number; name: string; price: number; category?: string };

// প্রোডাক্ট দেখা: ব্রাউজারের পিক্সেল আর সার্ভার (Conversions API) দুই জায়গা থেকে, একই event_id দিয়ে
export default function ViewContentTracker({ id, name, price, category }: Props) {
  useEffect(() => {
    const eventId = newEventId(`vc_${id}`);
    try {
      window.fbq?.('track', 'ViewContent', {
        content_ids: [String(id)],
        content_name: name,
        content_type: 'product',
        contents: [{ id: String(id), quantity: 1, item_price: price }],
        value: price,
        currency: 'BDT',
        ...(category ? { content_category: category } : {}),
      }, { eventID: eventId });
    } catch {}
    void sendServerEvent('ViewContent', eventId, { product_id: id });
  }, [id, name, price, category]);
  // WhatsApp-এর আগে থেকে লেখা মেসেজে এই প্রোডাক্টের নাম যাবে (ContactTracker)
  useEffect(() => {
    window.__spProduct = name;
    return () => { if (window.__spProduct === name) window.__spProduct = undefined; };
  }, [name]);
  return null;
}
