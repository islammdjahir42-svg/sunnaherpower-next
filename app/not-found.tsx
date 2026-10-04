import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">পেজটি পাওয়া যায়নি</h1>
      <p className="mt-2 text-muted">লিংকটি হয়তো পরিবর্তন হয়েছে।</p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white">সব প্রোডাক্ট দেখুন</Link>
    </section>
  );
}
