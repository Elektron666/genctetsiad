# Güvenlik Durumu — Genç TETSİAD

Son denetim: 26 Temmuz 2026

Tehdit modeli: **depo herkese açık, anon key her istemcide.** Bir saldırgan
şemayı, politikaları ve anahtarı bilir. Tek gerçek savunma RLS ve dashboard
ayarlarıdır.

---

## ✅ Kod ve veritabanında kapatılanlar

| # | Bulgu | Etki | Durum |
|---|---|---|---|
| H1 | Onaylanmamış kullanıcı **tüm üye rehberini** çekebiliyordu | Ad, telefon, firma, şehir toplanabilir | ✅ 006 |
| H2 | Kullanıcı kendini **mentor** yapabiliyor, **üye kodunu** değiştirebiliyordu | Kimlik sahtekârlığı | ✅ 006 |
| H3 | RLS'i kapalı tablo olabilir (`broadcasts`) | Tam okuma/yazma erişimi | ✅ 007 |
| H4 | `event_attendee_counts` view'i **RLS'i baypas ediyordu** | Politika atlanır | ✅ 007 |
| M1 | 3 SECURITY DEFINER fonksiyonunda `search_path` sabit değil | Fonksiyon ele geçirme | ✅ 006 |
| M2 | Kontenjan yalnızca istemcide denetleniyordu | API'den aşılabilir | ✅ 006 |
| M3 | Yönetim **bekleyen başvuruları göremiyordu** | Onay akışı kırık | ✅ 005 |
| L1 | Mentor başvuru metnini değiştirebiliyordu | Veri tahrifi | ✅ 006 |
| L2 | Ölü dosyada gerçek isim + telefon (public depo) | Gereksiz PII yayını | ✅ silindi |

**Doğrulanan sağlamlıklar:** `service_role` anahtarı hiçbir yerde yok ·
`.env` commit edilmemiş · log sızıntısı yok · oturum Keystore/Keychain'de
şifreli · `detectSessionInUrl` kapalı · tüm politikalar `TO authenticated`
(anon hiçbir şey okuyamaz) · yönetim paneli hem istemcide hem RLS'te
korunuyor (APK kırılsa bile sunucu reddeder) · hesap silme tüm verileri
zincirleme siliyor.

---

## 🔴 SENİN YAPMAN GEREKENLER — dashboard (koda kapalı)

### 1. Veritabanı şifresini DEĞİŞTİR (kritik, hemen)

Şifre bu sohbete düştü — ifşa sayılmalı.

`Supabase → Project Settings → Database → Reset database password`

### 2. Anonim girişi kapat

`Authentication → Sign In / Up → Anonymous sign-ins` → **KAPALI**

Açıksa: herkes hiçbir doğrulama olmadan `authenticated` oturum alır.

### 3. Yalnızca telefon sağlayıcısı açık olsun

`Authentication → Sign In / Up → Auth Providers`
- **Phone: AÇIK**
- **Email: KAPALI** · diğer tüm sağlayıcılar: **KAPALI**

Email açıksa, telefon doğrulaması olmadan hesap yaratılabilir.

### 4. OTP ömrünü kısalt

`Authentication → Sign In / Up → Phone → OTP Expiry`
- Varsayılan: 3600 sn (1 saat) → **300–600 sn (5–10 dk)** yap

6 haneli kodun 1 saat geçerli olması gereksiz geniş bir pencere.

### 5. SMS oran sınırlarını sıkılaştır (para riski)

`Authentication → Rate Limits`

Saldırı senaryosu: bir script rastgele numaralarla sürekli OTP ister →
**her SMS'i sen ödersin.** Twilio bağladıktan sonra bu gerçek bir maliyet
saldırısıdır.

- `Rate limit for sending SMS messages` → ihtiyacına göre düşük tut
  (ör. saatte 30–50; dernek ölçeğinde fazlasıyla yeterli)

> İleri seviye: aynı sayfada **Captcha** (hCaptcha / Cloudflare Turnstile)
> etkinleştirilebilir. **Ama bu tek başına giriş akışını bozar** —
> istemcinin `captchaToken` göndermesi gerekir. Etkinleştirmek istersen
> söyle, kodu birlikte ekleyelim.

### 6. Supabase hesabına 2FA aç

`Account → Security → Two-factor authentication`

Supabase hesabın ele geçerse RLS'in hiçbir önemi kalmaz — her şeye erişilir.

### 7. GitHub

- Hesabına **2FA** aç
- Depoyu **gizli** yapmayı değerlendir (aşağıdaki bölüm)

### 8. Yedekleme

Ücretsiz katmanda **point-in-time recovery yok.** Üye verisi kaybı veya
yanlışlıkla silme geri alınamaz.

- Kısa vade: `Database → Backups` sayfasından düzenli manuel yedek indir
- Üye sayısı artınca Pro katmana geçmeyi planla (günlük yedek + PITR)

---

## ⚖️ Kabul edilmiş riskler ve gerekçeleri

### Anon key herkese açık
**Kaçınılmaz.** Anahtar her APK'nın içinde; kimse gizleyemez. Güvenlik
RLS'ten gelir — bu yüzden yukarıdaki H1–H4 düzeltmeleri kritikti.

### Depo herkese açık
Anahtar zaten gizli değil, **ama** tüm şema ve RLS politikalarını
yayınlamak saldırgana bedava keşif sağlar.

**Karar: public kalıyor.** Gerekçe: gizlilik politikası GitHub Pages'te
barınıyor ve mağazalar için zorunlu; ücretsiz planda Pages public depo
istiyor. Depoyu gizlemek somut bir zorunluluğu kırar, karşılığında yalnızca
"keşif zorlaştırma" kazandırır — RLS denetimi kapalı çıktığı için (0·0·0)
şemayı görmek saldırgana eyleme dönüştürebileceği bir şey vermiyor.

İleride tetsiad.org'a kurumsal bir sayfa açılırsa metni oraya taşıyıp
depoyu gizlemek mantıklı olur.

### Bildirim gönderimi — ✅ sunucuya taşındı
Önceden push adminin telefonundan gönderiliyordu; bu, istemcinin **tüm
üyelerin bildirim token'larını okumasını** gerektiriyordu. Yönetici hesabı
ele geçerse saldırgan token'ları çekip üyelere istediği bildirimi
gönderebilirdi.

Artık `supabase/functions/broadcast-push` Edge Function'ı var: yetki
çağıranın JWT'siyle doğrulanır, token okuma ve gönderim `service_role`
ile sunucuda kalır — token'lar istemciye hiç inmez.

Tamamlamak için iki adım:
1. `supabase functions deploy broadcast-push`
2. Ardından migration **008** (token'ları yöneticiden de gizler)

Fonksiyon dağıtılmadan da uygulama çalışır: istemci eski yola geri
düşer. 008'i yalnızca dağıtımdan SONRA çalıştır.

### Üye telefonları onaylı üyelere görünür
Bu **bilinçli bir ürün kararı** — rehberin amacı bu. KVKK aydınlatma
metninde açıkça yazıyor. Onaylanmamış kişiler artık göremez (H1).

---

## Denetimi tekrar çalıştırma

Migration 006 ve 007 uygulandıktan sonra SQL Editor'de:

```sql
SELECT
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity)
    AS rls_kapali_tablo,
  (SELECT COUNT(*) FROM pg_policies
     WHERE schemaname='public' AND 'anon' = ANY(roles))
    AS anon_politikasi,
  (SELECT COUNT(*) FROM pg_proc
     WHERE pronamespace='public'::regnamespace AND prosecdef
       AND (proconfig IS NULL OR NOT EXISTS (
             SELECT 1 FROM unnest(proconfig) x WHERE x LIKE 'search_path=%')))
    AS definer_search_path_yok;
```

**Hepsi 0 olmalı.** Değilse o satır incelenmeli.
