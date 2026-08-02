-- ============================================================
-- 009 — YÖNETİM İŞLEM KAYDI (audit log)
-- ============================================================
-- Amaç: yönetimsel kararların izlenebilirliği.
--   • Kim kimi onayladı / reddetti
--   • Kim kimin rolünü değiştirdi (yetki yükseltme dahil)
--   • Kim hangi duyuruyu / etkinliği / kursu yayınladı veya kaldırdı
--
-- Neden tetikleyici (trigger) ile: istemciden log yazmak güvenilmez —
-- uygulamayı baypas eden bir istek loglanmaz. Tetikleyici, değişiklik
-- nasıl yapılırsa yapılsın (uygulama, REST API, SQL Editor) kaydı tutar.
--
-- ⚠️ KVKK NOTU: Bu kayıt "her şeyi ihtiyaten toplama" amacı taşımaz —
-- KVKK'nın veri minimizasyonu ilkesi bunu zaten yasaklar. Yalnızca
-- YÖNETİMSEL İŞLEMLER kaydedilir; üyelerin gezinme, okuma veya arama
-- davranışı KAYDEDİLMEZ. Hukuki dayanak: meşru menfaat (hesap
-- verebilirlik ve suistimalin önlenmesi).
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID,                    -- FK YOK: hesap silinse de iz kalmalı
  actor_name  TEXT,                    -- o anki ad (anlık kopya)
  action      TEXT NOT NULL,           -- 'member_approved', 'role_changed', ...
  target_type TEXT,                    -- 'profile' | 'announcement' | 'event' | 'course'
  target_id   TEXT,
  target_name TEXT,                    -- anlık kopya (kayıt silinse de anlaşılsın)
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_log(actor_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Yalnızca yönetim okuyabilir. INSERT/UPDATE/DELETE politikası YOK →
-- kayıt yalnızca SECURITY DEFINER tetikleyicilerle yazılır, hiç kimse
-- (admin dahil) uygulama üzerinden silemez veya değiştiremez.
DROP POLICY IF EXISTS "audit_select_admin" ON audit_log;
CREATE POLICY "audit_select_admin"
  ON audit_log FOR SELECT
  TO authenticated
  USING (is_admin_or_board());


-- ── Yardımcı: işlemi yapanın adını al ───────────────────────
CREATE OR REPLACE FUNCTION actor_display_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(full_name, ''), 'Bilinmeyen')
  FROM profiles WHERE id = auth.uid();
$$;


-- ── Profil: rol değişikliklerini kaydet ─────────────────────
CREATE OR REPLACE FUNCTION log_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO audit_log (actor_id, actor_name, action, target_type, target_id, target_name, details)
    VALUES (
      auth.uid(),
      actor_display_name(),
      CASE
        WHEN OLD.role = 'pending' THEN 'member_approved'
        WHEN NEW.role = 'pending' THEN 'member_suspended'
        ELSE 'role_changed'
      END,
      'profile',
      NEW.id::text,
      NEW.full_name,
      jsonb_build_object(
        'eski_rol', OLD.role,
        'yeni_rol', NEW.role,
        'uye_kodu', NEW.member_code
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_profile_role ON profiles;
CREATE TRIGGER trg_log_profile_role
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_role_change();


-- ── İçerik: yayınlama ve kaldırma ───────────────────────────
CREATE OR REPLACE FUNCTION log_content_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  act TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec := OLD;
    act := TG_ARGV[0] || '_deleted';
  ELSIF TG_OP = 'INSERT' THEN
    rec := NEW;
    act := TG_ARGV[0] || '_created';
  ELSE
    rec := NEW;
    act := TG_ARGV[0] || '_updated';
  END IF;

  INSERT INTO audit_log (actor_id, actor_name, action, target_type, target_id, target_name)
  VALUES (auth.uid(), actor_display_name(), act, TG_ARGV[0], rec.id::text, rec.title);

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_announcements ON announcements;
CREATE TRIGGER trg_log_announcements
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION log_content_change('announcement');

DROP TRIGGER IF EXISTS trg_log_events ON events;
CREATE TRIGGER trg_log_events
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION log_content_change('event');

DROP TRIGGER IF EXISTS trg_log_courses ON courses;
CREATE TRIGGER trg_log_courses
  AFTER INSERT OR UPDATE OR DELETE ON courses
  FOR EACH ROW EXECUTE FUNCTION log_content_change('course');


-- ============================================================
-- KULLANIM
-- ============================================================
-- Son 50 yönetimsel işlem:
--
--   SELECT created_at, actor_name, action, target_name, details
--   FROM audit_log ORDER BY created_at DESC LIMIT 50;
--
-- Belirli bir üyeyle ilgili tüm işlemler:
--
--   SELECT * FROM audit_log
--   WHERE target_type = 'profile' AND target_id = '<uuid>'
--   ORDER BY created_at;
--
-- Not: Bu tablo yalnızca yönetimsel işlemleri tutar. Üyelerin uygulama
-- içi gezinme/okuma davranışı kaydedilmez ve kaydedilmemelidir.
