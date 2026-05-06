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
  image_url: string | null;
  inventory_status: "in_stock" | "low_stock" | "out_of_stock" | null;
};

type CartItem = { sku: string; name: string; unitPrice: number; qty: number };

function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("qps_cart") || "[]"); } catch { return []; }
}
function writeCart(items: CartItem[]) {
  localStorage.setItem("qps_cart", JSON.stringify(items));
}

const statusLabel = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock"
};

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
        .select("id,sku,name,category,description,path_price,active,image_url,inventory_status")
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
    const status = p.inventory_status ?? "in_stock";
    if (status === "out_of_stock") {
      setErr("This product is currently out of stock.");
      return;
    }
    const items = readCart();
    const existing = items.find((i) => i.sku === p.sku);
    if (existing) existing.qty += qty;
    else items.push({ sku: p.sku, name: p.name, unitPrice: price, qty });
    writeCart(items);
    setMsg("Added to cart.");
    setTimeout(() => setMsg(null), 1500);
  }

  if (loading) return <div className="text-slate-300">Loading…</div>;
  if (err && !p) return <div className="text-red-200">{err}</div>;
  if (!p) return <div className="text-slate-300">Product not found.</div>;

  const status = p.inventory_status ?? "in_stock";

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="section-title">{p.name}</h1>
          <div className="mt-1 text-sm text-slate-400">SKU: {p.sku}{p.category ? ` • ${p.category}` : ""}</div>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/catalog" className="no-underline rounded-2xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Back</Link>
          <Link href="/portal/cart" className="no-underline rounded-2xl bg-white/10 px-4 py-2 hover:bg-white/15">Cart</Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="glass overflow-hidden rounded-[2rem]">
          <div className="aspect-[4/3] w-full bg-slate-900/70">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,1))] p-8 text-center text-sm text-slate-400">
                Product image placeholder
              </div>
            )}
          </div>

          <div className="space-y-4 p-6">
            <div className={`status-pill status-${status}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {statusLabel[status]}
            </div>
            <div className="text-sm leading-7 text-slate-300 whitespace-pre-wrap">
              {p.description || "No description yet."}
            </div>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Clinic price</div>
          <div className="text-3xl font-semibold">{money(price)}</div>

          <div className="mt-6 grid gap-2">
            <label className="text-xs text-slate-400">Quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2"
              disabled={status === "out_of_stock"}
            />
          </div>

          <button
            onClick={addToCart}
            disabled={status === "out_of_stock"}
            className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "out_of_stock" ? "Out of stock" : "Add to cart"}
          </button>

          {msg && <div className="mt-3 text-sm text-emerald-200">{msg}</div>}
          {err && <div className="mt-3 text-sm text-red-200">{err}</div>}

          <button
            onClick={() => router.push("/portal/cart")}
            className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
          >
            Go to cart →
          </button>
        </div>
      </div>
    </div>
  );
}
