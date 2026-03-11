import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/20 p-8">
        <div className="text-3xl font-semibold tracking-tight">Quantum Peptide Solutions</div>
        <p className="mt-3 max-w-2xl text-slate-300">
          A clinics-only wholesale portal for peptides. Register your clinic, get approved, and place orders from our catalog.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="no-underline rounded-2xl bg-white/10 px-5 py-3 hover:bg-white/15" href="/register">
            Register Your Clinic
          </Link>
          <Link className="no-underline rounded-2xl bg-white/5 px-5 py-3 hover:bg-white/10" href="/login">
            Login
          </Link>
          <Link className="no-underline rounded-2xl bg-white/5 px-5 py-3 hover:bg-white/10" href="/portal">
            Go to Portal
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Clinic Approval", body: "Registration is reviewed to keep the portal clinics-only." },
          { title: "Catalog + Ordering", body: "Search products, add to cart, and submit orders." },
          { title: "Simple Pricing", body: "Pricing is automatically calculated from Path base pricing with a fixed markup." }
        ].map((c) => (
          <div key={c.title} className="rounded-3xl border border-slate-800 bg-slate-900/10 p-6">
            <div className="font-semibold">{c.title}</div>
            <div className="mt-2 text-sm text-slate-300">{c.body}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
