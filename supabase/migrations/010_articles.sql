-- ============================================================
-- 010 — BÜLTEN / ÜYE YAZILARI (editoryal model)
-- ============================================================
-- Üye yazı gönderir → yönetim inceler → yayınlanır.
--
-- Neden doğrudan yayın DEĞİL:
--   • Kalite: profesyonel dernek bülteni, açık forum değil
--   • Hukuki: onaysız kullanıcı içeriği barındırmak 5651 kapsamında
--     "yer sağlayıcı" yükümlülüklerini gündeme getirir
--   • Mağaza: Apple 1.2 kullanıcı içeriğinde süzme/şikâyet/engelleme
--     şart koşar; ön onay bu yükümlülüklerin çoğunu doğal karşılar
--
-- GÜVENLİK KİLİDİ: Üye kendi yazısını YAYINLAYAMAZ. RLS, üyenin
-- yazabileceği tek durumu 'pending' ile sınırlar; 'published' durumuna
-- yalnızca yönetim geçirebilir.
-- ============================================================

CREATE TYPE article_status AS ENUM ('pending', 'published', 'rejected');

CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  summary      TEXT,                       -- listede görünen kısa özet
  body         TEXT NOT NULL,
  status       article_status NOT NULL DEFAULT 'pending',
  review_note  TEXT,                       -- reddedilirse gerekçe
  reviewed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(title) BETWEEN 5 AND 120),
  CHECK (char_length(body)  BETWEEN 200 AND 20000)
);

CREATE INDEX idx_articles_published ON articles(status, published_at DESC);
CREATE INDEX idx_articles_author    ON articles(author_id);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;


-- ── Okuma ────────────────────────────────────────────────────
-- Yayınlanmış yazıları yalnızca ONAYLI üyeler görür (rehberle aynı kural)
CREATE POLICY "articles_select_published"
  ON articles FOR SELECT TO authenticated
  USING (status = 'published' AND is_approved_member());

-- Yazar kendi yazısını her durumda görür (bekleyen/reddedilen dahil)
CREATE POLICY "articles_select_own"
  ON articles FOR SELECT TO authenticated
  USING (author_id = auth.uid());

-- Yönetim hepsini görür (inceleme kuyruğu)
CREATE POLICY "articles_select_admin"
  ON articles FOR SELECT TO authenticated
  USING (is_admin_or_board());


-- ── Yazma ────────────────────────────────────────────────────
-- Üye yalnızca KENDİ adına ve yalnızca 'pending' olarak gönderebilir.
-- Ayrıca yalnızca onaylı üyeler yazı gönderebilir.
CREATE POLICY "articles_insert_own"
  ON articles FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'pending'
    AND is_approved_member()
  );

-- Üye kendi yazısını, HENÜZ YAYINLANMAMIŞKEN düzeltebilir.
-- Durumu değiştiremez (kendini yayınlayamaz), yazarı değiştiremez.
CREATE POLICY "articles_update_own"
  ON articles FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    AND status IN ('pending', 'rejected')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'pending'
  );

-- Üye kendi yazısını geri çekebilir
CREATE POLICY "articles_delete_own"
  ON articles FOR DELETE TO authenticated
  USING (author_id = auth.uid() AND status <> 'published');

-- Yönetim: inceleme, yayınlama, kaldırma
CREATE POLICY "articles_manage_admin"
  ON articles FOR ALL TO authenticated
  USING (is_admin_or_board())
  WITH CHECK (is_admin_or_board());


-- ── Yayın zamanı ve inceleme bilgisi otomatik ────────────────
CREATE OR REPLACE FUNCTION handle_article_review()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := NOW();
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
      NEW.published_at := NOW();
    END IF;
    -- Yeniden gönderimde eski red gerekçesi temizlenir
    IF NEW.status = 'pending' THEN
      NEW.review_note := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_article_review
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION handle_article_review();


-- ── Denetim kaydı (009 ile aynı mantık) ──────────────────────
CREATE OR REPLACE FUNCTION log_article_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO audit_log (actor_id, actor_name, action, target_type, target_id, target_name, details)
    VALUES (
      auth.uid(), actor_display_name(),
      'article_' || NEW.status, 'article', NEW.id::text, NEW.title,
      jsonb_build_object('eski_durum', OLD.status, 'yeni_durum', NEW.status, 'gerekce', NEW.review_note)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (actor_id, actor_name, action, target_type, target_id, target_name)
    VALUES (auth.uid(), actor_display_name(), 'article_deleted', 'article', OLD.id::text, OLD.title);
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER trg_log_articles
  AFTER UPDATE OR DELETE ON articles
  FOR EACH ROW EXECUTE FUNCTION log_article_change();


-- ============================================================
-- DOĞRULAMA
-- ============================================================
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'articles';
--   → 6 satır dönmeli
--
-- Güvenlik testi (normal üye olarak çalıştırılırsa BAŞARISIZ olmalı):
--   UPDATE articles SET status = 'published' WHERE author_id = auth.uid();
--   → 0 satır etkilenir (WITH CHECK status='pending' zorunlu kılar)
