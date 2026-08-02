import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthContext } from '@/context/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import type { Event as SupabaseEvent } from '@/types/database';

// ─── Data ────────────────────────────────────────────────────────────────────

type Speaker = { initials: string; name: string };

type EventItem = {
  id: number;
  uuid?: string;   // Supabase kaydıysa gerçek UUID; count/katılım bununla yönetilir
  max?: number | null;   // kontenjan (null = sınırsız)
  day: number;
  month: string;
  tag: string;
  title: string;
  place: string;
  count: number;
  src: string;
  speakers: Speaker[];
  desc: string;
};

const EVENTS: EventItem[] = [
  {
    id: 1,
    day: 24,
    month: 'TEMMUZ',
    tag: 'SAHA GEZİSİ',
    title: 'İstanbul Fabrika Ziyareti',
    place: 'İstanbul · Beylikdüzü OSB',
    count: 38,
    src: '',
    speakers: [
      { initials: 'AK', name: 'Ahmet Kurt' },
      { initials: 'SY', name: 'Selin Yıldız' },
    ],
    desc: "Beylikdüzü OSB'deki iki büyük üretim tesisinde tam günlük teknik gezi. Dokuma, baskı ve konfeksiyon hatları canlı çalışırken incelenecek.",
  },
  {
    id: 2,
    day: 18,
    month: 'AĞUSTOS',
    tag: 'FUAR',
    title: 'HOMETEX 2027 Fuar Hazırlığı',
    place: 'CNR Expo · İstanbul',
    count: 120,
    src: '',
    speakers: [
      { initials: 'RÖ', name: 'Resul Öden' },
      { initials: 'AY', name: 'Aylin Yıldız' },
    ],
    desc: 'Türkiye ev tekstilinin yıllık vitrinine hazırlık kampı. Genç üyeler için stand tasarımı, yurt dışı alıcı görüşme provaları ve networking programı.',
  },
  {
    id: 3,
    day: 9,
    month: 'EYLÜL',
    tag: 'ÜNİVERSİTE',
    title: 'İTÜ Tasarım Günleri',
    place: 'İTÜ Maçka Kampüsü',
    count: 64,
    src: '',
    speakers: [
      { initials: 'LK', name: 'Prof. Dr. Leyla Karaca' },
      { initials: 'FÖ', name: 'Fatih Özdemir' },
    ],
    desc: 'Tekstil mühendisliği öğrencileri ile workshop, mentorluk ve bitirme projesi sunumları.',
  },
  {
    id: 4,
    day: 16,
    month: 'EKİM',
    tag: 'SAHA GEZİSİ',
    title: 'Bursa Fabrika Ziyareti',
    place: 'Bursa · DEMİRTAŞ OSB',
    count: 42,
    src: '',
    speakers: [{ initials: 'KB', name: 'Kerem Bayraktar' }],
    desc: "Bursa'nın köklü dokuma ve baskı fabrikalarında bir tam gün.",
  },
  {
    id: 5,
    day: 30,
    month: 'TEMMUZ',
    tag: 'TOPLANTI',
    title: 'Yönetim Kurulu Toplantısı',
    place: 'TETSİAD Merkezi · İstanbul',
    count: 22,
    src: '',
    speakers: [{ initials: 'RÖ', name: 'Resul Öden' }],
    desc: 'Genç TETSİAD yönetim kurulu aylık toplantısı.',
  },
];

const MONTHS_TR = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];

function supabaseToEventItem(e: SupabaseEvent, index: number): EventItem {
  const date = new Date(e.starts_at);
  return {
    id:       index + 1,   // liste içi benzersiz key; gerçek kimlik uuid'de
    uuid:     e.id,
    day:      date.getDate(),
    month:    MONTHS_TR[date.getMonth()] ?? '',
    tag:      e.city ?? 'ETKİNLİK',
    title:    e.title,
    place:    [e.location, e.city].filter(Boolean).join(' · ') || '—',
    count:    e.attendee_count ?? 0,
    max:      e.max_attendees,
    src:      e.image_url ?? '',   // görsel yoksa markalı zemin çizilir
    speakers: [],
    desc:     e.description ?? '',
  };
}

const PRESET_REGISTERED = new Set([2, 5]);

// ─── AppHeader ────────────────────────────────────────────────────────────────

function AppHeader({ section, title }: { section: string; title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.headerSection}>{section}</Text>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

// ─── Speaker initials row ─────────────────────────────────────────────────────

function SpeakerRow({ speakers }: { speakers: Speaker[] }) {
  const visible = speakers.slice(0, 3);
  return (
    <View style={styles.speakerRow}>
      {visible.map((s, i) => (
        <View
          key={i}
          style={[styles.speakerBadge, { marginLeft: i === 0 ? 0 : -6 }]}
        >
          <Text style={styles.speakerInitials}>{s.initials}</Text>
        </View>
      ))}
      <Text style={styles.speakerNames}>
        {visible.map((s) => s.name).join(' · ')}
      </Text>
    </View>
  );
}

// ─── RegisterButton ───────────────────────────────────────────────────────────

function RegisterButton({
  registered,
  onToggle,
  liveCount,
  max,
}: {
  registered: boolean;
  onToggle: () => void;
  liveCount: number;
  max?: number | null;
}) {
  const isFull = !registered && max != null && liveCount >= max;
  return (
    <TouchableOpacity
      onPress={isFull ? undefined : onToggle}
      activeOpacity={isFull ? 1 : 0.8}
      style={[styles.regBtn, registered && styles.regBtnActive, isFull && styles.regBtnFull]}
    >
      <Text style={[styles.regBtnText, registered && styles.regBtnTextActive, isFull && styles.regBtnTextFull]}>
        {registered ? '✓ KATILDIM' : isFull ? 'KONTENJAN DOLU' : 'KATIL'}
      </Text>
      <Text style={[styles.regBtnCount, registered && styles.regBtnTextActive, isFull && styles.regBtnTextFull]}>
        {max != null ? `${liveCount}/${max}` : liveCount}
      </Text>
    </TouchableOpacity>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({
  event,
  registered,
  onToggle,
  onPress,
}: {
  event: EventItem;
  registered: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  // Supabase event'inde count DB'den canlı gelir; demo veride lokal +1/-1 uygulanır
  const wasReg = PRESET_REGISTERED.has(event.id);
  const liveCount = event.uuid
    ? event.count
    : registered && !wasReg
    ? event.count + 1
    : !registered && wasReg
    ? event.count - 1
    : event.count;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* Photo */}
      <ImageBackground
        source={event.src ? { uri: event.src } : undefined}
        style={[styles.cardImage, !event.src && styles.cardImagePlaceholder]}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.cardImageOverlay}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{event.tag}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeDay}>{event.day}</Text>
            <Text style={styles.dateBadgeMonth}>{event.month}</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Title */}
        <Text style={styles.cardTitle}>{event.title}</Text>

        {/* Speakers */}
        {event.speakers.length > 0 && (
          <SpeakerRow speakers={event.speakers} />
        )}

        {/* Place + register */}
        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            <Text style={styles.placeText}>{event.place}</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <RegisterButton
              registered={registered}
              onToggle={handleToggle}
              liveCount={liveCount}
              max={event.max}
            />
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── EventDetail ──────────────────────────────────────────────────────────────

function EventDetail({
  event,
  registered,
  onToggle,
  onBack,
}: {
  event: EventItem;
  registered: boolean;
  onToggle: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const wasReg = PRESET_REGISTERED.has(event.id);
  const liveCount = event.uuid
    ? event.count
    : registered && !wasReg
    ? event.count + 1
    : !registered && wasReg
    ? event.count - 1
    : event.count;

  return (
    <View style={styles.detailWrap}>
      {/* Back bar */}
      <View style={[styles.detailTopBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtn}>← TAKVİME DÖN</Text>
        </TouchableOpacity>
        <Text style={styles.detailTag}>{event.tag}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cover */}
        <ImageBackground
          source={event.src ? { uri: event.src } : undefined}
          style={[styles.detailImage, !event.src && styles.cardImagePlaceholder]}
          imageStyle={{ resizeMode: 'cover' }}
        >
          <View style={styles.detailImageOverlay} />
        </ImageBackground>

        {/* Header */}
        <View style={styles.detailHeader}>
          <View style={styles.detailDateCol}>
            <Text style={styles.detailDayLarge}>{event.day}</Text>
            <Text style={styles.detailMonthSmall}>{event.month}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailTagInner}>{event.tag}</Text>
            <Text style={styles.detailTitle}>{event.title}</Text>
            <Text style={styles.detailPlace}>{event.place}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ETKİNLİK DETAYI</Text>
          <Text style={styles.descText}>{event.desc}</Text>
        </View>

        {/* Speakers */}
        {event.speakers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>KONUŞMACILAR</Text>
            {event.speakers.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.speakerListRow,
                  i > 0 && styles.speakerListRowBorder,
                ]}
              >
                <View style={styles.speakerAvatarLg}>
                  <Text style={styles.speakerAvatarText}>{s.initials}</Text>
                </View>
                <Text style={styles.speakerFullName}>{s.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KATILIMCILAR</Text>
          <View style={styles.attendeeRow}>
            <Text style={styles.attendeeCount}>{liveCount}</Text>
            <Text style={styles.attendeeLabel}>
              {event.max != null ? `/ ${event.max} KONTENJAN` : 'KAYITLI KATILIMCI'}
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          {registered ? (
            <View>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>✓ KATILIM ONAYLANDI</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onToggle}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>KATILIMI İPTAL ET</Text>
              </TouchableOpacity>
            </View>
          ) : event.max != null && liveCount >= event.max ? (
            <View style={[styles.joinBtn, styles.joinBtnFull]}>
              <Text style={[styles.joinBtnText, { color: 'rgba(224,96,96,0.9)' }]}>
                KONTENJAN DOLU
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={onToggle}
              activeOpacity={0.8}
            >
              <Text style={styles.joinBtnText}>KATIL → ÜCRETSİZ</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── CalendarScreen ───────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { registeredEvents, toggleEvent } = useAppContext();
  const { session } = useAuthContext();
  const { events: supabaseEvents, toggleAttendance, refetch } = useEvents(session?.user.id);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const displayEvents: EventItem[] = supabaseEvents.length > 0
    ? supabaseEvents.map(supabaseToEventItem)
    : EVENTS;

  const isRegistered = (event: EventItem): boolean => {
    if (event.uuid) {
      return supabaseEvents.find((e) => e.id === event.uuid)?.is_attending ?? false;
    }
    return registeredEvents.has(event.id);
  };

  const handleToggle = async (event: EventItem) => {
    if (event.uuid) {
      const res = await toggleAttendance(event.uuid);
      if (res.full) {
        Alert.alert(
          'Kontenjan Doldu',
          'Bu etkinliğin kontenjanı bu sırada doldu. Katılım kaydı oluşturulamadı.'
        );
      }
    } else {
      toggleEvent(event.id);
    }
  };

  const attendanceCount = supabaseEvents.length > 0
    ? supabaseEvents.filter((e) => e.is_attending).length
    : registeredEvents.size;

  if (selectedEvent) {
    // Snapshot yerine güncel listeden oku ki katılım sonrası sayaç canlı kalsın
    const liveSelected = displayEvents.find((e) =>
      selectedEvent.uuid ? e.uuid === selectedEvent.uuid : e.id === selectedEvent.id
    ) ?? selectedEvent;
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <EventDetail
          event={liveSelected}
          registered={isRegistered(liveSelected)}
          onToggle={() => handleToggle(liveSelected)}
          onBack={() => setSelectedEvent(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader section="TAKVİM" title="Etkinlikler & katılım." />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} progressBackgroundColor={Colors.navyDeep} />
        }
      >
        {/* Year + stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.statsYear}>2026</Text>
          <Text style={styles.statsInfo}>
            <Text style={styles.goldNum}>{displayEvents.length}</Text>
            {' ETKİNLİK · '}
            <Text style={styles.goldNum}>{attendanceCount}</Text>
            {' KATILIM'}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.goldDivider} />

        {/* Event cards */}
        {displayEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            registered={isRegistered(event)}
            onToggle={() => handleToggle(event)}
            onPress={() => setSelectedEvent(event)}
          />
        ))}

        {/* Footer */}
        <View style={styles.listFooter}>
          <Text style={styles.footerText}>
            {'12 AYDA '}
            <Text style={{ color: Colors.gold }}>{displayEvents.length} ETKİNLİK</Text>
            {' · GENÇ TETSİAD 2026'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },

  // Header
  headerWrap: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    backgroundColor: Colors.navyDeep,
  },
  headerSection: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 3,
    color: Colors.gold,
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 30,
    color: Colors.ivory,
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 34,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statsYear: {
    fontFamily: Fonts.cormorant,
    fontSize: 38,
    color: Colors.gold,
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 40,
  },
  statsInfo: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  goldNum: {
    color: Colors.gold,
  },
  goldDivider: {
    height: 0.5,
    backgroundColor: Colors.goldLine,
    marginHorizontal: 0,
  },

  // List
  listContent: {
    paddingBottom: 32,
  },

  // Event card
  card: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    backgroundColor: Colors.navy,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImageStyle: {
    resizeMode: 'cover',
  },
  // Görseli olmayan etkinlikler için markalı zemin — daha önce
  // picsum.photos'tan rastgele yabancı fotoğraflar çekiliyordu.
  cardImagePlaceholder: {
    backgroundColor: Colors.navyMid,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
  },
  cardImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,15,9,0.35)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 14,
  },
  tagBadge: {
    backgroundColor: 'rgba(3,15,9,0.75)',
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.gold,
  },
  dateBadge: {
    alignItems: 'center',
    backgroundColor: Colors.navyDeep,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateBadgeDay: {
    fontFamily: Fonts.cormorant,
    fontSize: 22,
    color: Colors.gold,
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 24,
  },
  dateBadgeMonth: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginTop: 1,
  },
  cardBody: {
    padding: 16,
    paddingBottom: 14,
  },
  cardTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 20,
    color: Colors.ivory,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 10,
  },

  // Speaker row
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  speakerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: Colors.navyMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerInitials: {
    fontFamily: Fonts.cormorant,
    fontSize: 9,
    color: Colors.gold,
    fontWeight: '600',
  },
  speakerNames: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginLeft: 10,
    flex: 1,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    flex: 1,
    marginRight: 12,
  },
  placeText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
  },

  // Register button
  regBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'transparent',
  },
  regBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  regBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.gold,
    fontWeight: '700',
  },
  regBtnTextActive: {
    color: Colors.navy,
  },
  regBtnFull: {
    borderColor: 'rgba(224,96,96,0.45)',
    backgroundColor: 'transparent',
  },
  regBtnTextFull: {
    color: 'rgba(224,96,96,0.8)',
  },
  regBtnCount: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.gold,
    letterSpacing: 0.5,
  },

  // List footer
  listFooter: {
    padding: 36,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    marginTop: 4,
  },
  footerText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
  },

  // Detail screen
  detailWrap: {
    flex: 1,
    backgroundColor: Colors.navyDeep,
  },
  detailTopBar: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    backgroundColor: Colors.navyDeep,
  },
  backBtn: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.gold,
  },
  detailTag: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  detailImage: {
    width: '100%',
    height: 220,
  },
  detailImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,15,9,0.3)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 22,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    gap: 16,
  },
  detailDateCol: {
    minWidth: 52,
    alignItems: 'center',
    paddingTop: 4,
  },
  detailDayLarge: {
    fontFamily: Fonts.cormorant,
    fontSize: 44,
    color: Colors.gold,
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 46,
  },
  detailMonthSmall: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginTop: 4,
  },
  detailDivider: {
    width: 0.5,
    alignSelf: 'stretch',
    backgroundColor: Colors.goldLine,
  },
  detailTagInner: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.gold,
    marginBottom: 8,
  },
  detailTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 24,
    color: Colors.ivory,
    fontWeight: '500',
    lineHeight: 28,
  },
  detailPlace: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
    marginTop: 10,
  },

  // Sections
  section: {
    padding: 22,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.gold,
    marginBottom: 14,
  },
  descText: {
    fontFamily: Fonts.jakarta,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
    fontWeight: '300',
  },

  // Speakers list in detail
  speakerListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  speakerListRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
  },
  speakerAvatarLg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: Colors.navyMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerAvatarText: {
    fontFamily: Fonts.cormorant,
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '600',
  },
  speakerFullName: {
    fontFamily: Fonts.cormorant,
    fontSize: 17,
    color: Colors.ivory,
    fontWeight: '500',
  },

  // Attendees
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  attendeeCount: {
    fontFamily: Fonts.cormorant,
    fontSize: 40,
    color: Colors.gold,
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 44,
  },
  attendeeLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },

  // CTA section
  ctaSection: {
    padding: 24,
    paddingBottom: 32,
  },
  confirmedBadge: {
    padding: 14,
    marginBottom: 14,
    backgroundColor: 'rgba(217,200,150,0.10)',
    borderWidth: 0.5,
    borderColor: Colors.gold,
    alignItems: 'center',
  },
  confirmedText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.gold,
    fontWeight: '700',
  },
  cancelBtn: {
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinBtnFull: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(224,96,96,0.45)',
  },
  joinBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.navy,
    fontWeight: '700',
  },
});
