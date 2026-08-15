-- ============================================================
-- RLS GÜVENLİK TESTLERİ
-- ============================================================
-- Bu dosya, migration'lar uygulandıktan SONRA çalıştırılır ve
-- politikaların gerçekten koruduğunu kanıtlar.
--
-- Daha önce bu doğrulama tek seferlik, elle yapılıyordu. Bir sonraki
-- migration onu sessizce bozabilirdi — nitekim 011'in ilk hâlinde
-- yönetim kurulu üyesi hâlâ başkanı düşürebiliyordu ve bu ancak elle
-- denendiği için görüldü.
--
-- Ek eklenti gerektirmez (pgTAP yok): her iddia başarısız olursa
-- EXCEPTION fırlatır, dosya hata koduyla biter, CI kırılır.
--
-- Çalıştırma:  psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- ============================================================

\set ON_ERROR_STOP on
SET client_min_messages TO NOTICE;

-- ── Yardımcılar ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION test_as(uid UUID) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE auth._ctx SET uid = test_as.uid;
END $$;

-- Bir ifadenin RLS tarafından ENGELLENDİĞİNİ doğrular.
-- Engelleme iki biçimde olur: politika reddi (exception) ya da 0 satır.
CREATE OR REPLACE FUNCTION assert_blocked(label TEXT, stmt TEXT) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  BEGIN
    EXECUTE stmt;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN
      RAISE EXCEPTION 'GÜVENLİK TESTİ BAŞARISIZ — "%" engellenmeliydi ama % satır etkiledi', label, n;
    END IF;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN NULL;   -- beklenen
    WHEN raise_exception THEN
      IF SQLERRM LIKE 'GÜVENLİK TESTİ%' THEN RAISE; END IF;     -- kendi hatamız
  END;
  RAISE NOTICE '  engellendi: %', label;
END $$;

-- Bir ifadenin ÇALIŞTIĞINI doğrular (izin verilmesi gerekenler).
CREATE OR REPLACE FUNCTION assert_allowed(label TEXT, stmt TEXT) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  EXECUTE stmt;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE EXCEPTION 'TEST BAŞARISIZ — "%" çalışmalıydı ama 0 satır etkiledi', label;
  END IF;
  RAISE NOTICE '  izin verildi: %', label;
END $$;

CREATE OR REPLACE FUNCTION assert_count(label TEXT, q TEXT, beklenen INT) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  EXECUTE q INTO n;
  IF n IS DISTINCT FROM beklenen THEN
    RAISE EXCEPTION 'TEST BAŞARISIZ — %: beklenen %, gelen %', label, beklenen, n;
  END IF;
  RAISE NOTICE '  % = %', label, n;
END $$;

-- ── Test verisi ──────────────────────────────────────────────

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'yk@test'),
  ('22222222-2222-2222-2222-222222222222', 'bekleyen@test'),
  ('33333333-3333-3333-3333-333333333333', 'baskan@test'),
  ('44444444-4444-4444-4444-444444444444', 'uye@test'),
  ('55555555-5555-5555-5555-555555555555', 'admin@test')
ON CONFLICT DO NOTHING;

SELECT test_as(NULL);   -- sunucu tarafı bağlam
UPDATE profiles SET role = 'board',     full_name = 'YK Uyesi'  WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET role = 'president', full_name = 'Baskan'    WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE profiles SET role = 'member',    full_name = 'Uye'       WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE profiles SET role = 'admin',     full_name = 'Yonetici'  WHERE id = '55555555-5555-5555-5555-555555555555';

INSERT INTO events (id, title, starts_at, max_attendees)
  VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Test Etkinlik', NOW() + INTERVAL '10 days', 50)
  ON CONFLICT DO NOTHING;
INSERT INTO courses (id, title)
  VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'Test Kurs')
  ON CONFLICT DO NOTHING;

GRANT USAGE ON SCHEMA public, auth TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON auth._ctx TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;


-- ============================================================
-- 1) YÖNETİM KURULU HESABI ELE GEÇTİ
-- ============================================================
\echo '── Yönetim kurulu hesabı ele geçti senaryosu'
SELECT test_as('11111111-1111-1111-1111-111111111111');
SET ROLE authenticated;

SELECT assert_blocked('kendini admin yapma',
  $$UPDATE profiles SET role='admin' WHERE id='11111111-1111-1111-1111-111111111111'$$);
SELECT assert_blocked('başkanı pending''e düşürme',
  $$UPDATE profiles SET role='pending' WHERE id='33333333-3333-3333-3333-333333333333'$$);
SELECT assert_blocked('başkanı admin yapma',
  $$UPDATE profiles SET role='admin' WHERE id='33333333-3333-3333-3333-333333333333'$$);
SELECT assert_blocked('başkanın adını değiştirme',
  $$UPDATE profiles SET full_name='Sahte' WHERE id='33333333-3333-3333-3333-333333333333'$$);
SELECT assert_blocked('üyeyi yönetim kuruluna terfi ettirme',
  $$UPDATE profiles SET role='board' WHERE id='44444444-4444-4444-4444-444444444444'$$);
SELECT assert_blocked('1 numaralı üye kodunu alma',
  $$UPDATE profiles SET member_code='GT-2026-00001' WHERE id='11111111-1111-1111-1111-111111111111'$$);
SELECT assert_blocked('kendini mentor ilan etme',
  $$UPDATE profiles SET is_mentor=true WHERE id='11111111-1111-1111-1111-111111111111'$$);
SELECT assert_blocked('profil silme (kaçak politika 013 ile kaldırıldı)',
  $$DELETE FROM profiles WHERE id='44444444-4444-4444-4444-444444444444'$$);
SELECT assert_blocked('denetim kaydını silme',
  $$DELETE FROM audit_log$$);
SELECT assert_blocked('denetim kaydını değiştirme',
  $$UPDATE audit_log SET actor_name='sahte'$$);
SELECT assert_blocked('sahte denetim kaydı ekleme',
  $$INSERT INTO audit_log(actor_name, action) VALUES('sahte','x')$$);
SELECT assert_blocked('başkasının cihaz token''ını silme',
  $$DELETE FROM push_tokens WHERE user_id<>'11111111-1111-1111-1111-111111111111'$$);
RESET ROLE;


-- ============================================================
-- 2) ONAY BEKLEYEN HESAP
-- ============================================================
\echo '── Onay bekleyen hesap'
SELECT test_as('22222222-2222-2222-2222-222222222222');
SET ROLE authenticated;

SELECT assert_blocked('etkinliğe kaydolma',
  $$INSERT INTO event_attendees(event_id,user_id) VALUES('aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222')$$);
SELECT assert_blocked('kursa yazılma',
  $$INSERT INTO course_enrollments(course_id,user_id) VALUES('bbbbbbbb-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222')$$);
SELECT assert_blocked('mentor olmayana başvurma',
  $$INSERT INTO mentorship_requests(mentee_id,mentor_id) VALUES('22222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444')$$);
SELECT assert_blocked('bülten yazısı gönderme',
  $$INSERT INTO articles(author_id,title,body) VALUES('22222222-2222-2222-2222-222222222222','Baslik testi',repeat('x',250))$$);
SELECT assert_blocked('başkasının profilini düzenleme',
  $$UPDATE profiles SET company='hack' WHERE id='33333333-3333-3333-3333-333333333333'$$);

-- Okuma izolasyonu: yalnızca kendi profilini görmeli
SELECT assert_count('onay bekleyenin gördüğü profil', $$SELECT count(*) FROM profiles$$, 1);
SELECT assert_count('onay bekleyenin gördüğü katılımcı', $$SELECT count(*) FROM event_attendees$$, 0);
SELECT assert_count('onay bekleyenin gördüğü yazı', $$SELECT count(*) FROM articles$$, 0);
SELECT assert_count('onay bekleyenin gördüğü denetim kaydı', $$SELECT count(*) FROM audit_log$$, 0);
RESET ROLE;


-- ============================================================
-- 3) NORMAL ÜYE
-- ============================================================
\echo '── Normal üye'
SELECT test_as('44444444-4444-4444-4444-444444444444');
SET ROLE authenticated;

SELECT assert_blocked('kendi rolünü yükseltme',
  $$UPDATE profiles SET role='admin' WHERE id='44444444-4444-4444-4444-444444444444'$$);
SELECT assert_blocked('kendini mentor ilan etme',
  $$UPDATE profiles SET is_mentor=true WHERE id='44444444-4444-4444-4444-444444444444'$$);
SELECT assert_blocked('üye kodunu değiştirme',
  $$UPDATE profiles SET member_code='GT-2026-00001' WHERE id='44444444-4444-4444-4444-444444444444'$$);
SELECT assert_blocked('başkasının profilini düzenleme',
  $$UPDATE profiles SET company='hack' WHERE id='33333333-3333-3333-3333-333333333333'$$);
SELECT assert_blocked('kendi yazısını yayınlama',
  $$INSERT INTO articles(author_id,title,body,status) VALUES('44444444-4444-4444-4444-444444444444','Baslik testi',repeat('x',250),'published')$$);
SELECT assert_blocked('başkasının yazısını yayınlama',
  $$UPDATE articles SET status='published'$$);
SELECT assert_blocked('başkasının cihaz token''ını okuyup silme',
  $$DELETE FROM push_tokens WHERE user_id<>'44444444-4444-4444-4444-444444444444'$$);

SELECT assert_allowed('kendi firmasını düzeltme',
  $$UPDATE profiles SET company='ORMEN' WHERE id='44444444-4444-4444-4444-444444444444'$$);
SELECT assert_allowed('etkinliğe katılma',
  $$INSERT INTO event_attendees(event_id,user_id) VALUES('aaaaaaaa-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444')$$);
RESET ROLE;


-- ============================================================
-- 4) İZİN VERİLMESİ GEREKENLER
-- ============================================================
\echo '── İzin verilmesi gerekenler'
SELECT test_as('11111111-1111-1111-1111-111111111111');
SET ROLE authenticated;
SELECT assert_allowed('yönetim kurulu başvuru onaylıyor',
  $$UPDATE profiles SET role='member' WHERE id='22222222-2222-2222-2222-222222222222'$$);
RESET ROLE;

-- Onay tetikleyicileri çalıştı mı (009 + 011 + 012)
SELECT test_as(NULL);
SELECT assert_count('onay üye kodu atadı',
  $$SELECT count(*) FROM profiles WHERE id='22222222-2222-2222-2222-222222222222' AND member_code IS NOT NULL$$, 1);
SELECT assert_count('onay bildirimi üretildi',
  $$SELECT count(*) FROM notifications WHERE user_id='22222222-2222-2222-2222-222222222222'$$, 1);
SELECT assert_count('onay denetim kaydına yazıldı',
  $$SELECT count(*) FROM audit_log WHERE target_id='22222222-2222-2222-2222-222222222222'$$, 1);


-- ============================================================
-- 5) VERİ BÜTÜNLÜĞÜ KISITLARI
-- ============================================================
\echo '── Veri bütünlüğü'
SELECT assert_blocked('geçmişe etkinlik yayınlama',
  $$INSERT INTO events(title,starts_at) VALUES('Gecmis Etkinlik', TIMESTAMPTZ '2019-01-01')$$);
SELECT assert_blocked('çok kısa duyuru başlığı',
  $$INSERT INTO announcements(title,body) VALUES('ab', repeat('x',50))$$);
SELECT assert_blocked('kontenjanı mevcut katılımcının altına indirme',
  $$UPDATE events SET max_attendees=0 WHERE id='aaaaaaaa-0000-0000-0000-000000000001'$$);

-- Rıza damgası üye tarafından geri alınamamalı
UPDATE profiles SET kvkk_accepted_at = TIMESTAMPTZ '2026-06-01'
  WHERE id='44444444-4444-4444-4444-444444444444';
SELECT test_as('44444444-4444-4444-4444-444444444444');
SET ROLE authenticated;
UPDATE profiles SET kvkk_accepted_at = TIMESTAMPTZ '2020-01-01'
  WHERE id='44444444-4444-4444-4444-444444444444';
RESET ROLE;
SELECT test_as(NULL);
SELECT assert_count('rıza tarihi üye tarafından geri alınamadı',
  $$SELECT count(*) FROM profiles WHERE id='44444444-4444-4444-4444-444444444444'
      AND kvkk_accepted_at = TIMESTAMPTZ '2026-06-01'$$, 1);


-- ============================================================
-- 6) YAPISAL DENETİM
-- ============================================================
\echo '── Yapısal denetim'
SELECT assert_count('profiles DELETE politikası yok',
  $$SELECT count(*) FROM pg_policies WHERE tablename='profiles' AND cmd='DELETE'$$, 0);
SELECT assert_count('profiles politika sayısı',
  $$SELECT count(*) FROM pg_policies WHERE tablename='profiles'$$, 6);
SELECT assert_count('search_path sabitlenmemiş SECURITY DEFINER fonksiyon',
  $$SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace
      AND prosecdef AND proconfig IS NULL$$, 0);
SELECT assert_count('RLS kapalı public tablo',
  $$SELECT count(*) FROM pg_tables t WHERE t.schemaname='public'
      AND NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.relname=t.tablename AND c.relrowsecurity)$$, 0);

\echo ''
\echo '════════════════════════════════════════════'
\echo '  TÜM RLS TESTLERİ GEÇTİ'
\echo '════════════════════════════════════════════'
