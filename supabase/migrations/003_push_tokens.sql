-- ============================================================
-- Push bildirimleri: cihaz token kayıtları
-- ============================================================

CREATE TABLE push_tokens (
  user_id    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Herkes kendi cihaz token'ını yazabilir/güncelleyebilir
CREATE POLICY "push_tokens_insert_own"
  ON push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_update_own"
  ON push_tokens FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Token listesini yalnızca yönetim okuyabilir (duyuru push'u göndermek için)
CREATE POLICY "push_tokens_select_own_or_admin"
  ON push_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_board());
