import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/woo";
import type { Product } from "@/lib/types";

// Google-এর জন্য সাইটম্যাপ: /sitemap.xml
// প্রোডাক্ট আর ক্যাটাগরি WooCommerce থেকে আসে, তাই নতুন প্রোডাক্ট দিলে নিজে থেকেই যুক্ত হবে।
export const revalidate = 3600; // ১ ঘণ্টা পরপর নতুন করে তৈরি হবে

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://sunnaherpower.com").replace(/\/$/, "");

// বাংলা বা বিশেষ অক্ষরের slug সঠিকভাবে encode করে পূর্ণ URL বানায়
function url(path: string) {
  return new URL(path, SITE + "/").href;
}

async function allProducts() {
  const all: Product[] = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await getProducts({ perPage: 100, page });
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([allProducts(), getCategories()]);
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/contact-us"), changeFrequency: "yearly", priority: 0.3 },
    { url: url("/privacy-policy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/return-replacement-policy"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const cats: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug && c.slug !== "uncategorized" && (c.count ?? 1) > 0)
    .map((c) => ({ url: url(`/product-category/${c.slug}`), changeFrequency: "weekly", priority: 0.7 }));

  const seen = new Set<string>();
  const prods: MetadataRoute.Sitemap = [];
  for (const p of products) {
    if (!p.slug || seen.has(p.slug)) continue;
    seen.add(p.slug);
    prods.push({ url: url(`/product/${p.slug}`), changeFrequency: "weekly", priority: 0.8 });
  }

  return [...pages, ...cats, ...prods];
}
