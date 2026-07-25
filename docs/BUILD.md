# Build Rehberi — Genç TETSİAD

Hangi durumda hangi yolu kullanacağın, tek sayfada.

---

## 1. Android APK — telefona kurulacak test sürümü ✅ HAZIR

**Expo sitesinden:** Build from GitHub →
| Alan | Değer |
|---|---|
| Platform | **Android** |
| Git ref | `main` |
| EAS Build profile | **preview** |
| EAS Submit | ☐ **kapalı** |

**Ya da GitHub'dan:** Actions → Build Android APK → Run workflow → `main` + `preview`

Sonuç: `.apk` dosyası → Builds sayfasındaki **Install** butonu/QR ile telefona kurulur.

---

## 2. iPhone'da görmek — Mac ve Apple hesabı OLMADAN ✅ HAZIR

Expo Go ile. Uygulamanın tamamı çalışır; **sadece push bildirimi çalışmaz** (Expo Go sınırı).

Bilgisayarda (Windows/Linux/Mac fark etmez):

```bash
git clone https://github.com/Elektron666/genctetsiad.git
cd genctetsiad/native
npm install --legacy-peer-deps
npx expo start --tunnel
```

iPhone'da:
1. App Store'dan **Expo Go** indir
2. Terminaldeki QR kodu **iPhone kamerasıyla** okut
3. Uygulama Expo Go içinde açılır

> `--tunnel` bayrağı şart — telefon ve bilgisayar farklı ağdaysa da çalışır.
> İlk açılış yavaştır (dev modu). İkon/splash Expo Go'nunki görünür, bu normal.

---

## 3. iOS gerçek kurulum (TestFlight) — Apple Developer $99/yıl gerekir

**Mac GEREKMEZ** — build bulutta (EAS) çalışır. Tek şart Apple hesabı.

Hesap alındıktan sonra:

```bash
cd native
eas credentials          # Apple hesabıyla giriş, sertifikaları EAS oluşturur
eas build --platform ios --profile ios-testflight
eas submit --platform ios --latest
```

Sonrasında iPhone'a **TestFlight** uygulamasından kurulur.

Ek olarak push bildirimi için: EAS otomatik APNs anahtarı üretir, ekstra iş yok.

---

## 4. Google Play yayını — $25 tek seferlik

```bash
eas build --platform android --profile production   # AAB üretir
```
Detaylı adımlar: [`store/play-yayin-rehberi.md`](store/play-yayin-rehberi.md)

---

## Profil özeti (`native/eas.json`)

| Profil | Ne üretir | Ne için |
|---|---|---|
| `preview` | Android APK · iOS simulator | Telefonda test |
| `ios-testflight` | iOS IPA (imzalı) | TestFlight dağıtımı |
| `production` | Android AAB · iOS IPA | Mağaza yayını |
| `development` | Dev client | Yerel geliştirme |

---

## Sık yapılan hatalar

| Hata | Sebep | Çözüm |
|---|---|---|
| `Failed to read "/eas.json"` | Expo repo kökünde arıyor | Proje ayarları → **Base directory: `native`** |
| iOS build "credentials" hatası | Apple hesabı yok | `preview` profili kullan (simulator) veya $99 hesabı al |
| Production build telefona kurulmuyor | AAB üretti | `preview` profili kullan, APK üretir |
| Build sonrası "submit failed" | Submit tiki açık | EAS Submit tikini kapat |
