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
