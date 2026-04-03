-- AP Automations Client Portal — v3 Migration
-- Run this in the Supabase SQL Editor AFTER migrations_v2.sql

-- ============================================================
-- ADD uploaded_by COLUMN TO client_files
-- ============================================================

ALTER TABLE client_files ADD COLUMN IF NOT EXISTS uploaded_by text default 'admin';

-- ============================================================
-- TICKET COMMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  author text NOT NULL CHECK (author IN ('client', 'admin')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Clients can view comments on their own tickets
CREATE POLICY "comments_select_own" ON ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT t.id FROM tickets t
      JOIN clients c ON t.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can insert comments (only as 'client' author)
CREATE POLICY "comments_insert_own" ON ticket_comments
  FOR INSERT WITH CHECK (
    author = 'client' AND
    ticket_id IN (
      SELECT t.id FROM tickets t
      JOIN clients c ON t.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Admin inserts/selects via service role key (bypasses RLS)
