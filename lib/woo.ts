import "server-only";
import type { Category, Product } from "./types";
import { readFile } from "node:fs/promises";
import path from "node:path";

const WP_URL = (process.env.WP_URL || "https://wp.sunnahertorch.com").replace(/\/$/, "");
const STORE = `${WP_URL}/wp-json/wc/store/v1`;
const REST = `${WP_URL}/wp-json/wc/v3`;
const REVALIDATE = 300; // 5 minutes

// Cloudflare/security plugins often block requests without browser-like headers
const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
};

async function storeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${STORE}${path}`, { headers: HEADERS, next: { revalidate: REVALIDATE } });
    if (!res.ok) throw new Error(`${res.status} ${path} :: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error("[woo] store api failed:", err);
    return fallback;
  }
}

// ---------- Local JSON mode (while the live API is blocked) ----------
// Set CATALOG_SOURCE=file in .env.local and put products.json / categories.json in /data

const USE_FILE = process.env.CATALOG_SOURCE === "file";

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "data", name), "utf8")) as T;
  } catch (err) {
    console.error(`[woo] data/${name} পড়া যায়নি:`, err);
    return fallback;
  }
}

// ---------- Public catalog (no keys needed) ----------

type ListOpts = { category?: number; perPage?: number; page?: number; search?: string };

function extractFirstImage(html: string): { id: number; src: string; thumbnail: string; alt: string } | null {
  const m = html.match(/src="([^"]+\.(webp|jpg|jpeg|png))"/i);
  if (!m) return null;
  return { id: -1, src: m[1], thumbnail: m[1], alt: "" };
}

export async function getProducts(opts: ListOpts = {}) {
  const perPage = opts.perPage ?? 24;
  const page = opts.page ?? 1;

  if (USE_FILE) {
    let list = await readJson<Product[]>("products.json", []);
    if (opts.category) list = list.filter((p) => p.categories.some((c) => c.id === opts.category));
    if (opts.search) {
      const q = opts.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list.slice((page - 1) * perPage, page * perPage);
  }

  const q = new URLSearchParams({ per_page: String(perPage), page: String(page) });
  if (opts.category) q.set("category", String(opts.category));
  if (opts.search) q.set("search", opts.search);
  const list = await storeGet<Product[]>(`/products?${q}`, []);
  return list.map((p) => {
    if (p.images.length) return p;
    const img = extractFirstImage(p.description + p.short_description);
    return img ? { ...p, images: [img] } : p;
  });
}


export async function getProduct(slug: string) {
  if (USE_FILE) {
    const list = await readJson<Product[]>("products.json", []);
    return list.find((p) => p.slug === slug || encodeURIComponent(p.slug) === slug) ?? null;
  }
  // Try slug search first
  let list = await storeGet<Product[]>(`/products?slug=${encodeURIComponent(slug)}`, []);
  // If not found, fetch all and match (WooCommerce slug search sometimes fails with encoded slugs)
  if (!list.length) {
    const all = await storeGet<Product[]>(`/products?per_page=100`, []);
    list = all.filter((p) => p.slug === slug || decodeURIComponent(p.slug) === decodeURIComponent(slug));
  }
  const p = list[0] ?? null;
  if (p && !p.images.length) {
    const img = extractFirstImage(p.description + p.short_description);
    if (img) p.images = [img];
  }
  return p;
}

// আইডি দিয়ে একটা প্রোডাক্ট (সার্ভারের Facebook ইভেন্টে আসল নাম/দাম/ক্যাটাগরি বসানোর জন্য)
export async function getProductById(id: number): Promise<Product | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  if (USE_FILE) {
    const list = await readJson<Product[]>("products.json", []);
    return list.find((p) => p.id === id) ?? null;
  }
  return storeGet<Product | null>(`/products/${id}`, null);
}

export async function getRelatedProducts(productId: number, price?: number): Promise<Product[]> {
  const list = await storeGet<Product[]>(`/products?related=${productId}&per_page=20`, []);
  let filtered = list.filter((p) => p.id !== productId);
  
  // Filter by price range ±40% if price provided
  if (price && price > 0) {
    const min = price * 0.6;
    const max = price * 1.4;
    const inRange = filtered.filter((p) => {
      const pPrice = Number(p.prices?.price ?? 0) / 100;
      return pPrice >= min && pPrice <= max;
    });
    if (inRange.length >= 2) filtered = inRange;
  }

  return filtered.slice(0, 4).map((p) => {
    if (p.images.length) return p;
    const img = extractFirstImage(p.description + p.short_description);
    return img ? { ...p, images: [img] } : p;
  });
}

export function getCategories() {
  if (USE_FILE) return readJson<Category[]>("categories.json", []);
  return storeGet<Category[]>(`/products/categories?per_page=50`, []);
}

export async function getCategory(slug: string) {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

// ---------- Orders (REST v3, needs keys, server only) ----------

function authHeader() {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("WC_CONSUMER_KEY / WC_CONSUMER_SECRET সেট করা নেই");
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

export type Billing = {
  first_name: string;
  last_name: string;
  phone: string;
  address_1: string;
  address_2: string;
  city: string;
  postcode: string;
  country: string;
};

export type NewOrder = {
  billing: Billing;
  note?: string;
  items: { product_id: number; quantity: number }[];
  meta?: Record<string, string>;
};

export type WooOrder = {
  id: number;
  order_key: string;
  status: string;
  date_created: string;
  total: string;
  payment_method_title: string;
  billing: Billing;
  line_items: { id: number; product_id: number; name: string; quantity: number; total: string }[];
  shipping_lines: { method_title: string; total: string }[];
  meta_data?: { key: string; value: unknown }[];
};

export function orderMeta(order: WooOrder, key: string): string {
  const v = order.meta_data?.find((m) => m.key === key)?.value;
  return typeof v === "string" ? v : "";
}

export async function createOrder(o: NewOrder): Promise<WooOrder> {
  const res = await fetch(`${REST}/orders`, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json", Authorization: authHeader() },
    cache: "no-store",
    body: JSON.stringify({
      payment_method: "cod",
      payment_method_title: "ক্যাশ অন ডেলিভারি",
      status: "processing",
      billing: o.billing,
      shipping: { ...o.billing },
      customer_note: o.note || "",
      // Prices are taken from WooCommerce, never from the browser
      line_items: o.items,
      shipping_lines: [{ method_id: "free_shipping", method_title: "ফ্রি ডেলিভারি", total: "0" }],
      meta_data: Object.entries(o.meta || {}).map(([key, value]) => ({ key, value })),
    }),
  });
  if (!res.ok) throw new Error(`Order failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getOrder(id: number, key: string): Promise<WooOrder | null> {
  try {
    const res = await fetch(`${REST}/orders/${id}`, {
      headers: { ...HEADERS, Authorization: authHeader() },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const order = (await res.json()) as WooOrder;
    // order_key check stops people from viewing others' orders by changing the id
    return order.order_key === key ? order : null;
  } catch {
    return null;
  }
}
