import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/wp";
import { decode } from "@/lib/format";

export const dynamic = "force-dynamic";

// Only these WordPress pages are served; everything else is 404
const ALLOWED = ["contact-us", "privacy-policy", "return-replacement-policy"];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!ALLOWED.includes(slug)) return {};
  const page = await getPage(slug);
  return { title: page ? decode(page.title.rendered) : undefined };
}

export default async function WpPageRoute({ params }: Props) {
  const { slug } = await params;
  if (!ALLOWED.includes(slug)) notFound();
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{decode(page.title.rendered)}</h1>
      <div className="prose-woo wp-content" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
    </article>
  );
}
