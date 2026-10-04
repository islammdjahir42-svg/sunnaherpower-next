import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return <p className="border border-line p-8 text-center text-muted">এই মুহূর্তে কোনো প্রোডাক্ট পাওয়া যায়নি।</p>;
  }
  return (
    <div className="grid grid-cols-2 border-t border-l border-line lg:grid-cols-4">
      {products.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
