-- ============================================================
-- 011 — 200 MADDELİK DENETİM: VERİTABANI DÜZELTMELERİ
-- ============================================================
-- Bu dosya tekrar tekrar çalıştırılabilir (idempotent).
-- ============================================================


-- ── K1 (KRİTİK): Yönetim kurulu üyesi kendini admin yapabiliyordu ──
--
-- profiles_update_admin politikası şöyleydi:
--     USING (is_admin_or_board())
-- ve WITH CHECK YOKTU. PostgreSQL'de UPDATE politikasında WITH CHECK
-- verilmezse USING ifadesi kontrol olarak kullanılır. is_admin_or_board()
-- satıra hiç bakmadığı için YENİ satır değerleri de sınırsız kabul edilir.
--
-- Sonuç: 'board' rolündeki herhangi bir kişi REST API'ye tek bir istek
-- atarak kendi rolünü 'admin' yapabilir, başkanı 'pending'e düşürebilir,
-- kendine 'GT-2026-00001' üye kodunu atayabilirdi.
--
-- Çözüm: rol atama yetkisi yalnızca 'admin'e verilir; board/president
-- üyelik onaylayabilir ama rol hiyerarşisini değiştiremez. Kimse kendi
-- rolünü değiştiremez.

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE OR REPLACE FUNCTION is_full_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Yönetim: profil alanlarını düzeltebilir, onay verebilir.
-- Rol değişimi 'pending' → 'member'/'student' ile sınırlı.
CREATE POLICY "profiles_update_board"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin_or_board() AND id <> auth.uid())
  WITH CHECK (
    is_admin_or_board()
    AND id <> auth.uid()                       -- kimse kendini yükseltemez
    AND role IN ('pending', 'member', 'student')
  );

-- Sistem yöneticisi: tam yetki, ama yine kendi rolüne dokunamaz.
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_full_admin() AND id <> auth.uid())
  WITH CHECK (is_full_admin() AND id <> auth.uid());


-- ── K2: Onay bekleyen kullanıcı katılımcı listelerini okuyabiliyordu ──
--
-- attendees_select_all USING (TRUE) — herhangi bir e-posta ile kayıt olan
-- biri (onay beklerken bile) her etkinliğin katılımcı user_id listesini
-- REST API'den çekebiliyordu. 006 profiles'ı kapattı ama bu tablo açık
-- kaldı; user_id'ler onay alındıktan sonra isimle eşleştirilebilir.

DROP POLICY IF EXISTS "attendees_select_all" ON event_attendees;
CREATE POLICY "attendees_select_approved"
  ON event_attendees FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_approved_member());


-- ── K3: Onay bekleyen kullanıcı etkinliğe/kursa kaydolabiliyordu ──
--
-- Uygulama "üyeliğiniz onaylanınca açılır" diyor ama RLS yalnızca
-- user_id = auth.uid() arıyordu. Onay bekleyen biri etkinlik
-- kontenjanını doldurabilir, kursa yazılabilir, mentora başvurabilirdi.

DROP POLICY IF EXISTS "attendees_insert_own" ON event_attendees;
CREATE POLICY "attendees_insert_own"
  ON event_attendees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_approved_member());

DROP POLICY IF EXISTS "enrollments_insert_own" ON course_enrollments;
CREATE POLICY "enrollments_insert_own"
  ON course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_approved_member());

-- Mentorluk: başvuran onaylı olmalı VE hedef gerçekten mentor olmalı.
-- Eskiden herhangi bir profile 'mentor' gibi başvuru yazılabiliyordu.
DROP POLICY IF EXISTS "mentorship_insert_as_mentee" ON mentorship_requests;
CREATE POLICY "mentorship_insert_as_mentee"
  ON mentorship_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    mentee_id = auth.uid()
    AND is_approved_member()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = mentor_id AND p.is_mentor)
  );

-- Başvuru sahibi başvurusunu geri çekebilmeli (hiç DELETE politikası yoktu)
DROP POLICY IF EXISTS "mentorship_delete_own" ON mentorship_requests;
CREATE POLICY "mentorship_delete_own"
  ON mentorship_requests FOR DELETE
  TO authenticated
  USING (mentee_id = auth.uid() AND status = 'pending');


-- ── K4: Çıkış yapan kullanıcının cihazı bildirim almaya devam ediyordu ──
--
-- push_tokens üzerinde DELETE politikası yoktu; kullanıcı çıkış yapsa da
-- token kayıtlı kalıyor, dernek duyuruları o cihaza düşmeye devam ediyordu.

DROP POLICY IF EXISTS "push_tokens_delete_own" ON push_tokens;
CREATE POLICY "push_tokens_delete_own"
  ON push_tokens FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Aynı cihazı iki kişi kullanırsa (ortak tablet), eski kaydın token'ı
-- yeni kullanıcıya işaret etmemeli. Token'ı benzersiz yapıp eski sahibi
-- otomatik düşürüyoruz.
DELETE FROM push_tokens a USING push_tokens b
  WHERE a.token = b.token AND a.updated_at < b.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);


-- ── K5: Üye kodu üreticisi RLS altında çalışıyordu ──
--
-- generate_member_code() benzersizlik kontrolünü RLS'e tabi bir SELECT
-- ile yapıyordu: çağıran yönetici, onay bekleyen bir profilin kodunu
-- göremezse "boşta" sanıp aynı kodu üretebilir, sonra UNIQUE kısıtı
-- patlar ve onay anlaşılmaz bir hatayla başarısız olur.
-- Ayrıca döngü sınırsızdı ve search_path sabitlenmemişti.

CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  code TEXT;
  yr   TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  i    INT  := 0;
BEGIN
  LOOP
    code := 'GT-' || yr || '-' || upper(substring(md5(random()::text) FROM 1 FOR 5));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE member_code = code);
    i := i + 1;
    IF i > 50 THEN
      RAISE EXCEPTION 'Üye kodu üretilemedi (50 denemede çakışma)';
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- Doğrudan 'member' olarak açılan profillere de kod atansın
CREATE OR REPLACE FUNCTION assign_member_code()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role <> 'pending' AND NEW.member_code IS NULL THEN
    NEW.member_code := generate_member_code();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_member_code_ins ON profiles;
CREATE TRIGGER trg_assign_member_code_ins
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_member_code();


-- ── K6: KVKK açık rızası hiçbir yerde saklanmıyordu ──
--
-- Kayıt ekranında iki onay kutusu var (aydınlatma + yurt dışı aktarım)
-- ama işaretlendikleri hiçbir yere yazılmıyordu. KVKK denetiminde
-- "rıza aldım" iddiasını KANITLAMAK gerekir; kanıt yoksa rıza yoktur.
--
-- Ayrıca kayıt 4. adımdaki üyelik tipi (şirket / üniversite) seçimi de
-- kaydedilmiyordu — kullanıcı seçiyor, veri çöpe gidiyordu.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_type      TEXT
  CHECK (member_type IN ('company', 'student'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kvkk_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS transfer_consent_at TIMESTAMPTZ;
-- KVKK m.11: üye telefonunu rehberde gizleyebilmeli
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN NOT NULL DEFAULT TRUE;

-- Rıza zaman damgaları geriye dönük DEĞİŞTİRİLEMEZ olmalı — yoksa
-- "sonradan yazıldı" itirazı karşısında kanıt değeri kalmaz.
CREATE OR REPLACE FUNCTION lock_consent_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.kvkk_accepted_at IS NOT NULL
     AND NEW.kvkk_accepted_at IS DISTINCT FROM OLD.kvkk_accepted_at THEN
    NEW.kvkk_accepted_at := OLD.kvkk_accepted_at;
  END IF;
  IF OLD.transfer_consent_at IS NOT NULL
     AND NEW.transfer_consent_at IS DISTINCT FROM OLD.transfer_consent_at THEN
    NEW.transfer_consent_at := OLD.transfer_consent_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_consent ON profiles;
CREATE TRIGGER trg_lock_consent
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION lock_consent_timestamps();


-- ── K7: Sahte/spam başvurular kuyruktan hiç çıkmıyordu ──
--
-- Yönetim yalnızca ONAYLAYABİLİYORDU. Reddedilen bir başvuru sonsuza
-- kadar 'pending' listesinde kalıyordu. Reddetme için ayrı bir durum
-- gerek — silmek KVKK açısından da doğru olan (veriyi tutmamak).

CREATE OR REPLACE FUNCTION reject_application(target UUID, reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_board() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target AND role = 'pending') THEN
    RAISE EXCEPTION 'yalnızca onay bekleyen başvuru reddedilebilir';
  END IF;

  INSERT INTO audit_log (actor_id, actor_name, action, target_type, target_id, target_name, details)
  SELECT auth.uid(), actor_display_name(), 'application_rejected', 'profile',
         target::text, p.full_name, jsonb_build_object('gerekce', reason)
  FROM profiles p WHERE p.id = target;

  DELETE FROM auth.users WHERE id = target;
END;
$$;

REVOKE EXECUTE ON FUNCTION reject_application(UUID, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION reject_application(UUID, TEXT) TO authenticated;


-- ── K8: Denetim kaydı hesap silinince yok oluyordu ──
--
-- audit_log.actor_id profiles'a CASCADE bağlıysa, bir yönetici hesabını
-- silerek kendi tüm işlem geçmişini de siler. Devlet talebine cevap
-- verebilmek için kayıt kalmalı; kimlik alanı NULL'a düşer, ad metni
-- zaten kopyalanmış durumda.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_actor_id_fkey;
    ALTER TABLE audit_log ADD CONSTRAINT audit_log_actor_id_fkey
      FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ── K9: Duyuru/etkinlik metinlerinde uzunluk sınırı yoktu ──
-- Yönetim 1 MB'lık bir gövde yayınlayabilir, bu da push bildirimine
-- ve ana sayfa bandına olduğu gibi giderdi.

ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_len_chk;
ALTER TABLE announcements ADD CONSTRAINT announcements_len_chk
  CHECK (char_length(title) BETWEEN 3 AND 120 AND char_length(body) BETWEEN 10 AND 2000);

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_title_len_chk;
ALTER TABLE events ADD CONSTRAINT events_title_len_chk
  CHECK (char_length(title) BETWEEN 3 AND 120);

-- Geçmişe etkinlik yayınlanmasını engelle (yönetici yazım hatası:
-- "24.13.2026" sessizce 2027 Ocak'a kayıyordu — bkz. istemci düzeltmesi)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_starts_sane_chk;
ALTER TABLE events ADD CONSTRAINT events_starts_sane_chk
  CHECK (starts_at > TIMESTAMPTZ '2020-01-01' AND starts_at < NOW() + INTERVAL '5 years');


-- ── K10: Sık kullanılan sorgularda indeks yoktu ──
--
-- event_attendees ve course_enrollments'ın birincil anahtarı
-- (event_id, user_id) sırasında; uygulama ise HER AÇILIŞTA
-- "WHERE user_id = ?" sorguluyor — bu indeksten yararlanamaz.

CREATE INDEX IF NOT EXISTS idx_attendees_user     ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user   ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_mentor  ON mentorship_requests(mentor_id, status);
CREATE INDEX IF NOT EXISTS idx_announcements_pub  ON announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_starts      ON events(starts_at) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_profiles_role      ON profiles(role);


-- ============================================================
-- DOĞRULAMA
-- ============================================================
-- 1) Yetki yükseltme kapandı mı? (board hesabıyla çalıştırıldığında
--    0 satır etkilenmeli):
--      UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
--
-- 2) Politika sayısı:
--      SELECT tablename, policyname, cmd FROM pg_policies
--      WHERE schemaname = 'public' ORDER BY tablename, policyname;
--
-- 3) SECURITY DEFINER fonksiyonların hepsinde search_path sabit mi?
--    (proconfig sütunu BOŞ OLMAMALI):
--      SELECT proname, proconfig FROM pg_proc
--      WHERE pronamespace = 'public'::regnamespace AND prosecdef;
