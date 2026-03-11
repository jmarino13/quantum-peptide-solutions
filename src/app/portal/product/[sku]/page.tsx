"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { MARKUP_RATE } from "@/lib/env";
import { money } from "@/lib/format";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  description: string | null;
  path_price: number;
  active: boolean;
};

type CartItem = { sku: string; name: string; unitPrice: number; qty: number };

function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("qps_cart") || "[]"); } catch { return []; }
}
function writeCart(items: CartItem[]) {
  localStorage.setItem("qps_cart", JSON.stringify(items));
}

export default function ProductPage() {
  return (
    <AuthGate requireRole="clinic">
      {() => <ProductInner />}
    </AuthGate>
  );
}

function ProductInner() {
  const params = useParams<{ sku: string }>();
  const sku = decodeURIComponent(params.sku);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("products")
        .select("id,sku,name,category,description,path_price,active")
        .eq("sku", sku)
        .eq("active", true)
        .maybeSingle();

      if (error) setErr(error.message);
      setP((data as Product) ?? null);
      setLoading(false);
    })();
  }, [sku]);

  const price = useMemo(() => {
    if (!p) return 0;
    return Number((p.path_price * (1 + MARKUP_RATE)).toFixed(2));
  }, [p]);

  function addToCart() {
    if (!p) return;
    const items = readCart();
    const existing = items.find((i) => i.sku === p.sku);
    if (existing) existing.qty += qty;
    else items.push({ sku: p.sku, name: p.name, unitPrice: price, qty });
    writeCart(items);
    setMsg("Added to cart.");
    setTimeout(() => setMsg(null), 1500);
  }

  if (loading) return <div className="text-slate-300">Loading…</div>;
  if (err) return <div className="text-red-200">{err}</div>;
  if (!p) return <div className="text-slate-300">Product not found.</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <div className="mt-1 text-sm text-slate-400">SKU: {p.sku}{p.category ? ` • ${p.category}` : ""}</div>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/catalog" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Back</Link>
          <Link href="/portal/cart" className="no-underline rounded-2xl bg-white/10 px-4 py-2 hover:bg-white/15">Cart</Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-sm text-slate-300 whitespace-pre-wrap">{p.description || "No description yet."}</div>
          </div>
          <div className="min-w-[240px] rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <div className="text-sm text-slate-400">Your price</div>
            <div className="text-2xl font-semibold">{money(price)}</div>

            <div className="mt-4 grid gap-2">
              <label className="text-xs text-slate-400">Quantity</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2"
              />
            </div>

            <button onClick={addToCart} className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 hover:bg-white/15">
              Add to cart
            </button>

            {msg && <div className="mt-3 text-sm text-emerald-200">{msg}</div>}
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/portal/cart")}
        className="rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10"
      >
        Go to cart →
      </button>
    </div>
  );
}
