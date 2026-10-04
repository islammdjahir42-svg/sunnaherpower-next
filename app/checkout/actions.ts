"use server";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { getOrder } from "@/lib/woo";
import { findDistrict, findThana, DISTRICTS } from "@/lib/bd-geo";
import { capitalize, checkPhone, formatPhone, splitName, toEnglish } from "@/lib/bn-format";

export type CheckoutState =
  | { ok: true; id: number; key: string }
  | { ok: false; error: string; fields?: Record<string, string> }
  | { ok: false; error: "gift_invalid"; gift_ids: number[] }
  | null;

function addressToEnglish(bn: string): string {
  let s = bn;
  const names = DISTRICTS.flatMap((d) => [d, ...d.thanas]).sort((a, b) => b.bn.length - a.bn.length);
  for (const n of names) s = s.split(n.bn).join(n.en);
  return toEnglish(s);
}

function sha256(str: string): string {
  return createHash('sha256').update(str.toLowerCase().trim()).digest('hex');
}

async function fireFacebookCAPIPurchase(orderId: number, total: number, items: {product_id: number, quantity: number}[], billing: Record<string, string>, siteUrl: string, pixelId: string, accessToken: string, fbc?: string, fbp?: string, user_agent?: string, pageUrl?: string, client_ip?: string) {
  try {
    const eventTime = Math.floor(Date.now() / 1000);
    const payload = {
      data: [{
        event_name: 'Purchase',
        event_time: eventTime,
        event_id: `purchase_${orderId}`,
        event_source_url: `${siteUrl}/checkout/order-received/${orderId}`,
        action_source: 'website',
        user_data: {
          ph: [sha256(billing.phone.replace(/[^0-9]/g, ''))],
          fn: [sha256(billing.first_name)],
          ln: [sha256(billing.last_name)],
          ct: [sha256(billing.city)],
          country: [sha256('bd')],
          ...(fbc ? { fbc } : {}),
          ...(fbp ? { fbp } : {}),
          ...(user_agent ? { client_user_agent: user_agent } : {}),
          ...(client_ip ? { client_ip_address: client_ip } : {}),
        },
        custom_data: {
          value: total,
          currency: 'BDT',
          content_ids: items.map(i => String(i.product_id)),
          content_type: 'product',
          order_id: String(orderId),
          contents: items.map(i => ({ id: String(i.product_id), quantity: i.quantity, item_price: (i as any).gift_price !== undefined ? (i as any).gift_price : undefined })),
        },
      }],
      test_event_code: process.env.FB_TEST_EVENT_CODE || undefined,
    };
    await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('[Facebook CAPI Purchase]', e);
  }
}

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const name = String(form.get("name") || "").trim().replace(/\s+/g, " ");
  const phoneRaw = String(form.get("phone") || "");
  const district = findDistrict(String(form.get("district") || "").trim());
  const thana = findThana(district, String(form.get("thana") || "").trim());
  const addressRaw = String(form.get("address") || "").trim();
  const address = addressRaw || [thana?.bn, district?.bn].filter(Boolean).join(", ");
  const note = String(form.get("note") || "").trim();
  const utm_source = String(form.get("utm_source") || "").trim();
  const utm_medium = String(form.get("utm_medium") || "").trim();
  const utm_campaign = String(form.get("utm_campaign") || "").trim();
  const referrer = String(form.get("referrer") || "").trim();
  const fbc = String(form.get("fbc") || "").trim();
  const headersList = await headers();
  const client_ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || '';
  const fbp = String(form.get("fbp") || "").trim();
  const user_agent = String(form.get("user_agent") || "").trim();
  const page_url = String(form.get("page_url") || "").trim();
  const referrerHost = referrer ? (() => { try { return new URL(referrer).hostname; } catch { return referrer; } })() : "(direct)";

  let items: { product_id: number; quantity: number; gift_price?: number }[] = [];
  try {
    const raw = JSON.parse(String(form.get("items") || "[]")) as { id: number; qty: number }[];
    items = raw
      .map((i) => ({ product_id: Math.trunc(Number(i.id)), quantity: Math.trunc(Number(i.qty)) }))
      .filter((i) => i.product_id > 0 && i.quantity > 0 && i.quantity <= 50);
  } catch { /* handled below */ }

  const fields: Record<string, string> = {};
  const phoneCheck = checkPhone(phoneRaw);
  if (name.length < 2) fields.name = "আপনার নাম লিখুন";
  if (!phoneCheck.ok) fields.phone = phoneCheck.message;
  if (address.length < 8) fields.address = "গ্রাম/এলাকা, থানা ও জেলাসহ পূর্ণ ঠিকানা লিখুন";
  if (Object.keys(fields).length) return { ok: false, error: "তথ্যগুলো ঠিক করে আবার চেষ্টা করুন", fields };
  if (!items.length) return { ok: false, error: "কার্ট খালি। আগে প্রোডাক্ট যোগ করুন।" };

  const phone = formatPhone(phoneRaw);
  const n = splitName(name);
  const billing = {
    first_name: capitalize(toEnglish(n.first)),
    last_name: capitalize(toEnglish(n.last)),
    phone,
    address_1: addressToEnglish(address),
    address_2: thana?.en || "",
    city: district?.en || "",
    postcode: district?.postcode || "",
    country: "BD",
  };

  if (process.env.ORDER_MODE !== "live") {
    console.log("[checkout demo]", { billing, items });
    return { ok: true, id: 0, key: "demo" };
  }

  const WP_URL = (process.env.WP_URL || "https://wp.sunnahertorch.com").replace(/\/$/, "");
  const ORDER_KEY = process.env.SUNNAHER_ORDER_KEY || "";

  // Gift validation
  let giftIds: number[] = [];
  let giftOffers: { gift: { id: number; price: number }; trigger_ids: number[] }[] = [];
  try {
    const giftRes = await fetch(`${WP_URL}/wp-json/sunnaher/v1/gift-offer`, { cache: "no-store" });
    const giftData = await giftRes.json();
    if (giftData.offers) {
      giftOffers = giftData.offers;
      giftIds = giftData.offers.map((o: { gift: { id: number } }) => o.gift.id);
    }
  } catch {}

  if (giftIds.length > 0 && items.every(i => giftIds.includes(i.product_id))) {
    return { ok: false, error: "শুধু ফ্রি গিফট দিয়ে অর্ডার করা যাবে না।" };
  }

  items = items.map(item => {
    const offer = giftOffers.find(o => o.gift.id === item.product_id);
    if (offer) {
      const triggerIds = offer.trigger_ids;
      const hasTrigger = triggerIds.length === 0 || items.some(i => !giftIds.includes(i.product_id) && triggerIds.includes(i.product_id));
      if (!hasTrigger) return { ...item, invalid_gift: true };
      return { ...item, quantity: 1, gift_price: offer.gift.price };
    }
    return item;
  }).filter(Boolean) as typeof items;

  // Invalid gift আছে কিনা check
  const hasInvalidGift = items.some(i => (i as any).invalid_gift);
  if (hasInvalidGift) {
    const invalidGiftIds = items.filter(i => (i as any).invalid_gift).map(i => i.product_id);
    return { ok: false, error: "gift_invalid", gift_ids: invalidGiftIds } as any;
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/sunnaher/v1/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sunnaher-Key": ORDER_KEY,
      },
      cache: "no-store",
      body: JSON.stringify({
        billing,
        items,
        note,
        phone,
        meta: {
          _customer_name_bn: name,
          _customer_address_bn: address,
          _customer_phone_local: phoneRaw.trim(),
          utm_source: utm_source,
          utm_medium: utm_medium,
          utm_campaign: utm_campaign,
          referrer: referrer,
          origin: utm_source ? `${utm_source} / ${utm_medium}` : (referrer ? referrer : "Direct"),
          _wc_order_attribution_source_type: utm_medium || (referrer ? "referral" : "direct"),
          _wc_order_attribution_utm_source: utm_source || (referrer ? referrerHost : "(direct)"),
          _wc_order_attribution_utm_medium: utm_medium || (referrer ? "referral" : "(none)"),
          _wc_order_attribution_utm_campaign: utm_campaign || "(not set)",
          _wc_order_attribution_referrer: referrer || "(direct)",
          _wc_order_attribution_device_type: "Desktop",
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error || "অর্ডার নেওয়া যায়নি।" };
    }

    // Server-side ServerTrack Purchase event
    const total = data.total ? Number(data.total) : 0;
    const PIXEL_ID = process.env.FB_PIXEL_ID || '1456582026311543';
    const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || '';
    const SITE_URL = (process.env.WP_URL || 'https://wp.sunnahertorch.com').replace('wp.', 'www.').replace('/wp-admin', '');
    if (ACCESS_TOKEN) {
      await fireFacebookCAPIPurchase(data.id, total, items, billing, SITE_URL, PIXEL_ID, ACCESS_TOKEN, fbc, fbp, user_agent, page_url, client_ip);
    }

    return { ok: true, id: data.id, key: data.order_key };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "অর্ডার নেওয়া যায়নি। একটু পরে আবার চেষ্টা করুন অথবা 01707638902 নম্বরে কল করুন।" };
  }
}
