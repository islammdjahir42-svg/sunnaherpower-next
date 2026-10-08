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
import { getCookie, getExternalId, getFbc, saveUserData } from "@/lib/fb";

export default function CheckoutForm() {
  const { items, setQty, remove, clear } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [ready, setReady] = useState(false);
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailOffer, setEmailOffer] = useState<{enabled:boolean;amount:number;label:string;audio?:string;trigger_ids?:number[]}|null>(null);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailAccepted, setEmailAccepted] = useState(false);
  const [emailDiscount, setEmailDiscount] = useState(0);
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(0);
  const [showEmailField, setShowEmailField] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement|null>(null);
  const audioUrlRef = React.useRef<string>("/order-guide.mp3");
  const emailPopupShownRef = React.useRef(false);
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [referrer, setReferrer] = useState("");
  const duplicateBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    const token = localStorage.getItem('ss_token');
    if (token) {
      fetch("https://wp.sunnaherpower.com/wp-json/sunnaher/v1/profile", { headers: { Authorization: "Bearer " + token } })
 .then(r => r.json()).then(d => {
 if (d.name) setName(d.name);
 if (d.phone) setPhone(d.phone.replace('+880', '0').replace(/[^0-9]/g, ''));
          if (d.district) setDistrict(d.district);
          if (d.thana) setThana(d.thana);
          if (d.address) setAddress(d.address);
        }).catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const foToken = localStorage.getItem('ss_token');
    if (foToken) {
      fetch("https://wp.sunnaherpower.com/wp-json/sunnaher/v1/first-order-discount", {
        headers: { Authorization: `Bearer ${foToken}` }
      }).then(r => r.json()).then(d => {
        if (d.eligible && d.amount > 0) setFirstOrderDiscount(d.amount);
      }).catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    fetch("https://wp.sunnaherpower.com/wp-json/sunnaher/v1/email-discount")
      .then(r => r.json())
      .then(d => {
        setEmailOffer(d);
        if (d.audio) audioUrlRef.current = d.audio;
        if (d.checkout_audio_enabled && d.audio) { try { const a = new Audio(d.audio); a.play().catch(()=>{}); } catch {} }
        const triggerIds = d.trigger_ids || []; const stored = localStorage.getItem('cart'); const cartIds = stored ? JSON.parse(stored).map((i: any) => i.id) : []; const match = triggerIds.length === 0 || cartIds.some((id: number) => triggerIds.includes(id)); if (d.enabled && match) { (window as any)._emailOfferReady = true; }
      })
      .catch(() => {});
  }, [ready]);

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
    setVal("fbc", getFbc());
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
    <>
    <form action={action} onSubmit={handleSubmit} className="grid items-start gap-8 md:grid-cols-2 md:gap-6">
      <input type="hidden" name="items" value={payload} />
      <input type="hidden" name="email_discount" value={emailDiscount} />
      <input type="hidden" name="ss_token" value={ready ? (localStorage.getItem("ss_token") || "") : ""} />
      <input type="hidden" name="first_order_discount" value={firstOrderDiscount} />
      <input type="hidden" name="customer_email" value={emailInput} />
      <input type="hidden" name="fbc" defaultValue={getFbc()} />
      <input type="hidden" name="fbp" defaultValue={getCookie('_fbp')} />
      <input type="hidden" name="external_id" defaultValue="" />
      <input type="hidden" name="user_agent" value={typeof navigator !== 'undefined' ? navigator.userAgent : ''} />
      <input type="hidden" name="page_url" value={typeof window !== 'undefined' ? window.location.href : ''} />
      <input type="hidden" name="utm_source" value={utmSource} />
      <input type="hidden" name="utm_medium" value={utmMedium} />
      <input type="hidden" name="utm_campaign" value={utmCampaign} />
      <input type="hidden" name="referrer" value={referrer} />

      {/* Email Discount Popup */}
      {showEmailPopup && !emailAccepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="mb-1 text-center text-2xl">🎁</p>
            <p className="mb-4 text-center text-[17px] font-bold text-ink">{emailOffer?.label || "ইমেইল দিলে ৫০ টাকা ছাড়!"}</p>
            <button
              type="button"
              onClick={() => { setShowEmailPopup(false); setShowEmailField(true); }}
              className="mb-3 w-full rounded-lg bg-accent py-3 text-[15px] font-bold text-white hover:opacity-90"
            >
              ✅ হ্যাঁ, আছে — আমি লিখব
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmailPopup(false);
                setEmailAccepted(true);
                try {
                  const audioUrl = audioUrlRef.current || "/order-guide.mp3";
                  const a = new Audio(audioUrl);
                  a.play();
                } catch {}
              }}
              className="w-full rounded-lg border border-line py-2.5 text-[14px] text-muted hover:bg-[#f7f7f7]"
            >
              নেই, লিখব না
            </button>
          </div>
        </div>
      )}

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
        <Field label="আপনার নাম" name="name" error={err?.fields?.name} autoComplete="name" value={name} onChange={e => setName((e.target as HTMLInputElement).value)} />

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
              const nameEl = document.querySelector('input[name="name"]') as HTMLInputElement;
              if (nameEl?.value?.trim().length >= 2 && (window as any)._emailOfferReady && !emailPopupShownRef.current && !emailAccepted) {
                emailPopupShownRef.current = true;
                setTimeout(() => setShowEmailPopup(true), 500);
              }
              setPhoneTouched(true);
              saveIncomplete(e.target.value);
            }
          }}
          onBlur={() => phone && setPhoneTouched(true)}
          placeholder="01XXXXXXXXX"
          error={phoneWarning || err?.fields?.phone}
          autoComplete="tel"
        />

        {/* Email Field */}
        {showEmailField && (
          <div className="mb-5" style={{animation:"fadeIn 0.4s ease"}}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <label className="block">
              <span className="mb-1.5 block text-[15px]">ইমেইল <span className="text-green-600 text-sm font-bold">(৳{emailOffer?.amount || 50} ছাড় পাবেন)</span></span>
              <input
                type="email"
                value={emailInput}
                onChange={e => {
                  setEmailInput(e.target.value);
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (emailRegex.test(e.target.value)) {
                    setEmailAccepted(true);
                    setEmailDiscount(emailOffer?.amount || 50);
                    try {
                      if (!(window as any).confetti) {
                        const s = document.createElement('script');
                        s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
                        s.onload = () => { (window as any).confetti({particleCount: 150, spread: 80, origin: {y: 0.6}}); };
                        document.head.appendChild(s);
                      } else {
                        (window as any).confetti({particleCount: 150, spread: 80, origin: {y: 0.6}});
                      }
                    } catch {}
                  } else {
                    setEmailAccepted(false);
                    setEmailDiscount(0);
                  }
                }}
                placeholder="example@gmail.com"
                className="w-full border border-green-400 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
              />
            </label>
          </div>
        )}

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
          {firstOrderDiscount > 0 && (
            <div className="flex justify-between border-b border-line py-3 text-[15px] text-green-600">
              <span className="font-bold">🎁 প্রথম অর্ডার ডিসকাউন্ট</span>
              <span>-{taka(firstOrderDiscount)}</span>
            </div>
          )}
          {emailDiscount > 0 && (
            <div className="flex justify-between border-b border-line py-3 text-[15px] text-green-600">
              <span className="font-bold">ইমেইল ডিসকাউন্ট</span>
              <span>-{taka(emailDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-4">
            <span className="text-2xl font-bold">সর্বমোট</span>
            <span className="text-2xl font-bold text-sale">{taka(Math.max(0, total - emailDiscount - firstOrderDiscount))}</span>
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

    {/* Floating Call - left */}
    <a href="tel:+8801908795252" aria-label="কল করুন"
      className="fixed bottom-4 left-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#119a26] text-white shadow-xl ring-2 ring-white">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
        <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1l-2.2 2.23Z" />
      </svg>
    </a>

    {/* Floating WhatsApp - right */}
    <a href="https://wa.me/8801908795252" target="_blank" rel="noopener" aria-label="WhatsApp"
      className="fixed right-4 bottom-4 z-50 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-gradient-to-b from-[#5ff777] to-[#12b72c] text-white shadow-xl ring-2 ring-white">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden>
        <path d="M20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.3 23.5l6-1.6A11.8 11.8 0 0 0 23.8 12a11.7 11.7 0 0 0-3.3-8.5ZM12.1 21.6a9.7 9.7 0 0 1-5-1.4l-.3-.2-3.6.9 1-3.5-.2-.4a9.8 9.8 0 1 1 8.1 4.6Zm5.4-7.3c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.4 13.4 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.8a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3Z" />
      </svg>
    </a>
    </>
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
