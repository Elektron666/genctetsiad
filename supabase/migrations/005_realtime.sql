-- ============================================================
-- Supabase Realtime — notifications + profiles + announcements tablolarını etkinleştir
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- profiles: admin onayı anında pending → authenticated geçişi için
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- announcements: ana sayfada canlı duyuru güncellemesi için
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
