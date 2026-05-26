-- ============================================================
-- Realtime: events tablosunu yayına ekle
-- ============================================================
-- Admin yeni etkinlik oluşturduğunda veya güncellediğinde
-- takvim ekranı otomatik güncellensin.
ALTER PUBLICATION supabase_realtime ADD TABLE events;
