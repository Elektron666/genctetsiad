-- ============================================================
-- Performans indeksleri — sık kullanılan sorgular için
-- ============================================================

-- event_attendees: kullanıcı başvuru sorgularında
CREATE INDEX IF NOT EXISTS idx_event_attendees_user
  ON event_attendees(user_id);

-- event_attendees: etkinlik başına katılımcı sayısında
CREATE INDEX IF NOT EXISTS idx_event_attendees_event
  ON event_attendees(event_id);

-- course_enrollments: kullanıcı kurs sorgularında
CREATE INDEX IF NOT EXISTS idx_enrollments_user
  ON course_enrollments(user_id);

-- mentorship_requests: mentee sorgularında
CREATE INDEX IF NOT EXISTS idx_mentorship_mentee
  ON mentorship_requests(mentee_id);

-- mentorship_requests: mentor sorgularında
CREATE INDEX IF NOT EXISTS idx_mentorship_mentor
  ON mentorship_requests(mentor_id);

-- profiles: admin paneli bekleyen üye sorgusu
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);

-- profiles: mentör listesi sorgusu
CREATE INDEX IF NOT EXISTS idx_profiles_is_mentor
  ON profiles(is_mentor)
  WHERE is_mentor = TRUE;

-- announcements: ana sayfa son duyuru sorgusu
CREATE INDEX IF NOT EXISTS idx_announcements_published
  ON announcements(published_at DESC);
