# Genç TETSİAD

Türkiye ev tekstilinin genç iş insanları için üyelik platformu.
TETSİAD gençlik yapılanmasının üyelerine özel mobil uygulaması.

**Konsept ve tasarım:** Fatih Özdemir · ORMEN TEKSTİL, Ankara

---

## Ne yapar

| | |
|---|---|
| **Üye rehberi** | Onaylı üyelerin firma, şehir ve sektör bilgisiyle listesi |
| **Etkinlik takvimi** | Fabrika ziyaretleri, fuarlar, komite toplantıları — kontenjanlı kayıt |
| **Akademi** | Gelişim programları, eğitim kataloğu ve mentorluk eşleştirmesi |
| **Bülten** | Üyelerin yazdığı, yönetimin incelediği sektör yazıları |
| **Duyurular** | Yönetimden anlık bildirim |
| **Dijital kartvizit** | QR ile paylaşılan üyelik kartı |
| **Yönetim paneli** | Başvuru onayı, içerik yayını, denetim kaydı |

Üyelik başvuruyla açılır ve **yönetim onayından geçer**. Onay bekleyen
kullanıcı duyuru ve etkinlikleri görebilir; rehber ile bülten onaydan
sonra açılır.

---

## Teknoloji

React Native 0.85 · Expo SDK 56 · TypeScript · Supabase (Postgres + RLS + Auth)
· EAS Build · Sentry

Kimlik doğrulama e-posta ile tek kullanımlık kod üzerinden yapılır.
Veri erişimi tamamen **Row Level Security** ile korunur — istemciye gömülü
anon anahtarı herkese açıktır, tek gerçek savunma katmanı RLS'tir.

---

## Yapı

```
native/                 Mobil uygulama (Expo Router)
  app/                  Ekranlar
  src/hooks/            Veri katmanı (Supabase)
  src/lib/              Supabase istemcisi, bildirimler, Sentry
supabase/
  migrations/           Şema ve RLS politikaları — SIRAYLA çalıştırılır
  seed/                 Demo verisi (yalnızca geliştirme)
  functions/            Edge Functions
docs/                   Gizlilik politikası, güvenlik notları, yayın rehberi
```

---

## Kurulum

```bash
cd native
npm ci
cp .env.example .env      # Supabase URL ve anon anahtarını girin
npx expo start
```

Veritabanı: `supabase/migrations/` altındaki dosyalar **numara sırasıyla**
Supabase SQL Editor'de çalıştırılır. `supabase/seed/` içindekiler yalnızca
geliştirme ortamı içindir.

```bash
npm run typecheck    # tip denetimi
npm run lint         # ESLint
```

---

## Belgeler

- [Güvenlik notları](docs/GUVENLIK.md) — tehdit modeli ve RLS kararları
- [Denetim raporu](docs/DENETIM-200.md) — 210 maddelik inceleme
- [Yayın yol haritası](docs/YAYIN-YOL-HARITASI.md)
- [Derleme rehberi](docs/BUILD.md)
- [Gizlilik politikası](docs/gizlilik-politikasi.html) · [Kullanım koşulları](docs/kullanim-kosullari.html)

---

## İletişim

TETSİAD — Tekstil Sanayicileri ve İşadamları Derneği
info@tetsiad.org · +90 212 292 04 04
