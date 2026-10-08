"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DISTRICTS, findDistrict, findThana } from "@/lib/bd-geo";

const WP = "https://wp.sunnaherpower.com";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", district: "", thana: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstDiscount, setFirstDiscount] = React.useState("১০০ টাকা");
  React.useEffect(() => {
    fetch("https://wp.sunnaherpower.com/wp-json/sunnaher/v1/topbar")
      .then(r => r.json())
      .then(d => { if (d.amount) setFirstDiscount(d.amount); })
      .catch(() => {});
  }, []);

  const [phoneError, setPhoneError] = useState("");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const districtObj = React.useMemo(() => findDistrict(form.district), [form.district]);
  const thanaObj = React.useMemo(() => findThana(districtObj, form.thana), [districtObj, form.thana]);
  const thanas = districtObj?.thanas || [];

  const handleDistrictChange = (val: string) => {
    const d = findDistrict(val);
    setForm(f => ({ ...f, district: val, thana: "", address: d ? d.bn + ", " : f.address }));
  };

  const handleThanaChange = (val: string) => {
    const t = findThana(districtObj, val);
    setForm(f => ({ ...f, thana: val, address: t ? t.bn + ", " + (districtObj?.bn || "") : f.address }));
  };

  const handlePhone = (val: string) => {
    set("phone", val);
    const digits = val.replace(/\D/g, "");
    if (val && (digits.length > 11 || (digits.length === 11 && !digits.startsWith("01")))) {
      setPhoneError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length !== 11 || !digits.startsWith("01")) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${WP}/wp-json/sunnaher/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "রেজিস্ট্রেশন সম্পন্ন হয়নি।");
        setLoading(false);
        return;
      }
      const loginRes = await fetch(`${WP}/wp-json/jwt-auth/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("ss_token", loginData.token);
        localStorage.setItem("ss_user", JSON.stringify({ name: loginData.user_display_name, email: loginData.user_email }));
        window.dispatchEvent(new Event("ss_auth_change"));
      }
      router.push("/");
    } catch {
      setError("সংযোগ সমস্যা। আবার চেষ্টা করুন।");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">একাউন্ট খুলুন</h1>
      <p className="mb-6 text-sm text-green-600 font-bold bg-green-50 px-4 py-3 rounded-lg">🎉 প্রথম অর্ডারে {firstDiscount} ছাড় পাবেন!</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">নাম *</label>
          <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required placeholder="আপনার পূর্ণ নাম" className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999]" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">ইমেইল *</label>
          <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required placeholder="example@gmail.com" className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999]" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">মোবাইল নম্বর *</label>
          {phoneError && <p className="mb-1 text-xs text-sale">{phoneError}</p>}
          <input type="tel" value={form.phone} onChange={e => handlePhone(e.target.value)} required placeholder="01XXXXXXXXX" className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">জেলা</label>
            <select value={form.district} onChange={e => handleDistrictChange(e.target.value)} className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999] bg-white">
              <option value="">জেলা সিলেক্ট</option>
              {DISTRICTS.map(d => <option key={d.en} value={d.en}>{d.bn}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">থানা</label>
            <select value={form.thana} onChange={e => handleThanaChange(e.target.value)} disabled={!form.district} className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999] bg-white disabled:opacity-50">
              <option value="">থানা সিলেক্ট</option>
              {thanas.map(t => <option key={t.en} value={t.en}>{t.bn}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">শিপিং ঠিকানা (গ্রাম/এলাকা, রাস্তা নম্বর)</label>
          <input type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder="গ্রাম/এলাকা, রাস্তা" className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999]" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">পাসওয়ার্ড *</label>
          <input type="password" value={form.password} onChange={e => set("password", e.target.value)} required placeholder="কমপক্ষে ৬ অক্ষর" minLength={6} className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999]" />
        </div>
        {error && <p className="text-sm text-sale">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-sm bg-accent py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
          {loading ? "লোড হচ্ছে..." : "একাউন্ট খুলুন"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        একাউন্ট আছে?{" "}
        <Link href="/login" className="font-bold text-accent underline">লগইন করুন</Link>
      </p>
    </div>
  );
}
