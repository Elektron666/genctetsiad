-- ============================================================
-- DEMO VERİSİ — YALNIZCA GELİŞTİRME ORTAMI
-- ============================================================
-- ⛔ BU DOSYAYI CANLI VERİTABANINDA ÇALIŞTIRMAYIN.
--
-- Daha önce migrations/002_seed_data.sql adıyla duruyordu. Migration'lar
-- SQL Editor'e sırayla yapıştırılarak uygulandığı için, numarası gereği
-- yanlışlıkla çalıştırılması işten değildi. Çalıştırılırsa üretime
-- 3 uydurma etkinlik, 3 uydurma kurs ve 3 uydurma duyuru girer;
-- duyurular üyelere gerçek bildirim olarak gider.
--
-- Bu yüzden migrations/ klasöründen çıkarıldı ve numarası kaldırıldı.
-- ============================================================

-- Demo etkinlikler
INSERT INTO events (title, description, location, city, starts_at, ends_at, max_attendees) VALUES
  ('Sürdürülebilirlik Zirvesi 2026',
   'Ev tekstili sektöründe sürdürülebilir üretim ve ESG standartları paneli.',
   'İstanbul Kongre Merkezi', 'İstanbul',
   NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '8 hours', 120),

  ('Genç Girişimci Buluşması',
   'Sektörün genç isimleriyle networking ve mentörlük etkinliği.',
   'Ankara Ticaret Odası', 'Ankara',
   NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '4 hours', 60),

  ('İhracat Stratejileri Çalıştayı',
   'Avrupa pazarına giriş, marka konumlandırma ve dijital ihracat.',
   'İzmir Fuarı', 'İzmir',
   NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '6 hours', 80);

-- Demo kurslar
INSERT INTO courses (title, description, instructor, duration_hours, level) VALUES
  ('Tekstil İhracatında Dijital Pazarlama',
   'Amazon, Etsy ve B2B platformlarında marka oluşturma.',
   'Dr. Mehmet Yılmaz', 8, 'beginner'),

  ('ESG Raporlaması ve Sürdürülebilirlik',
   'Avrupa yeşil mutabakatı kapsamında raporlama standartları.',
   'Ayşe Kaya, CFA', 12, 'intermediate'),

  ('Tedarik Zinciri Yönetimi',
   'Lean üretim, just-in-time ve dijital tedarik zinciri araçları.',
   'Prof. Dr. Fatih Özdemir', 16, 'advanced');

-- Demo duyurular
INSERT INTO announcements (title, body, type) VALUES
  ('2026 Dönemi Üyelik Başvuruları Açık',
   'Genç TETSİAD 2026 dönemi üyelik başvuruları devam ediyor. Başvuru için uygulamayı kullanabilirsiniz.',
   'general'),

  ('Sürdürülebilirlik Zirvesi Kayıtları Başladı',
   'Önümüzdeki ay düzenlenecek zirve için erken kayıt indirimi devam ediyor. Kontenjan sınırlıdır.',
   'event'),

  ('Yeni Mentorluk Programı',
   'Bu dönem 8 yeni mentor programımıza katıldı. Akademi sekmesinden başvurabilirsiniz.',
   'system');
