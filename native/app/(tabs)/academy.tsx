import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/theme';
import { useToast } from '@/components/Toast';
import { useAppContext } from '@/context/AppContext';
import { useAuthContext } from '@/context/AuthContext';
import { useCourses } from '@/hooks/useCourses';
import { useMembers } from '@/hooks/useMembers';
import { supabase } from '@/lib/supabase';
import type { Course as SupabaseCourse, CourseLevel } from '@/types/database';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Program = {
  id: string;
  title: string;
  desc: string;
  tag: string;
  duration: string;
  quota: number | null;
};

type Course = {
  id: number;
  title: string;
  tag: string;
  level: string;
  duration: string;
  progress: number;
};

type Mentor = {
  id: number;
  dbId?: string;    // UUID from profiles table (null for fallback data)
  name: string;
  title: string;
  firm: string;
  expertise: string;
  initials: string;
};

const PROGRAMS: Program[] = [
  {
    id: '3T',
    title: '3T Programı',
    desc: 'Türkiye Tekstil Temsilcileri — yıllık liderlik ve temsil programı. Seçilen 12 üye ulusal ve uluslararası platformlarda sektörü temsil eder.',
    tag: 'LİDERLİK',
    duration: '12 AY',
    quota: 12,
  },
  {
    id: 'TBA',
    title: 'TBA — Tekstil Büyükelçileri',
    desc: 'Uluslararası fuar ve konferanslarda Türkiye ev tekstilini temsil eden genç büyükelçiler programı.',
    tag: 'ULUSLARARASI',
    duration: '6 AY',
    quota: 8,
  },
  {
    id: 'AM',
    title: 'Altın Mekik',
    desc: 'Üretim, tasarım ve ihracat alanında olağanüstü başarı gösteren genç üyelere verilen prestij ödülü ve burs.',
    tag: 'ÖDÜL & BURS',
    duration: 'YIL SONU',
    quota: 3,
  },
  {
    id: 'UTGIK',
    title: 'UTGİK',
    desc: 'Uluslararası Tekstil Girişimcilik İnovasyonu Komitesi — AB ve global tekstil trendlerini takip eden araştırma ve rapor programı.',
    tag: 'ARAŞTIRMA',
    duration: 'SÜREKLİ',
    quota: null,
  },
];

const COURSES: Course[] = [
  { id: 1, title: 'İhracat Temelleri', tag: 'İHRACAT', level: 'BAŞLANGIÇ', duration: '8 SAAT', progress: 72 },
  { id: 2, title: 'Sürdürülebilir Tedarik Zinciri', tag: 'SÜRDÜRÜLEBİLİRLİK', level: 'ORTA', duration: '12 SAAT', progress: 45 },
  { id: 3, title: 'Marka İnşası & Konumlandırma', tag: 'MARKA', level: 'ORTA', duration: '10 SAAT', progress: 0 },
  { id: 4, title: 'Dijital Pazarlama & E-Ticaret', tag: 'DİJİTAL', level: 'BAŞLANGIÇ', duration: '6 SAAT', progress: 88 },
  { id: 5, title: 'Tekstil Kalite Standartları', tag: 'KALİTE', level: 'İLERİ', duration: '16 SAAT', progress: 0 },
  { id: 6, title: 'AB Direktifleri & Uyum', tag: 'YEŞİL', level: 'ORTA', duration: '8 SAAT', progress: 20 },
];

const MENTORS: Mentor[] = [
  { id: 1, name: 'Ahmet Yılmaz', title: 'CEO', firm: 'ATLAS TEKSTİL', expertise: 'İhracat & AB Pazarları', initials: 'AY' },
  { id: 2, name: 'Selin Çelik', title: 'Genel Müdür', firm: 'ÖZGÜR HOME', expertise: 'Sürdürülebilir Üretim', initials: 'SÇ' },
  { id: 3, name: 'Murat Demir', title: 'Kurucu', firm: 'DEMIR DESIGN', expertise: 'Marka ve Tasarım', initials: 'MD' },
  { id: 4, name: 'Fatma Kara', title: 'İhracat Direktörü', firm: 'KARA TEKSTİL', expertise: 'Uluslararası Ticaret', initials: 'FK' },
];

const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner:     'BAŞLANGIÇ',
  intermediate: 'ORTA',
  advanced:     'İLERİ',
};

function supabaseToCourse(c: SupabaseCourse): Course {
  return {
    id:       parseInt(c.id, 10) || 0,
    title:    c.title,
    tag:      'EĞİTİM',
    level:    LEVEL_LABELS[c.level ?? 'beginner'],
    duration: c.duration_hours ? `${c.duration_hours} SAAT` : '—',
    progress: c.enrollment?.progress ?? 0,
  };
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── AppHeader ─────────────────────────────────────────────────────────────────

function AppHeader({ section, title }: { section: string; title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.headerSection}>{section}</Text>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

// ─── PillSelector tabs ─────────────────────────────────────────────────────────

type Tab = 'PROGRAMLAR' | 'KURSLAR' | 'MENTÖRLER';

function TabSelector({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = ['PROGRAMLAR', 'KURSLAR', 'MENTÖRLER'];
  return (
    <View style={styles.tabRow}>
      {tabs.map((t) => (
        <TouchableOpacity
          key={t}
          style={[styles.tabItem, active === t && styles.tabItemActive]}
          onPress={() => onChange(t)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, active === t && styles.tabLabelActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── ProgramCard ───────────────────────────────────────────────────────────────

function ProgramCard({ program }: { program: Program }) {
  return (
    <View style={styles.programCard}>
      {/* Tag badge */}
      <View style={styles.programTagBadge}>
        <Text style={styles.programTagText}>{program.tag}</Text>
      </View>

      {/* Title */}
      <Text style={styles.programTitle}>{program.title}</Text>

      {/* Desc */}
      <Text style={styles.programDesc}>{program.desc}</Text>

      {/* Meta row */}
      <View style={styles.programMeta}>
        <View style={styles.programMetaItem}>
          <Text style={styles.programMetaLabel}>SÜRE</Text>
          <Text style={styles.programMetaValue}>{program.duration}</Text>
        </View>
        <View style={styles.programMetaDivider} />
        <View style={styles.programMetaItem}>
          <Text style={styles.programMetaLabel}>KONTENJAN</Text>
          <Text style={styles.programMetaValue}>
            {program.quota !== null ? String(program.quota) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── CourseCard (with animated progress bar) ──────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: course.progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [course.progress]);

  const status =
    course.progress >= 100
      ? 'TAMAMLANDI'
      : course.progress > 0
      ? 'DEVAM EDİYOR'
      : 'BAŞLAMADI';

  const levelColor =
    course.level === 'BAŞLANGIÇ'
      ? Colors.gold
      : course.level === 'ORTA'
      ? 'rgba(217,200,150,0.70)'
      : 'rgba(217,200,150,0.45)';

  return (
    <View style={styles.courseCard}>
      {/* Tag */}
      <Text style={styles.courseTag}>{course.tag}</Text>

      {/* Title */}
      <Text style={styles.courseTitle}>{course.title}</Text>

      {/* Level badge */}
      <View style={styles.courseLevelRow}>
        <View style={[styles.courseLevelBadge]}>
          <Text style={[styles.courseLevelText, { color: levelColor }]}>{course.level}</Text>
        </View>
        <Text style={styles.courseDuration}>{course.duration}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.courseBarTrack}>
        <Animated.View
          style={[
            styles.courseBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: course.progress >= 100 ? Colors.gold : Colors.gold,
              opacity: course.progress >= 100 ? 1 : 0.85,
            },
          ]}
        />
      </View>

      {/* Progress label */}
      <View style={styles.courseProgressRow}>
        <Text style={styles.courseStatus}>{status}</Text>
        <Text style={styles.coursePercent}>{course.progress}%</Text>
      </View>
    </View>
  );
}

// ─── MentorApplyModal ─────────────────────────────────────────────────────────

function MentorApplyModal({
  mentor,
  userId,
  onClose,
  onSent,
}: {
  mentor: Mentor;
  userId?: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setErrorMsg('');

    if (mentor.dbId && userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('mentorship_requests')
        .insert({ mentee_id: userId, mentor_id: mentor.dbId, message: message.trim() });
      if (error) {
        setSending(false);
        if (error.code === '23505') {
          setErrorMsg('Bu mentor için zaten başvuruda bulundunuz.');
        } else {
          setErrorMsg('Başvuru gönderilemedi. Tekrar deneyin.');
        }
        return;
      }
    }

    setSent(true);
    setSending(false);
    setTimeout(() => { onSent(); onClose(); }, 1500);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{mentor.name}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            {mentor.title} · {mentor.firm}
          </Text>
          <Text style={styles.modalExpertise}>{mentor.expertise}</Text>

          <View style={styles.modalDivider} />

          {sent ? (
            <View style={styles.sentWrap}>
              <Text style={styles.sentIcon}>✓</Text>
              <Text style={styles.sentText}>Değerlendirmeye alındı</Text>
            </View>
          ) : (
            <>
              {/* Message input */}
              <Text style={styles.modalInputLabel}>MESAJINIZ</Text>
              <TextInput
                style={styles.modalInput}
                value={message}
                onChangeText={(t) => setMessage(t.slice(0, 300))}
                placeholder="Neden bu mentorluk programına başvuruyorsunuz? Hedeflerinizi kısaca anlatın..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <View style={styles.charCountRow}>
                <Text style={[styles.charCount, message.length >= 280 && styles.charCountWarn]}>
                  {message.length}
                </Text>
                <Text style={styles.charTotal}> / 300</Text>
              </View>

              {/* Submit button */}
              {errorMsg ? (
                <View style={{ marginBottom: 10, padding: 10, borderWidth: 0.5, borderColor: 'rgba(229,115,115,0.5)' }}>
                  <Text style={{ fontFamily: Fonts.jakarta, fontSize: 10, color: '#e57373' }}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.modalSubmitBtn, (!message.trim() || sending) && styles.modalSubmitBtnDisabled]}
                onPress={handleSend}
                activeOpacity={0.8}
              >
                {sending
                  ? <ActivityIndicator color={Colors.navyDeep} size="small" />
                  : <Text style={[styles.modalSubmitText, (!message.trim() || sending) && styles.modalSubmitTextDisabled]}>GÖNDER</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── MentorCard ───────────────────────────────────────────────────────────────

function MentorCard({
  mentor,
  pending,
  onApply,
}: {
  mentor: Mentor;
  pending: boolean;
  onApply: () => void;
}) {
  return (
    <View style={[styles.mentorCard, pending && styles.mentorCardPending]}>
      {/* Avatar + info */}
      <View style={styles.mentorTop}>
        <View style={styles.mentorAvatar}>
          <Text style={styles.mentorAvatarText}>{mentor.initials}</Text>
        </View>
        <View style={styles.mentorInfo}>
          <Text style={styles.mentorLabel}>MENTÖR</Text>
          <Text style={styles.mentorName}>{mentor.name}</Text>
          <Text style={styles.mentorTitle}>{mentor.title}</Text>
          <Text style={styles.mentorFirm}>{mentor.firm}</Text>
        </View>
        {pending && (
          <View style={styles.mentorPendingBadge}>
            <Text style={styles.mentorPendingText}>BAŞVURULDU</Text>
          </View>
        )}
      </View>

      {/* Expertise tag */}
      <View style={styles.mentorExpertiseRow}>
        <View style={styles.mentorExpertisePill}>
          <Text style={styles.mentorExpertiseText}>{mentor.expertise}</Text>
        </View>
      </View>

      {/* Apply button */}
      <TouchableOpacity
        style={[styles.applyBtn, pending && styles.applyBtnPending]}
        onPress={pending ? undefined : onApply}
        activeOpacity={pending ? 1 : 0.8}
      >
        <Text style={[styles.applyBtnText, pending && styles.applyBtnTextPending]}>
          {pending ? '✓ Değerlendirmeye alındı' : 'BAŞVUR'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── PROGRAMLAR tab ───────────────────────────────────────────────────────────

function ProgramsTab() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      <Text style={styles.tabIntro}>
        Genç TETSİAD üyelerine özel 4 gelişim ve temsil programı.
      </Text>
      {PROGRAMS.map((p) => (
        <ProgramCard key={p.id} program={p} />
      ))}
      <View style={styles.tabFooter}>
        <Text style={styles.tabFooterText}>
          {'04 PROGRAM · '}
          <Text style={{ color: Colors.gold }}>3T · TBA · ALTIN MEKİK · UTGİK</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── KURSLAR tab ──────────────────────────────────────────────────────────────

function CoursesTab() {
  const { session } = useAuthContext();
  const { courses: supabaseCourses } = useCourses(session?.user.id);
  const displayCourses = supabaseCourses.length > 0
    ? supabaseCourses.map((c, i) => ({ ...supabaseToCourse(c), id: i + 1 }))
    : COURSES;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      <View style={styles.coursesGrid}>
        {displayCourses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </View>
      <View style={styles.tabFooter}>
        <Text style={styles.tabFooterText}>
          {`${String(displayCourses.length).padStart(2, '0')} KATEGORİ · TÜM ÜYELERE `}
          <Text style={{ color: Colors.gold }}>ÜCRETSİZ</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── MENTÖRLER tab ────────────────────────────────────────────────────────────

function MentorsTab() {
  const { mentorRequests, addMentorRequest } = useAppContext();
  const { session } = useAuthContext();
  const { mentors: supabaseMentors } = useMembers();
  const [modalMentor, setModalMentor] = useState<Mentor | null>(null);
  const { show: showToast, ToastComponent } = useToast();

  const displayMentors: Mentor[] = supabaseMentors.length > 0
    ? supabaseMentors.map((p, i) => ({
        id:        i + 1,
        dbId:      p.id,
        name:      p.full_name,
        title:     p.position ?? p.role,
        firm:      p.company ?? '—',
        expertise: p.mentor_bio ?? p.sector ?? '—',
        initials:  initials(p.full_name),
      }))
    : MENTORS;

  const handleSent = () => {
    if (modalMentor) {
      if (modalMentor.dbId) addMentorRequest(modalMentor.dbId);
      showToast(`${modalMentor.name} için başvuru gönderildi`, 'success');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tabContent}
      >
        {displayMentors.map((m) => (
          <MentorCard
            key={m.id}
            mentor={m}
            pending={!!(m.dbId && mentorRequests.has(m.dbId))}
            onApply={() => setModalMentor(m)}
          />
        ))}
        <View style={styles.tabFooter}>
          <Text style={styles.tabFooterText}>
            {'BAŞVURU SONRASI KOMİSYON '}
            <Text style={{ color: Colors.gold }}>EŞLEŞTİRME</Text>
            {' YAPAR'}
          </Text>
        </View>
      </ScrollView>

      {modalMentor && (
        <MentorApplyModal
          key={modalMentor.id}
          mentor={modalMentor}
          userId={session?.user?.id}
          onClose={() => setModalMentor(null)}
          onSent={handleSent}
        />
      )}
      {ToastComponent}
    </View>
  );
}

// ─── AcademyScreen ────────────────────────────────────────────────────────────

export default function AcademyScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('PROGRAMLAR');

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader section="AKADEMİ" title="Eğitim, mentorluk & programlar." />
      <TabSelector active={activeTab} onChange={setActiveTab} />

      <View style={styles.tabBody}>
        {activeTab === 'PROGRAMLAR' && <ProgramsTab />}
        {activeTab === 'KURSLAR' && <CoursesTab />}
        {activeTab === 'MENTÖRLER' && <MentorsTab />}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },

  // ── Header ──────────────────────────────────────────────
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
    fontSize: 28,
    color: Colors.ivory,
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 33,
  },

  // ── Tab selector ─────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    backgroundColor: Colors.navyDeep,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.gold,
  },
  tabLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.gold,
  },

  // ── Tab body ─────────────────────────────────────────────
  tabBody: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 40,
  },
  tabIntro: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    fontWeight: '300',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  tabFooter: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    marginTop: 8,
  },
  tabFooterText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
  },

  // ── Program cards ────────────────────────────────────────
  programCard: {
    marginHorizontal: 24,
    marginTop: 20,
    padding: 18,
    backgroundColor: Colors.navyMid,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
  },
  programTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: Colors.gold,
    backgroundColor: 'rgba(217,200,150,0.10)',
    marginBottom: 14,
  },
  programTagText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.gold,
    fontWeight: '500',
  },
  programTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 22,
    color: Colors.ivory,
    fontWeight: '500',
    lineHeight: 26,
    marginBottom: 10,
  },
  programDesc: {
    fontFamily: Fonts.jakarta,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 19,
    fontWeight: '300',
    marginBottom: 16,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    paddingTop: 14,
    gap: 0,
  },
  programMetaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  programMetaDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: Colors.goldLine,
    marginHorizontal: 8,
  },
  programMetaLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },
  programMetaValue: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.gold,
    fontWeight: '500',
  },

  // ── Courses grid ─────────────────────────────────────────
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  courseCard: {
    width: '47%',
    backgroundColor: Colors.navyMid,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    padding: 14,
  },
  courseTag: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.gold,
    marginBottom: 8,
  },
  courseTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 16,
    color: Colors.ivory,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 10,
    minHeight: 40,
  },
  courseLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  courseLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
  },
  courseLevelText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1,
  },
  courseDuration: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  courseBarTrack: {
    height: 2,
    backgroundColor: 'rgba(217,200,150,0.12)',
    marginBottom: 6,
    overflow: 'hidden',
  },
  courseBarFill: {
    height: '100%',
  },
  courseProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseStatus: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  coursePercent: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.5,
    color: Colors.gold,
  },

  // ── Mentor cards ─────────────────────────────────────────
  mentorCard: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 18,
    backgroundColor: Colors.navyMid,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
  },
  mentorCardPending: {
    borderColor: Colors.gold,
  },
  mentorTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: Colors.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorAvatarText: {
    fontFamily: Fonts.cormorant,
    fontSize: 15,
    color: Colors.gold,
    fontWeight: '600',
  },
  mentorInfo: {
    flex: 1,
    gap: 2,
  },
  mentorLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  mentorName: {
    fontFamily: Fonts.cormorant,
    fontSize: 20,
    color: Colors.ivory,
    fontWeight: '500',
    lineHeight: 22,
  },
  mentorTitle: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.gold,
    marginTop: 2,
  },
  mentorFirm: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
    marginTop: 1,
  },
  mentorPendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.gold,
  },
  mentorPendingText: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.navy,
    fontWeight: '700',
  },
  mentorExpertiseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  mentorExpertisePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
  },
  mentorExpertiseText: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  applyBtn: {
    borderWidth: 0.5,
    borderColor: Colors.gold,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnPending: {
    borderColor: Colors.goldLine,
    backgroundColor: 'rgba(217,200,150,0.06)',
  },
  applyBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.gold,
    fontWeight: '700',
  },
  applyBtnTextPending: {
    color: Colors.textMuted,
    fontWeight: '400',
  },

  // ── Mentor modal ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,15,9,0.85)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.navyDeep,
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    borderLeftWidth: 0.5,
    borderLeftColor: Colors.goldLine,
    borderRightWidth: 0.5,
    borderRightColor: Colors.goldLine,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 26,
    color: Colors.ivory,
    fontWeight: '500',
    lineHeight: 30,
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
    marginLeft: 12,
  },
  modalCloseText: {
    fontFamily: Fonts.jakarta,
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.gold,
    marginBottom: 4,
  },
  modalExpertise: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  modalDivider: {
    height: 0.5,
    backgroundColor: Colors.goldLine,
    marginVertical: 18,
  },
  modalInputLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    backgroundColor: 'transparent',
    padding: 12,
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 15,
    color: Colors.ivory,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    marginBottom: 18,
  },
  charCount: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textMuted,
  },
  charCountWarn: {
    color: Colors.gold,
  },
  charTotal: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.textMuted,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitBtnDisabled: {
    backgroundColor: 'rgba(217,200,150,0.15)',
  },
  modalSubmitText: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    letterSpacing: 2.5,
    color: Colors.navy,
    fontWeight: '700',
  },
  modalSubmitTextDisabled: {
    color: Colors.textMuted,
  },
  sentWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  sentIcon: {
    fontFamily: Fonts.cormorant,
    fontSize: 36,
    color: Colors.gold,
    lineHeight: 40,
  },
  sentText: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontSize: 18,
    color: Colors.ivory,
    lineHeight: 24,
  },
});
