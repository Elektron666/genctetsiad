-- ============================================================
-- 005 — KRİTİK DÜZELTME: yönetim bekleyen başvuruları göremiyordu
-- ============================================================
--
-- Sorun: profiles tablosundaki SELECT politikaları yalnızca
--   (a) onaylı profilleri (role != 'pending') ve
--   (b) kullanıcının kendi profilini
-- görünür kılıyordu. Admin/başkan/yönetim kurulu için bekleyen
-- başvuruları okuma izni YOKTU → Yönetim Paneli'nin ONAYLAR sekmesi
-- her zaman boş dönüyordu (UPDATE izni vardı, ama satır görünmediği
-- için onaylanacak bir şey listelenemiyordu).
--
-- Çözüm: yönetime tüm profilleri okuma izni.
-- ============================================================

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_board());

-- ── generate_member_code: RLS'ten bağımsız çalışmalı ─────────
-- Fonksiyon üye kodu çakışmasını "SELECT 1 FROM profiles" ile
-- kontrol ediyor. SECURITY INVOKER olduğu için RLS gizlediği
-- satırları görmüyordu → teoride aynı kod iki kez üretilip
-- UNIQUE kısıtını ihlal edebilirdi. SECURITY DEFINER ile
-- kontrol tüm tabloya bakar.

CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ── Yönetim duyuru/etkinlik silebilsin ───────────────────────
-- events_manage_admin ve announcements_manage_admin zaten FOR ALL,
-- yani DELETE kapsanıyor. Ek politika gerekmiyor; bu blok yalnızca
-- doğrulama amaçlı bırakıldı (aşağıdaki sorgu 2 satır dönmeli).
--
--   SELECT tablename, cmd FROM pg_policies
--   WHERE policyname IN ('events_manage_admin','announcements_manage_admin');
