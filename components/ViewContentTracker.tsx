"use client";
import { useEffect } from "react";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void; }
}

export default function ViewContentTracker({ id, name, price }: { id: number; name: string; price: number }) {
  useEffect(() => {
    try {
      window.fbq?.('track', 'ViewContent', {
        content_ids: [String(id)],
        content_name: name,
        content_type: 'product',
        contents: [{ id: String(id), quantity: 1, item_price: price }],
        value: price,
        currency: 'BDT',
      });
    } catch {}
  }, [id, name, price]);
  return null;
}
