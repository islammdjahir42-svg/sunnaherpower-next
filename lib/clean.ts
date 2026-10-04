import "server-only";
import { parse } from "node-html-parser";

// Looks like leftover JavaScript (script tags are stripped by the API, the code stays as text)
const JS_LINE = /^(\(function|function\s|var\s|let\s|const\s|if\s*\(|else\b|for\s*\(|return\b|document\.|window\.|[a-z_$][\w$]*\.(addEventListener|setAttribute|removeAttribute|classList|forEach|querySelector)|\}\)?\)?;?\s*$|\}\);?|\}\)\(\);?)/i;

const UPSELL = "#upsell-links, .upsell-links, .woocommerce, ul.products, .wd-products";
const MARK = "__related__";

export type CleanedDescription = { before: string; after: string; related: string[] };

function slugFromHref(href: string) {
  try {
    const m = new URL(href, "https://x.local").pathname.match(/\/product\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Cleans product description HTML coming from WordPress:
 * - pulls out the "related products" block (returns their slugs, keeps its position)
 * - removes scripts/styles and paragraphs that are leftover JavaScript
 */
export function cleanDescription(html: string): CleanedDescription {
  if (!html) return { before: "", after: "", related: [] };
  const root = parse(html, { comment: false });

  root.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

  // Extract related product slugs from sunnahersopan.com links, then replace with local links
  const _extraRelated: string[] = [];
  root.querySelectorAll("a[href]").forEach((el) => {
    const href = el.getAttribute("href") || "";
    if (href.includes("sunnahersopan.com/product/") || href.includes("/product/")) {
      const slug = href.match(/\/product\/([^/?#]+)/)?.[1];
      if (slug && !_extraRelated.includes(slug)) _extraRelated.push(slug);
      if (slug) el.setAttribute("href", `/product/${slug}`);
    }
  });

  // Extract product IDs from WooCommerce shortcodes like [products ids="123,456"]
  root.querySelectorAll("p, div").forEach((el) => {
    const text = el.text;
    const m = text.match(/\[products[^\]]*ids=["']([\d,\s]+)["']/);
    if (m) {
      const ids = m[1].split(",").map((id) => id.trim()).filter(Boolean);
      el.replaceWith(`<div class="wc-shortcode-products" data-ids="${ids.join(",")}"></div>`);
    } else if (/\[\w[^\]]*\]/.test(text)) {
      el.remove();
    }
  });

  // Related products block → slugs + a marker where it was
  const related: string[] = [];
  const blocks = root.querySelectorAll(UPSELL).filter((el) => !el.closest(UPSELL) || el.closest(UPSELL) === el);
  blocks.forEach((block, i) => {
    // Remove preceding h2/h3 "related products" heading
    const prev = block.previousElementSibling;
    if (prev && (prev.tagName === "H2" || prev.tagName === "H3")) {
      prev.remove();
    }
    block.querySelectorAll('a[href*="/product/"]').forEach((a) => {
      const slug = slugFromHref(a.getAttribute("href") || "");
      if (slug && !related.includes(slug)) related.push(slug);
    });
    if (i === 0) block.replaceWith(`<div id="${MARK}"></div>`);
    else block.remove();
  });

  root
    .querySelectorAll(
      "li.product, .wd-product, .product-grid-item, .price, .woocommerce-Price-amount, .add_to_cart_button, a[href*=\"add-to-cart\"]"
    )
    .forEach((el) => el.remove());

  // Leftover JavaScript printed as text
  let inCode = false;
  for (const el of root.querySelectorAll("p, pre, code, div")) {
    if (!el.parentNode || el.id === MARK) continue;
    const text = el.text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim();
    if (!text) continue;
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const allCode = lines.length > 0 && lines.every((l) => JS_LINE.test(l));

    if (text.startsWith("(function")) inCode = true;
    if (inCode || (allCode && el.tagName !== "DIV")) {
      const ends = /\}\)\(\);?\s*$/.test(text);
      el.remove();
      if (ends) inCode = false;
    }
  }

  // Drop now-empty wrappers (keep the marker)
  root.querySelectorAll("div, p").forEach((el) => {
    if (el.id === MARK || el.querySelector(`#${MARK}`)) return;
    if (!el.text.trim() && !el.querySelector("img, iframe, video")) el.remove();
  });

  // Remove trailing empty nodes (p, div, br) from root
  let lastChild = root.lastChild;
  while (lastChild) {
    const text = lastChild.text?.trim() ?? "";
    const tag = (lastChild as { tagName?: string }).tagName?.toLowerCase();
    const isEmptyBlock = (tag === "p" || tag === "div") && !text && !(lastChild as { querySelector?: (s: string) => unknown }).querySelector?.("img, iframe, video");
    const isBr = tag === "br";
    if (isEmptyBlock || isBr) {
      lastChild.remove();
      lastChild = root.lastChild;
    } else {
      break;
    }
  }

  const out = root.toString()
    .replace(/(\s*(<p[^>]*>(\s|&nbsp;|<br\s*\/?>\s*)*<\/p>|<div[^>]*>\s*(<br\s*\/?>\s*)*<\/div>|<br\s*\/?>\s*)\s*)+$/gi, "")
    .trim();
  const [before, after = ""] = out.split(`<div id="${MARK}"></div>`);
  // merge extra related slugs from sunnahersopan links
  _extraRelated.forEach(slug => { if (!related.includes(slug)) related.push(slug); });
  return { before, after, related };
}
