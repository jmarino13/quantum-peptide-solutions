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
  image_url: string | null;
  inventory_status: "in_stock" | "low_stock" | "out_of_stock" | null;
};

const statusLabel = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock"
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
        .select("id,sku,name,category,path_price,active,image_url,inventory_status")
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
          <h1 className="section-title">Catalog</h1>
          <div className="mt-1 text-sm text-slate-400">
            Clinic price shown includes a {Math.round(MARKUP_RATE * 100)}% markup over Path base cost.
          </div>
        </div>
        <Link href="/portal" className="no-underline rounded-2xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
          Back
        </Link>
      </div>

      <div className="glass rounded-[2rem] p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, SKU, or category…"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
        />
      </div>

      {err && <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">{err}</div>}

      {loading ? (
        <div className="text-slate-300">Loading products…</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const price = Number((p.path_price * (1 + MARKUP_RATE)).toFixed(2));
            const status = p.inventory_status ?? "in_stock";
            return (
              <div key={p.id} className="glass overflow-hidden rounded-[2rem]">
                <div className="aspect-[4/3] w-full bg-slate-900/70">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,1))] p-8 text-center text-sm text-slate-400">
                      Product image placeholder
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        SKU: {p.sku}{p.category ? ` • ${p.category}` : ""}
                      </div>
                    </div>
                    <div className={`status-pill status-${status}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {statusLabel[status]}
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Clinic price</div>
                      <div className="text-xl font-semibold">{money(price)}</div>
                    </div>
                    <Link
                      className="no-underline rounded-2xl bg-white/10 px-4 py-2 hover:bg-white/15"
                      href={`/portal/product/${encodeURIComponent(p.sku)}`}
                    >
                      View
                    </Link>
                  </div>
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
