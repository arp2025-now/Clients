-- migrations_v5.sql
-- Feature 1: document metadata (note, display_name, tags)
-- Feature 2: RLS hardening on client_files + Storage
-- Run in Supabase SQL Editor AFTER migrations_v4.sql

-- ── Feature 1: add columns to client_files ─────────────────────────────────

ALTER TABLE client_files
  ADD COLUMN IF NOT EXISTS note         text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS tags         text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_client_files_tags
  ON client_files USING GIN(tags);

-- ── Feature 2: RLS on client_files (INSERT + DELETE) ──────────────────────
-- SELECT policy "files_select_own" already exists from migrations_v2.sql

DROP POLICY IF EXISTS "files_insert_own" ON client_files;
CREATE POLICY "files_insert_own" ON client_files
  FOR INSERT WITH CHECK (own_client(client_id));

DROP POLICY IF EXISTS "files_delete_own" ON client_files;
CREATE POLICY "files_delete_own" ON client_files
  FOR DELETE USING (own_client(client_id));

-- ── Feature 2: Storage RLS on storage.objects ─────────────────────────────
-- Note: RLS on storage.objects is already enabled by Supabase by default.

-- Clients can only SELECT files inside their own client_id folder
DROP POLICY IF EXISTS "storage_select_own" ON storage.objects;
CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM clients WHERE user_id = auth.uid()
    )
  );

-- Clients can only INSERT files into their own client_id folder
DROP POLICY IF EXISTS "storage_insert_own" ON storage.objects;
CREATE POLICY "storage_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM clients WHERE user_id = auth.uid()
    )
  );

-- Clients can only DELETE files from their own client_id folder
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;
CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client-files'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM clients WHERE user_id = auth.uid()
    )
  );
