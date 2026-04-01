-- AP Automations Client Portal — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  business_name text not null,
  phone text,
  website_url text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  description text,
  status text check (status in ('in_progress','testing','live')) default 'in_progress',
  progress_pct integer default 0 check (progress_pct between 0 and 100),
  created_at timestamptz default now()
);

create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  system_name text not null,
  url text,
  username text,
  encrypted_password text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists onboarding_custom_fields (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  field_name text not null,
  field_value_encrypted text,
  field_type text check (field_type in ('text','url','credential')) default 'text',
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  subject text not null,
  priority text check (priority in ('low','high','urgent')) default 'low',
  description text,
  status text check (status in ('open','in_progress','resolved','closed')) default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  amount numeric not null,
  currency text default 'ILS',
  status text check (status in ('pending','paid','overdue')) default 'pending',
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- AUTO-UPDATE updated_at ON tickets
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tickets_updated_at
  before update on tickets
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table clients enable row level security;
alter table projects enable row level security;
alter table credentials enable row level security;
alter table onboarding_custom_fields enable row level security;
alter table tickets enable row level security;
alter table payments enable row level security;

-- clients: own row only
create policy "clients_select_own" on clients for select using (user_id = auth.uid());
create policy "clients_insert_own" on clients for insert with check (user_id = auth.uid());
create policy "clients_update_own" on clients for update using (user_id = auth.uid());

-- helper: check if client_id belongs to current user
create or replace function own_client(client_id uuid) returns boolean as $$
  select exists (select 1 from clients where id = client_id and user_id = auth.uid());
$$ language sql security definer;

-- projects
create policy "projects_select_own" on projects for select using (own_client(client_id));
create policy "projects_insert_own" on projects for insert with check (own_client(client_id));
create policy "projects_update_own" on projects for update using (own_client(client_id));

-- credentials (client can read own, but NO plaintext — admin decrypts via service role)
create policy "credentials_select_own" on credentials for select using (own_client(client_id));
create policy "credentials_insert_own" on credentials for insert with check (own_client(client_id));

-- onboarding_custom_fields
create policy "ocf_select_own" on onboarding_custom_fields for select using (own_client(client_id));
create policy "ocf_insert_own" on onboarding_custom_fields for insert with check (own_client(client_id));
create policy "ocf_update_own" on onboarding_custom_fields for update using (own_client(client_id));

-- tickets
create policy "tickets_select_own" on tickets for select using (own_client(client_id));
create policy "tickets_insert_own" on tickets for insert with check (own_client(client_id));
create policy "tickets_update_own" on tickets for update using (own_client(client_id));

-- payments: NO client access — admin only via service role
-- (no policies = no access for regular users)
