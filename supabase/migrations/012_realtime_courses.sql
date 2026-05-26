-- ============================================================
-- Realtime: courses tablosunu yayına ekle
-- ============================================================
-- Admin yeni kurs oluşturduğunda veya güncellediğinde
-- akademi ekranı otomatik güncellensin.
ALTER PUBLICATION supabase_realtime ADD TABLE courses;
