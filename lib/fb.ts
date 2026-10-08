// Facebook Pixel-এর ছোট সাহায্যকারী ফাংশন (শুধু ব্রাউজারে চলে)

export const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "2116851162527598";

const EID_KEY = "sp_eid"; // প্রতিটা ভিজিটরের স্থায়ী আইডি
const AM_KEY = "sp_am";   // অর্ডারের পর কাস্টমারের hash করা তথ্য (ফোন, নাম, জেলা...)

function store(): Storage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

// ৬৪ অক্ষরের র‍্যান্ডম আইডি। দেখতে hash-এর মতো, তাই পিক্সেল এটাকে আর বদলায় না,
// আর সার্ভারও হুবহু একই মান পাঠায় → ব্রাউজার আর সার্ভারের external_id মিলে যায়।
export function getExternalId(): string {
  const s = store();
  let id = s?.getItem(EID_KEY) || "";
  if (!/^[0-9a-f]{64}$/.test(id)) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    try { s?.setItem(EID_KEY, id); } catch {}
  }
  return id;
}

export function getStoredUserData(): Record<string, string> {
  try {
    const raw = store()?.getItem(AM_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    // শুধু hash করা মান রাখা (৬৪ অক্ষরের hex), অন্য কিছু না
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v as string))
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveUserData(am: Record<string, string> | undefined) {
  if (!am) return;
  try { store()?.setItem(AM_KEY, JSON.stringify(am)); } catch {}
}

// Advanced Matching: ভিজিটরের আইডি + আগের অর্ডারের hash করা তথ্য
export function matchingData(): Record<string, string> {
  return { ...getStoredUserData(), external_id: getExternalId() };
}

export function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

// ---------- fbc ব্যাকআপ ----------
// এড থেকে আসলে লিংকে fbclid থাকে। পিক্সেল সেটা দিয়ে _fbc কুকি বানায়, কিন্তু পিক্সেল ব্লক থাকলে
// (অ্যাড-ব্লকার, কিছু ব্রাউজার) কুকি তৈরি হয় না। তাই আমরাও Meta-র ফরম্যাটে নিজে রেখে দিই:
// fb.1.<প্রথম দেখার সময় মিলিসেকেন্ডে>.<fbclid হুবহু>
const FBC_KEY = "sp_fbc";

export function rememberFbclid() {
  try {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("fbclid");
    if (!id) return;
    const s = store();
    const prev = s?.getItem(FBC_KEY) || "";
    if (prev.endsWith("." + id)) return; // একই ক্লিক, সময় বদলানো যাবে না
    s?.setItem(FBC_KEY, `fb.1.${Date.now()}.${id}`);
  } catch {}
}

function fbcTime(v: string): number {
  const t = Number(v.split(".")[2]);
  return Number.isFinite(t) ? t : 0;
}

// _fbc কুকি আর আমাদের রাখা মানের মধ্যে যেটা নতুন ক্লিকের, সেটা
export function getFbc(): string {
  const cookie = getCookie("_fbc");
  let saved = "";
  try { saved = store()?.getItem(FBC_KEY) || ""; } catch {}
  if (!/^fb\.\d\.\d+\..+/.test(saved)) saved = "";
  if (!cookie) return saved;
  if (!saved) return cookie;
  return fbcTime(saved) > fbcTime(cookie) ? saved : cookie;
}

// ---------- ব্রাউজার + সার্ভার একই ইভেন্ট ----------
// একই event_id ব্রাউজারের পিক্সেল আর সার্ভারের Conversions API দুই জায়গায় যায়,
// তাই Facebook দুটোকে মিলিয়ে একটা ইভেন্ট গোনে, আর সার্ভারেরটা থেকে বাড়তি ম্যাচিং তথ্য পায়।
export function newEventId(prefix: string): string {
  const bytes = new Uint8Array(8);
  try { crypto.getRandomValues(bytes); } catch { for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256); }
  const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// পিক্সেল লোড হয়ে _fbp কুকি তৈরি হওয়া পর্যন্ত একটু অপেক্ষা (সর্বোচ্চ ~৩ সেকেন্ড),
// তারপর সার্ভারে পাঠানো। পিক্সেল ব্লক থাকলেও শেষে পাঠানো হয়, তখন fbp ছাড়া।
export async function sendServerEvent(eventName: string, eventId: string, data: { product_id: number }) {
  if (typeof window === "undefined") return;
  try {
    rememberFbclid();
    for (let i = 0; i < 12 && !getCookie("_fbp"); i++) await sleep(250);
    const body = JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      event_source_url: window.location.href,
      product_id: data.product_id,
      fbp: getCookie("_fbp"),
      fbc: getFbc(),
      external_id: getExternalId(),
      am: getStoredUserData(),
    });
    await fetch("/api/fb-event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {}
}
