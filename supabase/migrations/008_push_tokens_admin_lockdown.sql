-- ============================================================
-- 008 — Bildirim token'larını yöneticiden de gizle
-- ============================================================
--
-- ⚠️ ÖNKOŞUL: Bunu çalıştırmadan ÖNCE broadcast-push Edge Function'ı
--    dağıtılmış OLMALI:
--
--      supabase functions deploy broadcast-push
--
--    Fonksiyon dağıtılmadan bu migration çalıştırılırsa, yönetici
--    token'ları okuyamayacağı için bildirim gönderimi çalışmaz.
--    (Uygulama yine çökmez — duyuru yayınlanır, yalnızca push gitmez.)
--
-- Neden: 006 sonrası bile push_tokens_select_own_or_admin politikası
-- yönetime TÜM token'ları okuma izni veriyordu. Bir yönetici hesabı
-- ele geçerse saldırgan token'ları çekip üyelere istediği bildirimi
-- gönderebilirdi (Expo Push API gönderen doğrulaması yapmaz).
--
-- Edge Function service_role ile çalıştığı için RLS'ten etkilenmez;
-- dolayısıyla politikayı "yalnızca kendi token'ı" seviyesine
-- indirebiliriz.
-- ============================================================

DROP POLICY IF EXISTS "push_tokens_select_own_or_admin" ON push_tokens;

CREATE POLICY "push_tokens_select_own"
  ON push_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- ── Doğrulama ────────────────────────────────────────────────
-- push_tokens üzerinde tek bir SELECT politikası kalmalı ve
-- is_admin_or_board() içermemeli:
--
--   SELECT policyname, qual FROM pg_policies
--   WHERE tablename = 'push_tokens' AND cmd = 'SELECT';
--
-- Beklenen: 1 satır, qual = (user_id = auth.uid())


-- ── Geri alma (fonksiyon dağıtımı sorun çıkarırsa) ───────────
--
--   DROP POLICY IF EXISTS "push_tokens_select_own" ON push_tokens;
--   CREATE POLICY "push_tokens_select_own_or_admin"
--     ON push_tokens FOR SELECT TO authenticated
--     USING (user_id = auth.uid() OR is_admin_or_board());
