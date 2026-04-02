-- AP Automations Client Portal — v2 Migration
-- Run this in the Supabase SQL Editor AFTER migrations.sql

-- ============================================================
-- ADD COLUMNS TO clients
-- ============================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status text
  check (status in ('onboarding','active','paused')) default 'onboarding';

-- ============================================================
-- CLIENT FILES TABLE
-- ============================================================

create table if not exists client_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_type text check (file_type in ('contract','spec','other')) default 'other',
  size_bytes bigint,
  uploaded_at timestamptz default now()
);

alter table client_files enable row level security;

-- Clients can view their own files (download via signed URL)
create policy "files_select_own" on client_files
  for select using (own_client(client_id));

-- Admin inserts/deletes via service role key (bypasses RLS)

-- ============================================================
-- SUPABASE STORAGE BUCKET
-- ============================================================
-- After running this SQL, go to Supabase Storage and:
-- 1. Create a bucket named: client-files
-- 2. Set it to PRIVATE (not public)
-- 3. No public access needed — files served via signed URLs
