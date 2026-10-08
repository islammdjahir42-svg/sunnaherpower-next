import type { Metadata } from "next";
import Link from "next/link";
import { getOrder, orderMeta } from "@/lib/woo";
import PurchaseEvent from "@/components/PurchaseEvent";
import { taka } from "@/lib/format";

export const metadata: Metadata = { title: "অর্ডার সম্পন্ন", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ key?: string }> };

export default async function OrderReceived({ params, searchParams }: Props) {
  const id = Number((await params).id);
  const key = (await searchParams).key || "";

  if (id === 0 && key === "demo") {
    return (
      <Box title="ডেমো অর্ডার সম্পন্ন">
        <p className="text-muted">এটা ডেমো মোড। লাইভ স্টোরে কোনো অর্ডার তৈরি হয়নি।</p>
      </Box>
    );
  }

  const order = await getOrder(id, key);
  if (!order) {
    return (
      <Box title="অর্ডার পাওয়া যায়নি">
        <p className="text-muted">লিংকটি সঠিক কিনা দেখুন, অথবা 01707638902 নম্বরে কল করুন।</p>
      </Box>
    );
  }

  // কাস্টমার বাংলায় যা লিখেছিল সেটাই দেখবে; WooCommerce-এর ইংরেজি ভার্সন শুধু ট্র্যাকিংয়ে যায়
  const nameBn = orderMeta(order, "_customer_name_bn") || [order.billing.first_name, order.billing.last_name].join(" ");
  const addressBn = orderMeta(order, "_customer_address_bn") || order.billing.address_1;
  const phoneLocal = orderMeta(order, "_customer_phone_local") || order.billing.phone;

  const date = new Date(order.date_created).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <Box title="ধন্যবাদ! আপনার অর্ডার গ্রহণ করা হয়েছে">
      <PurchaseEvent
        orderId={order.id}
        value={Number(order.total)}
        items={order.line_items.map((l) => ({ item_id: String(l.product_id), item_name: l.name, price: Number(l.total) / l.quantity, quantity: l.quantity }))}
      />
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#f6f6f6] p-4 text-sm sm:grid-cols-4">
        <Info k="অর্ডার নম্বর" v={`#${order.id}`} />
        <Info k="তারিখ" v={date} />
        <Info k="মোট" v={taka(Number(order.total))} />
        <Info k="পেমেন্ট" v={order.payment_method_title} />
      </dl>

      <table className="mt-6 w-full text-sm">
        <tbody className="divide-y divide-black/5">
          {order.line_items.map((l) => (
            <tr key={l.id}>
              <td className="py-2">{l.name} × {l.quantity}</td>
              <td className="py-2 text-right font-semibold">{taka(Number(l.total))}</td>
            </tr>
          ))}
          <tr><td className="py-2">ডেলিভারি</td><td className="py-2 text-right">{order.shipping_lines[0]?.method_title || "—"}</td></tr>
          <tr className="text-base font-bold"><td className="py-2">মোট</td><td className="py-2 text-right text-sale">{taka(Number(order.total))}</td></tr>
        </tbody>
      </table>

      <div className="mt-6 text-sm">
        <p className="font-semibold">ডেলিভারি ঠিকানা</p>
        <p className="mt-1 text-muted">{nameBn}<br />{addressBn}<br />{phoneLocal}</p>
      </div>
      <p className="mt-6 text-sm text-muted">আমাদের প্রতিনিধি শীঘ্রই কল করে অর্ডার কনফার্ম করবেন।</p>
    </Box>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl bg-white p-6 ring-1 ring-black/5">
        <h1 className="mb-4 text-xl font-bold text-accent">✓ {title}</h1>
        {children}
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-accent px-6 py-2 font-semibold text-white">আরও কেনাকাটা করুন</Link>
      </div>
    </section>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
