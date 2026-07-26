-- ============================================================
-- 006 — GÜVENLİK SIKILAŞTIRMASI
-- ============================================================
-- Tehdit modeli: anon key her istemciye gömülüdür ve herkese açıktır.
-- Tek gerçek savunma RLS'tir. Aşağıdakiler doğrudan REST API'ye istek
-- atan (uygulamayı hiç kullanmayan) bir saldırgan varsayılarak yazıldı.
-- ============================================================


-- ── H1: Onaylanmamış kullanıcı tüm üye rehberini çekebiliyordu ──
--
-- Eski politika: USING (role != 'pending')
-- Bakılan satırın onaylı olmasını istiyordu ama BAKAN kişinin durumunu
-- hiç kontrol etmiyordu. Sonuç: herhangi bir telefon numarasıyla kayıt
-- olan biri (onay beklerken bile) tüm onaylı üyelerin ad, telefon,
-- firma ve şehir bilgisini REST API üzerinden toplayabiliyordu.
--
-- Çözüm: rehberi yalnızca ONAYLI üyeler görebilir.

CREATE OR REPLACE FUNCTION is_approved_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER              -- RLS'i baypas eder → politika özyinelemesini önler
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role <> 'pending'
  );
$$;

DROP POLICY IF EXISTS "profiles_select_approved" ON profiles;
CREATE POLICY "profiles_select_approved"
  ON profiles FOR SELECT
  TO authenticated
  USING (role <> 'pending' AND is_approved_member());

-- Not: profiles_select_own (kendi profili) ve profiles_select_admin
-- (yönetim) politikaları yerinde kalır; onay bekleyen kullanıcı kendi
-- profilini görmeye devam eder, rehberi göremez.


-- ── H2: Kullanıcı kendini mentor yapabiliyor / üye kodunu değiştirebiliyordu ──
--
-- Eski WITH CHECK yalnızca 'role' alanını sabitliyordu. is_mentor ve
-- member_code korumasızdı:
--   • is_mentor = true → resmi mentor listesinde görünüp TETSİAD
--     mentoru gibi davranabilir (kimlik sahtekârlığı)
--   • member_code = 'GT-2026-00001' → başkanın numarasıyla sahte
--     üyelik kartı gösterebilir
--
-- Çözüm: kullanıcı kendi profilinde bu üç alanı DEĞİŞTİREMEZ.

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role        =              (SELECT p.role        FROM profiles p WHERE p.id = auth.uid())
    AND is_mentor   =              (SELECT p.is_mentor   FROM profiles p WHERE p.id = auth.uid())
    AND member_code IS NOT DISTINCT FROM
                                   (SELECT p.member_code FROM profiles p WHERE p.id = auth.uid())
  );

-- Yönetim bu alanları değiştirebilir (profiles_update_admin dokunulmadı).


-- ── M1: SECURITY DEFINER fonksiyonlarda search_path sabitlenmemişti ──
--
-- search_path pinlenmemiş bir SECURITY DEFINER fonksiyonu, saldırgan
-- arama yolunda daha önce gelen bir şemaya sahte nesne koyabilirse
-- ele geçirilebilir. Supabase'in kendi güvenlik denetçisi de bunu
-- işaretler. Üç fonksiyon sabitleniyor.

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin_or_board()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'board', 'president')
  );
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, phone, email)
  VALUES (NEW.id, NEW.phone, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ── M2: Kontenjan yalnızca istemcide denetleniyordu ──
--
-- Uygulama dolu etkinlikte butonu kilitliyor, ama doğrudan REST API'ye
-- POST atan biri kontenjanı aşabiliyordu. Denetim sunucuya taşınıyor.

CREATE OR REPLACE FUNCTION enforce_event_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap INT;
  cnt INT;
BEGIN
  SELECT max_attendees INTO cap FROM events WHERE id = NEW.event_id;
  IF cap IS NULL THEN
    RETURN NEW;                       -- sınırsız kontenjan
  END IF;

  -- Eşzamanlı kayıtların kontenjanı aşmasını önlemek için etkinlik
  -- bazında danışmanlı kilit alınır.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.event_id::text));

  SELECT COUNT(*) INTO cnt FROM event_attendees WHERE event_id = NEW.event_id;
  IF cnt >= cap THEN
    RAISE EXCEPTION 'Etkinlik kontenjanı dolu (% / %)', cnt, cap
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_event_quota ON event_attendees;
CREATE TRIGGER trg_enforce_event_quota
  BEFORE INSERT ON event_attendees
  FOR EACH ROW EXECUTE FUNCTION enforce_event_quota();


-- ── L1: Mentor, gelen başvurunun içeriğini değiştirebiliyordu ──
--
-- Eski WITH CHECK yalnızca mentor_id'yi sabitliyordu; mentor başvuru
-- mesajını veya mentee_id'yi değiştirebiliyordu. Artık yalnızca
-- 'status' alanı değiştirilebilir.

DROP POLICY IF EXISTS "mentorship_update_mentor" ON mentorship_requests;
CREATE POLICY "mentorship_update_mentor"
  ON mentorship_requests FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (
    mentor_id = auth.uid()
    AND mentee_id = (SELECT r.mentee_id FROM mentorship_requests r WHERE r.id = mentorship_requests.id)
    AND message IS NOT DISTINCT FROM
                (SELECT r.message   FROM mentorship_requests r WHERE r.id = mentorship_requests.id)
  );


-- ============================================================
-- DOĞRULAMA
-- ============================================================
-- Aşağıdaki sorgu tüm SECURITY DEFINER fonksiyonların search_path'inin
-- sabitlendiğini gösterir (config sütunu boş OLMAMALI):
--
--   SELECT proname, prosecdef, proconfig
--   FROM pg_proc
--   WHERE pronamespace = 'public'::regnamespace AND prosecdef
--   ORDER BY proname;
--
-- Kontenjan tetikleyicisi:
--   SELECT tgname FROM pg_trigger WHERE tgname = 'trg_enforce_event_quota';
