"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ADMIN_EMAIL } from "@/lib/env";
import Link from "next/link";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");
    const clinicName = String(fd.get("clinic_name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const address = String(fd.get("address") || "").trim();

    if (!email || !password || !clinicName) {
      setErr("Please complete email, password, and clinic name.");
      setLoading(false);
      return;
    }

    const isAdmin = email === ADMIN_EMAIL;

    // 1) Create auth user
    const { data: signup, error: signErr } = await supabase.auth.signUp({
      email,
      password
    });

    if (signErr) {
      setErr(signErr.message);
      setLoading(false);
      return;
    }

    const userId = signup.user?.id;
    if (!userId) {
      setErr("Signup succeeded but user id was not returned. Try logging in.");
      setLoading(false);
      return;
    }

    // 2) Create clinic (for non-admin users). Admin can skip clinic and still manage everything.
    let clinicId: string | null = null;
    if (!isAdmin) {
      const { data: clinic, error: clinicErr } = await supabase
        .from("clinics")
        .insert([{ name: clinicName, phone, address, status: "pending" }])
        .select("id")
        .single();

      if (clinicErr) {
        setErr(clinicErr.message);
        setLoading(false);
        return;
      }
      clinicId = clinic.id;
    }

    // 3) Create profile
    const { error: profErr } = await supabase.from("profiles").insert([
      {
        id: userId,
        email,
        role: isAdmin ? "admin" : "clinic",
        clinic_id: clinicId
      }
    ]);

    if (profErr) {
      setErr(profErr.message);
      setLoading(false);
      return;
    }

    setMsg(
      isAdmin
        ? "Admin account created. You can now log in and approve clinics."
        : "Registration submitted. Please log in — your clinic will show as Pending until approved."
    );
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clinic Registration</h1>
        <p className="mt-2 text-sm text-slate-300">
          Create your account and submit your clinic info. Approval is required before pricing and ordering are available.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
        <div className="grid gap-2">
          <label className="text-sm text-slate-200">Email</label>
          <input name="email" type="email" required className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-200">Password</label>
          <input name="password" type="password" required className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
          <div className="text-xs text-slate-500">Use a strong password. (You can add password reset later.)</div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-200">Clinic Name</label>
          <input name="clinic_name" required className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-200">Phone (optional)</label>
          <input name="phone" className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-200">Shipping Address (optional)</label>
          <textarea name="address" rows={3} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
        </div>

        {err && (
          <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">{err}</div>
        )}
        {msg && (
          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm text-emerald-200">
            {msg}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-white/10 px-5 py-3 hover:bg-white/15 disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Create Account"}
        </button>

        <div className="text-xs text-slate-400">
          Already have an account? <Link href="/login">Login</Link>
        </div>
      </form>

      <div className="text-xs text-slate-500">
        Admin bootstrap: registering with <b>{ADMIN_EMAIL}</b> will create an admin user.
      </div>
    </div>
  );
}
