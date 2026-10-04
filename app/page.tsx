import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/woo";
import { CartIcon } from "@/components/Icons";

export const revalidate = 300;

const TRUST_BADGES = [
  { icon: "🚚", title: "দ্রুত ডেলিভারি", sub: "সারাদেশে দ্রুত পৌঁছে যাবে" },
  { icon: "💵", title: "ক্যাশ অন ডেলিভারি", sub: "পণ্য পেলে টাকা দিন" },
  { icon: "✅", title: "১০০% অরিজিনাল", sub: "সম্পূর্ণ অরিজিনাল পণ্য" },
  { icon: "🔁", title: "রিটার্ন পলিসি", sub: "সমস্যায় ফেরত বা পরিবর্তন" },
  { icon: "📞", title: "সাপোর্ট", sub: "সবসময় আপনার পাশে আছি" },
];

export default async function Home() {
  const products = await getProducts({ perPage: 12 });

  return (
    <>
      <section className="mx-auto max-w-[1224px] px-4 pt-10">
        <div
          className="relative overflow-hidden rounded-xl bg-[#0d1024] bg-cover bg-center"
          style={{ backgroundImage: "url(/hero.jpg)" }}
        >
          <style>{`
            @keyframes torchFlash {
              0%   { opacity: 0.55; }
              45%  { opacity: 0.55; }
              50%  { opacity: 0.05; }
              55%  { opacity: 0.55; }
              70%  { opacity: 0.55; }
              75%  { opacity: 0.08; }
              80%  { opacity: 0.55; }
              100% { opacity: 0.55; }
            }
            @keyframes glowPulse {
              0%   { opacity: 0; }
              45%  { opacity: 0; }
              50%  { opacity: 0.5; }
              55%  { opacity: 0; }
              70%  { opacity: 0; }
              75%  { opacity: 0.6; }
              80%  { opacity: 0; }
              100% { opacity: 0; }
            }
            .hero-dark { animation: torchFlash 4s ease-in-out infinite; }
            .hero-glow { animation: glowPulse 4s ease-in-out infinite; }
          `}</style>
          <div className="hero-dark absolute inset-0 bg-black/55" aria-hidden />
          <div className="hero-glow absolute inset-0" style={{background: "radial-gradient(ellipse at center, rgba(255,230,120,0.85) 0%, rgba(255,180,0,0.5) 35%, rgba(255,120,0,0.2) 60%, transparent 80%)"}} aria-hidden />
          <div className="relative flex min-h-[320px] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[520px]">
            <h1 className="text-3xl font-bold leading-tight text-sale sm:text-5xl">সুপার ব্রাইট রিচার্জেবল টর্চ লাইট</h1>
            <p className="mt-4 max-w-2xl text-lg font-semibold text-white sm:text-2xl">
              হাই পাওয়ার আলো • দীর্ঘস্থায়ী ব্যাটারি • আউটডোর ও জরুরি প্রয়োজনে পারফেক্ট
            </p>
            <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dark">
              এখনই কিনুন <CartIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1224px] px-4 pb-6">
        <ProductGrid products={products} />
      </section>

      {/* Trust badges */}
      <section className="mx-auto max-w-[1224px] px-4 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TRUST_BADGES.map((b) => (
            <div key={b.title}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white px-3 py-4 text-center shadow-sm">
              <span className="text-3xl">{b.icon}</span>
              <p className="text-sm font-bold text-ink">{b.title}</p>
              <p className="text-xs text-muted leading-5">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
