# genctetsiad.org — TASARIM VE YAPIM BRIEF'İ

Bu dosya, siteyi yapacak kişiye (ya da yapay zekâya) olduğu gibi verilir.
Marka kararları, renk kodları ve metinler uygulamadan çıkarılmıştır —
uydurma yoktur.

---

## ROL

Kıdemli bir ürün tasarımcısı ve front-end geliştiricisi olarak
davranıyorsun. Türkiye ev tekstili sektörünün genç iş insanları
derneği **Genç TETSİAD** için kurumsal web sitesini tasarlayıp
kodlayacaksın.

Bu bir "dernek sitesi" değil. **Uluslararası bir sektör platformunun
kurumsal yüzü.** Ziyaretçi kitlesi: fabrika sahipleri, ihracat
müdürleri, tasarımcılar, yurt dışındaki alıcılar, gazeteciler ve
üyelik başvurusu yapacak genç iş insanları.

---

## SİTE NE İŞE YARAR

Mobil uygulama **üyelere özel ve kapalıdır**. Site ise **halka açıktır**
ve üç işi vardır:

1. **Anlatmak** — Genç TETSİAD nedir, ne yapar, neden var
2. **Başvuru toplamak** — ziyaretçiyi uygulamayı indirmeye ve üyelik
   başvurusu yapmaya götürmek
3. **Yasal zorunluluk** — gizlilik politikası ve kullanım koşullarını
   barındırmak (Google Play ve App Store bu adreslere link verecek)

Üçüncüsü pazarlık konusu değil: mağaza incelemecisi bu sayfalara
tıklar, açılmazsa uygulama **reddedilir**.

---

## TASARIM DİLİ — DEĞİŞTİRME

Uygulamayla birebir aynı olmalı. Ziyaretçi siteden uygulamaya
geçtiğinde aynı markada olduğunu anlamalı.

### Renkler (uygulamadan birebir)

```css
--navy:       #051C11;   /* ana zemin — koyu orman yeşili/lacivert */
--navy-deep:  #030F09;   /* en koyu, alt bilgi ve üst çubuk */
--navy-mid:   #0A2E1A;   /* kart yüzeyi */
--green:      #0F6B45;   /* nadir vurgular */
--gold:       #D9C896;   /* AKSAN — az kullan */
--gold-line:  rgba(217,200,150,.15);  /* ince ayırıcı çizgiler */
--ivory:      #F5F0E6;   /* ana metin */
--muted:      rgba(245,240,230,.45);  /* ikincil metin */
```

**Altın rengi her yere basma.** Altın = aksan. Başlıklarda tek kelime,
ince çizgiler, düğme kenarı, sayılar. Zeminleri altınla doldurma.

### Tipografi

| Yazı tipi | Nerede |
|---|---|
| **Cormorant Garamond** *(italic, 300 ağırlık)* | Büyük başlıklar, manifesto, alıntılar — editoryal karakter buradan gelir |
| **Plus Jakarta Sans** | Gövde metni, düğmeler, arayüz |
| **JetBrains Mono** | Etiketler, tarih, üye kodu, teknik veri — harf aralığı geniş, boyut küçük |

Üçü de Google Fonts'ta var.

**Hiyerarşi güçlü olmalı:** 48–72px italic serif başlık, hemen altında
11–13px `letter-spacing: 2px` mono etiket. Aradaki kontrast markanın
imzasıdır.

### Karakter

```
EDİTORYAL      dergi gibi, kurumsal broşür gibi değil
MİNİMAL        bol boşluk, az öğe
YÖNETİCİ       ciddi, abartısız, güven veren
ULUSLARARASI   Milano/Kopenhag tekstil fuarı katalogu hissi
```

**Kaçın:** yuvarlak köşeli renkli kartlar · gradient düğmeler · stok
fotoğraf gülümsemeleri · emoji · "Hemen Başla!" tonundaki SaaS dili ·
gereksiz animasyon · parallax.

**Kullan:** ince altın çizgiler (0.5px) · köşe parantezleri · geniş
harf aralıklı küçük etiketler · tam genişlikte fotoğraf + koyu gradyan
· asimetrik ızgara · yavaş ve az fade-in.

---

## SAYFA YAPISI

```
/                          Ana sayfa
/hakkimizda                Genç TETSİAD nedir, manifesto, başkandan
/programlar                3T · TBA · Altın Mekik · UTGİK
/uyelik                    Üyelik nasıl işler + başvuru yönlendirmesi
/iletisim                  İletişim
/gizlilik-politikasi.html  ⚠️ BU DOSYA ADI DEĞİŞMEYECEK
/kullanim-kosullari.html   ⚠️ BU DOSYA ADI DEĞİŞMEYECEK
```

> Son iki dosyanın adı ve yolu **aynen korunmalı**. Mağaza
> başvurularında bu adresler verildi; değişirse linkler ölür ve
> uygulama reddedilir. Mevcut içerikleri depodaki `docs/` klasöründe,
> KVKK metinleri hukuken gözden geçirilmiş hâlde — **yeniden yazma,
> yalnızca sitenin tasarımına giydir.**

---

## ANA SAYFA — bölüm bölüm

### 1 · Kapak
- Tam ekran fabrika/dokuma fotoğrafı, üstünde koyu gradyan
- Başlık, üç satır, italic serif, ~64px:
  > *Değişim*
  > *gençlerle*
  > **olacak.**   ← yalnızca bu kelime altın
- Altında tek satır: `Türkiye ev tekstilinin genç iş insanları platformu.`
- İki düğme: **ÜYELİK BAŞVURUSU** (dolu altın) · **MANİFESTO** (çerçeveli)
- En altta ince "aşağı kaydırın" işareti

### 2 · Manifesto
Beş paragraf, uygulamadan birebir:

> Türkiye ev tekstili sektörü, yüzyıllık bir dokuma geleneğinin üzerinde
> yükseliyor. Biz bu geleneği geleceğe taşıyacak nesil olarak bir araya geldik.
>
> Genç TETSİAD; üretimi, tasarımı ve ihracatı birleştiren genç iş
> insanlarının platformudur. Rekabeti değil, dayanışmayı; kâr yarışını
> değil, ortak büyümeyi seçiyoruz.
>
> Avrupa'nın yeşil dönüşümünü tehdit değil fırsat olarak okuyoruz.
> Sürdürülebilir üretim standartlarını dünyadan önce benimsemek, bizi
> öne çıkaracak.
>
> Mentorluk, kurs ve etkinliklerle birbirimizden öğreniyoruz. Sektördeki
> her genç isim hem öğrenci hem öğretmendir.
>
> Değişim gençlerle olacak. Biz, o değişimin kendisiyiz.

Geniş satır aralığı, ortalanmış, en fazla 640px genişlik.

### 3 · Rakamlar
`1.500+ ÜYE · 55 İL · 40 ÜLKE`

⚠️ **Bu rakamları yayına almadan önce yönetime doğrulatın.** Uygulamada
sabit yazılıydı ve kaynağı belirsizdi. Teyit edilemezse bu bölümü
tamamen çıkarın — yanlış rakam, kurumsal sitede güven kaybettirir.

### 4 · Başkandan
Portre fotoğraf + gradyan, üzerinde ad ve unvan.

**Resul Öden** — GENÇ TETSİAD BAŞKANI — ROSSA HOME · İSTANBUL

Alıntı (italic serif, büyük):
> *"Genç TETSİAD, sektörün geleceğini bugünden örmeye başlayan bir
> atölyedir. Üretirken öğrenmek, paylaşırken büyümek istiyoruz."*

Ardından üç paragraflık mesaj (depodaki `native/app/(tabs)/index.tsx`
içinde `PRESIDENT.message` dizisinde birebir mevcut).

### 5 · Programlar

| Program | Açıklama | Kontenjan |
|---|---|:---:|
| **3T** — Türkiye Tekstil Temsilcileri | Yıllık liderlik ve temsil programı; seçilen üyeler ulusal ve uluslararası platformlarda sektörü temsil eder | 12 |
| **TBA** — Tekstil Büyükelçileri | Uluslararası fuar ve konferanslarda Türkiye ev tekstilini temsil | 8 |
| **Altın Mekik** | Üretim, tasarım ve ihracatta olağanüstü başarı ödülü ve bursu | 3 |
| **UTGİK** | AB ve global tekstil trendlerini izleyen araştırma komitesi | — |

### 6 · Uygulama tanıtımı
Telefon çerçevesi içinde gerçek ekran görüntüleri + altı özellik:
üye rehberi · etkinlik takvimi · akademi · mentorluk · bülten · duyurular.

App Store ve Google Play rozetleri — **yayına girene kadar "Yakında"**
yazın, ölü linke tıklatmayın.

### 7 · Üyelik
Üç adım: **Başvuru → Komisyon değerlendirmesi → Üyelik onayı**

Metin: *"Genç TETSİAD üyelik esaslı, kapalı bir platformdur. Başvurunuz
dernek komisyonu tarafından değerlendirilir."*

### 8 · Alt bilgi
İletişim · yasal linkler · TETSİAD bağlantısı · sosyal medya
Künye: `KONSEPT & TASARIM — Fatih Özdemir · ORMEN TEKSTİL · ANKARA`

---

## TEKNİK ŞARTLAR

**Yığın:** Statik HTML/CSS ya da Next.js (statik dışa aktarım). CMS
gerekmiyor — içerik yılda birkaç kez değişir.

**Zorunlu:**
- Mobil öncelikli, 360px'e kadar bozulmadan
- Lighthouse: performans ve erişilebilirlik **90+**
- Görseller WebP + `loading="lazy"` + doğru `width/height` (layout kayması olmasın)
- `lang="tr"`, sayfa başına özgün `<title>` ve `description`
- OG ve Twitter kartları — WhatsApp'ta paylaşılınca düzgün görünmeli
- `sitemap.xml`, `robots.txt`, favicon
- Güvenlik başlıkları: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- Çerez kullanma. Google Analytics ekleme — eklersen KVKK aydınlatma
  metnini de güncellemen gerekir ve o metin şu an "üçüncü taraf izleme
  aracı kullanılmaz" diyor.

**Türkçe tipografi:** `İ` ve `ı` ayrımına dikkat. CSS'te
`text-transform: uppercase` kullanırsan `lang="tr"` olmadan `i → I`
olur, `İ` değil. Test et.

---

## YASAKLAR

1. **Sahte üye, sahte firma, sahte referans koyma.** Depodaki eski
   prototipte tasarım amaçlı üretilmiş 34 sahte üye kaydı vardı ve
   içinde gerçek kişilerin adları geçiyordu — o yüzden yayından
   kaldırıldı. Aynı hatayı tekrarlama.
2. **Doğrulanmamış rakam yazma.** Üye/il/ülke sayıları yönetimden
   teyitli olmalı.
3. **Yasal sayfaların dosya adını değiştirme.**
4. **Üye verisi gösterme.** Rehber uygulamada, KVKK korumasında. Sitede
   üye listesi, üye fotoğrafı, üye iletişim bilgisi **olmayacak**.
5. **Stok fotoğraf kullanma.** Dernek arşivinden gerçek fotoğraf yoksa
   tipografi ve boşlukla çöz.

---

## TESLİM

1. Ana sayfa masaüstü + mobil tasarım
2. İç sayfa şablonu
3. Kodlanmış, `genctetsiad.org`'a yüklenmeye hazır statik site
4. Yasal sayfalar aynı adreslerde, yeni tasarımla
5. Lighthouse raporu

Bittiğinde uygulamadaki ve mağaza başvurularındaki üç URL
`genctetsiad.org`'a çevrilecek.
