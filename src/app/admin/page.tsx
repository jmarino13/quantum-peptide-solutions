"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { MARKUP_RATE } from "@/lib/env";
import { money } from "@/lib/format";

type Clinic = { id: string; name: string; phone: string | null; address: string | null; status: "pending" | "approved" | "denied"; created_at: string };
type Product = { id: string; sku: string; name: string; category: string | null; path_price: number; active: boolean; created_at: string };

export default function AdminPage() {
  return (
    <AuthGate requireRole="admin">
      {({ profile }) => <AdminInner email={profile.email || ""} />}
    </AuthGate>
  );
}

function AdminInner({ email }: { email: string }) {
  const [tab, setTab] = useState<"clinics" | "products">("clinics");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="mt-1 text-sm text-slate-300">Logged in as <b>{email}</b></div>
          <div className="mt-1 text-xs text-slate-500">Markup: {Math.round(MARKUP_RATE * 100)}%</div>
        </div>
        <div className="flex gap-2">
          <Link href="/portal" className="no-underline rounded-2xl bg-white/5 px-4 py-2 hover:bg-white/10">Clinic Portal</Link>
          <button onClick={() => supabase.auth.signOut()} className="rounded-2xl bg-white/10 px-4 py-2 hover:bg-white/15">Logout</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("clinics")} className={`rounded-2xl px-4 py-2 ${tab === "clinics" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}>Clinics</button>
        <button onClick={() => setTab("products")} className={`rounded-2xl px-4 py-2 ${tab === "products" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}>Products</button>
      </div>

      {tab === "clinics" ? <ClinicsTab /> : <ProductsTab />}
    </div>
  );
}

function ClinicsTab() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("clinics")
      .select("id,name,phone,address,status,created_at")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setClinics((data as Clinic[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function setStatus(id: string, status: Clinic["status"]) {
    const { error } = await supabase.from("clinics").update({ status }).eq("id", id);
    if (error) setErr(error.message);
    else refresh();
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Clinic Approvals</div>
        <button onClick={refresh} className="rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 text-sm">Refresh</button>
      </div>

      {err && <div className="mt-3 text-sm text-red-200">{err}</div>}
      {loading ? (
        <div className="mt-4 text-slate-300">Loading…</div>
      ) : (
        <div className="mt-4 space-y-3">
          {clinics.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleString()} • {c.phone || "No phone"} • {c.address || "No address"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-400">Status:</span>
                  <span className="text-sm font-semibold">{c.status}</span>
                  <button onClick={() => setStatus(c.id, "approved")} className="rounded-2xl bg-emerald-500/15 px-3 py-2 hover:bg-emerald-500/20 text-sm">Approve</button>
                  <button onClick={() => setStatus(c.id, "denied")} className="rounded-2xl bg-red-500/15 px-3 py-2 hover:bg-red-500/20 text-sm">Deny</button>
                  <button onClick={() => setStatus(c.id, "pending")} className="rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 text-sm">Set Pending</button>
                </div>
              </div>
            </div>
          ))}
          {!clinics.length && <div className="text-slate-400">No clinics yet.</div>}
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function refresh() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("products")
      .select("id,sku,name,category,path_price,active,created_at")
      .order("name", { ascending: true });
    if (error) setErr(error.message);
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => (p.name + " " + p.sku + " " + (p.category ?? "")).toLowerCase().includes(term));
  }, [q, products]);

  async function upsertProduct(fd: FormData) {
    const sku = String(fd.get("sku") || "").trim();
    const name = String(fd.get("name") || "").trim();
    const category = String(fd.get("category") || "").trim() || null;
    const desc = String(fd.get("description") || "").trim() || null;
    const pathPrice = Number(fd.get("path_price") || 0);

    if (!sku || !name || !pathPrice) {
      setErr("SKU, name, and Path price are required.");
      return;
    }

    const { error } = await supabase.from("products").upsert([
      { sku, name, category, description: desc, path_price: pathPrice, active: true }
    ], { onConflict: "sku" });

    if (error) setErr(error.message);
    else {
      (document.getElementById("productForm") as HTMLFormElement | null)?.reset();
      refresh();
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from("products").update({ active }).eq("id", id);
    if (error) setErr(error.message);
    else refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">Products</div>
          <button onClick={refresh} className="rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 text-sm">Refresh</button>
        </div>

        <div className="mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3"
          />
        </div>

        {err && <div className="mt-3 text-sm text-red-200">{err}</div>}
        {loading ? (
          <div className="mt-4 text-slate-300">Loading…</div>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((p) => {
              const price = Number((p.path_price * (1 + MARKUP_RATE)).toFixed(2));
              return (
                <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{p.name} <span className="text-xs text-slate-400">({p.sku})</span></div>
                      <div className="text-xs text-slate-400">{p.category || "Uncategorized"}</div>
                      <div className="mt-1 text-xs text-slate-400">Path: {money(p.path_price)} • Quantum: <b className="text-slate-200">{money(price)}</b></div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-slate-400">{p.active ? "Active" : "Inactive"}</span>
                      <button onClick={() => toggleActive(p.id, !p.active)} className="rounded-2xl bg-white/5 px-3 py-2 hover:bg-white/10 text-sm">
                        {p.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!filtered.length && <div className="text-slate-400">No products.</div>}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
        <div className="font-semibold">Add / Update Product</div>
        <div className="mt-1 text-xs text-slate-500">Upserts by SKU.</div>

        <form
          id="productForm"
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            upsertProduct(new FormData(e.currentTarget));
          }}
        >
          <div className="grid gap-2">
            <label className="text-xs text-slate-400">SKU</label>
            <input name="sku" className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2" required />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-400">Name</label>
            <input name="name" className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2" required />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-400">Category</label>
            <input name="category" className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2" />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-400">Path Price</label>
            <input name="path_price" type="number" step="0.01" min="0" className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2" required />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-400">Description</label>
            <textarea name="description" rows={4} className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2" />
          </div>
          <button className="w-full rounded-2xl bg-white/10 px-4 py-3 hover:bg-white/15">Save Product</button>
        </form>

        <div className="mt-4 text-xs text-slate-500">
          Tip: Start by adding a few core SKUs, then expand. CSV import can be added next.
        </div>
      </div>
    </div>
  );
}
