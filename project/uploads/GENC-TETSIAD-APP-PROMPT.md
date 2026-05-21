# GENÇ TETSİAD MOBİL UYGULAMA — MASTER DEVELOPMENT PROMPT

## PROJE KİMLİĞİ

**Proje:** Genç TETSİAD Mobil Uygulaması
**Kuruluş:** TETSİAD — Türkiye Ev Tekstili Sanayicileri ve İş İnsanları Derneği (1991'den beri faaliyet)
**Alt yapılanma:** Genç TETSİAD Komisyonu — sektördeki genç iş insanlarını bir araya getiren oluşum
**Proje sahibi:** Fatih Özdemir — ORMEN TEKSTİL, Ankara (Döşemelik kumaş B2B toptan)
**Rol:** Gönüllü proje mimarı ve vizyon sahibi. Kodlamayı yapmıyor, projeyi yönetiyor.
**Hedef:** iOS + Android cross-platform mobil uygulama (React Native + Expo)
**Backend:** Supabase (Frankfurt region — KVKK uyumu)
**Durum:** Çalışan React prototype mevcuttur (JSX artifact). Bu prompt, o prototipin gerçek uygulamaya dönüştürülmesi içindir.

---

## TASARIM SİSTEMİ — "Quiet Luxury"

### Estetik Referanslar
Hermès, Bottega Veneta, Monocle dergi — sessiz lüks. Hiçbir yerde bağırmayan ama her yerde hissedilen kalite. Jenerik dernek uygulaması estetiğinden tamamen uzak. Rakip Genç MÜSİAD uygulaması hazır şablon (Taptoweb white-label) kullanıyor — biz custom, sektöre özel bir kimlik yaratıyoruz.

### Renk Paleti
```
Navy (Ana zemin):     #0D1B2A
Navy Mid:             #1B2D45
Navy Light:           #253B56
Ivory (İçerik zemini): #F5F0E6
Ivory Deep:           #EBE5D8
Gold (Aksan):         #C4A265
Gold Dim:             rgba(196,162,101,0.12)
Gold Line:            rgba(196,162,101,0.30)
Text Muted:           #8B9AAF
Text Warm:            #9A8E7A
```

### Tipografi
- **Serif (başlıklar, büyük yazılar):** Cormorant Garamond — weight 300 italic hero başlıklar, 400-500 normal başlıklar
- **Sans (body, label, UI):** Plus Jakarta Sans — weight 400-700, label'larda 9px + letter-spacing 3px + uppercase
- Emoji veya ikon kullanılmayacak (mümkün olduğunca). Monogram ve tipografik çözümler tercih edilecek.

### UI Dili
- Label'lar: 9px, uppercase, letter-spacing 3-4px, altın veya muted renk
- Ayırıcılar (rule): 0.5px altın çizgi
- Butonlar: Dolgu → altın zemin + lacivert yazı. Outline → şeffaf + altın border + altın yazı. Padding 14px dikey, font 9px, letter-spacing 3px.
- Kartlar: Lacivert zemin kartlar (üyelik kartı, mentor kartı) + ince diagonal weave pattern SVG overlay
- Monogramlar: Yuvarlak, ince altın border, serif italic harfler. Avatar/emoji yerine kullanılır.
- Input alanları: Sadece alt çizgi (underline), serif font 20px, border-bottom altın

### Logo
TETSİAD resmi logosu kullanılacak:
`https://www.tetsiad.org/wp-content/uploads/2024/09/1920-1080-tetsiat-beyaz-logo2.svg`
- Login ekranında: 72px genişlikte, centered
- Header'da: 34px, sağ üstte bildirim çanının yanında
- Künye bölümünde: 48px, soluk (opacity 0.5)
- `onError` handler ile logo yüklenmezse gizlenecek (fallback: "GENÇ TETSİAD" text)

---

## UYGULAMA MİMARİSİ

### Tech Stack
```
Frontend:       React Native + Expo (managed workflow)
Backend:        Supabase (Auth, Database, Storage, Realtime)
Admin Panel:    Next.js (ayrı web uygulaması)
Push:           Expo Notifications veya OneSignal
SMS OTP:        Netgsm (Türkiye yerel) veya Twilio
Media CDN:      Supabase Storage veya Cloudinary
Error Tracking: Sentry
State Mgmt:     React Context + useReducer (Redux gereksiz bu ölçekte)
Navigation:     React Navigation (bottom tabs + stack)
```

### Supabase Veri Modeli (PostgreSQL)

```sql
-- ÜYE TABLOSU
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code TEXT UNIQUE, -- GT-2026-00512 formatında
  auth_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  city TEXT,
  sector TEXT, -- döşemelik, perde, havlu, halı, iplik, aksesuar, vb.
  role TEXT DEFAULT 'uye', -- uye, yonetim, baskan, editor, admin
  bio TEXT,
  avatar_url TEXT,
  is_student BOOLEAN DEFAULT false, -- üniversite öğrencisi bayrağı
  university TEXT, -- öğrenci ise hangi üniversite
  kvkk_accepted BOOLEAN DEFAULT false,
  kvkk_accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, active, inactive, rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ÜYE KODU OTOMATİK ATAMA (TRIGGER)
-- Format: GT-{yıl}-{5 haneli sıralı numara}
-- Örnek: GT-2026-00001, GT-2026-00512

-- ETKİNLİK TABLOSU
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT, -- FUAR, ÜNİVERSİTE, SAHA GEZİSİ, SOSYAL, TEKNOLOJİ, ARAŞTIRMA, YARIŞMA, ZİRVE
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  image_url TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ETKİNLİK KATILIM
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered', -- registered, attended, cancelled
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, member_id)
);

-- DUYURULAR
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT DEFAULT 'normal', -- normal, high, urgent
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AKADEMİ — EĞİTİMLER
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT, -- uzman_konusmaci, dijital, surec, muhasebe, iletisim, ozel_talep
  instructor TEXT,
  duration_weeks INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- EĞİTİM İLERLEME
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0, -- 0-100
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, member_id)
);

-- MENTÖRLER
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  expertise TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- MENTORLUK BAŞVURULARI
CREATE TABLE mentor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id),
  member_id UUID REFERENCES members(id),
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BİLDİRİMLER
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT, -- event, announcement, mentor, system
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row-Level Security (RLS) Kuralları
```
-- Üye sadece kendi verisini görebilir
-- Yönetim ve admin tüm üyeleri görebilir
-- Editor etkinlik ve duyuru ekleyebilir/düzenleyebilir
-- Admin her şeyi yapabilir
-- Üye listesi: aktif üyeler herkes tarafından görülebilir (temel bilgiler)
```

### Üye Kayıt Akışı
```
1. Telefon numarası girişi → SMS OTP (6 haneli kod)
2. OTP doğrulama
3. Temel bilgiler: Ad, Soyad, E-posta
4. Firma bilgileri: Firma adı, Şehir, Sektör alt dalı, Pozisyon
5. KVKK aydınlatma metni + açık rıza onayı (checkbox)
6. "Onay beklemede" durumu → Admin paneline düşer
7. Admin onayı → Üye kodu otomatik atanır (GT-2026-XXXXX) → Push bildirim
8. Üye uygulamaya giriş yapabilir
```

### Giriş Yöntemleri
- **Telefon + OTP** (birincil — önerilen)
- **E-posta + Şifre** (alternatif — kurumsal alışkanlık için)
- **Biyometrik** (sonraki girişlerde Face ID / Touch ID)
- Demo ekranda her iki yöntem de toggle ile gösterilmeli

### Üye ID Sistemi
```
Format: GT-{YIL}-{5_HANELI_SIRA}
Örnek: GT-2026-00512

GT    = Genç TETSİAD
YIL   = Üyelik yılı
SIRA  = Sıralı numara (Supabase trigger ile otomatik)
```

---

## EKRANLAR VE İÇERİK

### 1. GİRİŞ EKRANI (Login)
- Lacivert tam ekran zemin
- Üstte TETSİAD logosu (SVG, 72px)
- "GENÇ TETSİAD" serif başlık + "ÜYE GİRİŞİ" label
- Toggle: TELEFON · OTP ↔ E-POSTA · ŞİFRE
  - Telefon: +90 prefix + numara → "KOD GÖNDER" → 6 haneli OTP kutuları + geri sayım + "TEKRAR GÖNDER"
  - E-posta: email input + şifre input + "Beni hatırla" checkbox + "UNUTTUM" link
- "VEYA" ayırıcı → "FACE ID İLE GİRİŞ" outline buton
- Alt: "Üyelik başvurusu yap →" link
- En altta: "KONSEPT · FATİH ÖZDEMİR · ORMEN TEKSTİL" imza

### 2. ANA SAYFA (Kapak)
- **Header:** Sol üstte "GENÇ TETSİAD" label + sayfa adı serif. Sağ üstte bildirim çanı (badge sayısı) + TETSİAD logosu.
- **Hero bölümü:** Lacivert zemin, diagonal weave pattern overlay. "Değişim / gençlerle / olacak." (serif 44px, son kelime altın). Altında manifesto metni + "BAŞVUR" butonu. Alt kısmında "KONSEPT & TASARIM: Fatih Özdemir / ORMEN TEKSTİL · ANKARA" byline + FÖ monogram.
- **Son etkinlik fotoğrafı:** TETSİAD İftar veya güncel etkinlik fotoğrafı, gradient overlay ile caption.
- **Yatay etkinlik kartları:** İlk 4 yaklaşan etkinlik, fotoğraflı, yatay scroll.
- **Vizyon & Misyon:** Belgeden birebir: Vizyon = "Ev tekstilinde genç, öncü, yenilikçi ve sürdürülebilir bir ekip olmak." Misyon = "Genç temsilcileri bir araya getirerek bilgi paylaşımı, eğitim ve mentorluk yoluyla sektörün geleceğini güçlendirmek."
- **Hızlı istatistikler:** 1.500+ Üye · 55 İl · 40 Ülke · 10 Etkinlik
- **4 Faaliyet Alanı:** I. Üniversiteler & Fabrikalar, II. Gençlik Zirvesi, III. Gençlik Buluşmaları, IV. Mentörlük (her birinin açıklaması belgeden)
- **6 Hedef:** Belgeden birebir (01-06 numaralı)
- **7 Alt Komisyon:** Sektör Konuları, İletişim Medya ve PR, Kurumsal İlişkiler, Üniversiteler, Üye Kabul, Organizasyon ve Etkinlik, İhracat Geliştirme (lacivert etiketler)
- **İşbirlikleri:** Mimar Sinan GSÜ, Boğaziçi, Bilkent, İTÜ, ODTÜ, Yalova, MEB, TMMOB (altın çerçeveli etiketler)
- **Pull quote:** "Sektörün geleceğini gençlerle inşa etmek istiyoruz." — GENÇ TETSİAD KOMİSYONU · 2026
- **Künye:** Lacivert zemin. Konsept: Fatih Özdemir / ORMEN TEKSTİL. Yayımlayan: Genç TETSİAD Komisyonu.

### 3. TAKVİM (Etkinlikler)
- Sayfa başlığı: "Yaklaşan etkinlikler." serif 36px
- **Filtre:** TÜMÜ, FUAR, ÜNİVERSİTE, SAHA GEZİSİ, SOSYAL, TEKNOLOJİ, ARAŞTIRMA, YARIŞMA, ZİRVE (yatay scroll pill butonları)
- **Etkinlik listesi:** Her etkinlik:
  - Sol: Büyük gün sayısı (serif 30px) + ay adı (italic)
  - Dikey altın çizgi ayırıcı
  - Sağ: Tag label + başlık (serif 19px bold) + yer + katılımcı sayısı
  - Tıklayınca açılan detay: etkinlik fotoğrafı + açıklama + KATIL/İPTAL butonu
  - Katılınca "KATILDIM" badge'i görünür

**2026 Gerçek Etkinlik Takvimi:**
| Tarih | Etkinlik | Tag |
|-------|----------|-----|
| 22 Nisan | İstanbul Fabrika Ziyareti | SAHA GEZİSİ |
| 14 Mayıs | HOMETEX Fuar Çalışması | FUAR |
| 22 Mayıs | İTÜ Tasarım Etkinlikleri | ÜNİVERSİTE |
| 12 Haziran | Bursa Fabrika Ziyareti | SAHA GEZİSİ |
| 18 Temmuz | Gençlik Buluşması | SOSYAL |
| 7 Ağustos | Yapay Zeka Etkinlikleri (Google) | TEKNOLOJİ |
| 15 Eylül | Güneydoğu Turu · Etnik Desen | ARAŞTIRMA |
| 10 Ekim | MSGSÜ Tasarım Etkinliği | ÜNİVERSİTE |
| 14 Kasım | Tasarım Yarışması | YARIŞMA |
| 12 Aralık | Gençlik Zirvesi | ZİRVE |

### 4. ÜYE REHBERİ
- Sayfa başlığı: "Dokuyu oluşturanlar." serif 36px
- **Arama:** Serif italic input, ince altın border. İsim, firma, şehir, sektör üzerinden aranabilir.
- **Üye kartları:** Mono monogram + isim + firma + şehir + sektör + bio (italic). Yönetim üyelerine altın badge. MESAJ ve PROFİL butonları.
- Fatih Özdemir / ORMEN TEKSTİL kartının monogramı altın vurgulu (gold variant).

### 5. AKADEMİ (Eğitim & Mentorluk)
- Sayfa başlığı: "Ustadan çırağa." serif 36px
- Toggle: EĞİTİMLER ↔ MENTÖRLER
- **Eğitimler (6 kategori — belgeden birebir):**
  1. Uzman Konuşmacılar — Alanında uzman isimlerle seminerler
  2. Dijital Eğitimler — Sosyal medya ve e-ticaret stratejileri
  3. Süreç Eğitimleri — Üretimden pazarlamaya tam süreç
  4. Muhasebe — Doğru ticari muhasebe pratikleri
  5. İletişim — Diksiyon ve hitabet eğitimleri
  6. Özel Talepler — Üye talebi ile açılan özel başlıklar
  - Her birinde ilerleme barı (2px, navy/gold) + yüzde + durum labeli
- **Mentörler:** Lacivert zemin kartlar + weave overlay + mentor bilgileri + "MENTORLUK BAŞVURUSU" buton

### 6. PROFİL (Üyelik Kartı)
- **Üyelik kartı:** Lacivert zemin + weave pattern. Fatih Özdemir / FÖ monogram (altın kare). Firma: ORMEN TEKSTİL. Şehir: Ankara. Sektör: Döşemelik. Alt çizgide "GENÇ TETSİAD · AKTİF" + "№ 0342"
- **İstatistikler:** 08 Etkinlik · 02 Sertifika · 34 Bağlantı
- **Menü:** 01 Üyelik Bilgileri, 02 Bildirim Ayarları, 03 Katılım Geçmişi, 04 Belgelerim, 05 Destek
- **Çıkış Yap** butonu → login ekranına döner

### 7. TAB BAR
- Lacivert zemin, üst kenarda altın çizgi
- 5 sekme: KAPAK · TAKVİM · REHBER · AKADEMİ · KART
- Aktif sekme: altın renk + üstte ince altın underline
- İkon yok, sadece label (9px, uppercase, letter-spacing 2.5px)

---

## GÜVENLİK

### KVKK Uyumu (Zorunlu)
- Kayıt sırasında aydınlatma metni + açık rıza checkbox'u
- Veri silme hakkı (üyelikten çıkarken tüm veri silinebilmeli)
- Veri taşınabilirliği (üye kendi verisini JSON olarak indirebilmeli)
- VERBİS kaydı TETSİAD tarafından yapılmalı

### Teknik Güvenlik
- Tüm trafik HTTPS (TLS 1.3)
- Supabase RLS (row-level security) her tabloda aktif
- JWT token: 15 dk access + 30 gün refresh
- Rate limiting (brute force koruması)
- Hassas veriler şifreli (telefon, e-posta)
- Audit log: kim ne zaman neyi değiştirdi

### Rol Tabanlı Yetkilendirme
```
uye:       Kendi profilini görebilir/düzenleyebilir, etkinliklere katılabilir, eğitimlere erişebilir
editor:    Etkinlik ve duyuru ekleyebilir/düzenleyebilir, içerik yönetimi
yonetim:   Üye onayı/reddi, tüm üye listesini görebilir, raporlar
admin:     Her şey + sistem ayarları + rol atamaları
```

---

## ADMIN PANELİ (Next.js Web Uygulaması)

Ayrı bir web uygulaması. Bilgisayardan yönetilir.

| Panel | Yetki | İşlev |
|-------|-------|-------|
| Dashboard | Tüm admin | Üye sayısı, bekleyen başvurular, aktif etkinlikler |
| Üye Yönetimi | Yönetim | Onay/red, durum değiştirme, arama, Excel export |
| Etkinlik Yönetimi | Editor | Oluştur, düzenle, iptal, katılımcı listesi |
| İçerik Editörü | Editor | Duyuru, kapak haberi yönetimi |
| Akademi Modülü | Admin | Kurs ekleme, ilerleme takibi, sertifika |
| Mentor Yönetimi | Admin | Mentor listesi, başvuru eşleştirme |
| Bildirim Gönderici | Admin | Push notification (segmentli veya toplu) |
| Raporlar | Yönetim | Aylık aktivite, katılım istatistikleri |

---

## FOTOĞRAF / GÖRSEL KULLANIMI

### Etkinlik Görselleri
Her etkinliğe uygun stok fotoğraf veya gerçek TETSİAD fotoğrafı. Kaynaklar:
- TETSİAD web sitesi: `tetsiad.org` (İftar, HOMETEX, fuar fotoğrafları)
- Unsplash (ücretsiz stok): fabrika, fuar, üniversite kampüs, networking, AI konferans

### Fotoğraf kullanım kuralları
- Ana sayfa hero banner: Gerçek TETSİAD etkinlik fotoğrafı tercih edilir
- Etkinlik detaylarında: Her etkinliğe konuyla uyumlu fotoğraf
- Üye avatarları: Monogram (baş harfler) kullanılır, fotoğraf yükleme opsiyonel
- Tüm fotoğraflar `objectFit: "cover"` ile gösterilir
- `onError` handler ile yüklenemezse gizlenir veya placeholder gösterilir

---

## PERFORMANS VE UX

- Skeleton loaders (içerik yüklenirken)
- Pull-to-refresh (etkinlik ve duyuru listelerinde)
- Offline mod: Son görüntülenen veriler cache'lenir
- Haptic feedback (iOS — buton tıklamaları)
- Font yükleme: font-display: swap
- Image lazy loading
- Animasyonlar: Sadece tab geçişlerinde ve modal açılışlarında, subtle, 200-300ms

---

## ÖNCELİK SIRASI (MVP Sprint Planı)

### Sprint 1 (Hafta 1-2): Altyapı
- [ ] Expo projesi kurulumu
- [ ] Supabase hesabı + veri modeli
- [ ] Tasarım sistemi (renkler, fontlar, componentler)
- [ ] Navigation yapısı (tab bar + stack)

### Sprint 2 (Hafta 3-4): Auth
- [ ] Login ekranı (telefon + e-posta)
- [ ] OTP doğrulama akışı
- [ ] Kayıt formu (6 adım)
- [ ] KVKK onay ekranı

### Sprint 3 (Hafta 5-6): Ana İçerik
- [ ] Ana sayfa (hero, vizyon, faaliyetler, hedefler)
- [ ] Etkinlik listesi + filtre + detay + katılım
- [ ] Üye rehberi + arama

### Sprint 4 (Hafta 7-8): Akademi & Profil
- [ ] Akademi ekranı (6 kategori + ilerleme)
- [ ] Mentor kartları + başvuru
- [ ] Profil / üyelik kartı
- [ ] Bildirimler

### Sprint 5 (Hafta 9-10): Admin Panel
- [ ] Next.js admin panel iskeleti
- [ ] Üye onay/red
- [ ] Etkinlik CRUD
- [ ] Bildirim gönderici

### Sprint 6 (Hafta 11-12): Test & Lansman
- [ ] Beta test (20-30 üye)
- [ ] Bug fix + performans
- [ ] App Store + Google Play başvurusu
- [ ] Lansman materyalleri

---

## MEVCUT DOSYALAR

Bu prompt ile birlikte şu dosyalar referans olarak kullanılabilir:

1. **genc-tetsiad-v3.jsx** — Çalışan React prototype. Tüm ekranlar, login, içerikler, tasarım sistemi dahil. Bu dosya tasarımın "nasıl görünmesi gerektiğini" gösterir.
2. **Genc-TETSIAD-Proje-Dokumani.pdf** — 14 sayfalık proje dokümanı. Yönetici özeti, teknik mimari, backend kıyası, MVP yol haritası, bütçe, risk analizi.
3. **Genc-TETSIAD-Komisyonu.pdf** — Genç TETSİAD'ın kendi vizyon belgesi. Faaliyet alanları, hedefler, organizasyon yapısı, 2026 etkinlik takvimi, komisyonlar, işbirlikleri.

---

## KRİTİK NOTLAR

1. **"Fatih Özdemir · ORMEN TEKSTİL"** imzası uygulamada 3 yerde görünmeli: Login altı, ana sayfa hero byline, künye bölümü.
2. **TETSİAD başkanı Murat Şahinler'dir** (Ekim 2025'te seçildi). Ufuk Ocak değil.
3. **Genç TETSİAD henüz resmi olarak kurulmadı** — komisyon aşamasında. Uygulama bu komisyonun en somut çıktısı olacak.
4. **Üniversite öğrencileri** de hedef kitle — kayıt formunda `is_student` boolean bayrağı yeterli, ayrı akış yok.
5. **Komisyon/hiyerarşi yapısı** henüz netleşmedi — MVP'de basit tutulacak, v2'de genişletilecek.
6. **2026 etkinlik takvimi belgede mevcut** — Şubat'tan Aralık'a 12 etkinlik planlanmış. Bunlar gerçek veri olarak kullanılacak.
7. **Rakip analizi:** Genç MÜSİAD uygulaması = Taptoweb white-label, 100+ indirme, jenerik. Bizim avantajımız = sektöre özel kimlik, custom geliştirme.
