"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
};

export default function OrdersPage() {
  return (
    <AuthGate requireRole="clinic">
      {({ profile }) => <OrdersInner clinicId={profile.clinic_id!} />}
    </AuthGate>
  );
}

function OrdersInner({ clinicId }: { clinicId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total,created_at")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      if (error) setErr(error.message);
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, [clinicId]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order History</h1>
          <div className="mt-1 text-sm text-slate-400">Your submitted orders.</div>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/catalog" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Catalog</Link>
          <Link href="/portal/cart" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Cart</Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
        {err && <div className="text-sm text-red-200">{err}</div>}
        {loading ? (
          <div className="text-slate-300">Loading…</div>
        ) : orders.length ? (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/portal/orders/${o.id}`}
                className="no-underline block rounded-2xl border border-slate-800 bg-slate-950/30 p-4 hover:bg-slate-950/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">Order {o.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-xs text-slate-400">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Status</div>
                    <div className="text-sm font-semibold">{o.status}</div>
                    <div className="mt-1 text-sm">{money(o.total)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-slate-300">No orders yet.</div>
        )}
      </div>
    </div>
  );
}
