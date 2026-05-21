/* data.jsx — content from the brief */

const EVENTS = [
  { id: 1, day: 22, month: 'NİSAN', tag: 'SAHA GEZİSİ', title: 'İstanbul Fabrika Ziyareti',
    place: 'İstanbul · Beylikdüzü', count: 38, photoLabel: 'FABRİKA İÇİ',
    desc: 'Beylikdüzü Organize Sanayi Bölgesi’ndeki iki büyük üretim tesisinde tam günlük teknik gezi. Dokuma, baskı ve konfeksiyon hatları.' },
  { id: 2, day: 14, month: 'MAYIS', tag: 'FUAR', title: 'HOMETEX Fuar Çalışması',
    place: 'CNR Expo · İstanbul', count: 120, photoLabel: 'HOMETEX HALL',
    desc: 'Türkiye ev tekstilinin yıllık vitrini. Genç üyeler için stand turu, alıcı görüşmeleri ve networking programı.' },
  { id: 3, day: 22, month: 'MAYIS', tag: 'ÜNİVERSİTE', title: 'İTÜ Tasarım Etkinlikleri',
    place: 'İTÜ Maçka Kampüsü', count: 64, photoLabel: 'KAMPÜS',
    desc: 'Tekstil mühendisliği öğrencileri ile workshop, mentorluk ve bitirme projesi sunumları.' },
  { id: 4, day: 12, month: 'HAZİRAN', tag: 'SAHA GEZİSİ', title: 'Bursa Fabrika Ziyareti',
    place: 'Bursa · DEMİRTAŞ OSB', count: 42, photoLabel: 'DOKUMA',
    desc: 'Bursa’nın köklü dokuma ve baskı fabrikalarında bir gün. Saat 09:00 servis kalkışı.' },
  { id: 5, day: 18, month: 'TEMMUZ', tag: 'SOSYAL', title: 'Gençlik Buluşması',
    place: 'Galataport · İstanbul', count: 95, photoLabel: 'BULUŞMA',
    desc: 'Mevsim açılışı; sektörden 200 genç iş insanı yaz akşamı buluşmasında.' },
  { id: 6, day: 7, month: 'AĞUSTOS', tag: 'TEKNOLOJİ', title: 'Yapay Zekâ Etkinlikleri',
    place: 'Google Türkiye · Levent', count: 56, photoLabel: 'AI LAB',
    desc: 'Google Türkiye ev sahipliğinde, üretimde ve pazarlamada yapay zekâ uygulamaları üzerine yarım günlük program.' },
  { id: 7, day: 15, month: 'EYLÜL', tag: 'ARAŞTIRMA', title: 'Güneydoğu Turu · Etnik Desen',
    place: 'Gaziantep · Şanlıurfa · Mardin', count: 28, photoLabel: 'ANADOLU DESEN',
    desc: 'Anadolu motiflerinin çağdaş ev tekstiline taşınması üzerine 4 günlük saha araştırması.' },
  { id: 8, day: 10, month: 'EKİM', tag: 'ÜNİVERSİTE', title: 'MSGSÜ Tasarım Etkinliği',
    place: 'Mimar Sinan GSÜ · Fındıklı', count: 70, photoLabel: 'STÜDYO',
    desc: 'Tekstil tasarımı bölümü ile ortak workshop. Genç tasarımcı buluşması.' },
  { id: 9, day: 14, month: 'KASIM', tag: 'YARIŞMA', title: 'Tasarım Yarışması',
    place: 'İstanbul · Beyoğlu', count: 0, photoLabel: 'JÜRİ SALONU',
    desc: 'Genç tasarımcılar için ulusal yarışma. Final sunumları ve ödül töreni.' },
  { id: 10, day: 12, month: 'ARALIK', tag: 'ZİRVE', title: 'Gençlik Zirvesi',
    place: 'Wyndham Grand · Levent', count: 0, photoLabel: 'ZİRVE SALONU',
    desc: 'Yılın kapanışı. Sektörün geleceğine dair panel, sergi ve gala akşamı.' },
];

const EVENT_FILTERS = ['TÜMÜ', 'FUAR', 'ÜNİVERSİTE', 'SAHA GEZİSİ', 'SOSYAL', 'TEKNOLOJİ', 'ARAŞTIRMA', 'YARIŞMA', 'ZİRVE'];

const MEMBERS = [
  { id: 0, initials: 'RÖ', name: 'Resul Öden', firm: 'ÖDEN TEKSTİL', city: 'İstanbul',
    sector: 'Ev Tekstili · Yönetim', bio: 'Genç TETSİAD Başkanı. Yeni neslin sektördeki en somut sesi.',
    role: 'GENÇ TETSİAD BAŞKANI', gold: true },
  { id: 1, initials: 'FÖ', name: 'Fatih Özdemir', firm: 'ORMEN TEKSTİL', city: 'Ankara',
    sector: 'Döşemelik', bio: 'Aile şirketinin ikinci kuşağı. Genç TETSİAD’ın gönüllü mimarı.',
    role: 'KONSEPT MİMARI', gold: true },
  { id: 2, initials: 'EY', name: 'Elif Yıldız', firm: 'YILDIZ EV TEKSTİL', city: 'Denizli',
    sector: 'Havlu · Bornoz', bio: 'İhracat operasyonu ve sürdürülebilir pamuk üzerine çalışıyor.',
    role: 'YÖNETİM', gold: false },
  { id: 3, initials: 'MK', name: 'Mert Kaya', firm: 'KAYA HALI', city: 'Gaziantep',
    sector: 'Makine Halı', bio: 'Üçüncü kuşak halı üreticisi. Anadolu desenlerinin dijital arşivi üzerine projeleri var.',
    role: 'ÜYE', gold: false },
  { id: 4, initials: 'ZA', name: 'Zeynep Aydın', firm: 'AYDIN PERDE', city: 'Bursa',
    sector: 'Perdelik', bio: 'Mimarlardan gelen taleplere göre özel dokuma koleksiyonları geliştiriyor.',
    role: 'ÜYE', gold: false },
  { id: 5, initials: 'CO', name: 'Can Oktay', firm: 'OKTAY İPLİK', city: 'Uşak',
    sector: 'İplik', bio: 'Geri dönüşümlü iplik teknolojileri ve LCA raporlama.',
    role: 'YÖNETİM', gold: false },
  { id: 6, initials: 'SD', name: 'Selin Demir', firm: 'DEMİR AKSESUAR', city: 'İstanbul',
    sector: 'Aksesuar', bio: 'Trend araştırması ve görsel kimlik. MSGSÜ tekstil mezunu.',
    role: 'ÜYE', gold: false },
  { id: 7, initials: 'AT', name: 'Ahmet Tan', firm: 'TAN DOKUMA', city: 'Kahramanmaraş',
    sector: 'Dokuma', bio: 'Klasik atkı dokuma; küçük üretim, butik koleksiyon.',
    role: 'ÜYE', gold: false },
  { id: 8, initials: 'NK', name: 'Nazlı Karaca', firm: 'İTÜ', city: 'İstanbul',
    sector: 'Öğrenci · Tekstil Müh.', bio: 'Lisans 3. sınıf. Genç TETSİAD’ın ilk öğrenci üyelerinden.',
    role: 'ÖĞRENCİ', gold: false, student: true },
];

const COURSES = [
  { id: 1, num: 1, cat: 'UZMAN KONUŞMACILAR', title: 'Sektörün önde gelen isimleri',
    sub: 'Aylık seminerler · 9 konuşmacı / yıl', progress: 64, instructor: 'Çeşitli' },
  { id: 2, num: 2, cat: 'DİJİTAL EĞİTİMLER', title: 'Sosyal medya ve e‑ticaret',
    sub: '6 modül · 12 hafta', progress: 38, instructor: 'Burak Yılmaz' },
  { id: 3, num: 3, cat: 'SÜREÇ EĞİTİMLERİ', title: 'Üretimden pazarlamaya',
    sub: 'Operasyon, lojistik, kalite · 10 hafta', progress: 22, instructor: 'TETSİAD Akademi' },
  { id: 4, num: 4, cat: 'MUHASEBE', title: 'Doğru ticari muhasebe',
    sub: 'Üretici şirketler için pratik · 6 hafta', progress: 0, instructor: 'YMM Ofisi' },
  { id: 5, num: 5, cat: 'İLETİŞİM', title: 'Diksiyon ve hitabet',
    sub: 'Sunum ve sahne · 4 hafta', progress: 0, instructor: 'Hülya Mutlu' },
  { id: 6, num: 6, cat: 'ÖZEL TALEPLER', title: 'Üye talebiyle açılan başlıklar',
    sub: 'İhracat, KVKK, ESG · değişken', progress: 0, instructor: 'Davetli uzmanlar' },
];

const MENTORS = [
  { id: 1, initials: 'RÖ', name: 'Resul Öden', title: 'Genç TETSİAD Başkanı',
    expertise: 'Liderlik · Genç Girişimcilik · Vizyon' },
  { id: 2, initials: 'MŞ', name: 'Murat Şahinler', title: 'TETSİAD Başkanı',
    expertise: 'Marka · Strateji · Liderlik' },
  { id: 3, initials: 'AY', name: 'Aylin Yıldız', title: 'Hometex Komite',
    expertise: 'Fuar Operasyonu · Uluslararası Pazar' },
  { id: 4, initials: 'KB', name: 'Kerem Bayraktar', title: 'Bayraktar Tekstil',
    expertise: 'Üretim Verimliliği · Yalın' },
  { id: 5, initials: 'DT', name: 'Defne Türkmen', title: 'Designer · MSGSÜ',
    expertise: 'Yüzey Tasarımı · Renk' },
];

const ACTIVITIES = [
  { num: 1, title: 'Üniversiteler & Fabrikalar',
    desc: 'Tekstil bölümlerine sahip üniversitelerle, sektör fabrikalarını buluşturan iki yönlü ziyaret programı.' },
  { num: 2, title: 'Gençlik Zirvesi',
    desc: 'Yılın kapanışında düzenlenen büyük buluşma. Panel, sergi ve gala ile genç iş insanlarını bir araya getirir.' },
  { num: 3, title: 'Gençlik Buluşmaları',
    desc: 'Şehir ve fuar üzerinden, küçük gruplar halinde organize edilen düzenli ağ programları.' },
  { num: 4, title: 'Mentörlük',
    desc: 'Sektörün deneyimli isimleriyle, başvuru üzerine eşleştirme. Yıl boyu birebir görüşmeler.' },
];

const GOALS = [
  'Üniversite öğrencileri ile sektörü düzenli biçimde buluşturmak.',
  'Genç tasarımcı ve girişimcilere mentörlük sağlamak.',
  'Sektörün dijital ve sürdürülebilir dönüşümünde öncülük etmek.',
  'Üyeler arasında bilgi ve deneyim paylaşımını kurumsallaştırmak.',
  'Hometex Fuarı’nda gençlik temalı sergi alanları kurmak.',
  'Uluslararası fuarlarda Türk ev tekstilini genç yüzlerle temsil etmek.',
];

const COMMISSIONS = [
  'Sektör Konuları', 'İletişim Medya ve PR', 'Kurumsal İlişkiler', 'Üniversiteler',
  'Üye Kabul', 'Organizasyon ve Etkinlik', 'İhracat Geliştirme',
];

const UNIS = ['MSGSÜ', 'Boğaziçi', 'Bilkent', 'İTÜ', 'ODTÜ', 'Yalova', 'MEB', 'TMMOB'];

/* Resul Öden — Genç TETSİAD Başkanı */
const PRESIDENT = {
  initials: 'RÖ',
  name: 'Resul Öden',
  title: 'GENÇ TETSİAD BAŞKANI',
  firm: 'ÖDEN TEKSTİL · İSTANBUL',
  quote: 'Genç TETSİAD, sektörün geleceğini bugünden örmeye başlayan bir atölyedir. Üretirken öğrenmek, paylaşırken büyümek istiyoruz.',
  long: 'Türkiye ev tekstilinin dünyada hak ettiği yere ulaşması, yalnızca üretim gücüyle değil, genç kuşağın markalaşma, sürdürülebilirlik ve dijitalleşme alanında ortaya koyacağı vizyonla mümkün olacak. Bu uygulama, o vizyonu bir araya getiren ilk somut adım.',
  photo: 'GENÇ TETSİAD BAŞKANI · KÜRSÜDE',
};

/* Sustainable textile manifesto pillars */
const PILLARS = [
  { id: 1, title: 'Sürdürülebilir Üretim',
    desc: 'Geri dönüşümlü iplik, su tasarrufu, sertifikalı tedarik zinciri.' },
  { id: 2, title: 'Genç Tasarım',
    desc: 'Kampüslerden sektöre uzanan tasarım köprüsü.' },
  { id: 3, title: 'Dijital Dönüşüm',
    desc: 'E-ticaret, veri ile karar, üretimde otomasyon.' },
  { id: 4, title: 'Uluslararası Marka',
    desc: 'Türkiye’nin dokumasını dünya vitrinine taşımak.' },
];

/* Instagram-style news feed — sourced from @tetsiad.dernek content */
const NEWS = [
  { id: 1, tag: 'HOMETEX 2026', date: '14 MAYIS',
    title: 'Hometex Fuarı kapılarını gençlere açıyor',
    excerpt: 'Bu yıl ilk kez Genç TETSİAD özel sergi alanı — “Sürdürülebilirlik” ve “İnovasyon” temaları.',
    photoLabel: 'HOMETEX SALON' },
  { id: 2, tag: 'GENEL KURUL', date: '24 MART',
    title: 'TETSİAD yeni dönem Yönetim Kurulu seçildi',
    excerpt: 'Murat Şahinler başkanlığında 13 aktif komisyon kuruldu. Genç TETSİAD bu yapının en somut çıktısı.',
    photoLabel: 'GENEL KURUL SALONU' },
  { id: 3, tag: 'GENÇ TETSİAD', date: '12 NİSAN',
    title: 'İlk komisyon toplantısı yapıldı',
    excerpt: 'Resul Öden başkanlığında genç temsilciler bir araya geldi. 7 alt komisyon ve 2026 yol haritası onaylandı.',
    photoLabel: 'KOMİSYON TOPLANTISI' },
  { id: 4, tag: 'İHRACAT', date: '02 NİSAN',
    title: 'Q1 ihracatımız %12 büyüdü',
    excerpt: 'Türkiye ev tekstili 2026’nın ilk çeyreğinde 1,4 milyar dolarlık ihracata ulaştı.',
    photoLabel: 'LİMAN · İHRACAT' },
  { id: 5, tag: 'SÜRDÜRÜLEBİLİRLİK', date: '20 MART',
    title: 'Yeşil dönüşüm yol haritası açıklandı',
    excerpt: 'Üye firmalar 2030’a kadar enerji yoğunluğunu %30 azaltma taahhüdünü imzaladı.',
    photoLabel: 'YEŞİL ÜRETİM' },
  { id: 6, tag: 'İŞBİRLİĞİ', date: '08 MART',
    title: 'İTÜ ile akademik protokol imzalandı',
    excerpt: 'Tekstil mühendisliği öğrencileri için Genç TETSİAD bursu ve mentörlük programı başlıyor.',
    photoLabel: 'İTÜ İMZA TÖRENİ' },
];

/* Duyurular — live announcements from the leadership */
const ANNOUNCEMENTS = [
  { id: 1, priority: 'urgent', author: 'Resul Öden', authorRole: 'GENÇ TETSİAD BAŞKANI', initials: 'RÖ',
    time: '5 dk önce', date: '21 MAYIS · 14:38',
    title: 'Hometex 2026 stand listesi yayımlandı',
    body: 'Genç TETSİAD özel sergi alanı için 28 firmanın katılımı kesinleşti. Stand numaralarını üye panelinizden görebilirsiniz. Bu yıl ilk kez kendi vitrinimizle ev sahibiyiz.', pinned: true },
  { id: 2, priority: 'high', author: 'Resul Öden', authorRole: 'GENÇ TETSİAD BAŞKANI', initials: 'RÖ',
    time: '2 saat önce', date: '21 MAYIS · 11:50',
    title: 'Sürdürülebilirlik taahhüdü imza süreci',
    body: 'Üye firmalarımız için 2030 yeşil dönüşüm taahhüdü dijital imzaya açıldı. Profilinizdeki "Belgelerim" altından erişebilirsiniz. Son tarih: 30 Haziran.' },
  { id: 3, priority: 'normal', author: 'Murat Şahinler', authorRole: 'TETSİAD BAŞKANI', initials: 'MŞ',
    time: 'Dün', date: '20 MAYIS · 18:02',
    title: 'Üretimden markaya — yolculuğumuz başlıyor',
    body: 'Genel Kurul’da paylaştığım yeni dönem manifestosunun tam metnini “Belgelerim” altına ekledim. Genç TETSİAD bu yolculuğun en somut çıktısı olacak.' },
  { id: 4, priority: 'normal', author: 'Sistem', authorRole: 'GENÇ TETSİAD', initials: 'GT',
    time: '2 gün', date: '19 MAYIS · 09:15',
    title: 'İTÜ etkinliğine 12 kontenjan kaldı',
    body: '22 Mayıs İTÜ Tasarım Etkinlikleri için son kayıtlar. Workshop kontenjanı sınırlıdır.' },
  { id: 5, priority: 'high', author: 'Aylin Yıldız', authorRole: 'HOMETEX KOMİTE', initials: 'AY',
    time: '3 gün', date: '18 MAYIS · 16:40',
    title: 'Fuar refakatçi listesi kapanıyor',
    body: 'Yurt dışı alıcı refakatçi programı için 5 koltuk kaldı. Lütfen profilinizden başvurunuzu tamamlayın.' },
  { id: 6, priority: 'normal', author: 'Resul Öden', authorRole: 'GENÇ TETSİAD BAŞKANI', initials: 'RÖ',
    time: '5 gün', date: '16 MAYIS · 21:08',
    title: 'Hoş geldiniz — yeni başlıyoruz',
    body: 'Bu uygulama, Genç TETSİAD’ın sektördeki ilk dijital adımı. Geri bildirimleriniz, gelişimimizin temelini oluşturuyor.' },
];

/* Sustainability dashboard — TETSIAD 2030 commitments */
const SUSTAINABILITY = {
  headline: '2030 Yeşil Dönüşüm Taahhüdü',
  metrics: [
    { id: 1, label: 'Geri dönüşümlü iplik', value: 38, target: 70, unit: '%', delta: '+6 ay' },
    { id: 2, label: 'Su tasarrufu', value: 22, target: 50, unit: '%', delta: '+9 ay' },
    { id: 3, label: 'Enerji yoğunluğu', value: 18, target: 30, unit: '% azalış', delta: '+12 ay' },
    { id: 4, label: 'Sertifikalı tedarik', value: 64, target: 90, unit: '%', delta: '+3 ay' },
  ],
};

/* Export snapshot — Q1 2026 */
const EXPORTS = {
  period: 'Q1 · 2026',
  total: '1,4 Mr $',
  growth: '+12%',
  topMarkets: [
    { country: 'ABD', share: 22 },
    { country: 'Almanya', share: 18 },
    { country: 'İngiltere', share: 14 },
    { country: 'Fransa', share: 9 },
    { country: 'Hollanda', share: 7 },
    { country: 'Diğer', share: 30 },
  ],
};

Object.assign(window, {
  EVENTS, EVENT_FILTERS, MEMBERS, COURSES, MENTORS, ACTIVITIES, GOALS, COMMISSIONS, UNIS,
  PRESIDENT, PILLARS, NEWS, ANNOUNCEMENTS, SUSTAINABILITY, EXPORTS,
});
