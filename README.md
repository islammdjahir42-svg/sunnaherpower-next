# Sunnaher Power / Sunnaher Sopan – Next.js ফ্রন্টএন্ড (Headless WooCommerce)

একই কোড দুই সাইটে চলে। Vercel-এ `WP_URL` দেখে কোড ঠিক করে কোন সাইট (lib/site.ts)।
- sunnaherpower.com → Vercel প্রজেক্ট `sunnaherpower-next`, `WP_URL=https://wp.sunnaherpower.com`
- sunnahersopan.com → Vercel প্রজেক্ট `sunnahersopan-next`, `WP_URL=https://wp.sunnahersopan.com`

## চালানো
```bash
npm install
cp .env.example .env.local   # WP_URL দিন, ORDER_MODE=mock রাখুন
npm run dev                  # http://localhost:3000
```
প্রোডাক্ট/ক্যাটাগরি পাবলিক Store API থেকে আসে, কোনো key লাগে না।

## পেজ
| URL | কাজ |
|---|---|
| `/` | হোম |
| `/shop?q=` | সব প্রোডাক্ট + সার্চ |
| `/product-category/[slug]` | ক্যাটাগরি (আগের URL-এর মতোই) |
| `/product/[slug]` | প্রোডাক্ট (আগের URL-এর মতোই) |
| `/cart`, `/checkout` | কার্ট (localStorage), COD চেকআউট |
| `/checkout/order-received/[id]?key=` | থ্যাংক ইউ পেজ |

## অর্ডার
- `ORDER_MODE=mock` → লাইভ স্টোরে অর্ডার যায় না (ডেমো দেখানোর জন্য)
- `ORDER_MODE=live` + `WC_CONSUMER_KEY/SECRET` → আসল অর্ডার (`/wc/v3/orders`, status: processing)
- দাম ব্রাউজার থেকে নেওয়া হয় না, WooCommerce নিজে হিসাব করে।

