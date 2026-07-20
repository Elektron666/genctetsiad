# Google Play Yayın Rehberi — Genç TETSİAD

## A. Data Safety (Veri Güvenliği) Formu — Cevap Anahtarı

Play Console → App content → Data safety. Aşağıdaki gibi işaretle:

**Does your app collect or share any of the required user data types?** → **Yes**

| Veri türü | Toplanıyor? | Paylaşılıyor? | Amaç | Zorunlu mu? |
|---|---|---|---|---|
| Name (Ad) | Evet | Hayır | App functionality, Account management | Evet |
| Email address | Evet | Hayır | App functionality, Account management | Evet |
| Phone number | Evet | Hayır | App functionality, Account management | Evet |
| Other info (firma, şehir, sektör, pozisyon) | Evet | Hayır | App functionality | Evet |
| App interactions (etkinlik/kurs kayıtları) | Evet | Hayır | App functionality | Evet |
| Device or other IDs (push token) | Evet | Hayır | App functionality | Hayır (izne bağlı) |

- **Is all of the user data collected by your app encrypted in transit?** → Yes (HTTPS/TLS)
- **Do you provide a way for users to request that their data is deleted?** → **Yes** (uygulama içi hesap silme + e-posta)
- Location, Financial info, Health, Photos, Contacts, Browsing history → **No**

## B. Hesap silme beyanı

- App content → **Account deletion**:
  - In-app path: `Profil → Hesabımı Kalıcı Olarak Sil`
  - Web/dış yol (URL istenir): gizlilik politikası sayfasındaki "Hesap Silme" bölümü + info@tetsiad.org

## C. Gizlilik Politikası URL'si

`docs/gizlilik-politikasi.html` dosyasını yayınla, seçenekler:
1. **tetsiad.org/genc/gizlilik** (ideal — kurumsal alan adı)
2. GitHub Pages: repo Settings → Pages → `docs/` klasörü → URL: `https://elektron666.github.io/genctetsiad/gizlilik-politikasi.html`

## D. Mağaza Metinleri

**Uygulama adı:** Genç TETSİAD

**Kısa açıklama (80 krk):**
> Türkiye ev tekstilinin genç iş insanları platformu. Etkinlik, eğitim, network.

**Uzun açıklama:**
> Genç TETSİAD, Tekstil Sanayicileri ve İşadamları Derneği'nin genç kuşak platformudur.
>
> • ETKİNLİKLER — Fabrika ziyaretleri, fuar çalışmaları ve buluşmalara tek dokunuşla katılın
> • AKADEMİ — Sektörel kurslar, 3T ve TBA gibi gelişim programları, birebir mentorluk
> • REHBER — 1.500+ üyelik ağda sektörün genç isimlerine doğrudan ulaşın
> • DİJİTAL ÜYE KARTI — QR kartvizitinizle anında bağlantı kurun
> • SÜRDÜRÜLEBİLİRLİK — AB yeşil dönüşüm gündemini ve fırsat haritasını takip edin
>
> Uygulama dernek üyelerine özeldir; üyelik başvuruları yönetim onayına tabidir.

**Kategori:** Business · **İçerik derecelendirmesi anketi:** şiddet/kumar/vb. hepsi "Hayır" → PEGI 3 / Everyone çıkar.

## E. Görsel gereksinimleri (hazırlanacak)

- [ ] Telefon ekran görüntüleri: en az 2 adet (min 320px, max 3840px) — gerçek cihazdan al
- [ ] Uygulama ikonu 512×512 PNG (mevcut icon.png'den üretilebilir)
- [ ] Feature graphic 1024×500 (lacivert zemin + altın logo öneririm)

## F. Yayın sırası (kontrol listesi)

1. [ ] Play Console geliştirici hesabı ($25, tercihen dernek adına)
2. [ ] SQL migration'lar: 003 (push_tokens) + 004 (delete_own_account)
3. [ ] SMS sağlayıcı (Twilio) — Supabase → Auth → Phone
4. [ ] Firebase FCM — google-services.json + EAS'a service account key
5. [ ] Gizlilik politikası URL yayında
6. [ ] `eas build --profile production` → AAB
7. [ ] Internal testing track'e yükle → yönetim kuruluyla 1-2 hafta test
8. [ ] Data safety + account deletion + içerik derecelendirme formları
9. [ ] Production'a terfi

## G. İnceleme notu (App access)

Play Console → App content → App access → "All or some functionality is restricted":
> Üyelik onaylı dernek uygulamasıdır. İnceleme için test hesabı:
> Telefon: +90 5XX XXX XX XX — SMS kodu: 123456 (test numarası, gerçek SMS gitmez)
> Bu numara Supabase Auth test numarası olarak tanımlıdır.
