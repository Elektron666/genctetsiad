# Yayın Yol Haritası — Genç TETSİAD

Son güncelleme: 25 Temmuz 2026

---

## Durum özeti

| Alan | Durum |
|---|---|
| Uygulama kodu | ✅ Yayına hazır |
| Veritabanı (Supabase) | ✅ Şema + RLS + veri hazır |
| Yönetim paneli | ✅ Çalışıyor (onay, duyuru, etkinlik, rol) |
| Hesap silme (mağaza şartı) | ✅ Uygulama içinde |
| Gizlilik politikası metni | ✅ Yazıldı — **yayınlanması gerekiyor** |
| Android build | ⏳ APK alınacak |
| iOS build | ⛔ Apple hesabı bekliyor |
| SMS doğrulama | ⛔ Sağlayıcı bağlanacak |
| Push bildirimi | ⛔ Firebase bağlanacak |

**Özet:** Kod tarafında yapılacak iş kalmadı. Kalan her şey hesap açma, ödeme ve pano ayarı.

---

## 1. ÖNCE — ücretsiz, bugün yapılabilir

### 1.1 Gizlilik politikasını yayınla (5 dk) — mağazalar için ZORUNLU

GitHub Pages ile bedava:
1. https://github.com/Elektron666/genctetsiad/settings/pages
2. Source: **Deploy from a branch** → Branch: **main** → Folder: **/docs** → Save
3. 1-2 dakika sonra adres hazır:
   `https://elektron666.github.io/genctetsiad/gizlilik-politikasi.html`

Bu adresi hem Play Console'a hem App Store Connect'e gireceğiz.

### 1.2 Test telefon numarası (2 dk) — SMS parası harcamadan test

Supabase → Authentication → Sign In/Up → Phone → **Test phone numbers**
- Numara: `+90 5XX XXX XX XX` (kendi numaran)
- Kod: `123456`

Bu numara gerçek SMS göndermeden giriş yapar. Mağaza incelemecisine de bu numarayı vereceğiz.

### 1.3 İlk admin ol (1 dk)

Uygulamadan kayıt olduktan sonra Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE phone = '+905XXXXXXXXX';
```

---

## 2. GOOGLE PLAY — $25 tek seferlik

### 2.1 Hesap
https://play.google.com/console → **$25** öde (tercihen dernek adına kurumsal hesap; şahıs hesabında adres bilgisi herkese görünür).

> Yeni geliştirici hesapları için Google, yayın öncesi **12 kişiyle 14 gün kapalı test** isteyebilir. Yönetim kurulu üyeleriyle bunu yaparsanız hem şart karşılanır hem gerçek geri bildirim alırsınız.

### 2.2 Build
Expo → Build from GitHub → Platform **Android** · Git ref `main` · Profile **production** → AAB üretir.

### 2.3 Formlar (rehber: `store/play-yayin-rehberi.md`)
- [ ] Data safety formu — cevap anahtarı rehberde hazır
- [ ] Account deletion beyanı → `Profil → Hesabımı Kalıcı Olarak Sil`
- [ ] Gizlilik politikası URL'si (1.1'den)
- [ ] İçerik derecelendirme anketi (hepsi "Hayır" → Everyone)
- [ ] App access → test numarası + kodu (1.2'den)

### 2.4 Görseller
- [ ] 2+ telefon ekran görüntüsü (gerçek cihazdan)
- [ ] 512×512 uygulama ikonu
- [ ] 1024×500 feature graphic

### 2.5 Yayın
Internal testing → Closed testing → Production

---

## 3. APP STORE — $99/yıl

**Mac GEREKMEZ.** Build bulutta çalışır.

### 3.1 Hesap
https://developer.apple.com/programs → **$99/yıl**
- Dernek adına kurumsal hesap için **D-U-N-S numarası** gerekir (ücretsiz alınır, 1-2 hafta sürebilir)
- Şahıs hesabı daha hızlıdır ama uygulama senin adına görünür

### 3.2 Build + TestFlight
```bash
cd native
eas credentials                                    # Apple girişi, sertifikalar otomatik
eas build --platform ios --profile ios-testflight
eas submit --platform ios --latest
```
iPhone'a **TestFlight** uygulamasından kurulur.

### 3.3 App Store Connect
- [ ] App Privacy formu (Play'deki cevaplarla aynı)
- [ ] Gizlilik politikası URL'si
- [ ] Hesap silme yolu beyanı
- [ ] Ekran görüntüleri (6.7" iPhone boyutu)
- [ ] İnceleme notu: test numarası + `123456`

> Apple, üyelik gerektiren uygulamalarda incelemeciye çalışan bir hesap verilmesini şart koşar — test numarası bunu karşılar.

---

## 4. SMS DOĞRULAMA — gerçek kullanıcılar için zorunlu

Test numarası sadece senin için çalışır. Gerçek üyeler giriş yapabilsin diye SMS sağlayıcısı gerekir.

Supabase → Authentication → Phone → SMS provider:
- **Twilio** — Supabase'in en olgun entegrasyonu. Türkiye'ye gönderimde başlık (sender ID) kaydı gerekebilir, mesaj başına ücret alır.
- **Vonage / MessageBird** — alternatifler.

Maliyet: mesaj başına kuruşlar; 100 üyelik bir dernek için aylık maliyeti ihmal edilebilir.

---

## 5. PUSH BİLDİRİMİ — Firebase (ücretsiz)

1. https://console.firebase.google.com → yeni proje
2. Android uygulaması ekle → paket adı: `org.tetsiad.genc` → `google-services.json` indir
3. Bu dosyayı repoya ekle + `app.json`'a bağla *(bana ver, ben yaparım)*
4. Firebase → Project settings → Service accounts → "Generate new private key"
5. İnen JSON'u Expo'ya yükle: expo.dev → proje → Credentials → Android → **FCM V1 service account key**

> Bu gizli bir dosyadır — sohbete yapıştırma, sadece Expo'ya yükle.

iOS push'u için ek iş yok, EAS otomatik APNs anahtarı üretir.

---

## 6. YAYIN ÖNCESİ SON KONTROLLER

- [ ] Başkan mesajı, manifesto ve künye metinlerini **dernek onaylasın**
- [ ] Ana sayfadaki "1.500+ ÜYE · 55 İL · 40 ÜLKE" rakamları doğru mu?
- [ ] `runtimeVersion` politikası → mağaza sürümünden önce `appVersion`a çevrilecek
      *(şu an Expo Go testi için `sdkVersion`)*
- [ ] Gerçek cihazda uçtan uca test: kayıt → onay → etkinlik katılımı → duyuru push'u
- [ ] Supabase veritabanı şifresini değiştir (bir kez sohbete düştü)

---

## Maliyet özeti

| Kalem | Tutar | Zorunlu mu? |
|---|---|---|
| Google Play Console | $25 (tek seferlik) | Android yayını için evet |
| Apple Developer | $99/yıl | iOS yayını için evet |
| Firebase (FCM) | Ücretsiz | Push için evet |
| Supabase | Ücretsiz katman yeterli | — |
| EAS Build | Ücretsiz katman yeterli | — |
| SMS (Twilio) | Kullanım başına | Gerçek kullanıcı girişi için evet |

**Minimum başlangıç: $25** (sadece Android) veya **$124** (Android + iOS).
