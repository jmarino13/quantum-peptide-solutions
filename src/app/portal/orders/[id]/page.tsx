"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";

type Order = { id: string; status: string; total: number; created_at: string; note: string | null; clinic_id: string };
type Item = { id: string; sku: string; name: string; unit_price: number; qty: number };

export default function OrderDetailPage() {
  return (
    <AuthGate requireRole="clinic">
      {({ profile }) => <Inner clinicId={profile.clinic_id!} />}
    </AuthGate>
  );
}

function Inner({ clinicId }: { clinicId: string }) {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data: o, error: oErr } = await supabase
        .from("orders")
        .select("id,status,total,created_at,note,clinic_id")
        .eq("id", id)
        .maybeSingle();

      if (oErr) {
        setErr(oErr.message);
        setLoading(false);
        return;
      }

      if (!o || (o as Order).clinic_id !== clinicId) {
        setErr("Order not found.");
        setLoading(false);
        return;
      }

      setOrder(o as Order);

      const { data: it, error: itErr } = await supabase
        .from("order_items")
        .select("id,sku,name,unit_price,qty")
        .eq("order_id", id)
        .order("name", { ascending: true });

      if (itErr) setErr(itErr.message);
      setItems((it as Item[]) ?? []);
      setLoading(false);
    })();
  }, [id, clinicId]);

  if (loading) return <div className="text-slate-300">Loading…</div>;
  if (err) return <div className="text-red-200">{err}</div>;
  if (!order) return <div className="text-slate-300">Not found.</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order {order.id.slice(0, 8).toUpperCase()}</h1>
          <div className="mt-1 text-sm text-slate-400">
            {new Date(order.created_at).toLocaleString()} • Status: <b className="text-slate-200">{order.status}</b>
          </div>
        </div>
        <Link href="/portal/orders" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Back</Link>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">Total</div>
          <div className="text-xl font-semibold">{money(order.total)}</div>
        </div>

        {order.note ? (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="text-xs text-slate-400">Note</div>
            <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">{order.note}</div>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="font-semibold">{i.name}</div>
                <div className="text-xs text-slate-400">SKU: {i.sku}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">{i.qty} × {money(i.unit_price)}</div>
                <div className="text-sm text-slate-400">Line: {money(Number((i.qty * i.unit_price).toFixed(2)))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
