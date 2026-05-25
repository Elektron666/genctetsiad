-- ============================================================
-- Push Notifications Infrastructure
-- ============================================================

-- ── Profiles: Expo push token ────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON profiles(expo_push_token)
  WHERE expo_push_token IS NOT NULL AND push_enabled = TRUE;

-- ── Broadcast log ────────────────────────────────────────────
-- Gönderilen toplu duyuruların kaydı (denetim + tekrar gönderim)

CREATE TABLE broadcasts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  type          notif_type NOT NULL DEFAULT 'announcement',
  urgent        BOOLEAN NOT NULL DEFAULT FALSE,
  target_roles  member_role[],   -- NULL = tüm onaylı üyeler
  sent_count    INT NOT NULL DEFAULT 0,
  failed_count  INT NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcasts_select_all" ON broadcasts FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "broadcasts_insert_admin" ON broadcasts FOR INSERT TO authenticated WITH CHECK (is_admin_or_board());

-- ── Helper: tüm aktif push token'ları döndür ─────────────────
CREATE OR REPLACE FUNCTION get_push_recipients(roles_filter member_role[] DEFAULT NULL)
RETURNS TABLE (user_id UUID, token TEXT) AS $$
  SELECT id, expo_push_token
  FROM profiles
  WHERE expo_push_token IS NOT NULL
    AND push_enabled = TRUE
    AND role != 'pending'
    AND (roles_filter IS NULL OR role = ANY(roles_filter));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper: notifications tablosuna toplu insert ─────────────
-- Edge Function bunu çağırarak in-app inbox'a kayıt atar
CREATE OR REPLACE FUNCTION insert_broadcast_notifications(
  p_title TEXT,
  p_body TEXT,
  p_type notif_type,
  p_related_id UUID,
  p_roles_filter member_role[] DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  inserted_count INT;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, related_id)
  SELECT id, p_title, p_body, p_type, p_related_id
  FROM profiles
  WHERE role != 'pending'
    AND (p_roles_filter IS NULL OR role = ANY(p_roles_filter));

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
