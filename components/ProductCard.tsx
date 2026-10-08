import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { decode, priceInfo, taka } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";

export default function ProductCard({ p }: { p: Product }) {
  const { price, regular, discount } = priceInfo(p.prices);
  const img = p.images[0];
  const name = decode(p.name);
  const category = p.categories?.find((c) => c.slug !== "uncategorized" && c.slug !== "all-products");

  return (
    <article className="flex flex-col border-r border-b border-line p-2 sm:p-3">
      <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-white">
        {img && (
          <Image
            src={img.src}
            alt={img.alt || name}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-sale px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col items-center gap-2 pt-3 text-center">
        <Link href={`/product/${p.slug}`} className="line-clamp-2 text-sm leading-snug hover:text-accent sm:text-base">
          {name}
        </Link>
        <p className="mt-auto flex flex-wrap items-baseline justify-center gap-x-2 font-semibold">
          {discount > 0 && <del className="text-sm text-sale/70">{taka(regular)}</del>}
          <span className="text-sale sm:text-lg">{taka(price)}</span>
        </p>
        <AddToCartButton
          product={{ id: p.id, slug: p.slug, name, image: img?.thumbnail, price }}
          disabled={!p.is_in_stock || !p.is_purchasable}
          category={category ? decode(category.name) : undefined}
          compact
        />
      </div>
    </article>
  );
}
