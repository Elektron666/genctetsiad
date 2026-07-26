-- ============================================================
-- 007 — RLS EMNİYET AĞI (herkese açık depo varsayımıyla)
-- ============================================================
-- Depo public: anon key ve şema herkes tarafından görülebilir.
-- Bu durumda RLS'te en ufak boşluk doğrudan veri sızıntısıdır.
-- Bu migration, gözden kaçmış yüzeyleri kapatır.
-- ============================================================


-- ── 1) RLS'i olmayan HER tabloya RLS aç ─────────────────────
--
-- Migration'larımızda 9 tabloya RLS açıldı. Ancak veritabanında
-- bizim oluşturmadığımız tablolar da olabilir (ör. 'broadcasts' —
-- Supabase şablonundan veya elle gelmiş). RLS'i kapalı bir tablo,
-- anon key'i olan HERKES tarafından okunup yazılabilir.
--
-- RLS açık + politika yok = tüm erişim reddedilir (güvenli varsayılan).
-- Uygulamanın kullandığı 9 tablonun tamamının politikası zaten var,
-- dolayısıyla bu döngü uygulamayı etkilemez.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'            -- yalnızca normal tablolar
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
    RAISE NOTICE 'RLS etkinleştirildi: %', t.relname;
  END LOOP;
END $$;


-- ── 2) View'ler RLS'i baypas ediyordu ───────────────────────
--
-- Postgres'te bir view, varsayılan olarak SAHİBİNİN yetkileriyle
-- çalışır — yani alt tablodaki RLS politikalarını baypas eder.
-- event_attendee_counts, event_attendees üzerinden okuma yapıyor.
-- security_invoker = true, view'in çağıranın yetkileriyle çalışmasını
-- ve RLS'in uygulanmasını sağlar.
--
-- Not: Bu view uygulama tarafından kullanılmıyor (katılımcı sayısı
-- gömülü sorguyla alınıyor). Güvenli hâle getiriyoruz; istenirse
-- tamamen kaldırılabilir: DROP VIEW IF EXISTS event_attendee_counts;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'event_attendee_counts'
  ) THEN
    EXECUTE 'ALTER VIEW public.event_attendee_counts SET (security_invoker = true)';
  END IF;
END $$;


-- ── 3) anon rolüne verilmiş politika olmadığını garanti et ──
--
-- Tüm politikalarımız 'TO authenticated'. Oturum açmamış bir istemci
-- (anon) hiçbir şey okuyamaz. Aşağıdaki sorgu bunu doğrular —
-- SIFIR satır dönmelidir. Satır dönerse o politika gözden geçirilmeli.
--
--   SELECT tablename, policyname, roles FROM pg_policies
--   WHERE schemaname = 'public' AND 'anon' = ANY(roles);


-- ============================================================
-- DENETİM SORGUSU — bu migration'dan sonra çalıştır
-- ============================================================
-- Beklenen: rls_kapali_tablo = 0, anon_politikasi = 0,
--           korumasiz_view = 0, definer_search_path_yok = 0
--
--   SELECT
--     (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
--        WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity)
--       AS rls_kapali_tablo,
--     (SELECT COUNT(*) FROM pg_policies
--        WHERE schemaname='public' AND 'anon' = ANY(roles))
--       AS anon_politikasi,
--     (SELECT COUNT(*) FROM pg_views v
--        WHERE v.schemaname='public'
--          AND NOT COALESCE((SELECT (c.reloptions::text LIKE '%security_invoker=true%')
--                            FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
--                            WHERE n.nspname='public' AND c.relname=v.viewname), false))
--       AS korumasiz_view,
--     (SELECT COUNT(*) FROM pg_proc
--        WHERE pronamespace='public'::regnamespace AND prosecdef
--          AND (proconfig IS NULL OR NOT EXISTS (
--                SELECT 1 FROM unnest(proconfig) x WHERE x LIKE 'search_path=%')))
--       AS definer_search_path_yok;
