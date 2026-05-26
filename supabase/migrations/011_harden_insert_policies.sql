-- ============================================================
-- RLS Sertleştirme: pending/rejected kullanıcılar
-- etkinlik kaydı ve mentorluk başvurusu yapamamalı
-- ============================================================
--
-- Mevcut politikalar yalnızca auth.uid() kontrolü yapıyor;
-- pending/rejected kullanıcılar app'i bypass ederek doğrudan
-- API üzerinden kayıt yaptırabilirdi.

-- Helper: kullanıcının onaylı (approved) üye olup olmadığı
CREATE OR REPLACE FUNCTION is_approved_member()
RETURNS BOOLEAN AS $$
  SELECT role NOT IN ('pending', 'rejected') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- event_attendees INSERT: sadece onaylı üyeler katılabilir
DROP POLICY IF EXISTS "attendees_insert_own" ON event_attendees;
CREATE POLICY "attendees_insert_own"
  ON event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_approved_member());

-- course_enrollments INSERT: sadece onaylı üyeler kayıt olabilir
DROP POLICY IF EXISTS "enrollments_insert_own" ON course_enrollments;
CREATE POLICY "enrollments_insert_own"
  ON course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_approved_member());

-- mentorship_requests INSERT: sadece onaylı üyeler başvurabilir
DROP POLICY IF EXISTS "mentorship_insert_as_mentee" ON mentorship_requests;
CREATE POLICY "mentorship_insert_as_mentee"
  ON mentorship_requests FOR INSERT
  TO authenticated
  WITH CHECK (mentee_id = auth.uid() AND is_approved_member());
