import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import Pager from "@/components/Pager";
import { getCategory, getProducts } from "@/lib/woo";
import { decode } from "@/lib/format";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategory((await params).slug);
  return { title: cat ? decode(cat.name) : "ক্যাটাগরি" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const products = await getProducts({ category: cat.id, page, perPage: 24 });

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">{decode(cat.name)}</h1>
      <ProductGrid products={products} />
      <Pager base={`/product-category/${slug}`} page={page} hasNext={products.length === 24} />
    </section>
  );
}
