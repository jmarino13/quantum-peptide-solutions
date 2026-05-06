import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="glass rounded-[2rem] p-8 md:p-12">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
            Wholesale peptide portal for approved clinics
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
            Quantum Peptide Solutions
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Premium clinic ordering with approval workflow, live catalog visibility, markup automation, and streamlined reordering.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="no-underline rounded-2xl bg-white/10 px-5 py-3 hover:bg-white/15" href="/register">
              Register Your Clinic
            </Link>
            <Link className="no-underline rounded-2xl border border-white/10 bg-white/5 px-5 py-3 hover:bg-white/10" href="/login">
              Login
            </Link>
            <Link className="no-underline rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-100 hover:bg-cyan-400/15" href="/portal">
              Open Portal
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Clinic Approval", body: "Keep pricing and ordering private until a clinic has been approved." },
          { title: "Premium Catalog", body: "Show branded product cards with images, stock status, and quick ordering." },
          { title: "Markup Automation", body: "Store Path base price once and let Quantum pricing calculate automatically." }
        ].map((c) => (
          <div key={c.title} className="glass rounded-[2rem] p-6">
            <div className="font-semibold text-white">{c.title}</div>
            <div className="mt-3 text-sm leading-7 text-slate-300">{c.body}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
