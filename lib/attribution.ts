// কাস্টমার কোথা থেকে এসেছে (WooCommerce-এর Origin / Order attribution-এর জন্য)।
// কাস্টমার যে পেজে প্রথম ঢোকে সেখানেই উৎস ধরে রাখা হয়, কারণ চেকআউটে পৌঁছাতে পৌঁছাতে
// লিংকের UTM হারিয়ে যায় আর referrer হয়ে যায় নিজের সাইট।
//
// নিয়ম (WooCommerce-এর নিজের Order Attribution-এর মতো):
// - লিংকে UTM থাকলে → utm
// - UTM নেই কিন্তু fbclid/gclid/ttclid আছে → utm (facebook/google/tiktok)
// - বাইরের সার্চ ইঞ্জিন থেকে → organic, অন্য বাইরের সাইট থেকে → referral
// - সরাসরি (ঠিকানা লিখে/বুকমার্ক) → typein, তবে আগের ৩০ দিনের মধ্যে কোনো উৎস থাকলে সেটাই থাকে

export type SourceType = "utm" | "organic" | "referral" | "typein";

export type Attribution = {
  type: SourceType;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  id: string;
  referrer: string;
  entry: string; // কাস্টমার প্রথম যে পেজে ঢুকেছিল
  start: string; // সেশন শুরুর সময় (ISO)
  pages: number; // এই সেশনে কয়টা পেজ দেখেছে
  count: number; // মোট কতবার সাইটে এসেছে
};

const ATTR_KEY = "sp_attr";   // শেষ উৎস (৩০ দিন)
const SESS_KEY = "sp_sess";   // এই সেশন (ট্যাব বন্ধ হলে মুছে যায়)
const COUNT_KEY = "sp_visits";
const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia)\./i;
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)(facebook|fb)\.(com|me)$|^l\.facebook\.com$|^lm\.facebook\.com$|^m\.facebook\.com$/i, "facebook"],
  [/(^|\.)messenger\.com$/i, "messenger"],
  [/(^|\.)instagram\.com$/i, "instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, "youtube"],
  [/(^|\.)tiktok\.com$/i, "tiktok"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/i, "twitter"],
];

type Stored = Omit<Attribution, "pages" | "count" | "start" | "entry"> & { ts: number };
type Session = { start: string; entry: string; pages: number; lastPath: string };

function ls(): Storage | null { try { return window.localStorage; } catch { return null; } }
function ss(): Storage | null { try { return window.sessionStorage; } catch { return null; } }
function read<T>(s: Storage | null, k: string): T | null {
  try { const v = s?.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function write(s: Storage | null, k: string, v: unknown) { try { s?.setItem(k, JSON.stringify(v)); } catch {} }
const cut = (v: string | null, n = 150) => (v || "").trim().slice(0, n);

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// এই পেজের ঠিকানা আর referrer থেকে উৎস বের করা; কিছু না পেলে null (মানে সরাসরি/নিজের সাইট)
function detect(): Stored | null {
  const q = new URLSearchParams(window.location.search);
  const ref = document.referrer || "";
  const refHost = hostOf(ref);
  const ownHost = window.location.hostname.replace(/^www\./, "");
  const external = !!refHost && refHost !== ownHost && !refHost.endsWith("." + ownHost);
  const base = {
    campaign: cut(q.get("utm_campaign")), content: cut(q.get("utm_content")),
    term: cut(q.get("utm_term")), id: cut(q.get("utm_id")),
    referrer: external ? cut(ref, 500) : "", ts: Date.now(),
  };

  const utmSource = cut(q.get("utm_source"));
  if (utmSource) return { ...base, type: "utm", source: utmSource, medium: cut(q.get("utm_medium")) || "(none)" };

  // UTM ছাড়া এড/লিংক ক্লিক
  if (q.get("fbclid")) return { ...base, type: "utm", source: "facebook", medium: "social" };
  if (q.get("gclid") || q.get("gbraid") || q.get("wbraid")) return { ...base, type: "utm", source: "google", medium: "cpc" };
  if (q.get("ttclid")) return { ...base, type: "utm", source: "tiktok", medium: "cpc" };

  if (external) {
    if (SEARCH.test(refHost)) return { ...base, type: "organic", source: refHost.split(".").slice(-2, -1)[0] || refHost, medium: "organic" };
    const social = SOCIAL.find(([re]) => re.test(refHost));
    return { ...base, type: "referral", source: social ? social[1] : refHost, medium: "referral" };
  }
  return null;
}

// প্রতিটা পেজে চালাতে হয় (লেআউট থেকে)। পেজ গোনে, আর নতুন উৎস পেলে সেভ করে।
export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const path = window.location.pathname + window.location.search;
    let sess = read<Session>(ss(), SESS_KEY);
    if (!sess) {
      sess = { start: new Date().toISOString(), entry: cut(window.location.href, 500), pages: 0, lastPath: "" };
      const n = Number(ls()?.getItem(COUNT_KEY) || 0) + 1;
      try { ls()?.setItem(COUNT_KEY, String(n)); } catch {}
    }
    if (sess.lastPath !== path) { sess.pages += 1; sess.lastPath = path; }
    write(ss(), SESS_KEY, sess);

    const found = detect();
    if (found) {
      write(ls(), ATTR_KEY, found); // নতুন এড/লিংক ক্লিক আগেরটাকে বদলে দেয়
    } else {
      const prev = read<Stored>(ls(), ATTR_KEY);
      if (!prev || Date.now() - prev.ts > KEEP_MS) {
        write(ls(), ATTR_KEY, { type: "typein", source: "(direct)", medium: "(none)", campaign: "", content: "", term: "", id: "", referrer: "", ts: Date.now() });
      }
    }
  } catch {}
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  const a = read<Stored>(ls(), ATTR_KEY);
  const sess = read<Session>(ss(), SESS_KEY);
  if (!a) return null;
  return {
    type: a.type, source: a.source, medium: a.medium, campaign: a.campaign, content: a.content,
    term: a.term, id: a.id, referrer: a.referrer,
    entry: sess?.entry || "", start: sess?.start || "", pages: sess?.pages || 0,
    count: Number(ls()?.getItem(COUNT_KEY) || 1),
  };
}
