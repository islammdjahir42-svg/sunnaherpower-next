// চেকআউট ডেটা ফরম্যাটিং — বাংলা থেকে ইংরেজি, ফোন, নাম ভাগ
// কোনো নেটওয়ার্ক কল নেই, instant। সার্ভার ও ব্রাউজার দুই জায়গাতেই চলে।

// ---------- সংখ্যা ----------
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export function toAsciiDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

// ---------- ফোন ----------
// যেকোনো ইনপুট (০১৭..., +880..., 880..., স্পেস/ড্যাশসহ) → ১১ ডিজিটের লোকাল নাম্বার
export function localPhoneDigits(raw: string): string {
  let d = toAsciiDigits(String(raw || "")).replace(/\D/g, "");
  if (d.startsWith("880")) d = d.slice(2); // 8801XXXXXXXXX → 01XXXXXXXXX
  return d;
}

export type PhoneCheck = { ok: true } | { ok: false; message: string };

const BN = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export function checkPhone(raw: string): PhoneCheck {
  const d = localPhoneDigits(raw);
  if (!d) return { ok: false, message: "আপনার ১১ ডিজিটের মোবাইল নাম্বার দিন" };
  if (d.length < 11) return { ok: false, message: `আপনার ১১ ডিজিটের নাম্বার দিন — ${BN(11 - d.length)}টি সংখ্যা কম আছে` };
  if (d.length > 11) return { ok: false, message: `আপনার ১১ ডিজিটের নাম্বার দিন — ${BN(d.length - 11)}টি সংখ্যা বেশি হয়েছে` };
  if (!/^01[3-9]\d{8}$/.test(d)) return { ok: false, message: "সঠিক নাম্বার দিন, যেমন 01XXXXXXXXX" };
  return { ok: true };
}

// 01707638902 → +8801707638902 (Facebook/Google দেশের কোডসহ চায়)
export function formatPhone(raw: string): string {
  return "+880" + localPhoneDigits(raw).replace(/^0/, "");
}

// ---------- নাম ----------
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

export function capitalize(s: string): string {
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

// ---------- বাংলা → ইংরেজি ----------
// সাধারণ নাম/শব্দের প্রচলিত বানান (rule-এর চেয়ে বেশি নির্ভুল)
const WORDS: Record<string, string> = {
  "মোঃ": "Md", "মোহাম্মদ": "Mohammad", "মোহাম্মাদ": "Mohammad", "মুহাম্মদ": "Muhammad", "মুহাম্মাদ": "Muhammad", "মু": "Mu",
  "আব্দুল": "Abdul", "আবদুল": "Abdul", "আব্দুর": "Abdur", "আবদুর": "Abdur", "আবু": "Abu",
  "হোসেন": "Hossain", "হোসাইন": "Hossain", "হুসাইন": "Hussain", "হাসান": "Hasan",   "রহমান": "Rahman", "ইসলাম": "Islam", "আহমেদ": "Ahmed", "আহমদ": "Ahmed", "আহম্মেদ": "Ahmed",
  "উদ্দিন": "Uddin", "উদ্দীন": "Uddin", "বেগম": "Begum", "আক্তার": "Akter", "আখতার": "Akhter", "আকতার": "Akter",
  "খাতুন": "Khatun", "চৌধুরী": "Chowdhury", "সরকার": "Sarkar", "মিয়া": "Mia", "শেখ": "Sheikh",
  "খান": "Khan", "আলী": "Ali", "আলি": "Ali", "হক": "Haque", "বিশ্বাস": "Biswas", "তালুকদার": "Talukder",
  "মজুমদার": "Majumder", "ভূঁইয়া": "Bhuiyan", "ভূইয়া": "Bhuiyan", "ভুইয়া": "Bhuiyan", "মন্ডল": "Mondal", "মণ্ডল": "Mondal",
  "প্রামাণিক": "Pramanik", "শাহ": "Shah", "সৈয়দ": "Syed", "কাজী": "Kazi", "নূর": "Nur", "নুর": "Nur",
  "মাহমুদ": "Mahmud", "জাহিদ": "Zahid", "জামান": "Zaman", "আজিজ": "Aziz", "রফিক": "Rafiq", "শফিক": "Shafiq",
  "রশিদ": "Rashid", "হামিদ": "Hamid", "মাহফুজ": "Mahfuz", "মিজানুর": "Mizanur", "মোস্তফা": "Mostafa",
  "ইব্রাহিম": "Ibrahim", "ইউসুফ": "Yusuf", "ইয়াসিন": "Yasin", "নাজমুল": "Nazmul", "নজরুল": "Nazrul",
  "মনির": "Monir", "মনিরুল": "Monirul", "সুমন": "Sumon", "পারভেজ": "Parvez", "আসাদুজ্জামান": "Asaduzzaman",
  "ফারুক": "Faruk", "হাবিব": "Habib", "হাবিবুর": "Habibur", "শরীফ": "Sharif", "শরিফ": "Sharif",
  "রায়হান": "Rayhan", "তানভীর": "Tanvir", "ইমরান": "Imran", "জসিম": "Jasim",
  "মরিয়ম": "Mariam", "ফাতেমা": "Fatema", "আয়েশা": "Ayesha",   "সুমাইয়া": "Sumaiya", "জান্নাত": "Jannat", "পারভীন": "Parvin", "শারমিন": "Sharmin",
  "রোকসানা": "Roksana", "নাসরিন": "Nasrin", "রায়": "Roy", "দাস": "Das", "সাহা": "Saha",
  "ঘোষ": "Ghosh", "চন্দ্র": "Chandra", "কুমার": "Kumar", "দেব": "Deb", "পাল": "Pal",
  // ঠিকানা
  "গ্রাম": "Gram", "বাজার": "Bazar", "রোড": "Road", "বাড়ি": "Bari", "বাসা": "Basa", "নং": "No",
  "পোস্ট": "Post", "পোঃ": "Post", "থানা": "Thana", "জেলা": "Zila", "উপজেলা": "Upazila", "সদর": "Sadar",
};

// য় / ড় / ঢ় কখনো দুই codepoint-এ লেখা হয় — এক করে নেওয়া
function norm(w: string) {
  return w.normalize("NFC").replace(/\u09AF\u09BC/g, "\u09DF").replace(/\u09A1\u09BC/g, "\u09DC").replace(/\u09A2\u09BC/g, "\u09DD");
}
const WORDS_N: Record<string, string> = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [norm(k), v]));

const CONS: Record<string, string> = {
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "bh", "ম": "m", "য": "j", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh",
  "স": "s", "হ": "h", "\u09DC": "r", "\u09DD": "rh", "\u09DF": "y", "ৎ": "t",
};
const VOWEL: Record<string, string> = {
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
};
const KAR: Record<string, string> = {
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
};
const HASANTA = "্";

function translitWord(w: string): string {
  const s = norm(w);
  if (WORDS_N[s]) return WORDS_N[s];
  // শুরুতে ইয় → Y (ইয়াসমিন → Yasmin)
  const ch = [...s.replace(/^\u0987\u09DF/, "\u09DF")];
  let out = "";
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i];
    const next = ch[i + 1];

    if (c in CONS) {
      const prev = ch[i - 1];
      // যুক্তবর্ণের দ্বিতীয় অংশ: ্য → y, ্ব → (ম/ব-এর পরে b, নইলে w)
      if (prev === HASANTA && c === "য") { out += "y"; continue; }
      if (prev === HASANTA && c === "ব") { out += ch[i - 2] === "ম" || ch[i - 2] === "ব" ? "b" : "w"; continue; }
      if (c === "ক" && next === HASANTA && ch[i + 2] === "ষ") { out += "ksh"; i += 2; if (!(ch[i + 1] in KAR) && ch[i + 1] !== HASANTA) out += inherent(ch, i); continue; }
      out += CONS[c];
      if (next && (next in KAR || next === HASANTA)) continue;
      out += inherent(ch, i);
    } else if (c in KAR) out += KAR[c];
    else if (c in VOWEL) out += VOWEL[c];
    else if (c === "ং") out += "ng";
    else if (c === "ঃ") out += "h";
    else if (c === "ঁ" || c === HASANTA || c === "\u200c" || c === "\u200d") continue;
    else if (/[০-৯]/.test(c)) out += toAsciiDigits(c);
    else out += c;
  }
  return out;
}

// যে ব্যঞ্জনে কার/হসন্ত নেই, তার শেষে 'a' বসবে কিনা (schwa deletion heuristic)
function inherent(ch: string[], i: number): string {
  const isCons = (x?: string) => !!x && x in CONS;
  const last = !isCons(ch[i + 1]) && !(ch[i + 1] in KAR);
  if (last) return ch[i - 1] === HASANTA ? "a" : ""; // মোহাম্মদ → ...mad, রাকিব → rakib
  const first = i === 0 || !(isCons(ch[i - 1]) || ch[i - 1] in KAR || ch[i - 1] in VOWEL);
  if (first) return "a"; // জহিরুল → Ja...
  // মাঝখানে: পরের ব্যঞ্জন শব্দের শেষ হলে 'a' রাখা (আলম → Alam), পরেরটায় কার থাকলে বাদ (ইসলাম → Islam)
  let j = i + 1;
  while (isCons(ch[j]) && ch[j + 1] === HASANTA) j += 2; // পরের যুক্তবর্ণ পেরিয়ে
  const nextHasKar = ch[j + 1] in KAR;
  const nextIsLast = !isCons(ch[j + 1]) && !nextHasKar;
  if (nextHasKar) return "";
  return nextIsLast ? "a" : "";
}

export const hasBangla = (s: string) => /[\u0980-\u09FF]/.test(s);

export function toEnglish(text: string): string {
  if (!text || !hasBangla(text)) return text || "";
  return text
    .replace(/[।]/g, ".")
    .split(/(\s+|[,.\-/()#:;]+)/)
    .map((tok) => (hasBangla(tok) ? capitalize(translitWord(tok)) : tok))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
