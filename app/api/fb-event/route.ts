import { after } from "next/server";
import { getProductById } from "@/lib/woo";
import { decode, priceInfo } from "@/lib/format";

// ব্রাউজার থেকে আসা ইভেন্ট সার্ভার থেকে Facebook Conversions API-তে পাঠানো হয়।
// ব্রাউজারের পিক্সেল আর এই সার্ভার ইভেন্টে একই event_id থাকে, তাই Facebook একটাকে ডুপ্লিকেট ধরে বাদ দেয়।
// প্রোডাক্টের নাম, দাম, ক্যাটাগরি ব্রাউজার থেকে বিশ্বাস করা হয় না, WooCommerce থেকে নতুন করে নেওয়া হয়।

const ALLOWED_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout"]);
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
  items?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  external_id?: unknown;
  am?: unknown;
};

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const clampQty = (v: unknown) => Math.max(1, Math.min(50, Math.trunc(Number(v)) || 1));

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
  // ViewContent: ১টা প্রোডাক্ট, পরিমাণ ১। AddToCart: ১টা প্রোডাক্ট, ব্রাউজারের পরিমাণ।
  // InitiateCheckout: পুরো কার্ট (সর্বোচ্চ ২০টা আলাদা প্রোডাক্ট)। পরিমাণ সব সময় ১–৫০-এর মধ্যে।
  const wanted: { id: number; qty: number }[] =
    event_name === "InitiateCheckout"
      ? (Array.isArray(body.items) ? body.items : []).slice(0, 20).map((i) => ({
          id: Math.trunc(Number((i as Record<string, unknown>)?.id)),
          qty: clampQty((i as Record<string, unknown>)?.qty),
        }))
      : [{ id: Math.trunc(Number(body.product_id)), qty: event_name === "AddToCart" ? clampQty(body.quantity) : 1 }];

  // একই প্রোডাক্ট দুবার এলে পরিমাণ যোগ করে এক লাইনে
  const merged = new Map<number, number>();
  for (const w of wanted) if (w.id > 0) merged.set(w.id, Math.min(50, (merged.get(w.id) || 0) + w.qty));

  const found = await Promise.all([...merged].map(async ([id, qty]) => ({ product: await getProductById(id), qty })));
  const lines = found
    .filter((f) => f.product)
    .map(({ product, qty }) => {
      const p = product!;
      const category = p.categories?.find((c) => c.slug !== "uncategorized" && c.slug !== "all-products");
      return { id: String(p.id), name: decode(p.name), price: priceInfo(p.prices).price, qty, category: category ? decode(category.name) : "" };
    });
  if (!lines.length) return new Response(null, { status: 204 });

  const custom_data: Record<string, unknown> = {
    content_ids: lines.map((l) => l.id),
    content_name: lines.map((l) => l.name).join(", "),
    content_type: "product",
    contents: lines.map((l) => ({ id: l.id, quantity: l.qty, item_price: l.price })),
    value: lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    currency: "BDT",
  };
  if (event_name !== "ViewContent") custom_data.num_items = lines.reduce((n, l) => n + l.qty, 0);
  const categories = [...new Set(lines.map((l) => l.category).filter(Boolean))];
  if (categories.length) custom_data.content_category = categories.join(", ");

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
