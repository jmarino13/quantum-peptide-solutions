import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quantum Peptide Solutions",
  description: "Clinics-only wholesale portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-800 grid place-items-center text-sm font-bold">Q</div>
                <div>
                  <div className="text-sm font-semibold leading-4">Quantum Peptide Solutions</div>
                  <div className="text-xs text-slate-400">Clinics-only ordering portal</div>
                </div>
              </div>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link className="no-underline text-slate-200 hover:text-white" href="/register">Register</Link>
              <Link className="no-underline text-slate-200 hover:text-white" href="/login">Login</Link>
              <Link className="no-underline text-slate-200 hover:text-white" href="/portal">Portal</Link>
              <Link className="no-underline text-slate-200 hover:text-white" href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="border-t border-slate-800 py-8">
          <div className="mx-auto max-w-6xl px-4 text-xs text-slate-500">
            © {new Date().getFullYear()} Quantum Peptide Solutions • Clinics-only • All products for professional use.
          </div>
        </footer>
      </body>
    </html>
  );
}
