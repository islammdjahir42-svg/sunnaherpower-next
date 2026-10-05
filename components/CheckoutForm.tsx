"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import { useCart, cartTotal } from "@/lib/cart";
import { taka } from "@/lib/format";
import { DISTRICTS, findDistrict, findThana } from "@/lib/bd-geo";
import { checkPhone, localPhoneDigits } from "@/lib/bn-format";
import { getCookie, getExternalId, saveUserData } from "@/lib/fb";

export default function CheckoutForm() {
  const { items, setQty, remove, clear } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [ready, setReady] = useState(false);
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [referrer, setReferrer] = useState("");
  const duplicateBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUtmSource(p.get("utm_source") || "");
    setUtmMedium(p.get("utm_medium") || "");
    setUtmCampaign(p.get("utm_campaign") || "");
    setReferrer(document.referrer || "");
  }, []);

  // InitiateCheckout — কার্টের পণ্য, পরিমাণ আর দামসহ (আগে কোনো তথ্য ছাড়া যেত)
  // কার্ট localStorage থেকে আসে, তাই প্রথম রেন্ডারেই পণ্যগুলো পাওয়া যায়; ইভেন্ট একবারই যাবে।
  const icSent = useRef(false);
  useEffect(() => {
    if (icSent.current || !items.length) return;
    icSent.current = true;
    const params = {
      value: cartTotal(items),
      currency: 'BDT',
      content_ids: items.map(i => String(i.id)),
      content_type: 'product',
      contents: items.map(i => ({ id: String(i.id), quantity: i.qty, item_price: i.price })),
      num_items: items.reduce((n, i) => n + i.qty, 0),
    };
    try {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', params);
      } else {
        let _a = 0;
        const _iv = setInterval(() => {
          _a++;
          if (window.fbq || _a > 100) { clearInterval(_iv); window.fbq?.('track', 'InitiateCheckout', params); }
        }, 50);
      }
    } catch {}
  }, [items]);

  useEffect(() => {
    if (state?.ok) {
      deleteIncomplete();
      // কাস্টমারের hash করা তথ্য রেখে দেওয়া — পরের পেজে (অর্ডার সম্পন্ন) আর পরের ভিজিটে পিক্সেল init-এ যাবে
      saveUserData(state.am);
      clear();
      setTimeout(() => {
        window.location.href = `/checkout/order-received/${state.id}?key=${state.key}`;
      }, 500);
    }
  }, [state, clear, router]);

  // duplicate হলে banner-এ scroll
  const isDuplicate = state && !state.ok && state.error !== "gift_invalid" && !('fields' in state && state.fields) && state.error?.includes("অর্ডার করেছেন");
  const isGiftInvalid = state && !state.ok && state.error === "gift_invalid";

  const removeGiftsAndOrder = () => {
    if (isGiftInvalid && 'gift_ids' in state) {
      (state as any).gift_ids.forEach((id: number) => remove(id));
    }
  };
  useEffect(() => {
    if (isDuplicate) {
      setSubmitted(false);
      duplicateBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isDuplicate]);

  const districtObj = findDistrict(district);

  const handleDistrict = (en: string) => {
    setDistrict(en);
    setThana("");
    const d = findDistrict(en);
    setAddress(d ? d.bn + ", " : "");
  };

  const handleThana = (en: string) => {
    setThana(en);
    const t = findThana(districtObj, en);
    if (t && districtObj) setAddress(districtObj.bn + ", " + t.bn + ", ");
  };

  const phoneCheck = checkPhone(phone);
  const phoneWarning = phoneTouched && !phoneCheck.ok ? phoneCheck.message : "";

  const incompleteIdRef = React.useRef<number | null>(null);

  const saveIncomplete = async (phoneVal?: string, nameVal?: string, addrVal?: string) => {
    const ph = phoneVal ?? phone;
    if (localPhoneDigits(ph).length < 11) return;
    try {
      const WP = "https://wp.sunnaherpower.com";
      const cartItems = items.map(i => ({ id: i.id, name: i.name, qty: i.qty }));
      const res = await fetch(`${WP}/wp-json/sunnaher/v1/incomplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: ph,
          name: nameVal ?? (document.querySelector('input[name="name"]') as HTMLInputElement)?.value ?? "",
          address: addrVal ?? address,
          items: cartItems,
        }),
      });
      const data = await res.json();
      if (data.id) incompleteIdRef.current = data.id;
    } catch {}
  };

  const deleteIncomplete = async () => {
    const id = incompleteIdRef.current;
    if (!id) return;
    try {
      await fetch(`https://wp.sunnaherpower.com/wp-json/sunnaher/v1/incomplete/${id}`, { method: "DELETE" });
      incompleteIdRef.current = null;
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!phoneCheck.ok) {
      e.preventDefault();
      setPhoneTouched(true);
      document.getElementById("phone")?.focus();
      return;
    }
    const nameEl = document.querySelector('input[name="name"]') as HTMLInputElement;
    saveIncomplete(phone, nameEl?.value ?? "", address);
    const key = "order_lock_" + localPhoneDigits(phone) + "_" + items.map(i => i.id).sort().join(",");
    try {
      const t = localStorage.getItem(key);
      if (t && Date.now() - Number(t) < 30_000) {
        e.preventDefault();
        return;
      }
      localStorage.setItem(key, String(Date.now()));
    } catch {}
    // Facebook cookie আর ভিজিটর আইডি জমা দেওয়ার ঠিক আগে নতুন করে পড়া
    // (পেজ খোলার সময় পিক্সেল লোড না হলে _fbp তখনও তৈরি হয়নি থাকতে পারে)
    const f = e.currentTarget.elements;
    const setVal = (n: string, v: string) => { const el = f.namedItem(n) as HTMLInputElement | null; if (el) el.value = v; };
    setVal("fbc", getCookie("_fbc"));
    setVal("fbp", getCookie("_fbp"));
    setVal("external_id", getExternalId());
    setSubmitted(true);
  };

  if (!ready) return null;
  if (!items.length && !state?.ok) {
    return (
      <p className="bg-[#f7f7f7] p-8 text-center">
        কার্ট খালি। <Link href="/shop" className="font-semibold text-accent underline">শপে যান</Link>
      </p>
    );
  }

  const err = state && !state.ok && state.error !== "gift_invalid" ? state as { ok: false; error: string; fields?: Record<string, string> } : null;
  const total = cartTotal(items);
  const payload = JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty })));
  const thanas = districtObj?.thanas || [];

  return (
    <form action={action} onSubmit={handleSubmit} className="grid items-start gap-8 md:grid-cols-2 md:gap-6">
      <input type="hidden" name="items" value={payload} />
      <input type="hidden" name="fbc" defaultValue={getCookie('_fbc')} />
      <input type="hidden" name="fbp" defaultValue={getCookie('_fbp')} />
      <input type="hidden" name="external_id" defaultValue="" />
      <input type="hidden" name="user_agent" value={typeof navigator !== 'undefined' ? navigator.userAgent : ''} />
      <input type="hidden" name="page_url" value={typeof window !== 'undefined' ? window.location.href : ''} />
      <input type="hidden" name="utm_source" value={utmSource} />
      <input type="hidden" name="utm_medium" value={utmMedium} />
      <input type="hidden" name="utm_campaign" value={utmCampaign} />
      <input type="hidden" name="referrer" value={referrer} />

      {/* Gift invalid warning */}
      {isGiftInvalid && (
        <div className="md:col-span-2 rounded-sm bg-[#fff3cd] border border-[#ffc107] px-5 py-4 text-[15px] text-[#856404]">
          <p className="font-bold mb-2">⚠️ আপনার কার্টে গিফট আইটেম আছে যা এই অর্ডারের সাথে প্রযোজ্য নয়।</p>
          <p className="text-sm mb-3">গিফট পেতে সঠিক প্রোডাক্ট যোগ করুন, অথবা গিফট সরিয়ে অর্ডার করুন।</p>
          <button
            type="button"
            onClick={removeGiftsAndOrder}
            className="rounded bg-[#856404] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            গিফট সরিয়ে অর্ডার করুন
          </button>
        </div>
      )}

      {/* Duplicate warning banner */}
      {isDuplicate && (
        <div
          ref={duplicateBannerRef}
          className="md:col-span-2 rounded-sm bg-[#fff8e1] border border-[#f6c700] px-5 py-4 text-center text-[15px] font-medium text-[#7a5c00]"
        >
          🎉 ইতিপূর্বেই আপনার অর্ডার কনফার্ম হয়েছে! কিছুক্ষণের মধ্যেই আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবে। ধন্যবাদ স্যার। 🙏
        </div>
      )}

      {/* Billing */}
      <div className="md:pt-6">
        <h2 className="mb-5 text-lg font-bold">অর্ডার কনফার্ম করতে নিচের ফর্মটি পূরণ করুন</h2>
        <Field label="আপনার নাম" name="name" error={err?.fields?.name} autoComplete="name" />

        <Field
          label="আপনার (১১ ডিজিটের) মোবাইল নাম্বার"
          name="phone"
          type="tel"
          inputMode="tel"
          id="phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            const digits = localPhoneDigits(e.target.value);
            if (digits.length >= 11) {
              setPhoneTouched(true);
              saveIncomplete(e.target.value);
            }
          }}
          onBlur={() => phone && setPhoneTouched(true)}
          placeholder="01XXXXXXXXX"
          error={phoneWarning || err?.fields?.phone}
          autoComplete="tel"
        />

        {/* সম্পূর্ণ ঠিকানা */}
        <div className="mb-5">
          <span className="mb-1.5 block text-[15px]">সম্পূর্ণ ঠিকানা <span className="text-sale">*</span></span>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              name="district"
              value={district}
              onChange={(e) => handleDistrict(e.target.value)}
              className="w-full border border-line px-3 py-2 text-sm focus:outline-none focus:border-[#999] bg-white"
            >
              <option value="">জেলা সিলেক্ট</option>
              {DISTRICTS.map((d) => (
                <option key={d.en} value={d.en}>{d.bn}</option>
              ))}
            </select>
            <select
              name="thana"
              value={thana}
              onChange={(e) => handleThana(e.target.value)}
              disabled={!district}
              className="w-full border border-line px-3 py-2 text-sm focus:outline-none focus:border-[#999] bg-white disabled:opacity-50"
            >
              <option value="">থানা সিলেক্ট</option>
              {thanas.map((t) => (
                <option key={t.en} value={t.en}>{t.bn}</option>
              ))}
            </select>
          </div>
          <input
            name="address"
            required
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (!e.target.value.trim()) {
                setDistrict("");
                setThana("");
              }
            }}
            placeholder="বাড়ি নং, রাস্তা, এলাকা..."
            className={`w-full border px-3 py-2 text-sm focus:outline-none ${err?.fields?.address ? "border-sale" : "border-line focus:border-[#999]"}`}
          />
          {err?.fields?.address && <span className="mt-1 block text-sm text-sale">{err.fields.address}</span>}
        </div>
      </div>

      {/* Order summary */}
      <aside className="receipt bg-[#f7f7f7] px-4 py-8 sm:px-6">
        <h2 className="mb-5 text-center text-xl font-bold">আপনার অর্ডার</h2>

        <div className="bg-white px-4 shadow-sm">
          <div className="flex justify-between border-b border-line py-4 text-lg font-bold">
            <span>পণ্য</span>
            <span>সাবটোটাল</span>
          </div>

          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 border-b border-line py-4">
              <button
                type="button"
                onClick={() => remove(i.id)}
                aria-label={`${i.name} মুছুন`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm text-[#555] hover:bg-sale hover:text-white"
              >
                ×
              </button>
              <div className="relative h-14 w-14 shrink-0 bg-white">
                {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-[15px] leading-6">{i.name}</p>
                <div className="mt-2 inline-flex h-7 items-center border border-line text-xs">
                  <button type="button" onClick={() => setQty(i.id, i.qty - 1)} className="h-full w-6" aria-label="কমান">-</button>
                  <span className="w-6 border-x border-line text-center leading-7">{i.qty}</span>
                  <button type="button" onClick={() => setQty(i.id, i.qty + 1)} className="h-full w-6" aria-label="বাড়ান">+</button>
                </div>
              </div>
              <span className="shrink-0 text-[15px] text-muted">{taka(i.price * i.qty)}</span>
            </div>
          ))}

          <div className="flex justify-between border-b border-line py-3 text-lg">
            <span className="font-bold">সাবটোটাল</span>
            <span className="text-sale">{taka(total)}</span>
          </div>
          <div className="flex justify-between border-b border-line py-3 text-lg">
            <span className="font-bold">ডেলিভারি</span>
            <span>ফ্রি ডেলিভারি</span>
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-2xl font-bold">সর্বমোট</span>
            <span className="text-2xl font-bold text-sale">{taka(total)}</span>
          </div>
        </div>

        <p className="mt-6 text-[15px]">ক্যাশ অন ডেলিভারি</p>
        <p className="mt-3 bg-white p-4 text-[15px]">ডেলিভারির সময় নগদ টাকায় মূল্য পরিশোধ করুন।</p>

        {err && !err.fields && !isDuplicate && <p role="alert" className="mt-4 bg-sale/10 p-3 text-sm text-sale">{err.error}</p>}

        <button
          type="submit"
          disabled={pending || submitted}
          className="btn-animated mt-4 w-full rounded-sm py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "অর্ডার হচ্ছে…" : "👉 এখানে ক্লিক করে অর্ডার সম্পন্ন করুন।"}
        </button>
      </aside>
    </form>
  );
}

type FieldProps = { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>;

function Field({ label, name, error, ...rest }: FieldProps) {
  return (
    <label className="mb-5 block">
      <span className="mb-1.5 block text-[15px]">
        {label} <span className="text-sale">*</span>
      </span>
      <input
        name={name}
        required
        className={`w-full border px-3 py-2 text-sm focus:outline-none ${error ? "border-sale" : "border-line focus:border-[#999]"}`}
        {...rest}
      />
      {error && <span className="mt-1 block text-sm text-sale">{error}</span>}
    </label>
  );
}
