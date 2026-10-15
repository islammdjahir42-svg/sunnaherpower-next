import "server-only";
import { SITE } from "@/lib/site";
import localPages from "@/content/policy-pages.json";
export type WpPage = { id: number; slug: string; title: { rendered: string }; content: { rendered: string } };

const WP_URL = (process.env.WP_URL || SITE.wpUrl).replace(/\/$/, "");
const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
};

// যোগাযোগ, প্রাইভেসি পলিসি আর রিটার্ন পলিসি কোড থেকে আসে (content/policy-pages.json),
// WordPress থেকে না। লেখা বদলাতে হলে ওই ফাইলটা বদলাতে হবে।
const LOCAL_PAGES = new Map<string, WpPage>(
  (localPages as WpPage[]).map((p) => [p.slug, p])
);

export async function getPage(slug: string): Promise<WpPage | null> {
  const local = LOCAL_PAGES.get(slug);
  if (local) return local;
  try {
const url = `${WP_URL}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&_fields=id,slug,title,content`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const list = (await res.json()) as WpPage[];
    return list[0] ?? null;
  } catch (err) {
    console.error("[wp] page load failed:", err);
    return null;
  }
}
