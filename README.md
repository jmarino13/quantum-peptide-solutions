# Quantum Peptide Solutions — Starter Portal

Clinics-only wholesale portal (Next.js + Supabase + Vercel).

## What’s included (MVP)
- Clinic registration + login
- Admin bootstrap (first admin email)
- Clinic approval gate (pending/approved/denied)
- Catalog with pricing (Path base price + markup)
- Cart (localStorage) + submit order
- Order history + order detail
- Admin: approve clinics + add/update products

---

## 1) Create Supabase project + run schema
1. Supabase → New Project
2. Open **SQL Editor**
3. Paste and run: `supabase/schema.sql`

---

## 2) Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# defaults (you can change)
NEXT_PUBLIC_MARKUP_RATE=0.30
NEXT_PUBLIC_ADMIN_EMAIL=jude@lmgmedicine.com
```

---

## 3) Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

---

## 4) Create the first admin user
Go to `/register` and register with:

**jude@lmgmedicine.com**

That email will be assigned `role = admin`.

---

## 5) Deploy on Vercel
- Import GitHub repo into Vercel
- Add the same environment variables in Vercel Project Settings
- Deploy

---

## Notes / next upgrades
- Add CSV import for Path product list
- Add Stripe (card) or invoicing/terms
- Add shipment tracking + status updates
- Add clinic user management (multiple users per clinic)
