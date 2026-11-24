-- ============================================================================
-- PHARMINVIN — Smart Pharmacy Inventory & Patient Care Platform
-- Supabase PostgreSQL Production Schema (Run inside Supabase SQL Editor)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. User Profiles (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('admin', 'patient')) default 'patient',
  facility_name text default 'Pharminvin Central Hub — Navi Mumbai',
  created_at timestamptz default now()
);

-- 2. Storage Zones (IoT Cold-Chain & Ambient)
create table if not exists public.storage_zones (
  id text primary key,
  name text not null,
  code text not null,
  min_temp numeric not null,
  max_temp numeric not null,
  current_temp numeric not null,
  humidity numeric not null,
  max_humidity numeric not null default 60,
  status text not null check (status in ('optimal', 'warning', 'breach')) default 'optimal',
  breach_reason text,
  updated_at timestamptz default now()
);

-- 3. Inventory Batches (FEFO Automation Engine)
create table if not exists public.inventory_batches (
  id text primary key,
  batch_id text unique not null,
  name text not null,
  generic_name text not null,
  manufacturer text not null,
  category text not null,
  manufacture_date date not null,
  expiry_date date not null,
  quantity integer not null check (quantity >= 0),
  reorder_point integer not null default 100,
  unit_price numeric not null,
  shelf_zone_id text not null references public.storage_zones(id),
  shelf_zone_label text not null,
  status text not null check (status in ('active', 'quarantined', 'depleted')) default 'active',
  velocity text not null check (velocity in ('fast', 'medium', 'slow')) default 'medium',
  created_at timestamptz default now()
);

-- 4. Suppliers (Procurement Optimizer)
create table if not exists public.suppliers (
  id text primary key,
  name text not null,
  city text not null,
  distance_km numeric not null,
  est_delivery_hours numeric not null,
  unit_price_index numeric not null,
  ai_trust_score numeric not null check (ai_trust_score >= 0 and ai_trust_score <= 100),
  cold_chain_certified boolean default true,
  specialties text[] not null default '{}',
  active_contracts integer default 1
);

-- 5. Smart Restock Orders
create table if not exists public.restock_orders (
  id text primary key,
  order_code text unique not null,
  supplier_id text not null references public.suppliers(id),
  supplier_name text not null,
  items jsonb not null default '[]'::jsonb,
  total_cost numeric not null,
  status text not null check (status in ('Submitted', 'Dispatched', 'Cold-Chain Transit', 'Delivered')) default 'Submitted',
  eta_hours numeric not null,
  created_at timestamptz default now()
);

-- 6. Digital Prescriptions (Patient Care & Dosage Portal)
create table if not exists public.prescriptions (
  id text primary key,
  rx_code text unique not null,
  patient_name text not null,
  patient_id text not null,
  doctor_name text not null,
  hospital text not null,
  issued_date date not null,
  valid_until date not null,
  medications jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.storage_zones enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.suppliers enable row level security;
alter table public.restock_orders enable row level security;
alter table public.prescriptions enable row level security;

-- Open Demo-Ready Policies (Tighten to auth.uid() checks before HIPAA/CDSCO live PHI launch)
create policy "Public read storage_zones" on public.storage_zones for select using (true);
create policy "Public write storage_zones" on public.storage_zones for all using (true) with check (true);

create policy "Public read inventory_batches" on public.inventory_batches for select using (true);
create policy "Public write inventory_batches" on public.inventory_batches for all using (true) with check (true);

create policy "Public read suppliers" on public.suppliers for select using (true);
create policy "Public write suppliers" on public.suppliers for all using (true) with check (true);

create policy "Public read restock_orders" on public.restock_orders for select using (true);
create policy "Public write restock_orders" on public.restock_orders for all using (true) with check (true);

create policy "Public read prescriptions" on public.prescriptions for select using (true);
create policy "Public write prescriptions" on public.prescriptions for all using (true) with check (true);

-- Seed Core Storage Zones
insert into public.storage_zones (id, name, code, min_temp, max_temp, current_temp, humidity, max_humidity, status)
values
  ('zone-cryo-a', 'Cryo-Fridge A', 'CRYO-A [2°C–8°C]', 2, 8, 4.3, 44, 55, 'optimal'),
  ('zone-vault-b', 'Vaccine Vault B', 'VLT-B [-20°C]', -22, -18, -19.8, 36, 45, 'optimal'),
  ('zone-ambient-c', 'Controlled Ambient C', 'AMB-C [15°C–25°C]', 15, 25, 21.4, 48, 60, 'optimal')
on conflict (id) do nothing;
