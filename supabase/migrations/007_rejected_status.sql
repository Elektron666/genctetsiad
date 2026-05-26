-- ============================================================
-- Reddedilen üye durumu — profile silme yerine rol değişimi
-- ============================================================

-- member_role enum'una 'rejected' eklendi
ALTER TYPE member_role ADD VALUE IF NOT EXISTS 'rejected';

-- profiles_select_approved politikasını güncelle:
-- pending VE rejected üyeler başkalarına görünmemeli
DROP POLICY IF EXISTS "profiles_select_approved" ON profiles;
CREATE POLICY "profiles_select_approved"
  ON profiles FOR SELECT
  TO authenticated
  USING (role NOT IN ('pending', 'rejected'));
