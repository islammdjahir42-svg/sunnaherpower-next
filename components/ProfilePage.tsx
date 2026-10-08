"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DISTRICTS, findDistrict, findThana } from "@/lib/bd-geo";
import Link from "next/link";

const WP = "https://wp.sunnaherpower.com";
const taka = (n: number) => "৳ " + n.toLocaleString("bn-BD");

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  "pending": { label: "অপেক্ষমাণ", color: "#f59e0b" },
  "processing": { label: "প্রক্রিয়াধীন", color: "#3b82f6" },
  "on-hold": { label: "হোল্ডে", color: "#8b5cf6" },
  "completed": { label: "সম্পন্ন", color: "#10b981" },
  "cancelled": { label: "বাতিল", color: "#ef4444" },
  "refunded": { label: "ফেরত", color: "#6b7280" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{name:string;email:string}|null>(null);
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"profile"|"orders">("profile");
  const [form, setForm] = useState({ name: "", phone: "", district: "", thana: "", address: "" });
  const [orders, setOrders] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const districtObj = React.useMemo(() => findDistrict(form.district), [form.district]);
  const thanas = districtObj?.thanas || [];

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleDistrictChange = (val: string) => {
    const d = findDistrict(val);
    setForm(f => ({ ...f, district: val, thana: "", address: d ? d.bn + ", " : "" }));
  };

  const handleThanaChange = (val: string) => {
    const t = findThana(districtObj, val);
    setForm(f => ({ ...f, thana: val, address: t ? t.bn + ", " + (districtObj?.bn || "") : f.address }));
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem("ss_user");
      const t = localStorage.getItem("ss_token");
      if (!u || !t) { router.push("/login"); return; }
      setUser(JSON.parse(u));
      setToken(t);
    } catch { router.push("/login"); }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${WP}/wp-json/sunnaher/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      setForm({ name: d.name || "", phone: d.phone || "", district: d.district || "", thana: d.thana || "", address: d.address || "" });
      setLoading(false);
    }).catch(() => setLoading(false));
    fetch(`${WP}/wp-json/sunnaher/v1/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${WP}/wp-json/sunnaher/v1/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const u = JSON.parse(localStorage.getItem("ss_user") || "{}");
    u.name = form.name;
    localStorage.setItem("ss_user", JSON.stringify(u));
    window.dispatchEvent(new Event("ss_auth_change"));
  };

  const logout = () => {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    window.dispatchEvent(new Event("ss_auth_change"));
    router.push("/");
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center text-muted">
        <div className="mb-3 text-3xl">⏳</div>
        <p>লোড হচ্ছে...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      {/* Profile Header */}
      <div style={{background:"linear-gradient(135deg,#f57c00,#e65100)"}} className="px-4 pt-10 pb-16 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-xl font-bold">{user?.name}</h1>
                <p className="text-sm text-white/80">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30">
              🚪 লগআউট
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-2xl px-4">
        <div className="-mt-6 mb-6 flex rounded-xl bg-white shadow-md overflow-hidden">
          <button
            onClick={() => setTab("profile")}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${tab === "profile" ? "bg-accent text-white" : "text-muted hover:bg-[#f7f7f7]"}`}
          >
            👤 প্রোফাইল
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${tab === "orders" ? "bg-accent text-white" : "text-muted hover:bg-[#f7f7f7]"}`}
          >
            📦 অর্ডার হিস্ট্রি {orders.length > 0 && <span className="ml-1 rounded-full bg-sale px-1.5 py-0.5 text-xs text-white">{orders.length}</span>}
          </button>
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="rounded-xl bg-white p-6 shadow-sm mb-8">
            <h2 className="mb-5 text-base font-bold text-ink">ব্যক্তিগত তথ্য</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">নাম</label>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">ইমেইল (পরিবর্তন করা যাবে না)</label>
                <input type="email" value={user?.email || ""} disabled className="w-full rounded-lg border border-line px-4 py-3 text-sm bg-[#f7f7f7] text-muted cursor-not-allowed" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">মোবাইল নম্বর</label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="01XXXXXXXXX" className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">শিপিং ঠিকানা</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select value={form.district} onChange={e => handleDistrictChange(e.target.value)} className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:outline-none focus:border-accent bg-white">
                    <option value="">জেলা সিলেক্ট</option>
                    {DISTRICTS.map(d => <option key={d.en} value={d.en}>{d.bn}</option>)}
                  </select>
                  <select value={form.thana} onChange={e => handleThanaChange(e.target.value)} disabled={!form.district} className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:outline-none focus:border-accent bg-white disabled:opacity-50">
                    <option value="">থানা সিলেক্ট</option>
                    {thanas.map(t => <option key={t.en} value={t.en}>{t.bn}</option>)}
                  </select>
                </div>
                <input type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder="গ্রাম/এলাকা, রাস্তা নম্বর" className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30" />
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity">
                {saved ? "✅ সেভ হয়েছে!" : saving ? "সেভ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
              </button>
            </form>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="mb-8 space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                <div className="mb-4 text-5xl">📦</div>
                <p className="mb-2 font-bold text-ink">এখনো কোনো অর্ডার নেই</p>
                <p className="mb-6 text-sm text-muted">আমাদের পণ্য দেখুন এবং আজই অর্ডার করুন!</p>
                <Link href="/shop" className="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-bold text-white hover:opacity-90">কেনাকাটা শুরু করুন</Link>
              </div>
            ) : orders.map((o: any) => {
              const st = STATUS_MAP[o.status] || { label: o.status, color: "#6b7280" };
              return (
                <div key={o.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-ink">অর্ডার #{o.id}</span>
                      <p className="text-xs text-muted mt-0.5">{o.date}</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{background: st.color}}>{st.label}</span>
                  </div>
                  <div className="border-t border-line pt-3">
                    <p className="text-sm text-muted mb-2">{o.items?.map((i: any) => `${i.name} ×${i.qty}`).join(", ")}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">সর্বমোট</span>
                      <span className="font-bold text-accent text-lg">{taka(o.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
