export const dynamic = "force-dynamic";
export async function GET() {
  const WP_URL = process.env.WP_URL || "NOT SET";
  const CATALOG = process.env.CATALOG_SOURCE || "NOT SET";
  const res = await fetch(`${WP_URL}/wp-json/wc/store/v1/products?per_page=1`).then(r => r.json()).catch(e => ({ error: e.message }));
  return Response.json({ WP_URL, CATALOG, first_product: res[0]?.name ?? res });
}
