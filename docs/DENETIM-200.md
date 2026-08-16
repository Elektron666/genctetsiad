# MAĞAZA ÖNCESİ TAM DENETİM — 228 MADDE

**Kapsam:** 11.702 satır — `native/` (29 dosya), `supabase/` (12 dosya), `.github/`, `docs/`, `project/`
**Yöntem:** her dosya baştan sona okundu. Tahmin yok; her madde bir satıra dayanıyor.
**Tarih:** 2 Ağustos 2026 · **Durum:** 228 bulgu — **163'ü düzeltildi**, 65'i gerekçeli olarak açık.

> **2. tur:** 25 madde daha kapatıldı; ESLint kurulunca bir ölü özellik çıktı (201).
> **3. tur:** 37 madde daha kapatıldı. Migration'lar gerçek PostgreSQL'de
> çalıştırılıp RLS'e 22 saldırı denendi — **3 yeni hata bulundu (202–204)**,
> biri en kritik güvenlik düzeltmesinin sessizce uygulanmamasına yol açıyordu.
> **4. tur:** migration'lar uygulandıktan sonra canlı veritabanında politika
> sayımı yapıldı — depoda bulunmayan bir DELETE politikası çıktı (205).
> **5. tur:** hızlı tarama — 4 bulgu daha (206–209).
> **6. tur:** 012'nin yazdığı bildirimleri kimse okumuyordu (210) + mağaza
> için `runtimeVersion` çevrildi (161).
> **7. tur:** yasal metinler gerçekle örtüşmüyordu (211–212), Pages kökü
> 404 verecekti (213), Play başvuru dosyası hazırlandı (214).
> **8. tur:** performans ve edge-case (215–221), tekrarlanan mantık tek
> modülde toplandı (222) ve **48 test** yazılıp CI'ya eklendi (155).
> **9. tur:** kendi turumu review ettim — 8. turdaki sayfalama aramayı
> bozmuş (223); ağ yokken açılış sonsuz çarkta kalıyordu (138).
> **10. tur:** RLS doğrulaması elle yapılıyordu — 42 iddialık SQL test
> paketi yazıldı ve CI'ya bağlandı (226–227).
> **11. tur:** Supabase sorgu sütunları hiçbir araçla denetlenmiyordu;
> şema doğrulayıcı yazıldı (228).

> Bu belgenin amacı listelemek değil, **karar verilebilir hâle getirmek**.
> Her madde: ne bozuk · kullanıcı ne yaşıyor · ne yapıldı.

---

## Özet tablo

| Ağırlık | Adet | Düzeltildi | Açık |
|---|---|---|---|
| 🔴 Kritik — veri/güvenlik/yayın engeli | 29 | 27 | 2 |
| 🟠 Yüksek — yanlış bilgi, bozuk akış | 64 | 61 | 3 |
| 🟡 Orta — UX, performans, tutarlılık | 86 | 65 | 21 |
| ⚪ Düşük — temizlik, ileri sürüm | 49 | 16 | 33 |

---

# 🔴 KRİTİK (1–24)

### Yetki ve erişim

**1. Yönetim kurulu üyesi kendini ADMİN yapabiliyordu.** ✅
`profiles_update_admin` politikası `USING (is_admin_or_board())` idi ve **`WITH CHECK` yoktu**. PostgreSQL'de UPDATE politikasında WITH CHECK verilmezse USING ifadesi kontrol olarak kullanılır — bu ifade satıra hiç bakmadığı için yeni değerler sınırsız kabul edilir. `board` rolündeki biri REST API'ye tek istekle kendi rolünü `admin` yapabilir, başkanı `pending`e düşürebilirdi. Migration 006 bu politikaya "dokunulmadı" diye açıkça not düşmüş. → *011: rol atama yalnızca `admin`de; kimse kendi satırını güncelleyemez (`id <> auth.uid()`).*

**2. Aynı politika üye kodunu da serbest bırakıyordu.** ✅
Yönetim kurulu üyesi kendine `GT-2026-00001` (başkanın numarası) atayabilirdi. → 011 ile kapandı.

**3. Onay bekleyen kullanıcı katılımcı listelerini okuyabiliyordu.** ✅
`attendees_select_all USING (TRUE)`. Herhangi bir e-postayla kayıt olan biri, onay beklerken bile her etkinliğin katılımcı `user_id` listesini çekebiliyordu. 006 profilleri kapattı, bu tablo açık kaldı. → *011: `is_approved_member()`.*

**4. Onay bekleyen kullanıcı etkinliğe kaydolabiliyordu.** ✅
Uygulama "onaylanınca açılır" diyor, RLS yalnızca `user_id = auth.uid()` arıyordu. Onaysız biri kontenjanı doldurabilirdi. → 011.

**5. Onay bekleyen kullanıcı kursa yazılabiliyordu.** ✅ → 011.

**6. Mentorluk başvurusu herhangi bir profile yazılabiliyordu.** ✅
`WITH CHECK (mentee_id = auth.uid())` — hedefin gerçekten mentor olduğu hiç kontrol edilmiyordu. → *011: `EXISTS (… p.is_mentor)` + onaylı üye şartı.*

**7. Çıkış yapan cihaz bildirim almaya devam ediyordu.** ✅
`push_tokens` üzerinde DELETE politikası yoktu ve `signOut` token'ı silmiyordu. Ortak kullanılan bir telefonda başkasının dernek bildirimleri düşmeye devam ederdi. → *011 politika + `useAuth.signOut` temizliği.*

**8. Aynı token iki kullanıcıya bağlanabiliyordu.** ✅
`push_tokens` PK'sı yalnızca `user_id`. Ortak tablette ikinci kullanıcı giriş yapınca, birinci kullanıcının satırı hâlâ aynı token'a işaret ediyordu — **bildirimler yanlış kişiye**. → *011: token üzerinde UNIQUE indeks + eski kayıtların temizliği.*

### Kullanıcıya yalan söylenen yerler

**9. Takvimde 5 uydurma etkinlik gerçekmiş gibi listeleniyordu.** ✅
`supabaseEvents.length > 0 ? … : EVENTS` — dernek henüz etkinlik girmediyse (yani **ilk gün**) her üye sahte katılımcı sayıları (38, 120, 64), var olmayan konuşmacılar ("Prof. Dr. Leyla Karaca") ve hiçbir şey kaydetmeyen bir KATIL düğmesi görüyordu. → *`__DEV__` arkasına alındı + gerçek boş durum eklendi.*

**10. Akademide 6 uydurma kurs "%72 tamamlandı" gösteriyordu.** ✅ Aynı desen. → `__DEV__`.

**11. Akademide 4 uydurma mentor vardı ve BAŞVUR çalışıyor gibi görünüyordu.** ✅
Var olmayan kişiye başvurulup **başarı bildirimi** gösteriliyor, hiçbir kayıt oluşmuyordu. → `__DEV__`.

**12. Bildirim çekmecesinde 6 uydurma bildirim vardı.** ✅
"Üyeliğiniz onaylandı", "Fatih Özdemir bağlantı isteği gönderdi" — hiç yaşanmamış olaylar, **onay bekleyen bir kullanıcıya bile**. → `__DEV__` + boş yanıtta liste gerçekten boşaltılıyor.

**13. Profil kartında 5 kişilik sahte üye listesi vardı — telefon numaralarıyla.** ✅
`allMembers = ownMember ? [ownMember] : MEMBERS` — profil yüklenemediğinde kullanıcı **Resul Öden'in kartını görüyor ve numarasına dokunup arayabiliyordu**. → `__DEV__`.

**14. Rehberde 19 kişilik sahte üye listesi paket içindeydi.** ✅
Ekranda `__DEV__` ile gizliydi ama **dizi yayın paketine giriyordu**: APK'yı açan biri gerçek kişilerin adlarını ve numaralarını okuyabilirdi. → `__DEV__` sabitine taşındı, üretim paketinden düşüyor.

### Yayın engelleri

**15. Yazı tipi yüklenemezse uygulama sonsuza kadar açılış ekranında kalıyordu.** ✅
`useFonts` hata döndürdüğünde `loaded` kalıcı olarak `false` — `SplashScreen.hideAsync()` hiç çağrılmıyor. Kullanıcı **uygulamayı hiç açamaz**, kaldırıp yeniden kurmaktan başka çaresi yok. Mağaza incelemecisinin cihazında olursa doğrudan ret. → *`fontError` yakalanıyor, sistem yazı tipiyle devam ediliyor.*

**16. `eas update` gözden geçirilmemiş kodu doğrudan telefonlara basıyordu.** ✅
`main`'e atılan `native/**` dokunan her commit, testsiz/tipsiz şekilde anında yayına düşüyordu — **mağaza incelemesini de atlayarak**. → *Otomatik tetikleme kaldırıldı; elle çalıştırılıyor ve önce `tsc` geçiyor.*

**17. CI kilit dosyasını yok sayıyordu.** ✅
`npm install --legacy-peer-deps` — `package-lock.json` görmezden geliniyor. Hermes'i kıran supabase-js 2.106 tam olarak böyle gelmişti. → `npm ci`.

**18. CI'da tip denetimi yoktu.** ✅ → Her iki iş akışına `tsc --noEmit` eklendi.

**19. `google-services.json` halka açık depoya girebilirdi.** ✅
`app.config.js` "git'e girmez" diyordu ama `.gitignore`'da yoktu. → Eklendi (+ `GoogleService-Info.plist`).

**20. iOS ihracat uyumluluğu beyanı yoktu.** ✅
`ITSAppUsesNonExemptEncryption` olmadan **her TestFlight/App Store yüklemesi** soruda takılır ve elle cevaplanana kadar dağıtım başlamaz. → `infoPlist` eklendi.

**21. EAS profillerinde `channel` tanımsızdı.** ✅
`updates.url` tanımlı ama kanal yok — OTA güncellemesi build'e hiç ulaşmayabilirdi. → `development` / `preview` / `production` kanalları eklendi.

**22. KVKK açık rızası hiçbir yere kaydedilmiyordu.** ✅
Kayıt ekranında iki onay kutusu var, ikisi de zorunlu — ve **işaretlendikleri hiçbir yere yazılmıyordu**. KVKK denetiminde rızayı *kanıtlamak* gerekir; kanıt yoksa rıza yoktur. → *011: `kvkk_accepted_at`, `transfer_consent_at` + geriye dönük değiştirilemez trigger; kayıt ekranı artık yazıyor.*

**23. Denetim kaydı hesap silinince yok oluyordu.** ✅
`audit_log.actor_id` profiles'a CASCADE bağlıysa, bir yönetici hesabını silerek tüm işlem geçmişini siler — devlet talebine cevap verebilmek için tutulan kayıt tam da o anda kayboluyordu. → *011: `ON DELETE SET NULL`.*

**24. Migration 008 uygulanmadan yönetici tüm cihaz token'larını okuyabiliyor.** ⚠️ AÇIK
008 dosyası "önce `broadcast-push` dağıt" diyor; dağıtılmadı. Bugün her yönetim kurulu üyesi 1.500 token'ı çekebilir ve **Expo Push gönderen doğrulaması yapmadığı için** dernek adına istediği bildirimi gönderebilir. Madde 1 ile zincirlenince: üye → board → admin → tüm token'lar.
**Yapılacak:** `supabase functions deploy broadcast-push` → sonra `008` → sonra `011`.

---

# 🟠 YÜKSEK (25–75, +201)

### Hata gizleyen kod

**25. Yönetim paneli ağ hatasında "Bekleyen başvuru yok" diyordu.** ✅ `useAdmin.refetch` dört sorgunun hatasını da yutuyordu. Yönetici kuyruğun boş olduğunu sanıyordu. → Hata durumu eklendi.

**26. Onay işlemi 0 satır güncellese bile "başarılı" görünüyordu.** ✅ RLS'in engellediği `update` Supabase'de hatasız döner. → `.select('id')` ile satır sayısı denetleniyor.

**27. Rol değiştirme aynı sorunu taşıyordu.** ✅ → Aynı düzeltme.

**28. Her etkinlik hatası "kontenjan doldu" olarak gösteriliyordu.** ✅ Onay bekleyen bir üye KATIL'a bastığında kontenjanın dolduğu söyleniyordu. → Hata kodu ayrıştırılıyor: `42501` → üyelik onayı gerekli, `23514` → kontenjan, diğer → bağlantı hatası.

**29. Kursa kayıt hatası tamamen yutuluyordu.** ✅ `enroll` hiçbir şey döndürmüyordu.

**30. …ve başarı bildirimi KOŞULSUZ gösteriliyordu.** ✅ Kayıt oluşmasa da üye kaydolduğunu sanıyordu. → İkisi de düzeltildi.

**31. Kod tekrar gönderme hatası yutuluyordu.** ✅ Supabase saatlik sınıra takıldığında hiçbir şey olmuyor, geri sayım "gönderildi" gibi yeniden başlıyordu. → Uyarı eklendi.

**32. Takvimde hata/yükleme durumu yoktu.** ✅ `useEvents.error` hiç okunmuyordu; ağ hatası sahte etkinliklere düşüyordu. → Eklendi.

**33. Akademide hata/yükleme durumu yoktu.** ✅ → Eklendi.

**34. Duyuru gönderimi çökebiliyordu.** ✅ `pushToAll` geri düşüş yolu try/catch dışındaydı; token okuma reddedilirse duyuru akışı yakalanmamış hatayla patlıyordu. → Sarıldı.

**35. Onay bildirimi yakalanmamış promise reddi üretiyordu.** ✅ `pushToUser` await edilmiyordu. → `.catch(() => {})`.

**36. Mentor başvurusuna cevap verilemezse sessiz kalıyordu.** ⚠️ AÇIK — `respond` hatası kullanıcıya gösterilmiyor.

**37. `useMyArticles` hata durumu tutmuyor.** ⚠️ AÇIK.

**38. Geçici ağ hatası onaylı üyeyi "onay bekleniyor" ekranına düşürüyordu.** ✅ `loadProfile` hata durumunda koşulsuz `pending` yazıyordu — tek bir kesinti üyeyi uygulamadan atıyordu. → Önceki durum korunuyor.

### Kayıt akışı

**39. Üyelik tipi seçimi (4. adım) hiçbir yere kaydedilmiyordu.** ✅ Kullanıcı ŞİRKET/ÜNİVERSİTE seçiyor, veri çöpe gidiyordu — koca bir adım işlevsizdi. → *011: `member_type` sütunu.*

**40. 6 haneli kod yapıştırılamıyordu.** ✅ `maxLength={1}` + `val.slice(-1)` → e-postadan kopyalanan kodun yalnızca **son hanesi** yazılıyordu. Türk kullanıcılar kodu kopyalar. → Yapıştırma dağıtımı eklendi (iki ekranda da).

**41. Otomatik kod doldurma ipuçları yoktu.** ✅ → `textContentType="oneTimeCode"`, `autoComplete="sms-otp"`, e-posta alanına `emailAddress`.

**42. 13 şehir dışından kimse kayıt olamıyordu.** ✅ Antalya, Trabzon, Konya dışı… sektörde "Diğer" vardı, şehirde yoktu. → Eklendi (kayıt + profil düzenleme).

**43. "KODU PAYLAŞ / KOPYALA" panoya kopyalamıyordu.** ✅ Etiketin yarısı yanlıştı. → "REFERANS KODUNU PAYLAŞ".

**44. "Bu kodla başvuru durumunuzu sorgulayabilirsiniz" — sorgulanacak yer yok.** ✅ Uydurma yetenek. → Metin düzeltildi.

**45. Başvuru iki kez gönderilebiliyordu.** ✅ "BAŞVURUYU TAMAMLA" düğmesinde yükleme durumu yoktu. → Eklendi.

**46. KVKK metni hâlâ "SMS sağlayıcısı" diyordu.** ✅ Doğrulama e-postaya geçti; e-posta işleyicisi (asıl veriyi gören taraf) hiç açıklanmıyordu. → Düzeltildi.

**47. KVKK tam metin bağlantısı tıklanamıyordu.** ✅ Düz metin olarak yazılıydı — kullanıcı politikanın tamamını okuyamıyordu. → Dokunulabilir bağlantı.

**48. Kayıt yarıda bırakılırsa hesap "yarım" kalıyordu.** ✅
1. adımda OTP doğrulanınca kullanıcı **zaten giriş yapmış** olur. 2. adımda vazgeçerse boş `full_name` ile bir profil kalıyor; uygulamayı tekrar açtığında her alanı "—" gösteren onay ekranına düşüyor ve kaydı tamamlamanın **hiçbir yolu kalmıyordu**. → *Onay ekranında "BAŞVURUNUZU TAMAMLAYIN" uyarısı; kayıt akışı oturum varsa doğrulama adımını atlayıp mevcut bilgileri ön dolduruyor.*

**49. Android donanım geri tuşu kayıt akışını tamamen terk ediyordu.** ✅ 5 adım doldurup geri tuşuna basan kullanıcı her şeyi kaybediyordu. → *`BackHandler` adım adım geri gidiyor; veri girilmişse çıkış onayı soruyor.*

**50. `login` ekranı `shouldCreateUser: true` kullanıyor.** ⚠️ AÇIK — giriş ekranına yazılan her e-posta yeni `auth.users` kaydı yaratır. Hesap sayımı ve gönderim kotası bundan etkilenir.

### Rehber ve kartvizit

**51. vCard'da uydurma e-posta vardı.** ✅ E-postası olmayan üyenin QR'ında **derneğin adresi kendi adresiymiş gibi** gömülüydü; okutan kişi bunu rehberine kaydediyordu. → Bilinmeyen alanlar hiç yazılmıyor.

**52. vCard'da `TEL:—` yazıyordu.** ✅ Telefonu olmayan üyenin kartına çöp kayıt. → Aynı düzeltme.

**53. vCard alanları kaçırılmıyordu.** ✅ "ORMEN, TEKSTİL" gibi bir firma adı kaydı ikiye bölüyordu. → `vcEsc()`.

**54. `tel:—` bağlantısı açılmaya çalışılıyordu.** ✅ Telefonu olmayan üyede arama düğmesi gösteriliyor, dokununca sessizce başarısız oluyordu. → Düğme gizleniyor (rehber + kart).

**55. Profil kartı aynı anda "AKTİF ÜYE" ve "ONAY BEKLİYOR" diyordu.** ✅ DURUM satırı `AKTİF ÜYE · 2026` olarak sabit yazılıydı, hemen altındaki bandda onay uyarısı vardı. → Role bağlandı.

**56. E-POSTA satırında derneğin adresi görünüyordu.** ✅ → `—`.

**57. Rehber modalını Android geri tuşu kapatmıyordu.** ✅ `onRequestClose` yoktu. → Eklendi.

**58. Rehber listesi bayat kalabiliyordu.** ✅ `useMemo` bağımlılığı `allMembers.length` idi — üye sayısı değişmeden içerik değişince (isim düzeltme) liste yenilenmiyordu. → Diziye bağlandı.

**59. Filtreler rol *etiketlerine* göre çalışıyor.** ⚠️ AÇIK — `m.role === 'Üye'` metin karşılaştırması; `ROLE_LABELS` değişirse filtreler sessizce bozulur.

**60. Üyenin telefonunu gizleme seçeneği yoktu.** ⚠️ KISMEN — "isteyen üye e-postasını görünür kılar" demiştiniz ama böyle bir anahtar yoktu; her onaylı üye herkesin numarasını görüyor. → *011 ile `phone_visible` sütunu eklendi; arayüz anahtarı v1.1'de.*

### Yönetim paneli

**61. Sahte/spam başvuru kuyruktan hiç çıkmıyordu.** ✅ Yönetimin elinde yalnızca ONAYLA vardı. → *011: `reject_application()` RPC — audit_log'a yazar, kişisel veriyi siler; panelde "Başvuruyu reddet ve sil".*

**62. "24.13.2026" sessizce 2027 Ocak'a kayıyordu.** ✅ `new Date(2026, 12, 31)` hata vermez, taşar. Yönetici yazım hatası yapınca etkinlik bir yıl sonraya gidiyor ve kimse fark etmiyordu. → Aralık denetimi + sonucu geri okuyarak taşma yakalama.

**63. "31.02.2026" 3 Mart'a kayıyordu.** ✅ → Aynı düzeltme.

**64. Geçersiz saat sessizce 10:00 oluyordu.** ✅ `?? ['', '10', '00']` geri düşüşü. → Reddediliyor.

**65. Geçmişe etkinlik yayınlanabiliyordu.** ✅ → İstemcide uyarı + *011'de `CHECK` kısıtı*.

**66. Kontenjana "0" yazınca SINIRSIZ oluyordu.** ✅ `parseInt(…) || null` — 0 falsy. → `quotaNum` denetimi.

**67. Duyuru önizlemesiz ve onaysız gidiyordu.** ✅ Geri alınamaz bir işlem: metin silinse bile bildirim 1.500 telefona düşmüş olur. → Gidecek metni gösteren onay adımı.

**68. Duyuru/etkinlik metinlerinde uzunluk sınırı yoktu.** ✅ Yönetim 1 MB'lık gövde yayınlayabilir, ana sayfa bandına ve bildirime olduğu gibi giderdi. → *011: `CHECK` kısıtları.*

**69. Yönetici kendi rolünü değiştirebiliyordu (arayüzde).** ✅ Tek admin kendini `member` yaparsa panele bir daha giremezdi. → RLS (011) + arayüzde seçenek gizlendi.

**70. Yeni başvuru geldiğinde kimse haberdar olmuyor.** ⚠️ AÇIK — yöneticiye bildirim gitmiyor, panel dışında rozet yok. Başvuru günlerce bekleyebilir.

**71. `events.created_by` hiç doldurulmuyor.** ⚠️ AÇIK — hangi yöneticinin hangi etkinliği açtığı tablodan okunamıyor (audit_log kapsıyor).

**72. `announcements.created_by` hiç doldurulmuyor.** ⚠️ AÇIK — aynı.

**73. Yönetici listesi sayfalanmıyor.** ⚠️ AÇIK — `select('*')` ile 1.500 profil tek seferde.

**74. Katılımcı telefonları denetimsiz görülebiliyor.** ⚠️ AÇIK — organizasyon için gerekli ama görüntüleme audit_log'a yazılmıyor.

**75. Onay ekranı kendini tazelemiyordu.** ✅ Yönetim onayladıktan sonra kullanıcı **uygulamayı kapatıp açmadan** içeri giremiyordu. → *Aşağı çekip yenileme + görünür ipucu.*

---

# 🟡 ORTA (76–153)

### Veri modeli ve performans

**76.** `event_attendees(user_id)` indeksi yoktu — PK `(event_id, user_id)` sırasında olduğu için uygulamanın her açılışta yaptığı `WHERE user_id = ?` sorgusu indeksten yararlanamıyordu. ✅ *011*
**77.** `course_enrollments(user_id)` — aynı. ✅ *011*
**78.** `mentorship_requests(mentor_id, status)` indeksi yoktu. ✅ *011*
**79.** `announcements(published_at)` indeksi yoktu — her açılışta sıralanıyor. ✅ *011*
**80.** `events(starts_at)` kısmi indeksi yoktu. ✅ *011*
**81.** `profiles(role)` indeksi yoktu. ✅ *011*
**82.** Üye kodu üreticisi RLS altında çalışıyordu — benzersizlik kontrolü göremediği satırları atlayıp çakışan kod üretebilir, sonra UNIQUE kısıtı patlar ve **onay anlaşılmaz bir hatayla başarısız olurdu**. ✅ *011: SECURITY DEFINER + 50 deneme sınırı.*
**83.** Doğrudan `member` olarak açılan profile hiç üye kodu atanmıyordu. ✅ *011: INSERT trigger'ı.*
**84.** `generate_member_code` / `assign_member_code` `search_path` sabitlenmemişti. ✅ *011*
**85.** `notifications` tablosu tamamen ölü — RLS'i var, indeksi var, tipi var, **hiçbir kod yazmıyor/okumuyor**. ⚠️ AÇIK
**86.** Bildirim okundu durumu hiç saklanmıyordu — uygulama kapanınca hepsi tekrar okunmamış oluyor, zil rozeti hiç sıfırlanmıyordu. ✅ *Okunan kimlikler cihazda saklanıyor (son 200).*
**87.** `mentorship_requests` DELETE politikası yoktu — başvuru geri çekilemiyordu. ✅ *011*
**88.** `002_seed_data.sql` `migrations/` klasöründe duruyor ve "Production'da çalıştırma!" yorumuna güveniyor; siz migration'ları elle yapıştırıyorsunuz. ⚠️ AÇIK — `supabase/seed/` altına taşınmalı.
**89.** Seed duyurusu "erken kayıt indirimi" diyor; uygulama her etkinliğin ücretsiz olduğunu söylüyor. ⚠️ AÇIK
**90.** `enforce_event_quota` yalnızca INSERT'te; yönetici kontenjanı mevcut sayının altına indirirse hiçbir şey uyarmıyor. ⚠️ AÇIK
**91.** `updated_at` trigger'ı yalnızca `profiles` ve `articles`'ta. ⚠️ AÇIK

### Ekran davranışı

**92.** Ana sayfadaki 4 etkinlik **tamamen sabitti** — `useEvents` hiç çağrılmıyordu. "YAKLAŞAN" başlığı altında geçmiş tarihler görünüyordu. ✅ *Gerçek etkinliklere bağlandı, geçmişler süzülüyor, boş/hata durumu var.*
**93.** Ana sayfa kartları sayısal id kullanıyordu, gerçek etkinlikler UUID — "✓ KATILDIM" rozeti gerçeği asla yansıtamıyordu. ✅ *Artık `is_attending` üzerinden.*
**94.** Ana sayfa "HOMETEX 2027" diyor, görseli `hometex-2026-acilis.jpg`, bildirim metni "HOMETEX 2026". ⚠️ AÇIK
**95.** 4. etkinlik "Bursa Fabrika Ziyareti" ama komite toplantısı fotoğrafını kullanıyor. ⚠️ AÇIK
**96.** Duyuru bandı `banner.label` alanını yok sayıyordu. ✅ *Kategori gerçek türden okunuyor.*
**97.** Ana sayfada **giriş yapmış üyeye "BAŞVUR" düğmesi** gösteriliyor. ⚠️ AÇIK
**98.** Ana sayfa istatistikleri (1.500+ üye / 55 il / 40 ülke / 10 etkinlik) sabit ve takvimdeki sayıyla çelişiyor. ⚠️ AÇIK — dernek onayı gerekiyor.
**99.** `useCounter` 4 ayrı `setTimeout(…, 16)` zinciri çalıştırıyor; `requestAnimationFrame` yerine timer — düşük segment Android'de takılma. ⚠️ AÇIK
**100.** `SCREEN_WIDTH` modül düzeyinde okunuyor — döndürme/katlanabilir cihazda bayat kalıyor. ⚠️ AÇIK
**101.** Kapak yüksekliği sabit `580px` — küçük telefonlarda CTA ile başlık üst üste biniyor. ⚠️ AÇIK
**102.** Kapak üst çubuğu `top: Platform.OS === 'ios' ? 0 : 12` — güvenli alan yerine sabit değer; çentikli Android'de zil simgesi durum çubuğunun altında kalıyor. ⚠️ AÇIK
**103.** Alt sekme çubuğu yüksekliği sabitti; jest çubuğu olan cihazlarda sistem çubuğuyla çakışıyordu. ✅ *`useSafeAreaInsets` ile hesaplanıyor.*
**104.** REHBER sekmesi onay bekleyen kullanıcıya da görünüyordu, açınca RLS boş dönüyordu. ✅ *Onaya kadar sekme gizli.*
**105.** Bildirim çekmecesinde boş durum yoktu. ✅ *Boş, filtreli-boş ve hata durumları ayrı ayrı.*
**106.** Çekmecedeki tutamak sürüklenebilir görünüyordu ama hiçbir şey yapmıyordu. ✅ *Dokunmak kapatıyor.*
**107.** Duyurular yalnızca oturum açılışında bir kez çekiliyordu. ✅ *Ön plana her dönüşte tazeleniyor + çekmecede aşağı çekip yenileme.*
**108.** Ana sayfada aşağı çekip yenileme yok. ⚠️ AÇIK
**109.** Künye iletişim bilgileri tıklanamıyordu. ✅ Düzeltildi.
**110.** "Trendleri Keşfet / GÜNDEM" kartı sürdürülebilirlik sekmesini açıyordu. ✅ Etiket gerçeğe uyduruldu.
**111.** Takvim yılı `2026` olarak sabit yazılıydı. ✅ → `new Date().getFullYear()`.
**112.** Geçmiş etkinlikler listeden hiç düşmüyordu. ✅ → 12 saat toleransla süzülüyor.
**113.** "12 AYDA n ETKİNLİK" — n tüm etkinlikler, 12 aylık değil. ⚠️ AÇIK
**114.** Etkinlik "tag" alanında şehir gösteriliyor, `place` alanında da şehir var — DB'de kategori sütunu yok. ⚠️ AÇIK
**115.** Kurs "tag" alanında eğitmenin **adı** kategori rozeti gibi gösteriliyor. ⚠️ AÇIK
**116.** `level` boşsa sessizce "BAŞLANGIÇ" yazılıyor. ⚠️ AÇIK
**117.** "KATIL → ÜCRETSİZ" — ücretli etkinlik modellenmiş değil. ⚠️ AÇIK
**118.** Gerçek etkinliklerde KONUŞMACILAR bölümü hiç görünmüyor (`speakers: []` sabit). ⚠️ AÇIK
**119.** Açıklaması boş etkinlikte "ETKİNLİK DETAYI" başlığı boş gövdeyle çiziliyor. ⚠️ AÇIK
**120.** KATIL düğmesinde yükleme durumu yok; çift dokunuş iki istek gönderiyor. ⚠️ AÇIK
**121.** Başarılı katılımda hiçbir onay geri bildirimi yok (Toast bileşeni var ama burada kullanılmıyor). ⚠️ AÇIK
**122.** Liste anahtarları dizi indeksinden üretiliyor (`id: index + 1`) — yenilemeden sonra kart durumları karışabilir. ⚠️ AÇIK
**123.** Kurs ilerlemesini işaretleyecek arayüz yok; `updateProgress` ölü API, gerçek kayıtlar sonsuza kadar %0. ⚠️ AÇIK
**124.** "n KATEGORİ" yazıyor ama n kurs sayısı. ⚠️ AÇIK
**125.** Mentor listesi tüm üyeleri çekip istemcide süzüyor — 4 mentor için 1.500 profil. ⚠️ AÇIK
**126.** Mentor kabulünde mentee'ye bildirim gitmiyor. ⚠️ AÇIK
**127.** Programlar (3T/TBA/Altın Mekik/UTGİK) tamamen sabit; yönetimin düzenleme yolu yok. ⚠️ AÇIK
**128.** Sürdürülebilirlik sekmesi 191 satır sabit metin — tek bir düğme, bağlantı veya kaynak yok; AB mevzuatı tarihleri eskiyecek ve güncellenemeyecek. ⚠️ AÇIK
**129.** Aynı sekmedeki istatistiklerin kaynağı belirtilmiyor. ⚠️ AÇIK
**130.** Bülten yazısı taslak olarak saklanmıyordu — uygulama bellekten düşerse 20.000 karaktere kadar yazı yok oluyordu. ✅ *Yazdıkça yerel taslak; açılışta geri yükleniyor.*
**131.** Bülten yazma penceresi kaydedilmemiş değişiklik uyarısı vermiyordu. ✅
**132.** Profil ekranında aşağı çekip yenileme yok; onay sonrası kart eski durumu gösteriyor. ⚠️ AÇIK
**133.** Toast'ta `accessibilityLiveRegion` yoktu — ekran okuyucu bildirimleri hiç duyurmuyordu. ✅
**134.** Toast Android'de `elevation` kullanmıyordu. ✅
**135.** Hata sınırındaki "TEKRAR DENE" belirleyici bir hatada sonsuz döngüye girer — çıkış yolu yok. ⚠️ AÇIK
**136.** Hata sınırındaki e-posta adresi tıklanabilir değil. ⚠️ AÇIK

### Kimlik doğrulama ve oturum

**137.** SecureStore Android'de ~2 KB sınırlı; büyük JWT'li oturum sessizce saklanamayabilir ve kullanıcı her açılışta çıkış yapmış olur. ⚠️ AÇIK — izlenmeli.
**138.** Supabase istemcisinde istek zaman aşımı yok; takılan bir istek sonsuza kadar bekliyor. ⚠️ AÇIK
**139.** `getSession()` ve `onAuthStateChange` aynı anda `loadProfile` tetikleyebiliyor — yarış durumu. ⚠️ AÇIK
**140.** `loadProfile` iptal edilemiyor; çıkış sırasında dönen eski yanıt durumu geri yazabilir. ⚠️ AÇIK
**141.** Ham Supabase hataları Türk kullanıcıya İngilizce gösteriliyordu (*"For security purposes, you can only request this after 54 seconds"*). ✅ *`authErrorTR()` — koda/kalıba bakıp Türkçe metin, bekleme süresi dahil.*
**142.** Kod doğrulama, altı kutu doluyken her tuş vuruşunda yeniden tetikleniyordu — art arda istek, kilitlenme riski. ✅
**143.** `useRef` döngü içinde çağrılıyordu — hook kuralı ihlali. ✅ *Tek ref dizisi.*
**144.** `normalizePhone` boş girdide `+90` üretiyor; doğrulama yok. ⚠️ AÇIK
**145.** Telefon uzunluğu yalnızca `>= 10` kontrol ediliyor; 15 hane de geçiyor. ⚠️ AÇIK

### Profil düzenleme

**146.** Telefon düzenlenemiyordu — rehberde herkese görünen alan ve KVKK düzeltme hakkının en çok işe yaradığı yer. ✅ Eklendi.
**147.** E-posta doğrulaması burada `includes('@')` ile yapılıyordu, kayıt ekranındakinden zayıf. ✅ Aynı regex.
**148.** Profil e-postası ile giriş e-postası sessizce ayrışıyor. ✅ Kısmen — alan "REHBERDE GÖRÜNEN" olarak etiketlendi; gerçek çözüm e-posta değişikliği akışı (v1.1).
**149.** `mentor_bio` düzenlenemiyordu — mentor kendi tanıtımını yazamıyordu, kart sektöre düşüyordu. ✅
**150.** Kaydedilmemiş değişiklik uyarısı yok. ⚠️ AÇIK
**151.** Onay ekranından kayıt bilgisi düzeltilemiyordu. ✅ *48 ile birlikte.*
**152.** "3–5 iş günü" sözü iki ekranda veriliyor; dernek bunu taahhüt etmeli. ⚠️ AÇIK
**153.** Sentry yorumu "ABD sunucuları" diyordu; DSN `ingest.de` — Almanya. ✅ Düzeltildi.

---

# ⚪ DÜŞÜK (154–200)

**154.** ESLint yapılandırması **hiç yoktu** — 15 dosyadaki `eslint-disable` yorumları çalışmayan bir aracı susturuyordu. ✅ *`eslint.config.js` + `npm run lint`. İlk çalıştırmada 39 hata çıktı; hepsi giderildi (0 hata, 32 uyarı) ve **madde 201'i ortaya çıkardı.***
**155.** Hiç test yok. İki mağazaya çıkacak uygulamada sıfır otomatik test. ⚠️
**156.** `npm run typecheck` betiği eklendi. ✅
**157.** `@sentry/react-native` caret aralığındaydı (`^8.20.0`) — Hermes'i kıran sınıf. ✅ Sabitlendi.
**158.** `react-native-qrcode-svg` caret aralığındaydı. ✅ Sabitlendi.
**159.** `expo-secure-store` tek başına caret kullanıyordu. ✅ `~` yapıldı.
**160.** `@expo/ngrok` tünel hata ayıklamasından kalmıştı. ✅ Kaldırıldı.
**161.** `runtimeVersion.policy: 'sdkVersion'` — mağaza sürümünden önce `appVersion` olmalı, yoksa OTA tüm sürümlere düşer. ⚠️ **Yayın öncesi yapılacak** (kendi yol haritanızda yazılı).
**162.** `versionCode: 1` / `buildNumber: '1'` sabit; `appVersionSource: remote` ile çelişiyor. ⚠️
**163.** `.env.example` `GOOGLE_SERVICES_JSON` ve `SENTRY_AUTH_TOKEN`'ı belgelemiyor. ⚠️
**164.** `eas.json` `submit.production` boş — `eas submit` etkileşimli soracak. ⚠️
**165.** Anon key üç yerde yinelenmiş (`eas.json`, `supabase.ts` geri düşüşü, CI). Proje değişirse biri unutulur. ⚠️
**166.** `supabase.ts` geri düşüş değerleri, yanlış yapılandırmayı sessizce başarıya çeviriyor. ⚠️
**167.** `EAS_NO_VCS: "1"` izlenmeyen dosyaları da yüklüyor. ⚠️
**168.** iOS için CI iş akışı yok. ⚠️
**169.** `expo-update` eş zamanlılık grubu eklendi. ✅
**170.** `vercel.json` `project/` prototipini yayınlıyor — içinde sahte üye listesi var, açık internette. ⚠️
**171.** `index.html` tarayıcıda Babel derliyor (`@babel/standalone`) — "yayın" için uygun değil. ⚠️
**172.** Aynı sayfa React'in **development** derlemesini yüklüyor. ⚠️
**173.** `project/` ve `native/` aynı içeriğin iki ayrı kaynağı. ⚠️
**174.** `chats/chat1.md` depoda duruyor (sır taraması temiz, yine de gereksiz). ⚠️
**175.** Bildirim yönlendirmesi başlık metnine bakıyordu — yönetici başlığı değiştirince sessizce bozulurdu. ✅ *`data.screen` yükü; başlık yalnızca geri düşüş.*
**176.** `broadcast-push` `data` yükü göndermiyordu (175'in kökü). ✅ *Beyaz listeli `screen` alanı eklendi.*
**177.** `sendPushBatch` Expo yanıtını okumuyordu — her HTTP 200 "teslim edildi" sayılıyordu. ✅ *Biletler okunuyor, gerçek gönderim sayısı dönüyor.*
**178.** Ölü token'lar hiç temizlenmiyordu. ✅ *`DeviceNotRegistered` dönen kayıtlar hem istemcide hem Edge Function'da siliniyor.*
**179.** `broadcast-push` gönderim sınırı uygulamıyor. ⚠️
**180.** `broadcast-push` `Access-Control-Allow-Origin: '*'` — mobil için gereksiz. ⚠️
**181.** `EXPO_PROJECT_ID` sabit yazılı; `Constants.expoConfig.extra` yerine. ⚠️
**182.** Uygulama kapalıyken bildirime dokunulursa yönlendirme tamamen kayboluyordu. ✅ *`getLastNotificationResponseAsync`.*
**183.** `expo-updates` bağımlı ama güncelleme kontrolü/geri bildirimi arayüzde yok. ⚠️
**184.** `useMembers` `select('*')` ile gereksiz kişisel veri çekiyor. ⚠️
**185.** `useEvents`/`useCourses` de sütun daraltması yapmıyor. ⚠️
**186.** Rehberde sayfalama yok. ⚠️
**187.** `AuthContext` tipleri `Promise<any>` — tip güvenliği kayıp. ⚠️
**188.** `Database` tipindeki `Insert: Partial<Profile>` `role` yazmaya izin veriyor (RLS engelliyor ama tip yakalamıyor). ⚠️
**189.** Takvim `FlatList` yerine `ScrollView` kullanıyor — yılda ~20 etkinlik için kabul edilebilir, bilinçli bırakıldı. ⚠️
**190.** Login ekranındaki SMS döneminden kalma ölü stiller. ✅ *Kullanılmayan kod temizlendi (`SCREEN_WIDTH`, `initials`, `Dimensions`, `View`).*
**191.** Kayıt ekranındaki `phoneRow`/`cc` stilleri aynı şekilde ölü. ⚠️
**192.** `Toast.tsx` importları dosyanın ortasındaydı. ✅
**193.** `Toast` `duration` prop değişimini yok sayıyor. ⚠️
**194.** Duyuru bandındaki 📢 emoji, tipografik tasarım diliyle çelişiyor ve Android sürümlerine göre farklı çiziliyor. ⚠️
**195.** `ROLE_LABELS[…] ?? …` — kayıt tam olduğu için `??` dalı ölü. ⚠️
**196.** İmza üç ayrı yerde görünüyor: giriş ekranı alt bilgisi (düz metin), ana sayfa künyesi (KONSEPT sütunu), uzun basışla açılan künye penceresi. **Gizli değil.** Kaynak açık depoda olduğu sürece de gizlenemez. ⚠️
**197.** Yasal metinler `elektron666.github.io` üzerinde — derneğin resmî belgesi kişisel GitHub hesabında görünüyor. `genctetsiad.org` alınınca taşınmalı. ⚠️
**198.** Bu bağlantılar **şu an ölü** — GitHub Pages henüz açılmadı. Mağaza incelemecisi bunlara tıklar. ⚠️ **Yayın engeli.**
**199.** Yasal bağlantı açılamazsa sessiz kalıyordu. ✅ `openExternal()` ile adres gösteriliyor + URL'ler tek kaynağa taşındı.
**200.** Yönetim panelinde denetim kaydını görüntüleyecek ekran yoktu — kayıt tutuluyor ama yalnızca SQL Editor'den okunabiliyordu. ✅ *Yeni **KAYIT** sekmesi: son 100 işlem, Türkçe eylem adlarıyla.*

---

**201. `updateAnnouncement` / `updateEvent` / `updateCourse` hiçbir yerden çağrılmıyordu.** 🟠 ✅
ESLint kurulur kurulmaz çıktı: bu üç fonksiyon `useAdmin`'de yazılmış, `admin.tsx`'te destructure edilmiş ve **hiç kullanılmamış**. Yani "yayınlanan içeriği düzenleme" özelliği tamamen ölüydü — yönetim yayınlanmış bir duyurudaki yazım hatasını ancak **silip yeniden yazarak** düzeltebiliyordu, bu da üyelere **ikinci kez bildirim** gitmesi demekti. Fonksiyonun başındaki yorum tam da bunu önlemek için yazılmıştı.
→ *Yayındakiler listesine DÜZENLE düğmesi ve düzenleme sayfası eklendi; düzenleme bildirim göndermiyor.*

---

# Yapılacaklar sırası

Sıra önemli — 011'i 008'den önce çalıştırmayın.

```
1. supabase functions deploy broadcast-push
2. SQL Editor:  009  →  010  →  008  →  011
3. Dashboard:   Anonymous sign-in KAPALI · yalnızca Email · OTP 300–600s
4. Resend SMTP  (bu olmadan kimse kayıt olamaz)
5. GitHub Pages → /docs            (madde 198 — mağaza engeli)
6. app.config.js: runtimeVersion → 'appVersion'   (madde 161)
7. Firebase google-services.json  (artık .gitignore'da)
8. İlk APK:  Expo → Build from GitHub → Android · main · preview
```

## Hâlâ doğrulanmamış olan

Bu uygulama **hiçbir gerçek cihazda uçtan uca çalıştırılmadı.** Buradaki her şey
statik inceleme, tip denetimi, Hermes paketleme ve `expo prebuild` çıktısıyla
doğrulandı. Kayıt → e-posta kodu → onay → duyuru → bildirim zincirinin
gerçek bir telefonda denenmesi, listedeki hiçbir maddenin yerine geçmez.

---

# 3. TUR — GERÇEK POSTGRES ÜZERİNDE DOĞRULAMA

Önceki turlarda migration'lar yalnızca **okunarak** doğrulanmıştı. Bu turda
yerel bir PostgreSQL 16 örneği ayağa kaldırıldı, Supabase ortamı (auth şeması,
`auth.uid()`, `anon`/`authenticated`/`service_role` rolleri) taklit edildi ve
**11 migration sıfırdan sırayla çalıştırıldı.** Ardından RLS'e karşı 22 saldırı
denendi.

## Sonuçlar

| Ölçüm | Sonuç |
|---|---|
| Sıfırdan uygulanan migration | **11 / 11** temiz |
| 011 + 012 tekrar çalıştırma | **4 / 4** sorunsuz (idempotent) |
| Engellenen saldırı | **22 / 22** |
| İzin verilmesi gereken işlem | **3 / 3** çalışıyor |
| `search_path` sabitlenmemiş SECURITY DEFINER fonksiyon | **0** |

## Doğrulama sırasında bulunan 3 YENİ hata

**202. `011` idempotent DEĞİLDİ.** 🔴 ✅
`profiles_update_board` ve `attendees_select_approved` için `DROP POLICY IF
EXISTS` yoktu. Dosya ikinci kez çalıştırıldığında *"policy already exists"*
hatası verip **duruyordu** — yani en kritik güvenlik düzeltmesi uygulanmamış
kalıyordu. Bu hatayı daha önce iki kez yaşamıştınız; üçüncüsü olacaktı.
Dosyanın başındaki "idempotent" iddiası da yanlıştı.

**203. Yönetim kurulu üyesi hâlâ başkanı `pending`e düşürebiliyordu.** 🔴 ✅
011'in ilk hâli rol kısıtını yalnızca `WITH CHECK`e koymuştu. `USING` hedef
satırı sınırlamadığı ve `pending` izin verilen kümede olduğu için politika
işlemi **kabul ediyordu**. Yerel testte açıkça görüldü. Artık hedef satırın
kendisi de `pending/member/student` olmak zorunda — başkan, yönetim kurulu ve
admin satırlarına `board` rolü hiç dokunamıyor.

**204. KVKK rıza kilidi geri dönülemezdi.** 🟠 ✅
Bir kez yazılan rıza damgası **hiç kimse** tarafından düzeltilemiyordu — admin
de, sunucu tarafı da. Yanlış yazılmış bir damga sonsuza kadar sabitlenirse
KVKK m.11 "düzeltilmesini isteme" hakkı işletilemez hâle gelirdi. Artık kilit
üye için mutlak, sistem yöneticisi için `audit_log`'a yazılarak açık.

## Denenen saldırılar (hepsi engellendi)

**Yönetim kurulu hesabı ele geçmiş varsayımıyla:** kendini admin yapma ·
başkanı düşürme · başkanı admin yapma · başkanın adını değiştirme · üyeyi
yönetime terfi ettirme · 1 numaralı üye kodunu alma · kendini mentor ilan
etme · denetim kaydını silme · denetim kaydını değiştirme · sahte denetim
kaydı ekleme · başkasının cihaz token'ını silme

**Onay bekleyen hesapla:** etkinliğe kaydolma · kursa yazılma · mentor
olmayan birine başvurma · bülten yazısı gönderme · başkasının profilini
düzenleme

**Normal üye hesabıyla:** kendi rolünü yükseltme · kendini mentor ilan etme ·
üye kodunu değiştirme · başkasının profilini düzenleme · kendi yazısını
yayınlama · başkasının yazısını yayınlama

## Okuma izolasyonu (ölçülen değerler)

| Rol | profiles | audit_log | push_tokens | articles | event_attendees |
|---|---|---|---|---|---|
| Onay bekleyen | 1 (yalnız kendisi) | 0 | 0 | 0 | 0 |
| Onaylı üye | 4 (rehber) | 0 | 0 | yayınlananlar | katılımcılar |
| Yönetim | tümü | tümü | 0 (008 sonrası) | tümü | tümü |

---

# 4. TUR — CANLI VERİTABANINDA KAÇAK POLİTİKA

Migration'lar uygulandıktan sonra canlı veritabanında politika sayımı
yapıldı: `profiles` üzerinde **7** politika çıktı, oysa depodaki
migration'ların ürettiği küme **6**.

**205. `profiles_delete_admin` — depoda bulunmayan bir DELETE politikası.** 🔴 ✅

`FOR DELETE USING (is_admin_or_board())`. Erken bir denemeden kalmış;
hiçbir migration dosyasında geçmiyor. Ne yaptığı yerel PostgreSQL
kopyasında ölçüldü — `board` rolündeki bir hesap **tek komutla başkan
dahil bütün profilleri sildi**:

| | önce | sonra |
|---|---|---|
| profil | 3 | **1** |
| `auth.users` | 3 | **3** |
| üye yazısı | 1 | **0** |
| `audit_log` | 3 | 4 |

İki ayrı sorun:

1. **Yetki.** 011 rol hiyerarşisini kilitlemişti ama bu politika
   yönetim kurulu üyesine üye veritabanını komple silme yetkisi
   veriyordu — ve `audit_log`'a **hiçbir kayıt düşmüyordu** (tek artan
   satır, CASCADE ile silinen yazının kendi tetikleyicisindendi).

2. **Tutarsız durum.** `profiles` silinince `auth.users` satırı KALIR.
   `handle_new_user` yalnızca `auth.users`'a INSERT'te tetiklendiği için
   profil bir daha oluşmaz: o kişi giriş yapabilir ama uygulamada
   kilitlenir ve aynı e-postayla yeniden kayıt da olamaz.

**Çözüm (013):** politika kaldırıldı; `profiles` üzerinde artık hiçbir
DELETE politikası yok (döngüyle temizleniyor, ileride bir tane daha
sızarsa o da düşer). Kalıcı silme yalnızca üç denetlenen yoldan
yapılabiliyor:

| Yol | Kim | Ne yapar |
|---|---|---|
| `delete_own_account()` | kullanıcı | kendi hesabını siler (004) |
| `reject_application()` | yönetim | bekleyen başvuruyu reddeder (011) |
| `remove_member()` | yalnız admin | üyeliği sonlandırır, `auth.users`'ı da siler, `audit_log`'a yazar |

Ayrıca `rls_policy_overview` görünümü eklendi; ileride beklenmedik bir
politika sızarsa tek sorguyla görülebilsin diye.

## 013 doğrulaması (yerel PostgreSQL)

| Deneme | Sonuç |
|---|---|
| board → doğrudan `DELETE FROM profiles` | `DELETE 0` |
| board → `remove_member()` | reddedildi (yalnız admin) |
| admin → kendini silme | reddedildi |
| admin → üyeyi silme | ✓ profil **ve** `auth.users` silindi, yetim hesap kalmadı |
| silme `audit_log`'a yazıldı mı | ✓ gerekçesiyle birlikte |
| 013 üç kez üst üste | ✓ idempotent |

---

# 5. TUR — HIZLI TARAMA

**206. `Linking.openURL` hiçbir yerde yakalanmıyordu.** 🟠 ✅
Rehber, ana sayfa künyesi ve QR kartvizitte beş çağrı. Çeviricisi ya da
posta uygulaması olmayan bir cihazda (tablet, bazı Android sürümleri)
**yakalanmamış promise reddi** oluşuyor, kullanıcı ise dokunduğunda
hiçbir şey olmadığını görüyordu. → `openTel()` / `openMail()`: hata
durumunda numarayı/adresi elle kullanabilmesi için gösteriyor.

**207. `.then()` zincirlerinde `.catch` yoktu.** 🟡 ✅
Yönetim panelinde beş, profil ekranında bir yerde. Ağ koptuğunda
yakalanmamış reddi oluşuyordu.

**208. Künye ve kapaktaki "2026" sabit yazılıydı.** 🟡 ✅
Altı yerde. 1 Ocak 2027'de uygulama hâlâ "GENÇ TETSİAD · 2026" diyecekti.
→ `new Date().getFullYear()`.

**209. Demo verisi `migrations/` klasöründe duruyordu.** 🟠 ✅
`002_seed_data.sql`. Migration'lar SQL Editor'e **sırayla yapıştırılarak**
uygulandığı için, numarası gereği yanlışlıkla çalıştırılması işten
değildi — çalıştırılsa üretime 3 uydurma etkinlik, 3 uydurma kurs ve
3 uydurma duyuru girerdi; duyurular üyelere **gerçek bildirim** olarak
giderdi. → `supabase/seed/demo_data.sql` olarak taşındı, numarası
kaldırıldı, başına uyarı eklendi.

---

# 6. TUR

**210. 012'nin yazdığı kişisel bildirimleri hiçbir ekran okumuyordu.** 🟠 ✅
Migration 012 `notifications` tablosunu tetikleyicilerle canlandırmıştı:
üyelik onayı, mentorluk sonucu ve yazı incelemesi artık satır olarak
düşüyordu. Ama `AppContext` yalnızca `announcements` tablosunu okuyordu —
**bu satırlar kullanıcıya hiç ulaşmıyordu.** Push anlık ve kaçırılabilir
olduğu için kalıcı kayıt tam da bunun içindi.
→ Kişisel bildirimler duyurularla birleştirilip tek akışta gösteriliyor;
okundu bilgisi sunucuya da yazılıyor (başka cihazda tekrar okunmamış
görünmesin diye).

**161. `runtimeVersion` mağaza sürümü için `appVersion` yapıldı.** ⚪ ✅
`sdkVersion` iken SDK 56 ile derlenmiş **tüm** sürümler aynı çalışma
zamanını paylaşıyordu: 1.0.0 için yayınlanan bir OTA güncellemesi 1.1.0'a
da düşer, orada bulunmayan bir yerel modülü çağırıp uygulamayı
çökertirdi. Yayın öncesi yapılacaklar listesindeydi; artık yapıldı.

> Bu değişiklik uygulamanın **Expo Go ile açılmasını sonlandırır.**
> Test artık derlenmiş APK üzerinden yapılır — zaten öyle yapılıyordu.

---

# 7. TUR — YASAL METİNLER VE MAĞAZA DOSYASI

**211. Gizlilik politikası hâlâ SMS doğrulaması anlatıyordu.** 🟠 ✅
Kimlik doğrulama e-postaya geçmişti; uygulama içi KVKK metni
düzeltilmiş ama **yayınlanan HTML politika düzeltilmemişti.** Politika,
var olmayan bir veri akışını (SMS sağlayıcısına telefon numarası
aktarımı) tarif ediyor, gerçekte veriyi işleyen tarafı (e-posta
sağlayıcısı) ise hiç açıklamıyordu. KVKK açısından yanlış aydınlatma.
→ Telefon artık "üye rehberi" amacıyla, e-posta "kimlik doğrulama"
amacıyla listeleniyor; tedarikçi tablosunda Resend (AB) yer alıyor.

**212. Yeni toplanan veriler politikada beyan edilmiyordu.** 🟠 ✅
`011` ile rıza zaman damgaları (`kvkk_accepted_at`,
`transfer_consent_at`) ve telefon görünürlük tercihi saklanmaya
başlamıştı ama politikada geçmiyordu. Toplanan her veri beyan
edilmelidir. → Tabloya eklendi + telefon görünürlüğü hakkı ayrı
paragraf olarak yazıldı.

**213. GitHub Pages kökü 404 verecekti.** 🟠 ✅
`docs/` altında `index.html` yoktu. Pages açıldığında
`elektron666.github.io/genctetsiad/` boş dönerdi — mağaza formunda
"Web sitesi" alanına verilecek adres tam da bu.
→ İki yasal belgeye yönlendiren, uygulamanın paletiyle uyumlu bir
kök sayfa eklendi.

**214. Play Console başvuru dosyası yoktu.** ⚪ ✅
Mevcut `play-yayin-rehberi.md` süreci anlatıyordu ama doldurulacak
alanları içermiyordu. → `play-basvuru-dosyasi.md`: kısa/tam açıklama
(karakter sınırlarına uygun), **Veri Güvenliği formunun her satırı**,
içerik derecelendirme anketi cevapları, incelemeci erişim metni,
ekran görüntüsü planı ve reddedilme sebepleri tablosu.

Dosyadaki beyanlar koddan doğrulandı:
- Reklam/izleme kütüphanesi: **yok** → "paylaşım yok" beyanı doğru
- İstenen izinler: `INTERNET`, `VIBRATE`, `POST_NOTIFICATIONS` → hassas
  izin beyanı gerekmiyor
- Hesap silme: iki ekranda mevcut → "silme talep edilebilir" doğru

> ⚠️ Dosyadaki en kritik uyarı: **inceleme hesabı önceden oluşturulup
> `role='member'` yapılmalı.** `pending` kalırsa Google incelemecisi
> yalnızca onay bekleme ekranını görür ve uygulamayı işlevsiz sayar.

---

# 8. TUR — PERFORMANS, EDGE-CASE VE TEST ALTYAPISI

**215. Rehber araması her tuş vuruşunda tüm listeyi tarıyordu.** 🟡 ✅
1.500 üyede her harf için **3.000 `toLocaleLowerCase('tr-TR')` çağrısı**
yapılıyordu (ad + firma, üye başına, her tuşta). Düşük segment Android'de
yazmayı takılmalı hâle getiriyordu.
→ 220 ms debounce + üye başına **bir kez** hesaplanan arama anahtarı
(ad + firma + şehir birleşik). Şehir de artık aranabiliyor.

**216. Rehber 1.500 üyeyi tek istekte, tüm sütunlarıyla indiriyordu.** 🟡 ✅
`select('*')` — e-posta, rıza damgaları, mentor notu dahil ekranda hiç
kullanılmayan her şey. → Gösterilen sütunlarla sınırlandı + 100'lük
sayfalama (`onEndReached` ile otomatik).

**217. Kursa kayıt düğmesinde çift dokunuş iki kayıt gönderiyordu.** 🟠 ✅
`CourseCard`'da yükleme durumu yoktu. → `busy` durumu + `disabled`.

**218. Mentorluk kabul/red düğmelerinde aynı sorun.** 🟠 ✅
Hızlı çift dokunuş iki güncelleme gönderiyor, ikincisi 0 satır
etkiliyordu. → İstek başına kilit.

**219. Kullanılmayan iki görsel yayın paketinde taşınıyordu.** 🟡 ✅
`DEMO_EVENTS` `__DEV__` ile boşaltılmıştı ama `require()` modül düzeyinde
çalıştığı için Metro ikisini de paketliyordu — **~465 KB ölü ağırlık**.
→ `require` da `__DEV__` arkasına alındı.

**220. Kullanıcı girdisi uzun olduğunda düzen taşıyordu.** 🟡 ✅
Uzun firma/üye adı ve duyuru başlığı satırları itiyordu. → Rehber, admin
listeleri ve bildirim çekmecesinde `numberOfLines`.

**221. Kayıt ekranında sökülmüş bileşende `setState`.** ⚪ ✅
Doğrulama sonrası 300 ms'lik geçiş zamanlayıcısı temizlenmiyordu.

**222. Aynı yardımcı fonksiyon dört dosyada kopyalanmıştı.** 🟡 ✅
`initials` dörtte, vCard üretimi ve tarih ayrıştırma ekran bileşenlerinin
içinde. Ekran içinde oldukları için **test edilemiyorlardı** — oysa
bulduğumuz hataların çoğu tam olarak bu saf fonksiyonlardaydı.
→ `src/lib/format.ts`: `trLower`, `initials`, `fmtDateTR`, `vcEsc`,
`buildVCard`, `parseTRDate`, `parseQuota`.

**155. Test altyapısı hiç yoktu.** 🟠 ✅
→ `jest-expo` kuruldu, **48 test** yazıldı, CI'ya eklendi.

### Testler neyi koruyor

Her test, gerçekten yaşanmış bir hatanın tekrarını engelliyor:

| Test | Koruduğu hata |
|---|---|
| `trLower` | "İSTANBUL" araması "İstanbul"u bulamıyordu |
| `initials` | çift boşluklu ad, boş ad, Türkçe büyütme |
| `vcEsc` / `buildVCard` | "ORMEN, TEKSTİL" kartı ikiye bölüyordu; telefonu olmayana `TEL:—` ve derneğin e-postası gömülüyordu |
| `parseTRDate` | "24.13.2026" sessizce 2027 Ocak'a kayıyordu; "31.02" 3 Mart'a; geçersiz saat 10:00 oluyordu |
| `parseQuota` | kontenjana "0" yazınca sınırsız oluyordu |
| `authErrorTR` | ham İngilizce Supabase hatası kullanıcıya gösteriliyordu |
| `isValidTRMobile` | boş girdi "+90" üretiyor, 15 hane kabul ediliyordu |

> Testi yazarken **aynı tuzağa ben de düştüm:** `/internet bağlantı/i`
> ile eşleştirmeye çalıştım, geçmedi. JS'in `/i` bayrağı ASCII'ye göre
> katlıyor; `'İ'` (U+0130) ile `'i'` eşleşmiyor. Testin kendisi Türkçe
> küçültme hatasına yakalandı ve düzeltildi.

### Doğrulama sonuçları

```
tsc --noEmit    temiz
eslint .        0 hata (4 uyarı)
jest            48/48 geçti
expo export     Hermes bytecode üretildi
```

CI artık her derlemede üçünü de çalıştırıyor.

---

# 9. TUR — KENDİ TURUMU REVIEW ETMEK

**223. 8. turda soktuğum sayfalama, aramanın doğruluğunu bozdu.** 🟠 ✅
Rehbere `onEndReached` ile sonsuz kaydırma eklemiştim. Ama arama
**istemcide** yapılıyor: yalnızca ilk 200 kayıt yüklüyken "Zeynep"
aranırsa, listenin 400. sırasındaki Zeynep **"Sonuç bulunamadı"**
görünüyordu. Sayfalamadan önce hepsi tek seferde geldiği için arama
doğruydu — performansı düzeltirken doğruluğu bozmuşum.

> Aramayı sunucuya taşımak çözüm değildi: Postgres `ilike` varsayılan
> collation'da Türkçe İ/ı ayrımını doğru yapmıyor. Aramanın doğruluğu
> istemcideki `toLocaleLowerCase('tr-TR')` sayesinde.

→ Sonsuz kaydırma kaldırıldı. İlk sayfa gelir gelmez liste çizilir,
kalan sayfalar **arka planda akar**. Yüklenirken altta
"Üyeler yükleniyor — 400 / 1.500" görünür; arama o sırada sonuç
vermezse "liste hâlâ yükleniyor" denir. Tümü indiğinde arama yine
eksiksiz.

**138. Ağ yokken açılış sonsuza kadar dönen çarkta kalıyordu.** 🔴 ✅
`supabase.auth.getSession()` zaman aşımına sahip değil. Ağ yoksa
çözülmüyor, `status` kalıcı olarak `'loading'` kalıyor ve kullanıcı
**sonsuza kadar** dönen çarka bakıyordu — ne mesaj, ne yeniden deneme,
ne çıkış. Uçakta veya tünelde uygulamayı açan üye onu "bozuk" sayardı.
→ 8 saniye zaman aşımı → giriş ekranına düşer. Zaman aşımından sonra
gelen yanıtta gerçek oturum varsa yine devreye alınır.

**224. Yavaş bağlantıda açılış ekranı hiçbir şey söylemiyordu.** 🟡 ✅
3 saniyeden uzun sürerse "Bağlantı kuruluyor... İnternet bağlantınız
yavaşsa bu biraz sürebilir." yazılıyor.

**225. `useMembers.mentors` ölü kaldı.** ⚪ ✅
Mentör sekmesi `useMentors()`'a geçirilmişti; eski `mentors` alanı
kimse tarafından kullanılmıyordu. Kaldırıldı.

---

# 10. TUR — GÜVENLİĞİ TEK SEFERLİK OLMAKTAN ÇIKARMAK

**226. RLS doğrulaması tekrarlanabilir değildi.** 🔴 ✅

Bu denetimin en ağır bulguları (madde 1, 203, 205) RLS politikalarındaydı
ve hepsi **elle** doğrulandı. Sorun şu: bir sonraki migration bir
politikayı sessizce gevşetebilir ve kimse fark etmez. Nitekim tam da bu
oldu — `011`'in ilk hâlinde yönetim kurulu üyesi hâlâ başkanı
düşürebiliyordu, yalnızca elle denendiği için görüldü. Görülmeseydi
yayına o hâliyle çıkacaktı.

→ `supabase/tests/rls_test.sql`: **42 iddia**, ek eklenti gerektirmez
(pgTAP yok). Her iddia başarısız olursa `EXCEPTION` fırlatır ve dosya
hata koduyla biter.

| Bölüm | Kapsam |
|---|---|
| Yönetim kurulu hesabı ele geçti | 12 saldırı |
| Onay bekleyen hesap | 5 saldırı + 4 okuma izolasyonu |
| Normal üye | 7 saldırı + 2 izinli işlem |
| Onay zinciri | üye kodu · bildirim · denetim kaydı üretildi mi |
| Veri bütünlüğü | geçmiş tarih · kısa başlık · kontenjan düşürme · rıza kilidi |
| Yapısal | DELETE politikası yok · 6 politika · `search_path` · RLS kapalı tablo yok |

**Test paketinin kendisi de test ediliyor.** Asla başarısız olamayan bir
test hiçbir şey korumaz. CI'da son adım, kaçak `DELETE` politikasını
kasten geri koyup paketin bunu **yakaladığını** doğruluyor; yakalamazsa
o adım hata verir.

Yerelde iki gerçek gerileme üzerinde denendi:

```
kaçak DELETE politikası geri konunca  → yakalandı (çıkış kodu 3)
011'in eski hâli geri konunca         → yakalandı (çıkış kodu 3)
sağlam veritabanında                  → 42/42 geçti (çıkış kodu 0)
```

**227. Migration idempotansı da denetleniyor.** ⚪ ✅
Madde 202'de `011` ikinci çalıştırmada duruyordu ve en kritik güvenlik
düzeltmesi uygulanmamış kalıyordu. CI artık `011`–`013`'ü **üç kez üst
üste** çalıştırıyor; biri idempotans kaybederse derleme kırılır.

### `.github/workflows/db-test.yml`

`supabase/**` altında değişiklik olan her PR'da çalışır: temiz
PostgreSQL 16 → tüm migration'lar sırayla → idempotans → 42 güvenlik
iddiası → paketin kırılabildiğinin kanıtı.

---

# 11. TUR — SUPABASE SORGULARININ ŞEMAYLA DOĞRULANMASI

**228. Sorgu sütun adlarını hiçbir araç denetlemiyordu.** 🟠 ✅

Supabase istemcisinde tablo ve sütun adları **düz metindir**:

```ts
supabase.from('profiles').select('id, full_name, company')
```

Bu dizeleri ne TypeScript ne ESLint görür. Bir sütunu yanlış yazarsanız
uygulama derlenir, 48 birim testi geçer, Hermes paketi üretilir,
mağazaya çıkar — ve kullanıcı yalnızca **"Bağlantı kurulamadı"** görür.
Hata çalışma zamanında, tek bir ekranda ortaya çıkar.

→ `native/scripts/check-schema.mjs`: kaynaktaki her `.from().select()`
zincirini, migration'lardan üretilen **gerçek şemaya** karşı doğrular.
**105 sütun referansı** denetleniyor.

### Denetleyicinin kendisinde iki hata çıktı

Bu betiği yazarken iki kez yanıldım ve ikisi de kanıtlama adımı
sayesinde görüldü:

**1) Yanlış alarm.** İlk hâli `.from()` sonrası sabit 400 karakterlik
pencerede `.select()` arıyordu. `.from('announcements').delete()`
çağrısı, hemen ardından gelen `.from('events').select(...)` ifadesini
kendine ait sanıp **beş yanlış hata** üretti. → Pencere bir sonraki
`.from(` çağrısında kesiliyor.

**2) Sessiz kör nokta — daha ciddisi.** Kasten `full_name` → `fullname`
yazdım; **yakalamadı**. Sebep: uygulamanın en büyük sütun listesi
modül düzeyinde bir sabitte duruyor
(`const DIRECTORY_COLUMNS = 'id, full_name, ...'`) ve regex yalnızca
düz metin `.select('...')` eşliyordu. Yani **rehberin ana sorgusu hiç
denetlenmiyordu.**

> En önemli durumu atlayan bir denetleyici, yokluğundan daha kötüdür —
> yanlış güven verir.

→ Modül düzeyi dize sabitleri çözülüyor; çözülemeyen bir sabit
**sessizce atlanmıyor**, hata olarak bildiriliyor.

### Kanıtlanmış davranış

```
temiz kod                          → 105 referans geçti (çıkış 0)
tablo adı yanlış ('profile')       → yakalandı (çıkış 1)
sabitteki sütun yanlış ('fullname')→ yakalandı (çıkış 1)
```

Uygulamada gerçek bir uyumsuzluk **çıkmadı** — 105 referansın hepsi
geçerli. Bu turun kazancı bulunan hata değil, bundan sonra bu sınıf
hatanın CI'da yakalanacak olması.

CI: `supabase/**` veya `native/src|app|scripts/**` değişen her PR'da.
