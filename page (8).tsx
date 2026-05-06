"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";

export default function PortalPage() {
  return (
    <AuthGate requireRole="clinic">
      {({ profile, clinic }) => (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Clinic Portal</h1>
              <div className="mt-2 text-sm text-slate-300">
                Logged in as <b>{profile.email}</b> • Clinic: <b>{clinic?.name}</b>
              </div>
            </div>
            <button
              className="rounded-2xl bg-white/10 px-4 py-2 hover:bg-white/15"
              onClick={() => supabase.auth.signOut()}
            >
              Logout
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/portal/catalog" className="no-underline rounded-3xl border border-slate-800 bg-slate-900/10 p-6 hover:bg-slate-900/20">
              <div className="font-semibold">Browse Catalog</div>
              <div className="mt-2 text-sm text-slate-300">Search products, view pricing, and add to cart.</div>
            </Link>
            <Link href="/portal/cart" className="no-underline rounded-3xl border border-slate-800 bg-slate-900/10 p-6 hover:bg-slate-900/20">
              <div className="font-semibold">Cart</div>
              <div className="mt-2 text-sm text-slate-300">Review items and submit an order.</div>
            </Link>
            <Link href="/portal/orders" className="no-underline rounded-3xl border border-slate-800 bg-slate-900/10 p-6 hover:bg-slate-900/20">
              <div className="font-semibold">Order History</div>
              <div className="mt-2 text-sm text-slate-300">Track past orders and statuses.</div>
            </Link>
          </div>
        </div>
      )}
    </AuthGate>
  );
}
