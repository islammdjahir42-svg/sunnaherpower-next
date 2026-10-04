import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "চেকআউট", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-[920px] px-4 py-8 sm:py-10">
      <CheckoutForm />
    </section>
  );
}
