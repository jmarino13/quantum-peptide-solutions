"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { MARKUP_RATE } from "@/lib/env";
import { money } from "@/lib/format";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  path_price: number;
  active: boolean;
};

export default function CatalogPage() {
  return (
    <AuthGate requireRole="clinic">
      {() => <CatalogInner />}
    </AuthGate>
  );
}

function CatalogInner() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("products")
        .select("id,sku,name,category,path_price,active")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) setErr(error.message);
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => (p.name + " " + p.sku + " " + (p.category ?? "")).toLowerCase().includes(term));
  }, [q, products]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Catalog</h1>
          <div className="mt-1 text-sm text-slate-400">Pricing shown includes a {Math.round(MARKUP_RATE * 100)}% markup over Path base.</div>
        </div>
        <Link href="/portal" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Back</Link>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/10 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, SKU, category…"
          className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3"
        />
      </div>

      {err && <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">{err}</div>}

      {loading ? (
        <div className="text-slate-300">Loading products…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => {
            const price = Number((p.path_price * (1 + MARKUP_RATE)).toFixed(2));
            return (
              <div key={p.id} className="rounded-3xl border border-slate-800 bg-slate-900/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="mt-1 text-xs text-slate-400">SKU: {p.sku}{p.category ? ` • ${p.category}` : ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Price</div>
                    <div className="text-lg font-semibold">{money(price)}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link className="no-underline rounded-2xl bg-white/10 px-4 py-2 hover:bg-white/15" href={`/portal/product/${encodeURIComponent(p.sku)}`}>
                    View
                  </Link>
                </div>
              </div>
            );
          })}
          {!filtered.length && <div className="text-slate-400">No products match your search.</div>}
        </div>
      )}
    </div>
  );
}
