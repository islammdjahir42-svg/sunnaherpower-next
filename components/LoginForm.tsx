"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site";

const WP = SITE.wpUrl;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${WP}/wp-json/jwt-auth/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
        setLoading(false);
        return;
      }
      localStorage.setItem("ss_token", data.token);
      localStorage.setItem("ss_user", JSON.stringify({ name: data.user_display_name, email: data.user_email }));
      window.dispatchEvent(new Event("ss_auth_change"));
      router.push("/");
    } catch {
      setError("সংযোগ সমস্যা। আবার চেষ্টা করুন।");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">লগইন করুন</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">ইমেইল</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            required
            className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">পাসওয়ার্ড</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-[#999]"
          />
        </div>
        {error && <p className="text-sm text-sale">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-accent py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "লোড হচ্ছে..." : "লগইন করুন"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        একাউন্ট নেই?{" "}
        <Link href="/register" className="font-bold text-accent underline">রেজিস্ট্রার করুন</Link>
      </p>
    </div>
  );
}
