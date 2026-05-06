
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }

html, body {
  min-height: 100%;
}

body {
  @apply text-slate-50;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.18), transparent 24%),
    radial-gradient(circle at right top, rgba(14, 165, 233, 0.14), transparent 28%),
    linear-gradient(180deg, #020617 0%, #020617 45%, #030712 100%);
}

a { @apply underline decoration-slate-600 hover:decoration-slate-300; }

input, textarea, select {
  @apply outline-none;
}

.glass {
  @apply border border-white/10 bg-white/[0.03] backdrop-blur-xl;
  box-shadow: 0 12px 40px rgba(2, 6, 23, 0.35);
}

.section-title {
  @apply text-2xl font-semibold tracking-tight;
}

.status-pill {
  @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border;
}

.status-in_stock {
  @apply border-emerald-500/25 bg-emerald-500/10 text-emerald-300;
}

.status-low_stock {
  @apply border-amber-500/25 bg-amber-500/10 text-amber-300;
}

.status-out_of_stock {
  @apply border-red-500/25 bg-red-500/10 text-red-300;
}
