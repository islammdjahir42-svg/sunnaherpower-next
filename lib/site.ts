// এক কোড দিয়ে একাধিক সাইট (Sunnaher Power, Sunnaher Sopan)।
//
// কোন সাইট, সেটা ঠিক হয় Vercel-এর WP_URL সেটিং থেকে:
//   WP_URL = https://wp.sunnaherpower.com → সাইট sunnaherpower.com
//   WP_URL = https://wp.sunnahersopan.com → সাইট sunnahersopan.com
// next.config.ts এই মানগুলো ব্রাউজারের কোডেও পৌঁছে দেয় (SITE_WP_URL, SITE_PIXEL_ID)।
//
// রঙ, ডিজাইন, ফোন নম্বর সব সাইটে একই। শুধু যেগুলো সাইটভেদে আলাদা সেগুলো নিচের PROFILES-এ।
// নতুন সাইট যোগ করতে এখানে একটা লাইন যোগ করুন, আর Vercel-এ WP_URL দিন।

type Profile = {
  email: string;
  facebook: string;
  pixelId: string; // Vercel-এ FB_PIXEL_ID না থাকলে এটা; খালি থাকলে পিক্সেল চলবে না
};

const PROFILES: Record<string, Profile> = {
  "sunnaherpower.com": {
    email: "Support@sunnaherpower.com",
    facebook: "https://www.facebook.com/SunnaherPower/",
    pixelId: "2116851162527598",
  },
  "sunnahersopan.com": {
    email: "Support@SunnaherSopan.com",
    facebook: "https://www.facebook.com/SunnaherSopan/",
    pixelId: "", // Sopan-এর পিক্সেল Vercel-এর FB_PIXEL_ID থেকে আসে
  },
};

const DEFAULT_WP = "https://wp.sunnaherpower.com";
const trim = (u: string) => u.trim().replace(/\/+$/, "");

const WP_URL = trim(process.env.SITE_WP_URL || DEFAULT_WP);

// wp.sunnahersopan.com → https://sunnahersopan.com
function siteFromWp(wp: string): string {
  try {
    const u = new URL(wp);
    return `${u.protocol}//${u.hostname.replace(/^wp\./, "")}`;
  } catch {
    return "https://sunnaherpower.com";
  }
}

const SITE_URL = trim(process.env.NEXT_PUBLIC_SITE_URL || siteFromWp(WP_URL));

const DOMAIN = (() => {
  try { return new URL(SITE_URL).hostname.replace(/^www\./, ""); } catch { return "sunnaherpower.com"; }
})();

const PROFILE: Profile | undefined = PROFILES[DOMAIN];

export const SITE = {
  /** WordPress/WooCommerce ব্যাকএন্ড, যেমন https://wp.sunnaherpower.com */
  wpUrl: WP_URL,
  /** সাইটের ঠিকানা, যেমন https://sunnaherpower.com */
  url: SITE_URL,
  /** ডোমেইন, যেমন sunnaherpower.com (টাইটেলে দেখায়) */
  domain: DOMAIN,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || PROFILE?.email || `Support@${DOMAIN}`,
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || PROFILE?.facebook || "",
  /** Facebook পিক্সেল (ব্রাউজার আর সার্ভার দুই জায়গায় একই) */
  pixelId: process.env.SITE_PIXEL_ID || PROFILE?.pixelId || "",
};
