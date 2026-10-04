"use client";
import { useEffect } from "react";

type Props = {
  orderId: number;
  value: number;
  items: { item_id: string; item_name: string; price: number; quantity: number }[];
  user: { first_name: string; last_name: string; phone: string; address_1: string; city: string; postcode: string; country: string };
};

declare global {
  interface Window { 
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export default function PurchaseEvent({ orderId, value, items, user }: Props) {
  useEffect(() => {
    const flag = `purchase_sent_${orderId}`;
    try { if (localStorage.getItem(flag)) return; } catch {}

    // Facebook Pixel Purchase
    try {
      window.fbq?.('track', 'Purchase', {
        value,
        currency: 'BDT',
        content_ids: items.map(i => i.item_id),
        content_name: items.map(i => i.item_name).join(', '),
        content_type: 'product',
        transaction_id: String(orderId),
        contents: items.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
      }, {
        em: undefined,
        fn: user.first_name,
        ln: user.last_name,
        ph: user.phone,
        ct: user.city,
        zp: user.postcode,
        country: 'bd',
      });
    } catch {}

    // GTM dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "purchase",
      event_id: `purchase_${orderId}`,
      ecommerce: { transaction_id: String(orderId), value, currency: "BDT", items },
      user_data: {
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone,
        address: { street: user.address_1, city: user.city, postal_code: user.postcode, country: user.country },
      },
    });

    try { localStorage.setItem(flag, "1"); } catch {}
  }, [orderId, value, items, user]);
  return null;
}
