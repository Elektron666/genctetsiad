-- ============================================================
-- Genç TETSİAD — Initial Schema
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE member_role AS ENUM (
  'pending',     -- başvurdu, onay bekliyor
  'member',      -- onaylı üye
  'student',     -- öğrenci üye
  'board',       -- yönetim kurulu
  'president',   -- başkan
  'admin'        -- sistem yöneticisi
);

CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notif_type AS ENUM ('announcement', 'event', 'system', 'mentorship');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- ── Profiles ─────────────────────────────────────────────────
-- auth.users ile 1:1 ilişki. Kullanıcı kayıt olduğunda trigger ile oluşturulur.

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL DEFAULT '',
  email        TEXT,
  phone        TEXT,
  company      TEXT,
  city         TEXT,
  sector       TEXT,
  position     TEXT,
  role         member_role NOT NULL DEFAULT 'pending',
  is_mentor    BOOLEAN NOT NULL DEFAULT FALSE,
  mentor_bio   TEXT,
  member_code  TEXT UNIQUE,            -- GT-2026-XXXXX, trigger ile atanır
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Üyelik kodu üretici: GT-YYYY-XXXXX
CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
BEGIN
  LOOP
    code := 'GT-' || year || '-' || upper(substring(md5(random()::text) FROM 1 FOR 5));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE member_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- role 'pending' → 'member'/'student'/'board' olduğunda otomatik kod ata
CREATE OR REPLACE FUNCTION assign_member_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != 'pending' AND OLD.role = 'pending' AND NEW.member_code IS NULL THEN
    NEW.member_code := generate_member_code();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_member_code
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_member_code();

-- Yeni auth.users kaydında otomatik profile oluştur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone, email)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Events ───────────────────────────────────────────────────

CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  location      TEXT,
  city          TEXT,
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ,
  max_attendees INT,
  image_url     TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_attendees (
  event_id      UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Katılımcı sayısını hızlı çekmek için view (RLS sorgulayan kullanıcının yetkisiyle)
CREATE VIEW event_attendee_counts
WITH (security_invoker = true) AS
  SELECT event_id, COUNT(*) AS attendee_count
  FROM event_attendees
  GROUP BY event_id;

-- ── Courses ──────────────────────────────────────────────────

CREATE TABLE courses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  instructor     TEXT,
  duration_hours INT,
  level          course_level,
  image_url      TEXT,
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_enrollments (
  course_id    UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  progress     INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at TIMESTAMPTZ,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, user_id)
);

-- ── Mentorship ───────────────────────────────────────────────

CREATE TABLE mentorship_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message    TEXT,
  status     request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentee_id, mentor_id),
  CHECK (mentee_id != mentor_id)
);

-- ── Announcements ────────────────────────────────────────────

CREATE TABLE announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'event', 'system')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ── Notifications (kişisel) ──────────────────────────────────

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  type       notif_type NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  related_id UUID,   -- opsiyonel: event_id, course_id, request_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- ── Helper: mevcut kullanıcının rolünü döndür ────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS member_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_board()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'board', 'president') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Profiles RLS ─────────────────────────────────────────────

-- Onaylı üyeler rehberde herkese görünür
CREATE POLICY "profiles_select_approved"
  ON profiles FOR SELECT
  TO authenticated
  USING (role != 'pending');

-- Herkes kendi profilini görebilir (pending dahil)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Kullanıcı kendi profilini güncelleyebilir (rol hariç)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())  -- rol değiştiremez
  );

-- Admin her profili güncelleyebilir (rol dahil)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin_or_board());

-- ── Events RLS ───────────────────────────────────────────────

CREATE POLICY "events_select_published"
  ON events FOR SELECT
  TO authenticated
  USING (is_published = TRUE);

CREATE POLICY "events_manage_admin"
  ON events FOR ALL
  TO authenticated
  USING (is_admin_or_board())
  WITH CHECK (is_admin_or_board());

-- ── Event Attendees RLS ──────────────────────────────────────

-- Katılım sayıları herkese açık (etkinlik sayfasında gösterilir)
CREATE POLICY "attendees_select_all"
  ON event_attendees FOR SELECT
  TO authenticated
  USING (TRUE);

-- Herkes katılabilir / kendi kaydını silebilir
CREATE POLICY "attendees_insert_own"
  ON event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendees_delete_own"
  ON event_attendees FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Courses RLS ──────────────────────────────────────────────

CREATE POLICY "courses_select_published"
  ON courses FOR SELECT
  TO authenticated
  USING (is_published = TRUE);

CREATE POLICY "courses_manage_admin"
  ON courses FOR ALL
  TO authenticated
  USING (is_admin_or_board())
  WITH CHECK (is_admin_or_board());

-- ── Course Enrollments RLS ───────────────────────────────────

CREATE POLICY "enrollments_select_own"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "enrollments_insert_own"
  ON course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "enrollments_update_own"
  ON course_enrollments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Mentorship Requests RLS ──────────────────────────────────

CREATE POLICY "mentorship_select_involved"
  ON mentorship_requests FOR SELECT
  TO authenticated
  USING (mentee_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "mentorship_insert_as_mentee"
  ON mentorship_requests FOR INSERT
  TO authenticated
  WITH CHECK (mentee_id = auth.uid());

-- Mentor kendi başvurularını kabul/red edebilir
CREATE POLICY "mentorship_update_mentor"
  ON mentorship_requests FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

-- ── Announcements RLS ────────────────────────────────────────

CREATE POLICY "announcements_select_all"
  ON announcements FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "announcements_manage_admin"
  ON announcements FOR ALL
  TO authenticated
  USING (is_admin_or_board())
  WITH CHECK (is_admin_or_board());

-- ── Notifications RLS ────────────────────────────────────────

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Sistem bildirimleri sadece service_role'dan insert edilir
-- (Edge Function / server-side)
