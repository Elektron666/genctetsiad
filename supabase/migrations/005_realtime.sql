-- ============================================================
-- Supabase Realtime — notifications + profiles tablolarını etkinleştir
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- profiles: admin onayı anında pending → authenticated geçişi için
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
