export const dynamic = "force-dynamic";
export async function GET() {
  const WP_URL = (process.env.WP_URL || "https://wp.sunnahertorch.com").replace(/\/$/, "");
  const url = `${WP_URL}/wp-json/wp/v2/pages?slug=contact-us&_fields=id,slug,title,content`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 Chrome/129" },
    });
    const data = await res.json();
    return Response.json({ url, status: res.status, found: data.length, content_length: data[0]?.content?.rendered?.length ?? 0 });
  } catch (e: unknown) {
    return Response.json({ url, error: String(e) });
  }
}
