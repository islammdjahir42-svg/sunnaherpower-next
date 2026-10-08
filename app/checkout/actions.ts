"use server";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { getOrder } from "@/lib/woo";
import { findDistrict, findThana, DISTRICTS } from "@/lib/bd-geo";
import { capitalize, checkPhone, formatPhone, splitName, toEnglish } from "@/lib/bn-format";

export type CheckoutState =
  | { ok: true; id: number; key: string; am?: Record<string, string> }
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
  return createHash('sha256').update(str).digest('hex');
}

// Meta-র নিয়মে normalize করে hash করা কাস্টমারের তথ্য।
// সার্ভার (CAPI) আর ব্রাউজার (pixel init) দুই জায়গাতেই হুবহু এই মানগুলো যায়, যাতে মিলে যায়।
function hashedUserData(billing: Record<string, string>, email = ""): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, v: string) => { if (v) out[k] = sha256(v); };
  put("em", email.trim().toLowerCase());                                        // কাস্টমার ইমেইল দিলে
  put("ph", billing.phone.replace(/\D/g, ""));                                  // 8801XXXXXXXXX
  put("fn", billing.first_name.toLowerCase().trim());
  put("ln", billing.last_name.toLowerCase().trim());
  put("ct", billing.city.toLowerCase().replace(/[^a-z]/g, ""));                 // জেলা, যেমন coxsbazar
  put("zp", billing.postcode.toLowerCase().replace(/\s/g, ""));
  put("country", "bd");
  return out;
}

// সার্ভারের Purchase কখন test হিসেবে যাবে: শুধু Preview/লোকালে। লাইভ সাইটে কখনো না,
// কারণ test_event_code থাকলে ইভেন্ট আসল রিপোর্ট আর এড অপটিমাইজেশনে যায় না।
const TEST_EVENT_CODE = process.env.VERCEL_ENV === "production" ? undefined : process.env.FB_TEST_EVENT_CODE || undefined;

// অর্ডারের প্রতিটা প্রোডাক্ট: আইডি, পরিমাণ, একটার দাম আর নাম (Facebook-এর contents-এর জন্য)
type PurchaseLine = { id: string; quantity: number; item_price?: number; name?: string };

// WooCommerce-এ তৈরি হওয়া অর্ডার থেকে আসল দাম আর নাম নেওয়া হয় (ব্রাউজারের দাম বিশ্বাস করা হয় না)।
// অর্ডার পড়া না গেলে কার্টের আইডি/পরিমাণ দিয়ে চালিয়ে নেওয়া হয়, ফ্রি গিফটের দাম সহ।
async function purchaseLines(
  orderId: number, orderKey: string,
  items: { product_id: number; quantity: number; gift_price?: number }[],
): Promise<{ lines: PurchaseLine[]; total?: number }> {
  const order = orderKey ? await getOrder(orderId, orderKey) : null;
  if (order?.line_items?.length) {
    return {
      lines: order.line_items.map((l) => ({
        id: String(l.product_id),
        quantity: l.quantity,
        item_price: l.quantity > 0 ? Math.round((Number(l.total) / l.quantity) * 100) / 100 : undefined,
        name: l.name,
      })),
      total: Number(order.total) || undefined,
    };
  }
  return {
    lines: items.map((i) => ({
      id: String(i.product_id),
      quantity: i.quantity,
      ...(i.gift_price !== undefined ? { item_price: i.gift_price } : {}),
    })),
  };
}

async function fireFacebookCAPIPurchase(
  orderId: number, total: number, lines: PurchaseLine[],
  am: Record<string, string>, siteUrl: string, pixelId: string, accessToken: string,
  extra: { fbc?: string; fbp?: string; user_agent?: string; client_ip?: string; external_id?: string },
) {
  try {
    const user_data: Record<string, unknown> = Object.fromEntries(Object.entries(am).map(([k, v]) => [k, [v]]));
    if (extra.external_id) user_data.external_id = [extra.external_id];
    if (extra.fbc) user_data.fbc = extra.fbc;
    if (extra.fbp) user_data.fbp = extra.fbp;
    if (extra.user_agent) user_data.client_user_agent = extra.user_agent;
    if (extra.client_ip) user_data.client_ip_address = extra.client_ip;

    const payload = {
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `purchase_${orderId}`, // ব্রাউজারের Purchase-এও হুবহু এই eventID যায় → ডুপ্লিকেট বাদ
        event_source_url: `${siteUrl}/checkout/order-received/${orderId}`,
        action_source: "website",
        user_data,
        custom_data: {
          value: total,
          currency: "BDT",
          content_ids: lines.map((l) => l.id),
          ...(lines.some((l) => l.name) ? { content_name: lines.map((l) => l.name).filter(Boolean).join(", ") } : {}),
          content_type: "product",
          order_id: String(orderId),
          num_items: lines.reduce((n, l) => n + l.quantity, 0),
          contents: lines.map((l) => ({ id: l.id, quantity: l.quantity, ...(l.item_price !== undefined ? { item_price: l.item_price } : {}) })),
        },
      }],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    };
    const res = await fetch(`https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) console.error("[Facebook CAPI Purchase]", res.status, await res.text());
  } catch (e) {
    console.error("[Facebook CAPI Purchase]", e);
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
  const external_id = String(form.get("external_id") || "").trim().slice(0, 100);
  const customer_email = String(form.get("customer_email") || "").trim();
  const email_discount = parseFloat(String(form.get("email_discount") || "0"));
  const ss_token = String(form.get("ss_token") || "").trim();
  const first_order_discount = parseFloat(String(form.get("first_order_discount") || "0"));
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

  // ইমেইল শুধু সঠিক ফরম্যাটে থাকলেই Facebook-এ যাবে
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email) ? customer_email : "";
  const am = hashedUserData(billing, validEmail);

  if (process.env.ORDER_MODE !== "live") {
    console.log("[checkout demo]", { billing, items });
    return { ok: true, id: 0, key: "demo", am };
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
        customer_email: customer_email || undefined,
        email_discount: (email_discount > 0 && customer_email) ? email_discount : 0,
        ss_token: ss_token || undefined,
        first_order_discount: first_order_discount > 0 ? first_order_discount : 0,
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

    // সার্ভার থেকে Facebook Purchase (Conversions API)
    const total = data.total ? Number(data.total) : 0;
    // ব্রাউজারের পিক্সেল যে আইডি ব্যবহার করে, সার্ভারেও সেটাই (আগে ভুল করে অন্য সাইটের পিক্সেল ডিফল্ট ছিল)
    const PIXEL_ID = process.env.FB_PIXEL_ID || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "2116851162527598";
    const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || "";
    // কাস্টমার যে ডোমেইন থেকে অর্ডার দিয়েছে সেটাই; না পেলে WP_URL থেকে আন্দাজ
    let SITE_URL = WP_URL.replace("://wp.", "://www.");
    try { if (page_url) SITE_URL = new URL(page_url).origin; } catch {}
    if (ACCESS_TOKEN) {
      const p = await purchaseLines(data.id, String(data.order_key || ""), items);
      await fireFacebookCAPIPurchase(data.id, total || p.total || 0, p.lines, am, SITE_URL, PIXEL_ID, ACCESS_TOKEN, { fbc, fbp, user_agent, client_ip, external_id });
    }

    return { ok: true, id: data.id, key: data.order_key, am };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "অর্ডার নেওয়া যায়নি। একটু পরে আবার চেষ্টা করুন অথবা 01707638902 নম্বরে কল করুন।" };
  }
}
