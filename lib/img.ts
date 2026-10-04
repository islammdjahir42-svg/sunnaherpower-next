/**
 * When sunnahertorch.com has no product images (import skipped them),
 * we look up the same product on sunnahersopan.com by slug and pull its images.
 * Results are cached in-process so we only call the source site once per slug.
 */
import "server-only";

const SOURCE = "https://sunnahersopan.com";
const cache = new Map<string, { id: number; src: string; thumbnail: string; alt: string }[]>();

export async function getImagesFromSource(slug: string) {
  if (cache.has(slug)) return cache.get(slug)!;
  try {
    const res = await fetch(
      `${SOURCE}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}&_fields=images`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129 Safari/537.36",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error(res.status.toString());
    const list = await res.json() as { images?: { id: number; src: string; thumbnail: string; alt: string }[] }[];
    const raw = list[0]?.images ?? [];
    const imgs = raw.map((img: {src:string;thumbnail:string;alt:string}, i:number) => ({ id: i, ...img }));
    cache.set(slug, imgs);
    return imgs;
  } catch {
    cache.set(slug, []);
    return [];
  }
}
