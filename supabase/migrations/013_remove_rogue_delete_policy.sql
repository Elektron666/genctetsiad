-- ============================================================
-- 013 — KAÇAK SİLME POLİTİKASININ KALDIRILMASI
-- ============================================================
-- Canlı veritabanında, bu depodaki hiçbir migration'da bulunmayan
-- bir politika tespit edildi:
--
--   profiles_delete_admin — FOR DELETE USING (is_admin_or_board())
--
-- Muhtemelen erken bir denemeden kalmıştı. Ne yaptığı yerel bir
-- PostgreSQL kopyasında ölçüldü: 'board' rolündeki bir hesap tek
-- komutla BAŞKAN DAHİL bütün profilleri sildi.
--
--   profil      3 → 1
--   auth.users  3 → 3   ← hesaplar kaldı, profilleri yok
--   üye yazısı  1 → 0   ← CASCADE ile gitti
--   audit_log   3 → 4   ← yalnızca yazı silinmesi düştü;
--                          PROFİL SİLMELERİ HİÇ KAYDEDİLMEDİ
--
-- İki ayrı sorun:
--
--   1) Yetki: yönetim kurulu üyesi rol hiyerarşisini değiştiremiyor
--      (011 bunu kapattı) ama üye veritabanını komple silebiliyordu.
--      Kayıt da tutulmuyordu.
--
--   2) Tutarsız durum: profiles silinince auth.users satırı KALIYOR.
--      handle_new_user yalnızca auth.users'a INSERT'te tetiklendiği
--      için profil bir daha oluşmuyor. O kişi giriş yapabiliyor ama
--      profili olmadığı için uygulamada kilitleniyor ve aynı
--      e-postayla yeniden kayıt da olamıyor.
-- ============================================================

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

-- Emniyet: bu tabloda hiçbir DELETE politikası kalmamalı.
-- Silme yalnızca aşağıdaki iki denetlenen yoldan yapılır:
--   • delete_own_account()   — kullanıcı kendi hesabını siler (004)
--   • reject_application()   — yönetim bekleyen başvuruyu reddeder (011)
--   • remove_member()        — yönetim onaylı üyeliği sonlandırır (aşağıda)
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE tablename = 'profiles' AND cmd = 'DELETE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', p.policyname);
    RAISE NOTICE 'Kaldırılan DELETE politikası: %', p.policyname;
  END LOOP;
END $$;


-- ── Üyeliği sonlandırmanın denetlenen yolu ──────────────────
--
-- Yönetimin bir üyeyi çıkarması gerekebilir. Doğrudan DELETE yerine
-- auth.users'ı da silen, kaydı audit_log'a yazan ve yalnızca sistem
-- yöneticisine açık olan bir RPC kullanılır.
--
-- Askıya alma (rol = 'pending') geri alınabilir olduğu için
-- çoğu durumda tercih edilmelidir; bu fonksiyon KALICI silme içindir.

CREATE OR REPLACE FUNCTION remove_member(target UUID, reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  t_name TEXT;
  t_role member_role;
BEGIN
  IF NOT is_full_admin() THEN
    RAISE EXCEPTION 'Bu işlem yalnızca sistem yöneticisine açıktır';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'Kendi hesabınızı buradan silemezsiniz';
  END IF;

  SELECT full_name, role INTO t_name, t_role FROM profiles WHERE id = target;
  IF t_name IS NULL THEN
    RAISE EXCEPTION 'Üye bulunamadı';
  END IF;

  INSERT INTO audit_log (actor_id, actor_name, action, target_type, target_id, target_name, details)
  VALUES (auth.uid(), actor_display_name(), 'member_removed', 'profile',
          target::text, t_name,
          jsonb_build_object('rol', t_role, 'gerekce', reason));

  -- auth.users'tan silmek profiles'ı da CASCADE ile götürür; böylece
  -- yetim hesap kalmaz ve kişi isterse yeniden kayıt olabilir.
  DELETE FROM auth.users WHERE id = target;
END;
$$;

REVOKE EXECUTE ON FUNCTION remove_member(UUID, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION remove_member(UUID, TEXT) TO authenticated;


-- ── Aynı sınıftan başka kaçak var mı? ───────────────────────
-- Depodaki migration'ların ürettiği politika kümesi bilinmektedir.
-- Beklenmedik bir politika ileride yine sızarsa erken görülsün diye
-- denetim görünümü bırakıyoruz.

CREATE OR REPLACE VIEW rls_policy_overview AS
  SELECT tablename, cmd, policyname, qual::text AS using_ifadesi, with_check::text AS check_ifadesi
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, cmd, policyname;

ALTER VIEW rls_policy_overview SET (security_invoker = true);
REVOKE ALL ON rls_policy_overview FROM anon, authenticated;


-- ============================================================
-- DOĞRULAMA
-- ============================================================
-- 1) profiles üzerinde DELETE politikası KALMAMALI (0 dönmeli):
--      SELECT count(*) FROM pg_policies
--      WHERE tablename='profiles' AND cmd='DELETE';
--
-- 2) profiles politika sayısı tam 6 olmalı:
--      SELECT count(*) FROM pg_policies WHERE tablename='profiles';
--
-- 3) Tüm politikaların dökümü:
--      SELECT * FROM rls_policy_overview;
