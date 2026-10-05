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
    __spPurchaseSent?: Record<string, true>;
  }
}

// একই অর্ডারের Purchase ব্রাউজার থেকে একবারই যাবে।
// তিন স্তরের পাহারা: পেজের মেমরি (একই পেজে দুবার চললে), sessionStorage (একই ট্যাবে রিলোড),
// localStorage (পরে আবার লিংক খুললে)। চিহ্ন বসানো হয় পাঠানোর আগেই।
function claimOnce(flag: string): boolean {
  const mem = (window.__spPurchaseSent ||= {});
  if (mem[flag]) return false;
  try { if (sessionStorage.getItem(flag) || localStorage.getItem(flag)) { mem[flag] = true; return false; } } catch {}
  mem[flag] = true;
  try { sessionStorage.setItem(flag, "1"); } catch {}
  try { localStorage.setItem(flag, "1"); } catch {}
  return true;
}

export default function PurchaseEvent({ orderId, value, items, user }: Props) {
  useEffect(() => {
    const flag = `purchase_sent_${orderId}`;
    if (!claimOnce(flag)) return;

    // Facebook Pixel Purchase
    // কাস্টমারের তথ্য (ফোন, নাম, জেলা) পিক্সেল init-এই চলে গেছে (অর্ডারের সময় সেভ করা hash থেকে)।
    // eventID সার্ভারের CAPI Purchase-এর সাথে হুবহু এক, তাই Facebook একটাকে ডুপ্লিকেট হিসেবে বাদ দেবে।
    try {
      window.fbq?.('track', 'Purchase', {
        value,
        currency: 'BDT',
        content_ids: items.map(i => i.item_id),
        content_name: items.map(i => i.item_name).join(', '),
        content_type: 'product',
        num_items: items.reduce((n, i) => n + i.quantity, 0),
        order_id: String(orderId),
        contents: items.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
      }, { eventID: `purchase_${orderId}` });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]); // শুধু অর্ডার নম্বর বদলালে আবার চলবে, অন্য prop-এর নতুন অবজেক্টে না
  return null;
}
