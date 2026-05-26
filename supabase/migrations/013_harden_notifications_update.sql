-- ============================================================
-- Güvenlik: notifications UPDATE politikasına WITH CHECK ekle
-- ============================================================
-- Mevcut politika yalnızca USING (user_id = auth.uid()) içeriyor.
-- WITH CHECK olmadan bir kullanıcı kendi bildiriminin user_id'sini
-- başka bir kullanıcıya değiştirerek sahte bildirim enjekte edebilir.
-- WITH CHECK eklenerek UPDATE sonrasında da user_id = auth.uid()
-- şartı korunuyor.

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
