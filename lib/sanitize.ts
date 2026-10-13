import "server-only";
import { parse, HTMLElement, Node, NodeType } from "node-html-parser";

// WordPress থেকে আসা ছোট লেখা (যেমন Short description) নিরাপদভাবে দেখানোর জন্য।
// শুধু নিচের ট্যাগগুলো থাকে; বাকি ট্যাগ সরে যায় কিন্তু ভেতরের লেখা থাকে।
// script/style/iframe-এর মতো ট্যাগ ভেতরের লেখাসহ পুরো বাদ যায়।
// কোনো attribute থাকে না (class, style, onclick ইত্যাদি), শুধু লিংকের নিরাপদ href।

const ALLOWED = new Set(["p", "br", "strong", "b", "em", "i", "u", "span", "ul", "ol", "li", "a"]);
const DROP_WITH_CONTENT = new Set([
  "script", "style", "noscript", "iframe", "object", "embed", "template",
  "svg", "math", "form", "input", "button", "select", "textarea", "head", "title",
]);
const VOID = new Set(["br"]);

function escapeText(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string) {
  return escapeText(s).replace(/"/g, "&quot;");
}

// শুধু http(s), সাইটের নিজের পাথ (/...), tel: আর mailto: লিংক
function safeHref(raw: string | undefined): string | null {
  const href = (raw || "").trim();
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^(https?:|tel:|mailto:)/i.test(href)) return href;
  return null;
}

function render(node: Node): string {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return escapeText(node.text);
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return ""; // comment ইত্যাদি
  const el = node as HTMLElement;
  const tag = (el.rawTagName || "").toLowerCase();
  if (DROP_WITH_CONTENT.has(tag)) return "";

  const inner = el.childNodes.map(render).join("");
  if (!ALLOWED.has(tag)) return inner; // অপরিচিত ট্যাগ: শুধু ভেতরের লেখা

  if (VOID.has(tag)) return `<${tag}>`;
  if (tag === "a") {
    const href = safeHref(el.getAttribute("href"));
    if (!href) return inner;
    const external = /^https?:/i.test(href);
    const extra = external ? ' target="_blank" rel="noopener noreferrer nofollow"' : "";
    return `<a href="${escapeAttr(href)}"${extra}>${inner}</a>`;
  }
  return `<${tag}>${inner}</${tag}>`;
}

/** নিরাপদ HTML ফেরত দেয়; লেখা না থাকলে (শুধু ফাঁকা ট্যাগ/স্পেস) খালি string। */
export function sanitizeShortHtml(html: string | undefined | null): string {
  if (!html) return "";
  const root = parse(html, { comment: false });
  const out = root.childNodes
    .map(render)
    .join("")
    // ফাঁকা প্যারাগ্রাফ (শুধু স্পেস/&nbsp;/<br>) বাদ, যাতে বাড়তি ফাঁকা জায়গা না থাকে
    .replace(/<p>(?:\s| |<br>)*<\/p>/g, "")
    .trim();
  // লেখা আছে কিনা: ট্যাগ, &nbsp; আর স্পেস বাদ দিয়ে দেখা
  const text = parse(out).text.replace(/[\s ​]+/g, "");
  return text ? out : "";
}
