-- migrations_v4.sql
-- Project cover images
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url text;

-- Audit log (change history — visible to admin + client)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  entity_type text,   -- 'ticket' | 'project' | 'payment' | 'file' | 'comment'
  entity_id uuid,
  action text,        -- 'created' | 'updated' | 'status_changed' | 'commented' | 'uploaded'
  details jsonb,      -- e.g. { "from": "open", "to": "resolved", "subject": "..." }
  actor text,         -- 'client' | 'admin'
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_own" ON audit_log FOR SELECT USING (own_client(client_id));

-- In-app notifications for clients
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (own_client(client_id));
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (own_client(client_id));
-- Admin inserts via service role (no insert policy needed for client)
