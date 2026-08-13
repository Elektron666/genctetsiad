-- ============================================================
-- 012 — DENETİM 3. TUR: VERİTABANI DÜZELTMELERİ
-- ============================================================
-- 011'den SONRA çalıştırın. Tekrar çalıştırılabilir (idempotent).
-- ============================================================


-- ── D1: notifications tablosu tamamen ölüydü ──
--
-- RLS'i vardı, indeksi vardı, TypeScript tipi vardı — ama hiçbir kod
-- ona yazmıyor, hiçbir ekran ondan okumuyordu. Uygulamadaki bildirim
-- listesi tamamen istemci belleğindeydi.
--
-- İki seçenek vardı: canlandırmak ya da kaldırmak. Kişiye özel
-- bildirim (mentorluk sonucu, üyelik onayı, yazı incelemesi) gerçek
-- bir ihtiyaç olduğu için canlandırıyoruz.

-- INSERT politikası hiç yoktu; yalnızca service_role yazabiliyordu,
-- bu da uygulama içinden bildirim üretmeyi imkânsız kılıyordu.
DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
CREATE POLICY "notifications_insert_admin"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_board());

-- Kullanıcı kendi bildirimini silebilmeli (KVKK: veriyi kaldırma hakkı)
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Sistem olaylarında kişisel bildirim üreten yardımcı. SECURITY DEFINER
-- çünkü tetikleyiciden, onaylanan kullanıcının kendisi adına değil,
-- sistem adına yazılır.
CREATE OR REPLACE FUNCTION notify_user(
  target UUID, n_title TEXT, n_body TEXT,
  n_type notif_type DEFAULT 'system', related UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, related_id)
  VALUES (target, n_title, n_body, n_type, related);
END;
$$;

-- Üyelik onaylandığında kalıcı bir bildirim bırak. Push anlık ve
-- kaçırılabilir; uygulamayı sonra açan üye ne olduğunu görebilmeli.
CREATE OR REPLACE FUNCTION notify_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'pending' AND NEW.role <> 'pending' THEN
    PERFORM notify_user(
      NEW.id,
      'Üyeliğiniz onaylandı',
      'Genç TETSİAD üyeliğiniz aktif edildi. Üye kodunuz: ' || COALESCE(NEW.member_code, '—'),
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_approval ON profiles;
CREATE TRIGGER trg_notify_on_approval
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_on_approval();

-- Mentorluk başvurusu sonuçlandığında iki tarafa da kayıt bırak
CREATE OR REPLACE FUNCTION notify_on_mentorship()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM notify_user(NEW.mentor_id, 'Yeni mentorluk başvurusu',
      'Bir üye size mentorluk başvurusu gönderdi. Akademi > Mentörler bölümünden yanıtlayabilirsiniz.',
      'mentorship', NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM notify_user(NEW.mentee_id,
      CASE WHEN NEW.status = 'accepted'
           THEN 'Mentorluk başvurunuz kabul edildi'
           ELSE 'Mentorluk başvurunuz sonuçlandı' END,
      CASE WHEN NEW.status = 'accepted'
           THEN 'Mentörünüz sizinle iletişime geçecek.'
           ELSE 'Bu dönem eşleşme sağlanamadı. Başka mentörlere başvurabilirsiniz.' END,
      'mentorship', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_mentorship ON mentorship_requests;
CREATE TRIGGER trg_notify_mentorship
  AFTER INSERT OR UPDATE ON mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_mentorship();

-- Bülten yazısı incelendiğinde yazara sonucu bildir
CREATE OR REPLACE FUNCTION notify_on_article_review()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    PERFORM notify_user(
      NEW.author_id,
      CASE WHEN NEW.status = 'published' THEN 'Yazınız yayımlandı' ELSE 'Yazınız için revizyon istendi' END,
      CASE WHEN NEW.status = 'published'
           THEN '"' || NEW.title || '" bültende yayımlandı.'
           ELSE COALESCE(NEW.review_note, 'Yönetim yazınız için düzeltme istedi.') END,
      'announcement', NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_article ON articles;
CREATE TRIGGER trg_notify_article
  AFTER UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION notify_on_article_review();


-- ── D2: updated_at yalnızca iki tabloda güncelleniyordu ──
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

ALTER TABLE events  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_touch_events  ON events;
CREATE TRIGGER trg_touch_events  BEFORE UPDATE ON events  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_touch_courses ON courses;
CREATE TRIGGER trg_touch_courses BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ── D3: kontenjan mevcut katılımcı sayısının altına indirilebiliyordu ──
--
-- enforce_event_quota yalnızca INSERT'te çalışıyordu. Yönetici 60 kişilik
-- bir etkinliğin kontenjanını 20'ye çekince 40 kişi sessizce "fazlalık"
-- oluyor, kimse uyarılmıyordu.
CREATE OR REPLACE FUNCTION guard_quota_decrease()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE cnt INT;
BEGIN
  IF NEW.max_attendees IS NOT NULL
     AND NEW.max_attendees IS DISTINCT FROM OLD.max_attendees THEN
    SELECT COUNT(*) INTO cnt FROM event_attendees WHERE event_id = NEW.id;
    IF NEW.max_attendees < cnt THEN
      RAISE EXCEPTION 'Kontenjan mevcut katılımcı sayısının (%) altına indirilemez', cnt
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_quota ON events;
CREATE TRIGGER trg_guard_quota
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION guard_quota_decrease();


-- ── D4: kurs ilerlemesi tamamlanınca completed_at boş kalıyordu ──
CREATE OR REPLACE FUNCTION stamp_course_completion()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.progress >= 100 AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  ELSIF NEW.progress < 100 THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_completion ON course_enrollments;
CREATE TRIGGER trg_course_completion
  BEFORE INSERT OR UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION stamp_course_completion();


-- ── D5: bildirimler sınırsız birikiyordu ──
-- 90 günden eski OKUNMUŞ bildirimleri temizleyen bakım fonksiyonu.
-- Supabase → Database → Cron ile haftalık çalıştırılabilir.
CREATE OR REPLACE FUNCTION prune_old_notifications()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n INT;
BEGIN
  DELETE FROM notifications
  WHERE read AND created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE EXECUTE ON FUNCTION prune_old_notifications() FROM PUBLIC, anon, authenticated;


-- ── D6: kişisel bildirimler için indeks zaten var, kontrol ──
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);


-- ============================================================
-- DOĞRULAMA
-- ============================================================
-- 1) Tetikleyiciler yerinde mi?
--      SELECT tgname, tgrelid::regclass FROM pg_trigger
--      WHERE NOT tgisinternal ORDER BY tgrelid::regclass::text, tgname;
--
-- 2) Bir başvuruyu onayladıktan sonra bildirim üretildi mi?
--      SELECT title, body, created_at FROM notifications ORDER BY created_at DESC LIMIT 5;
--
-- 3) Tüm SECURITY DEFINER fonksiyonlarda search_path sabit mi?
--      SELECT proname, proconfig FROM pg_proc
--      WHERE pronamespace = 'public'::regnamespace AND prosecdef AND proconfig IS NULL;
--      → BOŞ dönmeli
