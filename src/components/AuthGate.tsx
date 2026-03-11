"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Profile = {
  id: string;
  email: string | null;
  role: "admin" | "clinic";
  clinic_id: string | null;
};

type Clinic = {
  id: string;
  name: string;
  status: "pending" | "approved" | "denied";
};

export function AuthGate({
  requireRole,
  children
}: {
  requireRole?: "admin" | "clinic";
  children: (ctx: { profile: Profile; clinic: Clinic | null }) => React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needAdmin = useMemo(() => requireRole === "admin", [requireRole]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (!user) {
        if (mounted) {
          setLoading(false);
          setProfile(null);
        }
        return;
      }

      // Fetch profile (created during signup)
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id,email,role,clinic_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profErr) {
        if (mounted) {
          setError(profErr.message);
          setLoading(false);
        }
        return;
      }

      if (!prof) {
        if (mounted) {
          setError("Profile not found. Please contact support.");
          setLoading(false);
        }
        return;
      }

      setProfile(prof as Profile);

      if (prof.clinic_id) {
        const { data: cl, error: clErr } = await supabase
          .from("clinics")
          .select("id,name,status")
          .eq("id", prof.clinic_id)
          .maybeSingle();

        if (clErr) {
          if (mounted) setError(clErr.message);
        } else {
          setClinic((cl as Clinic) ?? null);
        }
      } else {
        setClinic(null);
      }

      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading…</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-5">
        <div className="font-semibold">Something went wrong</div>
        <div className="mt-1 text-sm text-red-200">{error}</div>
        <div className="mt-3 text-sm text-slate-300">
          Try logging out and back in, or contact your admin.
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
        <div className="text-lg font-semibold">Please log in</div>
        <div className="mt-2 text-sm text-slate-300">
          You must be logged in to access this page.
        </div>
        <div className="mt-4 flex gap-3">
          <Link className="no-underline rounded-xl bg-white/10 px-4 py-2 hover:bg-white/15" href="/login">
            Go to Login
          </Link>
          <Link className="no-underline rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10" href="/register">
            Register Clinic
          </Link>
        </div>
      </div>
    );
  }

  if (needAdmin && profile.role !== "admin") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
        <div className="text-lg font-semibold">Admin access required</div>
        <div className="mt-2 text-sm text-slate-300">
          Your account does not have permission to view this page.
        </div>
      </div>
    );
  }

  if (requireRole === "clinic") {
    if (!clinic) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
          <div className="text-lg font-semibold">Clinic account not linked</div>
          <div className="mt-2 text-sm text-slate-300">
            This user is not linked to a clinic profile.
          </div>
        </div>
      );
    }
    if (clinic.status !== "approved") {
      return (
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-6">
          <div className="text-lg font-semibold">Awaiting approval</div>
          <div className="mt-2 text-sm text-slate-200">
            Your clinic registration is currently <b>{clinic.status}</b>. Once approved, you’ll see pricing and ordering.
          </div>
          <div className="mt-4 text-sm text-slate-300">
            If you believe this is an error, contact Quantum Peptide Solutions support.
          </div>
        </div>
      );
    }
  }

  return <>{children({ profile, clinic })}</>;
}
