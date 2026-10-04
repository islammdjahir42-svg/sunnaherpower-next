import { getProducts } from "@/lib/woo";
import { decode, priceInfo } from "@/lib/format";

export const revalidate = 300;

// ৩ অক্ষর লিখলেই সাজেশন। শব্দ আগে-পরে লিখলেও মিলবে ("torch sunstar" = "sunstar torch")
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().replace(/\s+/g, " ");
  if (q.length < 3) return Response.json([]);

  const words = q.toLowerCase().split(" ");
  const matchAll = (name: string) => words.every((w) => name.toLowerCase().includes(w));

  let list = await getProducts({ search: q, perPage: 8 });

  // পুরো বাক্য দিয়ে না পেলে সবচেয়ে লম্বা শব্দ দিয়ে খুঁজে বাকি শব্দ মিলিয়ে দেখা
  if (!list.length && words.length > 1) {
    const longest = [...words].sort((a, b) => b.length - a.length)[0];
    const wide = await getProducts({ search: longest, perPage: 50 });
    list = wide.filter((p) => matchAll(decode(p.name)));
    if (!list.length) list = wide; // তাও না পেলে অন্তত কাছাকাছি গুলো
  }

  return Response.json(
    list.slice(0, 8).map((p) => {
      const { price, regular, discount } = priceInfo(p.prices);
      return { slug: p.slug, name: decode(p.name), image: p.images[0]?.thumbnail ?? "", price, regular, discount };
    })
  );
}
