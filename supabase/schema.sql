-- Quantum Peptide Solutions (QPS) Supabase schema
-- Run this in Supabase SQL Editor (in order).

-- 1) Extensions
create extension if not exists "pgcrypto";

-- 2) Clinics
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now()
);

-- 3) Profiles (maps auth.users -> role + clinic linkage)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'clinic' check (role in ('admin','clinic')),
  clinic_id uuid references public.clinics(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4) Products (Path base price stored; Quantum price computed in app as path_price * 1.30)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text,
  description text,
  path_price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5) Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'submitted',
  note text,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- 6) Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text not null,
  name text not null,
  unit_price numeric(12,2) not null default 0,
  qty integer not null default 1 check (qty >= 1),
  created_at timestamptz not null default now()
);

-- =========================
-- RLS (Row Level Security)
-- =========================
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper: is admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Helper: current user's clinic_id
create or replace function public.my_clinic_id()
returns uuid
language sql
stable
as $$
  select p.clinic_id from public.profiles p where p.id = auth.uid();
$$;

-- Profiles: users can read/update their own profile; admin can read all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Clinics: admin can see all; clinic users can see their own clinic row
drop policy if exists "clinics_select_own_or_admin" on public.clinics;
create policy "clinics_select_own_or_admin"
on public.clinics for select
using (public.is_admin() or id = public.my_clinic_id());

-- Clinics insert: allow authenticated users to create (registration). (Admin may not need.)
drop policy if exists "clinics_insert_authenticated" on public.clinics;
create policy "clinics_insert_authenticated"
on public.clinics for insert
with check (auth.uid() is not null);

-- Clinics update: admin only (approvals)
drop policy if exists "clinics_update_admin_only" on public.clinics;
create policy "clinics_update_admin_only"
on public.clinics for update
using (public.is_admin())
with check (public.is_admin());

-- Products: approved clinics + admins can read; admin can write
drop policy if exists "products_select_approved_or_admin" on public.products;
create policy "products_select_approved_or_admin"
on public.products for select
using (
  public.is_admin()
  or (
    exists (
      select 1 from public.clinics c
      where c.id = public.my_clinic_id() and c.status = 'approved'
    )
  )
);

drop policy if exists "products_insert_admin_only" on public.products;
create policy "products_insert_admin_only"
on public.products for insert
with check (public.is_admin());

drop policy if exists "products_update_admin_only" on public.products;
create policy "products_update_admin_only"
on public.products for update
using (public.is_admin())
with check (public.is_admin());

-- Orders: approved clinics can create/read own; admin can read/write all
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
on public.orders for select
using (public.is_admin() or clinic_id = public.my_clinic_id());

drop policy if exists "orders_insert_approved_clinic" on public.orders;
create policy "orders_insert_approved_clinic"
on public.orders for insert
with check (
  public.is_admin()
  or (
    clinic_id = public.my_clinic_id()
    and exists (select 1 from public.clinics c where c.id = public.my_clinic_id() and c.status = 'approved')
  )
);

drop policy if exists "orders_update_admin_only" on public.orders;
create policy "orders_update_admin_only"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

-- Order items: must follow order ownership; admin can do all
drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin"
on public.order_items for select
using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.clinic_id = public.my_clinic_id()
  )
);

drop policy if exists "order_items_insert_approved_clinic" on public.order_items;
create policy "order_items_insert_approved_clinic"
on public.order_items for insert
with check (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    join public.clinics c on c.id = o.clinic_id
    where o.id = order_id
      and o.clinic_id = public.my_clinic_id()
      and c.status = 'approved'
  )
);

drop policy if exists "order_items_update_admin_only" on public.order_items;
create policy "order_items_update_admin_only"
on public.order_items for update
using (public.is_admin())
with check (public.is_admin());

-- Done.
