import type { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";
import Pager from "@/components/Pager";
import { getProducts } from "@/lib/woo";

export const metadata: Metadata = { title: "সব প্রোডাক্ট" };

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function Shop({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const products = await getProducts({ search: q, page: current, perPage: 24 });

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">{q ? `"${q}" এর ফলাফল` : "সব প্রোডাক্ট"}</h1>
      <ProductGrid products={products} />
      <Pager base="/shop" page={current} hasNext={products.length === 24} extra={q ? { q } : undefined} />
    </section>
  );
}
