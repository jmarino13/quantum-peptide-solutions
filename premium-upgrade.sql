"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";

type CartItem = { sku: string; name: string; unitPrice: number; qty: number };

function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("qps_cart") || "[]"); } catch { return []; }
}
function writeCart(items: CartItem[]) {
  localStorage.setItem("qps_cart", JSON.stringify(items));
}

export default function CartPage() {
  return (
    <AuthGate requireRole="clinic">
      {({ profile }) => <CartInner userId={profile.id} clinicId={profile.clinic_id!} />}
    </AuthGate>
  );
}

function CartInner({ userId, clinicId }: { userId: string; clinicId: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setItems(readCart()), []);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0), [items]);

  function updateQty(sku: string, qty: number) {
    const next = items.map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, qty) } : i));
    setItems(next);
    writeCart(next);
  }

  function remove(sku: string) {
    const next = items.filter((i) => i.sku !== sku);
    setItems(next);
    writeCart(next);
  }

  async function submitOrder() {
    setErr(null);
    setMsg(null);

    if (!items.length) {
      setErr("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([
        {
          clinic_id: clinicId,
          created_by: userId,
          status: "submitted",
          note,
          total
        }
      ])
      .select("id")
      .single();

    if (orderErr) {
      setErr(orderErr.message);
      setSubmitting(false);
      return;
    }

    const orderId = order.id;

    // Create order items
    const { error: itemsErr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: orderId,
        sku: i.sku,
        name: i.name,
        unit_price: i.unitPrice,
        qty: i.qty
      }))
    );

    if (itemsErr) {
      setErr(itemsErr.message);
      setSubmitting(false);
      return;
    }

    // Clear cart
    writeCart([]);
    setItems([]);
    setMsg("Order submitted! You can view it in Order History.");
    setSubmitting(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cart</h1>
          <div className="mt-1 text-sm text-slate-400">Review items and submit your order.</div>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/catalog" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Catalog</Link>
          <Link href="/portal/orders" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Orders</Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
        {!items.length ? (
          <div className="text-slate-300">Your cart is empty.</div>
        ) : (
          <div className="space-y-4">
            {items.map((i) => (
              <div key={i.sku} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-xs text-slate-400">SKU: {i.sku} • {money(i.unitPrice)} each</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={(e) => updateQty(i.sku, Number(e.target.value || 1))}
                    className="w-24 rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2"
                  />
                  <button onClick={() => remove(i.sku)} className="rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10">
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-slate-400">Total</div>
              <div className="text-xl font-semibold">{money(Number(total.toFixed(2)))}</div>
            </div>

            <div className="grid gap-2 pt-2">
              <label className="text-sm text-slate-200">Order note (optional)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2" />
            </div>

            {err && <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">{err}</div>}
            {msg && <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm text-emerald-200">{msg}</div>}

            <button
              disabled={submitting}
              onClick={submitOrder}
              className="w-full rounded-2xl bg-white/10 px-5 py-3 hover:bg-white/15 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Order"}
            </button>

            <div className="text-xs text-slate-500">
              MVP behavior: submitting creates an order record. You can later add Stripe payment or invoice workflows.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
