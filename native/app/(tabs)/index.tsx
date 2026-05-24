import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAppContext } from '@/context/AppContext';

// ── Data ───────────────────────────────────────────────────────────────────

const PRESIDENT = {
  name: 'Resul Öden',
  title: 'GENÇ TETSİAD BAŞKANI',
  firm: 'ROSSA HOME · İSTANBUL',
  quote:
    'Genç TETSİAD, sektörün geleceğini bugünden örmeye başlayan bir atölyedir. Üretirken öğrenmek, paylaşırken büyümek istiyoruz.',
  message: [
    'Ev tekstili sektörümüz onlarca yıldır dünya pazarında güçlü bir yer tutmaktadır. Ancak bu güç, artık yalnızca üretim kapasitesiyle ölçülmüyor.',
    "Genç TETSİAD olarak tam da bu dönüşümün merkezinde yer almak istiyoruz. Türkiye'nin dokuma geleneğini, genç kuşağın vizyonuyla birleştirdiğimizde ortaya çok güçlü bir sinerji çıkıyor.",
    'Bu platform, yalnızca bir uygulama değil; sektörün geleceğine yapılan somut bir yatırım.',
  ],
};

const IMG_FABRIKA   = require('../../assets/images/fabrika-ziyareti-grup.jpg');
const IMG_HOMETEX   = require('../../assets/images/hometex-2026-acilis.jpg');
const IMG_KOMITE    = require('../../assets/images/bolge-komite-toplantisi.jpg');
const IMG_PRESIDENT = require('../../assets/images/resul-oden-roportaj.jpg');

const EVENTS = [
  {
    id: 1,
    day: 22,
    month: 'NİSAN',
    tag: 'SAHA GEZİSİ',
    title: 'İstanbul Fabrika Ziyareti',
    src: IMG_FABRIKA,
  },
  {
    id: 2,
    day: 14,
    month: 'MAYIS',
    tag: 'FUAR',
    title: 'HOMETEX Fuar Çalışması',
    src: IMG_HOMETEX,
  },
  {
    id: 3,
    day: 22,
    month: 'MAYIS',
    tag: 'KOMITE',
    title: 'Bölge Komite Toplantısı',
    src: IMG_KOMITE,
  },
  {
    id: 4,
    day: 12,
    month: 'HAZİRAN',
    tag: 'SAHA GEZİSİ',
    title: 'Bursa Fabrika Ziyareti',
    src: 'https://picsum.photos/seed/gt-ev4/400/300',
  },
];

const ANNOUNCEMENTS = [
  {
    id: 1,
    pinned: true,
    label: 'DUYURU',
    text: 'HOMETEX 2026 fuar katılım başvuruları 15 Haziran\'a kadar açık. Detaylar için takvime bakın.',
  },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Animated counter hook ──────────────────────────────────────────────────

function useCounter(target: number, duration = 1200, delay = 0) {
  const [val, setVal] = useState(0);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startAt = Date.now() + delay;
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startAt;
      if (elapsed < 0) {
        frameRef.current = setTimeout(tick, 16);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = setTimeout(tick, 16);
      }
    };
    frameRef.current = setTimeout(tick, 16);
    return () => {
      if (frameRef.current) clearTimeout(frameRef.current);
    };
  }, [target, duration, delay]);

  return val;
}

// ── Stats strip ────────────────────────────────────────────────────────────

function StatsStrip() {
  const c1 = useCounter(1500, 1400, 0);
  const c2 = useCounter(55, 1000, 200);
  const c3 = useCounter(40, 900, 400);
  const c4 = useCounter(10, 700, 600);

  const stats = [
    { value: c1 >= 1500 ? '1.500' : c1.toLocaleString('tr-TR'), suffix: '+', label: 'ÜYE' },
    { value: String(c2), suffix: '', label: 'İL' },
    { value: String(c3), suffix: '', label: 'ÜLKE' },
    { value: String(c4), suffix: '', label: 'ETKİNLİK' },
  ];

  return (
    <View style={statsStyles.strip}>
      {stats.map((s, i) => (
        <View
          key={s.label}
          style={[
            statsStyles.cell,
            i < stats.length - 1 && statsStyles.cellBorder,
          ]}
        >
          <Text style={statsStyles.number}>
            {s.value}
            <Text style={statsStyles.suffix}>{s.suffix}</Text>
          </Text>
          <Text style={statsStyles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const statsStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    backgroundColor: Colors.navyDeep,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingVertical: 22,
    paddingHorizontal: 8,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  cellBorder: {
    borderRightWidth: 0.5,
    borderRightColor: Colors.goldLine,
  },
  number: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: FontSize['3xl'],
    color: Colors.gold,
    lineHeight: 32,
  },
  suffix: {
    fontSize: FontSize.lg,
  },
  label: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginTop: 6,
  },
});

// ── Main screen ────────────────────────────────────────────────────────────

type NotifTab = 'TÜMÜ' | 'DUYURU' | 'ETKİNLİK' | 'SİSTEM';

function NotificationDrawer({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead } = useAppContext();
  const [tab, setTab] = useState<NotifTab>('TÜMÜ');

  const filtered = tab === 'TÜMÜ'
    ? notifications
    : notifications.filter(n => n.category === tab);

  const tabs: NotifTab[] = ['TÜMÜ', 'DUYURU', 'ETKİNLİK', 'SİSTEM'];
  const catColor = (cat: string) => {
    if (cat === 'ETKİNLİK') return Colors.gold;
    if (cat === 'SİSTEM') return 'rgba(217,200,150,0.55)';
    return Colors.textMuted;
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={notifStyles.overlay}>
        <View style={notifStyles.sheet}>
          {/* Handle */}
          <View style={notifStyles.handle} />

          {/* Header */}
          <View style={notifStyles.header}>
            <Text style={notifStyles.title}>BİLDİRİMLER</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
                <Text style={notifStyles.markAll}>Tümünü okundu işaretle</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={notifStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab bar */}
          <View style={notifStyles.tabs}>
            {tabs.map(t => (
              <TouchableOpacity key={t} style={[notifStyles.tab, tab === t && notifStyles.tabActive]} onPress={() => setTab(t)}>
                <Text style={[notifStyles.tabText, tab === t && notifStyles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {filtered.map(n => (
              <TouchableOpacity key={n.id} style={[notifStyles.item, !n.read && notifStyles.itemUnread]} onPress={() => markRead(n.id)} activeOpacity={0.8}>
                {!n.read && <View style={notifStyles.unreadDot} />}
                <View style={notifStyles.itemContent}>
                  <View style={notifStyles.itemTop}>
                    <Text style={[notifStyles.itemCat, { color: catColor(n.category) }]}>{n.category}</Text>
                    <Text style={notifStyles.itemDate}>{n.date}</Text>
                  </View>
                  <Text style={notifStyles.itemTitle}>{n.title}</Text>
                  <Text style={notifStyles.itemBody}>{n.body}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const MANIFESTO_PARAGRAPHS = [
  'Türkiye ev tekstili sektörü, yüzyıllık bir dokuma geleneğinin üzerinde yükseliyor. Biz bu geleneği geleceğe taşıyacak nesil olarak bir araya geldik.',
  'Genç TETSİAD; üretimi, tasarımı ve ihracatı birleştiren genç iş insanlarının platformudur. Rekabeti değil, dayanışmayı; kâr yarışını değil, ortak büyümeyi seçiyoruz.',
  'Avrupa\'nın yeşil dönüşümünü tehdit değil fırsat olarak okuyoruz. Sürdürülebilir üretim standartlarını dünyadan önce benimsemek, bizi öne çıkaracak.',
  'Mentorluk, kurs ve etkinliklerle birbirimizden öğreniyoruz. Sektördeki her genç isim hem öğrenci hem öğretmendir.',
  'Bu platform, yalnızca bir uygulama değil — sektörün geleceğine yapılan somut bir yatırımdır.',
];

function ManifestoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={manifStyles.backdrop}>
        <View style={manifStyles.sheet}>
          <View style={manifStyles.corner_tl} /><View style={manifStyles.corner_tr} />
          <View style={manifStyles.corner_bl} /><View style={manifStyles.corner_br} />
          <Text style={manifStyles.overline}>GENÇ TETSİAD</Text>
          <Text style={manifStyles.title}>Manifesto</Text>
          <View style={manifStyles.divider} />
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
            {MANIFESTO_PARAGRAPHS.map((p, i) => (
              <Text key={i} style={[manifStyles.para, i > 0 && { marginTop: 16 }]}>{p}</Text>
            ))}
          </ScrollView>
          <View style={manifStyles.divider} />
          <Text style={manifStyles.sig}>{'GENÇ TETSİAD · 2026'}</Text>
          <TouchableOpacity style={manifStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={manifStyles.closeBtnText}>KAPAT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const manifStyles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(3,15,9,0.94)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  sheet:       { backgroundColor: Colors.navyDeep, borderWidth: 0.5, borderColor: Colors.gold, padding: 28, width: '100%' },
  overline:    { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 3, color: Colors.gold, fontWeight: '700', marginBottom: 8 },
  title:       { fontFamily: 'CormorantGaramond', fontSize: 34, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', lineHeight: 38 },
  divider:     { height: 0.5, backgroundColor: Colors.goldLine, marginVertical: 18 },
  para:        { fontFamily: Fonts.jakarta, fontSize: 12, color: Colors.ivory, lineHeight: 20, opacity: 0.85 },
  sig:         { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 2, color: Colors.textMuted, textAlign: 'right', marginBottom: 20 },
  closeBtn:    { borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 12, alignItems: 'center' },
  closeBtnText:{ fontFamily: Fonts.jakarta, fontSize: 9, letterSpacing: 2.5, color: Colors.gold, fontWeight: '600' },
  // corner brackets
  corner_tl: { position: 'absolute', top: 8, left: 8, width: 14, height: 14, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: Colors.gold },
  corner_tr: { position: 'absolute', top: 8, right: 8, width: 14, height: 14, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: Colors.gold },
  corner_bl: { position: 'absolute', bottom: 8, left: 8, width: 14, height: 14, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: Colors.gold },
  corner_br: { position: 'absolute', bottom: 8, right: 8, width: 14, height: 14, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: Colors.gold },
});

export default function HomeScreen() {
  const { registeredEvents, unreadCount } = useAppContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const banner = ANNOUNCEMENTS.find((a) => a.pinned) ?? ANNOUNCEMENTS[0];

  const handleQuickCard = (target: string) => {
    if (target === 'directory') {
      router.push('/(tabs)/directory');
    } else if (target === 'academy') {
      router.push('/(tabs)/academy');
    }
    // news/toast — no-op for now
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── A. COVER IMAGE ──────────────────────────────────── */}
        <View style={styles.cover}>
          <Image
            source={IMG_FABRIKA}
            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* Gradient: heavy top + heavy bottom, open in middle */}
          <LinearGradient
            colors={[
              'rgba(5,28,17,0.90)',
              'rgba(5,28,17,0.08)',
              'rgba(5,28,17,0.14)',
              'rgba(5,28,17,0.95)',
            ]}
            locations={[0, 0.35, 0.55, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Top bar */}
          <View style={styles.coverTopBar}>
            <Text style={styles.coverTopBarLabel}>GENÇ TETSİAD · 2026</Text>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.7} onPress={() => setNotifOpen(true)}>
              {/* Bell icon — drawn inline */}
              <View style={styles.bellIcon}>
                <View style={styles.bellBody} />
                <View style={styles.bellBase} />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Main tagline */}
          <View style={styles.coverTaglineWrap}>
            <Text style={styles.coverTaglineMain}>
              {'Değişim\ngençlerle\n'}
              <Text style={styles.coverTaglineGold}>olacak.</Text>
            </Text>
            <Text style={styles.coverSubtitle}>
              Türkiye ev tekstilinin genç iş insanları platformu.
            </Text>
          </View>

          {/* CTA buttons */}
          <View style={styles.coverCTAWrap}>
            <View style={styles.coverCTARow}>
              <TouchableOpacity style={styles.btnFill} activeOpacity={0.8} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.btnFillText}>BAŞVUR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline} activeOpacity={0.8} onPress={() => setManifestoOpen(true)}>
                <Text style={styles.btnOutlineText}>MANİFESTO</Text>
              </TouchableOpacity>
            </View>

            {/* Scroll hint */}
            <View style={styles.scrollHint}>
              <View style={styles.scrollHintLine} />
              <Text style={styles.scrollHintText}>AŞAĞI KAYDIRIN</Text>
              <View style={styles.scrollHintLine} />
            </View>
          </View>
        </View>

        {/* ── B. ANNOUNCEMENT BANNER ─────────────────────────── */}
        {banner && (
          <View style={styles.bannerWrap}>
            <View style={styles.bannerStrip} />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerLabel}>📢 DUYURU</Text>
              <Text style={styles.bannerText}>{banner.text}</Text>
            </View>
          </View>
        )}

        {/* ── C. QUICK ACCESS CARDS ──────────────────────────── */}
        <View style={styles.quickGrid}>
          {[
            { icon: '◈', label: 'Üyelere\nUlaş', sub: 'REHBER', target: 'directory' },
            { icon: '◆', label: 'Sektörel\nGelişim', sub: 'AKADEMİ', target: 'academy' },
            { icon: '◉', label: 'Trendleri\nKeşfet', sub: 'GÜNDEM', target: 'news' },
          ].map((card) => (
            <TouchableOpacity
              key={card.target}
              style={styles.quickCard}
              activeOpacity={0.75}
              onPress={() => handleQuickCard(card.target)}
            >
              <Text style={styles.quickCardIcon}>{card.icon}</Text>
              <Text style={styles.quickCardLabel}>{card.label}</Text>
              <Text style={styles.quickCardSub}>{card.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── D. STATS STRIP ─────────────────────────────────── */}
        <View style={styles.statsWrap}>
          <StatsStrip />
        </View>

        {/* ── E. BAŞKAN'DAN ───────────────────────────────────── */}
        <View style={styles.presidentSection}>

          {/* Section header with flanking lines */}
          <View style={styles.sectionDividerRow}>
            <View style={styles.sectionDividerLine} />
            <Text style={styles.sectionDividerLabel}>BAŞKAN'DAN</Text>
            <View style={styles.sectionDividerLine} />
          </View>

          {/* Portrait image with gradient */}
          <View style={styles.portraitWrap}>
            <Image
              source={IMG_PRESIDENT}
              style={styles.portraitImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                'rgba(5,28,17,0.25)',
                'rgba(5,28,17,0.10)',
                'rgba(5,28,17,0.97)',
              ]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Name overlay */}
            <View style={styles.portraitNameWrap}>
              <Text style={styles.portraitName}>{PRESIDENT.name}</Text>
              <View style={styles.portraitTitleRow}>
                <View style={styles.portraitTitleLine} />
                <Text style={styles.portraitTitle}>{PRESIDENT.title}</Text>
              </View>
            </View>
          </View>

          {/* Message body */}
          <View style={styles.presidentBody}>

            {/* Pull quote */}
            <View style={styles.pullQuoteWrap}>
              <Text style={styles.pullQuoteText}>"{PRESIDENT.quote}"</Text>
            </View>

            {/* Paragraphs */}
            {PRESIDENT.message.map((para, i) => (
              <Text
                key={i}
                style={[
                  styles.presidentPara,
                  i < PRESIDENT.message.length - 1 && styles.presidentParaGap,
                ]}
              >
                {para}
              </Text>
            ))}

            {/* Signature block */}
            <View style={styles.sigBlock}>
              <View style={styles.sigLeft}>
                <Text style={styles.sigName}>{PRESIDENT.name}</Text>
                <Text style={styles.sigTitle}>{PRESIDENT.title}</Text>
                <Text style={styles.sigFirm}>{PRESIDENT.firm}</Text>
              </View>
              <Text style={styles.sigMono}>{'GENÇ\nTETSİAD\n2026'}</Text>
            </View>
          </View>
        </View>

        {/* ── F. YAKLAŞAN ETKİNLİKLER ─────────────────────────── */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsHeaderRow}>
            <View style={styles.sectionNumDot} />
            <Text style={styles.eventsHeaderLabel}>YAKLAŞAN ETKİNLİKLER</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScroll}
          >
            {EVENTS.slice(0, 4).map((ev) => {
              const joined = registeredEvents.has(ev.id);
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.eventCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/calendar')}
                >
                  <Image
                    source={typeof ev.src === 'string' ? { uri: ev.src } : ev.src}
                    style={styles.eventCardImage}
                    resizeMode="cover"
                  />
                  {joined && (
                    <View style={styles.eventJoinedBadge}>
                      <Text style={styles.eventJoinedText}>✓ KATILDIM</Text>
                    </View>
                  )}
                  <View style={styles.eventCardBody}>
                    <Text style={styles.eventTag}>{ev.tag}</Text>
                    <Text style={styles.eventTitle}>{ev.title}</Text>
                    <View style={styles.eventDateRow}>
                      <Text style={styles.eventDay}>{ev.day}</Text>
                      <Text style={styles.eventMonth}>{ev.month}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── G. FOOTER / KÜNYE ──────────────────────────────── */}
        <View style={styles.footer}>
          {/* Logo text */}
          <View style={styles.footerLogoRow}>
            <View style={styles.footerLogoLine} />
            <View style={styles.footerLogoCenter}>
              <Text style={styles.footerLogoMain}>GENÇ TETSİAD</Text>
            </View>
            <View style={styles.footerLogoLine} />
          </View>

          <View style={styles.footerRule} />

          {/* Credits grid */}
          <View style={styles.footerGrid}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColLabel}>KONSEPT</Text>
              <Text style={styles.footerColName}>Fatih Özdemir</Text>
              <Text style={styles.footerColDetail}>ORMEN TEKSTİL</Text>
              <Text style={styles.footerColDetail}>ANKARA · 2026</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColLabel}>YAYINLAYAN</Text>
              <Text style={styles.footerColItalic}>{'Genç TETSİAD'}</Text>
              <Text style={styles.footerColDetail}>TETSİAD ALT YAPILANMA</Text>
            </View>
          </View>

          <View style={styles.footerRule} />

          {/* Contact */}
          <Text style={styles.footerContact}>
            info@tetsiad.org  ·  +90 212 292 04 04
          </Text>
        </View>

      </ScrollView>

      {notifOpen && <NotificationDrawer onClose={() => setNotifOpen(false)} />}
      {manifestoOpen && <ManifestoModal onClose={() => setManifestoOpen(false)} />}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // ── Cover ────────────────────────────────────────────
  cover: {
    height: 580,
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  coverTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 12,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coverTopBarLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.gold,
    letterSpacing: 2,
    fontWeight: '600',
  },
  bellButton: {
    padding: 4,
  },
  bellIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBody: {
    width: 14,
    height: 12,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    marginBottom: 2,
  },
  bellBase: {
    width: 8,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: Colors.gold,
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 5,
    color: Colors.navyDeep,
    fontWeight: '700',
  },

  coverTaglineWrap: {
    position: 'absolute',
    bottom: 128,
    left: 24,
    right: 24,
  },
  coverTaglineMain: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 52,
    color: Colors.ivory,
    lineHeight: 50,
    letterSpacing: -1,
  },
  coverTaglineGold: {
    color: Colors.gold,
  },
  coverSubtitle: {
    marginTop: 14,
    fontFamily: Fonts.jakarta,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(245,240,230,0.65)',
    lineHeight: 17,
    maxWidth: 260,
  },

  coverCTAWrap: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
  },
  coverCTARow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  btnFill: {
    flex: 1,
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFillText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.navyDeep,
    letterSpacing: 2.5,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: Colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 2.5,
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: 0.45,
  },
  scrollHintLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(217,200,150,0.6)',
  },
  scrollHintText: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    letterSpacing: 2.5,
    color: Colors.gold,
  },

  // ── Announcement banner ───────────────────────────────
  bannerWrap: {
    flexDirection: 'row',
    backgroundColor: Colors.navyMid,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    overflow: 'hidden',
  },
  bannerStrip: {
    width: 3,
    backgroundColor: Colors.gold,
  },
  bannerContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  bannerLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.gold,
    letterSpacing: 2,
    fontWeight: '700',
  },
  bannerText: {
    fontFamily: Fonts.jakarta,
    fontSize: 11,
    fontWeight: '300',
    color: Colors.ivory,
    lineHeight: 16,
  },

  // ── Quick-access grid ──────────────────────────────────
  quickGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(217,200,150,0.06)',
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  quickCardIcon: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 24,
    color: Colors.gold,
    lineHeight: 26,
    marginBottom: 8,
  },
  quickCardLabel: {
    fontFamily: Fonts.cormorant,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.ivory,
    lineHeight: 15,
    textAlign: 'center',
    marginBottom: 6,
  },
  quickCardSub: {
    fontFamily: Fonts.jakarta,
    fontSize: 6,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },

  // ── Stats ──────────────────────────────────────────────
  statsWrap: {
    marginTop: 28,
  },

  // ── President section ──────────────────────────────────
  presidentSection: {
    marginTop: 40,
  },
  sectionDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionDividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.goldLine,
  },
  sectionDividerLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.gold,
    letterSpacing: 3,
    fontWeight: '600',
  },
  portraitWrap: {
    height: 340,
    overflow: 'hidden',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  portraitNameWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  portraitName: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 38,
    color: Colors.ivory,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  portraitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  portraitTitleLine: {
    width: 28,
    height: 0.5,
    backgroundColor: Colors.gold,
  },
  portraitTitle: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.gold,
    letterSpacing: 2,
    fontWeight: '600',
  },
  presidentBody: {
    backgroundColor: Colors.navyDeep,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
  },
  pullQuoteWrap: {
    marginBottom: 24,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: Colors.gold,
  },
  pullQuoteText: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 19,
    color: Colors.ivory,
    lineHeight: 29,
  },
  presidentPara: {
    fontFamily: Fonts.jakarta,
    fontSize: 12,
    fontWeight: '300',
    color: Colors.textMuted,
    lineHeight: 20,
  },
  presidentParaGap: {
    marginBottom: 16,
  },
  sigBlock: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sigLeft: {
    gap: 3,
  },
  sigName: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 28,
    color: Colors.gold,
    lineHeight: 28,
  },
  sigTitle: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginTop: 8,
  },
  sigFirm: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.gold,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginTop: 3,
  },
  sigMono: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'right',
    lineHeight: 14,
  },

  // ── Events section ────────────────────────────────────
  eventsSection: {
    marginTop: 40,
  },
  eventsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionNumDot: {
    width: 5,
    height: 5,
    backgroundColor: Colors.gold,
    borderRadius: 0,
    transform: [{ rotate: '45deg' }],
  },
  eventsHeaderLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.gold,
    letterSpacing: 2.5,
    fontWeight: '600',
  },
  eventsScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  eventCard: {
    width: 230,
    backgroundColor: Colors.navyMid,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    overflow: 'hidden',
  },
  eventJoinedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  eventJoinedText: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    fontWeight: '700',
    color: Colors.navy,
    letterSpacing: 1,
  },
  eventCardImage: {
    width: '100%',
    height: 110,
  },
  eventCardBody: {
    padding: 14,
  },
  eventTag: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.gold,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 17,
    fontWeight: '500',
    color: Colors.ivory,
    lineHeight: 20,
    minHeight: 40,
    marginBottom: 12,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  eventDay: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 22,
    color: Colors.gold,
    lineHeight: 22,
  },
  eventMonth: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
  },

  // ── Footer ────────────────────────────────────────────
  footer: {
    marginTop: 40,
    backgroundColor: Colors.navyDeep,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  footerLogoLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.goldLine,
  },
  footerLogoCenter: {
    alignItems: 'center',
    gap: 4,
  },
  footerLogoMain: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 22,
    color: 'rgba(245,240,230,0.55)',
    letterSpacing: 2,
  },
  footerLogoSub: {
    fontFamily: Fonts.mono,
    fontSize: 6,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  footerRule: {
    height: 0.5,
    backgroundColor: Colors.goldLine,
    marginVertical: 20,
  },
  footerGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  footerCol: {
    flex: 1,
    gap: 4,
  },
  footerColLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerColName: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 20,
    color: Colors.ivory,
    lineHeight: 20,
  },
  footerColItalic: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 14,
    color: Colors.ivory,
    lineHeight: 19,
  },
  footerColDetail: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontWeight: '600',
  },
  footerContact: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});

// ── Notification drawer styles ──────────────────────────────────────────────

const notifStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3,15,9,0.88)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.navyDeep,
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    maxHeight: '85%',
    paddingHorizontal: 0,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 3,
    backgroundColor: Colors.goldLine,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
  },
  title: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.ivory,
    letterSpacing: 2,
  },
  markAll: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  closeBtn: {
    fontFamily: Fonts.jakarta,
    fontSize: 16,
    color: Colors.textMuted,
    paddingLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
  },
  tabActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  tabText: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.navy,
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
  },
  itemUnread: {
    backgroundColor: 'rgba(217,200,150,0.04)',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
    marginTop: 6,
    marginRight: 10,
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemCat: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  itemDate: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textMuted,
  },
  itemTitle: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.ivory,
    marginBottom: 4,
  },
  itemBody: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
