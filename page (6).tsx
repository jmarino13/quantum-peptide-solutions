"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
    } else {
      setMsg("Logged in. You can now open the Portal.");
    }
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setMsg("Logged out.");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-slate-300">Access the clinic portal or admin dashboard.</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
        <div className="grid gap-2">
          <label className="text-sm text-slate-200">Email</label>
          <input name="email" type="email" required className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-200">Password</label>
          <input name="password" type="password" required className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
        </div>

        {err && (
          <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">{err}</div>
        )}
        {msg && (
          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm text-emerald-200">
            {msg}
          </div>
        )}

        <button disabled={loading} className="w-full rounded-2xl bg-white/10 px-5 py-3 hover:bg-white/15 disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link href="/register">Register</Link>
          <button type="button" onClick={logout} className="underline decoration-slate-600 hover:decoration-slate-300">
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}
