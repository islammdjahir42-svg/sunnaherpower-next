import type { Prices } from "./types";

export function toAmount(value: string, minorUnit: number) {
  return Number(value || 0) / 10 ** minorUnit;
}

export function taka(amount: number) {
  return `৳ ${amount.toLocaleString("en-US")}`;
}

export function priceInfo(p: Prices) {
  const price = toAmount(p.price, p.currency_minor_unit);
  const regular = toAmount(p.regular_price, p.currency_minor_unit);
  const discount = regular > price ? Math.round(((regular - price) / regular) * 100) : 0;
  return { price, regular, discount };
}

// Store API returns HTML-encoded names like &#8220;
export function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
