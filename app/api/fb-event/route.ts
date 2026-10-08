import { after } from "next/server";
import { getProductById } from "@/lib/woo";
import { decode, priceInfo } from "@/lib/format";

// ব্রাউজার থেকে আসা ইভেন্ট সার্ভার থেকে Facebook Conversions API-তে পাঠানো হয়।
// ব্রাউজারের পিক্সেল আর এই সার্ভার ইভেন্টে একই event_id থাকে, তাই Facebook একটাকে ডুপ্লিকেট ধরে বাদ দেয়।
// প্রোডাক্টের নাম, দাম, ক্যাটাগরি ব্রাউজার থেকে বিশ্বাস করা হয় না, WooCommerce থেকে নতুন করে নেওয়া হয়।

const ALLOWED_EVENTS = new Set(["ViewContent", "AddToCart"]);
const HASH_KEYS = new Set(["em", "ph", "fn", "ln", "ct", "st", "zp", "country"]);
const HEX64 = /^[0-9a-f]{64}$/;
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|headless|lighthouse|preview|python|curl|wget/i;

// Purchase-এর মতোই: শুধু Preview/লোকালে test হিসেবে যায়, লাইভ সাইটে কখনো না
const TEST_EVENT_CODE = process.env.VERCEL_ENV === "production" ? undefined : process.env.FB_TEST_EVENT_CODE || undefined;

type Body = {
  event_name?: unknown;
  event_id?: unknown;
  event_source_url?: unknown;
  product_id?: unknown;
  quantity?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  external_id?: unknown;
  am?: unknown;
};

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function sameSiteUrl(raw: string, req: Request): string {
  try {
    const u = new URL(raw);
    const host = new URL(req.url).host;
    if (u.host === host || u.host.endsWith("sunnaherpower.com")) return u.href;
  } catch {}
  return req.headers.get("referer") || "";
}

export async function POST(req: Request) {
  const PIXEL_ID = process.env.FB_PIXEL_ID || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "2116851162527598";
  const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || "";

  let body: Body;
  try { body = (await req.json()) as Body; } catch { return new Response(null, { status: 400 }); }

  const event_name = str(body.event_name, 40);
  const event_id = str(body.event_id, 100);
  if (!ALLOWED_EVENTS.has(event_name) || !/^[A-Za-z0-9_.-]{8,100}$/.test(event_id)) {
    return new Response(null, { status: 400 });
  }

  const user_agent = req.headers.get("user-agent") || "";
  // বট বা টোকেন না থাকলে চুপচাপ বাদ
  if (!ACCESS_TOKEN || !user_agent || BOT_UA.test(user_agent)) return new Response(null, { status: 204 });

  const client_ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";

  // ---------- কাস্টমারের তথ্য ----------
  const user_data: Record<string, unknown> = { client_user_agent: user_agent };
  if (client_ip) user_data.client_ip_address = client_ip;
  const fbp = str(body.fbp, 200);
  const fbc = str(body.fbc, 500);
  const external_id = str(body.external_id, 100);
  if (/^fb\.\d\.\d+\.\d+$/.test(fbp)) user_data.fbp = fbp;
  if (/^fb\.\d\.\d+\..+$/.test(fbc)) user_data.fbc = fbc;
  if (HEX64.test(external_id)) user_data.external_id = [external_id];
  // আগের অর্ডারের hash করা তথ্য (ফোন, নাম, জেলা, বিভাগ...), শুধু ৬৪ অক্ষরের hash নেওয়া হয়
  if (body.am && typeof body.am === "object") {
    for (const [k, v] of Object.entries(body.am as Record<string, unknown>)) {
      if (HASH_KEYS.has(k) && typeof v === "string" && HEX64.test(v)) user_data[k] = [v];
    }
  }

  // ---------- প্রোডাক্টের তথ্য (WooCommerce থেকে) ----------
  const productId = Math.trunc(Number(body.product_id));
  const product = await getProductById(productId);
  if (!product) return new Response(null, { status: 204 });
  const { price } = priceInfo(product.prices);
  const category = product.categories?.find((c) => c.slug !== "uncategorized" && c.slug !== "all-products");

  // ViewContent-এ সব সময় ১টা; AddToCart-এ ব্রাউজারের পরিমাণ, ১–৫০-এর মধ্যে
  const quantity = event_name === "AddToCart" ? Math.max(1, Math.min(50, Math.trunc(Number(body.quantity)) || 1)) : 1;

  const custom_data: Record<string, unknown> = {
    content_ids: [String(product.id)],
    content_name: decode(product.name),
    content_type: "product",
    contents: [{ id: String(product.id), quantity, item_price: price }],
    value: price * quantity,
    currency: "BDT",
  };
  if (event_name === "AddToCart") custom_data.num_items = quantity;
  if (category) custom_data.content_category = decode(category.name);

  const payload = {
    data: [{
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      event_source_url: sameSiteUrl(str(body.event_source_url, 2000), req),
      action_source: "website",
      user_data,
      custom_data,
    }],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  // উত্তর আগে ফেরত দিয়ে তারপর Facebook-এ পাঠানো, যাতে কাস্টমারের পেজ ধীর না হয়
  after(async () => {
    try {
      const res = await fetch(`https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      if (!res.ok) console.error(`[Facebook CAPI ${event_name}]`, res.status, await res.text());
    } catch (e) {
      console.error(`[Facebook CAPI ${event_name}]`, e);
    }
  });

  return new Response(null, { status: 202 });
}
