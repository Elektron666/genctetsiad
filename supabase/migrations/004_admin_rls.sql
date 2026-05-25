-- ============================================================
-- Admin RLS ek politikaları
-- ============================================================

-- Adminler pending dahil tüm profilleri görebilir
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_board());

-- Adminler profil silebilir (red işlemi için)
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin_or_board());
