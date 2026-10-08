import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import OrderRow from "@/components/OrderRow";
import ProductGrid from "@/components/ProductGrid";
import { getProduct, getRelatedProducts } from "@/lib/woo";
import { getImagesFromSource } from "@/lib/img";
import { cleanDescription } from "@/lib/clean";
import { decode, priceInfo, taka } from "@/lib/format";
import type { Product } from "@/lib/types";
import StickyBar from "@/components/StickyBar";
import DescriptionCleaner from "@/components/DescriptionCleaner";
import ViewContentTracker from "@/components/ViewContentTracker";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct(decodeURIComponent((await params).slug));
  if (!p) return { title: "প্রোডাক্ট পাওয়া যায়নি" };
  const img = p.images[0]?.src;
  return {
    title: decode(p.name),
    description: p.short_description.replace(/<[^>]+>/g, "").slice(0, 160),
    openGraph: img ? { images: [img] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct(decodeURIComponent((await params).slug));
  if (!p) notFound();

  const name = decode(p.name);
  const { price, regular, discount } = priceInfo(p.prices);
  const category = p.categories?.find((c) => c.slug !== "uncategorized" && c.slug !== "all-products");
  const images = p.images.length ? p.images : await getImagesFromSource(p.slug);
  const desc = cleanDescription(p.description);

  const relatedFromDesc = (await Promise.all(desc.related.slice(0, 4).map((s) => getProduct(s)))).filter(
    (r): r is Product => !!r && r.id !== p.id
  );
  const relatedFromWC = relatedFromDesc.length ? relatedFromDesc : await getRelatedProducts(p.id, Number(p.prices?.price ?? 0) / 100);
  const related = relatedFromWC.slice(0, 4);

  return (
    <div className="mx-auto max-w-[1224px] px-4 pb-2" style={{ paddingBottom: "160px" }}>
      <ViewContentTracker id={p.id} name={name} price={price} category={category ? decode(category.name) : undefined} />
      <p className="mx-auto max-w-3xl py-6 text-center text-[17px] leading-8 sm:py-8 sm:text-lg">
        ৮ দিনের <strong>মানিব্যাক গ্যারান্টি</strong> সাথে থাকছে এক বছরের <strong>রিপ্লেসমেন্ট</strong> ও তিন বছরের সার্ভিস ওয়ারেন্টি
      </p>

      <div className="flex justify-center mt-2 mb-6">
        <OrderRow
          product={{ id: p.id, slug: p.slug, name, image: images[0]?.thumbnail, price }}
          disabled={!p.is_in_stock || !p.is_purchasable}
          category={category ? decode(category.name) : undefined}
          animated={true}
        />
      </div>

      <div className="mx-auto max-w-[470px]">
        <ProductGallery images={images} name={name} discount={discount} />
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <h1 className="text-xl font-bold sm:text-2xl">{name}</h1>
        <p className="mt-3 flex items-baseline gap-2 text-2xl font-bold">
          {discount > 0 && <del className="text-[#e4531c]">{taka(regular)}</del>}
          <span className="text-[#1f9d24]">{taka(price)}</span>
        </p>
        <div className="mt-4">
          <OrderRow
            product={{ id: p.id, slug: p.slug, name, image: images[0]?.thumbnail, price }}
            disabled={!p.is_in_stock || !p.is_purchasable}
            category={category ? decode(category.name) : undefined}
            showQty={true}
            animated={true}
          />
        </div>
      </div>

      {(desc.before.trim() || related.length > 0 || desc.after.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, "").trim()) && (
      <section className="product-desc mt-4 text-[17px] leading-8 overflow-hidden">
        <DescriptionCleaner />
        {desc.before && <div className="wp-content" dangerouslySetInnerHTML={{ __html: desc.before.replace(/(<p>(\s|&nbsp;)*<\/p>\s*)+$/gi, "").trim() }} />}
        {related.length > 0 && (
          <div className="my-6 max-w-3xl">
            <ProductGrid products={related} />
          </div>
        )}
        {desc.after && desc.after.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, "").trim() && (
          <div className="wp-content [&>p:last-child]:mb-0 [&>p:empty]:hidden" dangerouslySetInnerHTML={{ __html: desc.after.replace(/(<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/gi, "").trim() }} />
        )}
      </section>
      )}
      <StickyBar
        product={{ id: p.id, slug: p.slug, name, image: images[0]?.thumbnail, price }}
        name={name}
        price={price}
        regular={regular}
        discount={discount}
        disabled={!p.is_in_stock || !p.is_purchasable}
      />
    </div>
  );
}
