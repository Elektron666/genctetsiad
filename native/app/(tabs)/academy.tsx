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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/theme';
import { useToast } from '@/components/Toast';
import { useAppContext } from '@/context/AppContext';
import { useAuthContext } from '@/context/AuthContext';
import { useCourses } from '@/hooks/useCourses';
import { useMembers } from '@/hooks/useMembers';
import { supabase } from '@/lib/supabase';
import { BulletinTab } from '@/components/BulletinTab';
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
  uuid?: string;   // Supabase kaydıysa gerçek UUID
  title: string;
  tag: string;
  level: string;
  duration: string;
  progress: number;
  enrolled?: boolean;
};

type Mentor = {
  id: number;
  uuid?: string;   // Supabase profil UUID'si; başvuru DB'ye bununla yazılır
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

// Sunum verisi — yayında gösterilmez. Daha önce Supabase boş dönerse
// üye, hiç kaydolmadığı 6 kursu "%72 tamamlandı" gibi görüyordu.
const DEMO_COURSES: Course[] = [
  { id: 1, title: 'İhracat Temelleri', tag: 'İHRACAT', level: 'BAŞLANGIÇ', duration: '8 SAAT', progress: 72 },
  { id: 2, title: 'Sürdürülebilir Tedarik Zinciri', tag: 'SÜRDÜRÜLEBİLİRLİK', level: 'ORTA', duration: '12 SAAT', progress: 45 },
  { id: 3, title: 'Marka İnşası & Konumlandırma', tag: 'MARKA', level: 'ORTA', duration: '10 SAAT', progress: 0 },
  { id: 4, title: 'Dijital Pazarlama & E-Ticaret', tag: 'DİJİTAL', level: 'BAŞLANGIÇ', duration: '6 SAAT', progress: 88 },
  { id: 5, title: 'Tekstil Kalite Standartları', tag: 'KALİTE', level: 'İLERİ', duration: '16 SAAT', progress: 0 },
  { id: 6, title: 'AB Direktifleri & Uyum', tag: 'YEŞİL', level: 'ORTA', duration: '8 SAAT', progress: 20 },
];

const COURSES: Course[] = __DEV__ ? DEMO_COURSES : [];

// Sunum verisi — yayında gösterilmez. Daha önce bu 4 uydurma mentora
// "BAŞVUR" denebiliyor ve var olmayan kişi için başarı bildirimi
// gösteriliyordu; hiçbir kayıt oluşmuyordu.
const DEMO_MENTORS: Mentor[] = [
  { id: 1, name: 'Ahmet Yılmaz', title: 'CEO', firm: 'ATLAS TEKSTİL', expertise: 'İhracat & AB Pazarları', initials: 'AY' },
  { id: 2, name: 'Selin Çelik', title: 'Genel Müdür', firm: 'ÖZGÜR HOME', expertise: 'Sürdürülebilir Üretim', initials: 'SÇ' },
  { id: 3, name: 'Murat Demir', title: 'Kurucu', firm: 'DEMIR DESIGN', expertise: 'Marka ve Tasarım', initials: 'MD' },
  { id: 4, name: 'Fatma Kara', title: 'İhracat Direktörü', firm: 'KARA TEKSTİL', expertise: 'Uluslararası Ticaret', initials: 'FK' },
];

const MENTORS: Mentor[] = __DEV__ ? DEMO_MENTORS : [];

const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner:     'BAŞLANGIÇ',
  intermediate: 'ORTA',
  advanced:     'İLERİ',
};

function supabaseToCourse(c: SupabaseCourse, index: number): Course {
  return {
    id:       index + 1,   // liste içi benzersiz key; gerçek kimlik uuid'de
    uuid:     c.id,
    title:    c.title,
    tag:      c.instructor ?? 'EĞİTİM',
    level:    LEVEL_LABELS[c.level ?? 'beginner'],
    duration: c.duration_hours ? `${c.duration_hours} SAAT` : '—',
    progress: c.enrollment?.progress ?? 0,
    enrolled: !!c.enrollment,
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

type Tab = 'PROGRAMLAR' | 'KURSLAR' | 'MENTÖRLER' | 'BÜLTEN';

function TabSelector({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = ['PROGRAMLAR', 'KURSLAR', 'MENTÖRLER', 'BÜLTEN'];
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

function CourseCard({ course, onEnroll }: { course: Course; onEnroll?: () => void }) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: course.progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [course.progress]);

  // Supabase kursu: kayıtlı değilse durum 'KAYIT AÇIK'; demo kurslarda eski davranış
  const status =
    course.uuid && !course.enrolled
      ? 'KAYIT AÇIK'
      : course.progress >= 100
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

      {/* Enroll CTA — sadece kayıt olunmamış Supabase kurslarında */}
      {onEnroll && (
        <TouchableOpacity style={styles.courseEnrollBtn} onPress={onEnroll} activeOpacity={0.8}>
          <Text style={styles.courseEnrollText}>KAYIT OL →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── MentorApplyModal ─────────────────────────────────────────────────────────

function MentorApplyModal({
  mentor,
  onClose,
  onSent,
}: {
  mentor: Mentor;
  onClose: () => void;
  onSent: (message: string) => Promise<boolean>;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const ok = await onSent(message.trim());
    setSending(false);
    if (!ok) {
      onClose();
      return;
    }
    setSent(true);
    setTimeout(onClose, 1500);
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
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (!message.trim() || sending) && styles.modalSubmitBtnDisabled]}
                onPress={handleSend}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSubmitText, (!message.trim() || sending) && styles.modalSubmitTextDisabled]}>
                  GÖNDER
                </Text>
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
  statusText,
  onApply,
}: {
  mentor: Mentor;
  pending: boolean;
  statusText?: string;
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
          {pending ? (statusText ?? '✓ Değerlendirmeye alındı') : 'BAŞVUR'}
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
  const { courses: supabaseCourses, loading, error, enroll } = useCourses(session?.user.id);
  const { show: showToast, ToastComponent } = useToast();

  const displayCourses = supabaseCourses.length > 0
    ? supabaseCourses.map(supabaseToCourse)
    : COURSES;

  const handleEnroll = async (course: Course) => {
    if (!course.uuid) return;
    // Daha önce hata yutuluyordu ve başarı bildirimi KOŞULSUZ
    // gösteriliyordu: kayıt oluşmasa da üye kaydolduğunu sanıyordu.
    const { error } = await enroll(course.uuid);
    if (error) {
      showToast('Kayıt oluşturulamadı. Üyeliğiniz onaylı mı?', 'error');
      return;
    }
    showToast(`"${course.title}" kursuna kaydoldunuz`, 'success');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tabContent}
      >
        {displayCourses.length === 0 && (
          <Text style={styles.tabIntro}>
            {loading ? 'Yükleniyor...' : error
              ? 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.'
              : 'Eğitim kataloğu hazırlanıyor. Yeni kurslar eklendiğinde bildirim alacaksınız.'}
          </Text>
        )}
        <View style={styles.coursesGrid}>
          {displayCourses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onEnroll={c.uuid && !c.enrolled && session?.user ? () => handleEnroll(c) : undefined}
            />
          ))}
        </View>
        <View style={styles.tabFooter}>
          <Text style={styles.tabFooterText}>
            {`${String(displayCourses.length).padStart(2, '0')} KATEGORİ · TÜM ÜYELERE `}
            <Text style={{ color: Colors.gold }}>ÜCRETSİZ</Text>
          </Text>
        </View>
      </ScrollView>
      {ToastComponent}
    </View>
  );
}

// ─── Mentor gelen kutusu (yalnızca is_mentor kullanıcılara görünür) ──────────

type InboxRequest = {
  id: string;
  mentee_id: string;
  message: string | null;
  menteeName: string;
  menteeFirm: string;
};

function MentorInbox({ onResponded }: { onResponded: (name: string, accepted: boolean) => void }) {
  const { session } = useAuthContext();
  const [requests, setRequests] = useState<InboxRequest[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('mentorship_requests')
        .select('id, mentee_id, message')
        .eq('mentor_id', session.user.id)
        .eq('status', 'pending');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data ?? []) as any[];
      if (cancelled || rows.length === 0) return;

      const menteeIds = rows.map(r => r.mentee_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, company').in('id', menteeIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pMap = new Map(((profiles ?? []) as any[]).map(p => [p.id, p]));

      if (!cancelled) {
        setRequests(rows.map(r => ({
          id: r.id,
          mentee_id: r.mentee_id,
          message: r.message,
          menteeName: pMap.get(r.mentee_id)?.full_name ?? 'Üye',
          menteeFirm: pMap.get(r.mentee_id)?.company ?? '—',
        })));
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = async (req: InboxRequest, accepted: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('mentorship_requests')
      .update({ status: accepted ? 'accepted' : 'rejected' })
      .eq('id', req.id);
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== req.id));
      onResponded(req.menteeName, accepted);
    }
  };

  if (requests.length === 0) return null;

  return (
    <View style={styles.inboxWrap}>
      <Text style={styles.inboxHeader}>◆ GELEN MENTORLUK BAŞVURULARI ({requests.length})</Text>
      {requests.map(req => (
        <View key={req.id} style={styles.inboxCard}>
          <Text style={styles.inboxName}>{req.menteeName}</Text>
          <Text style={styles.inboxFirm}>{req.menteeFirm}</Text>
          {!!req.message && <Text style={styles.inboxMsg}>"{req.message}"</Text>}
          <View style={styles.inboxBtnRow}>
            <TouchableOpacity style={styles.inboxAccept} onPress={() => respond(req, true)} activeOpacity={0.8}>
              <Text style={styles.inboxAcceptText}>✓ KABUL ET</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inboxReject} onPress={() => respond(req, false)} activeOpacity={0.8}>
              <Text style={styles.inboxRejectText}>REDDET</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── MENTÖRLER tab ────────────────────────────────────────────────────────────

function MentorsTab() {
  const { mentorRequests, addMentorRequest } = useAppContext();
  const { session, profile } = useAuthContext();
  const { mentors: supabaseMentors } = useMembers();
  const [modalMentor, setModalMentor] = useState<Mentor | null>(null);
  const [sentTo, setSentTo] = useState<Map<string, string>>(new Map());
  const { show: showToast, ToastComponent } = useToast();

  // Daha önce gönderilmiş başvuruları ve durumlarını işaretle
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('mentorship_requests')
        .select('mentor_id, status')
        .eq('mentee_id', session.user.id);
      if (!cancelled && data) {
        setSentTo(new Map((data as { mentor_id: string; status: string }[]).map((r) => [r.mentor_id, r.status])));
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayMentors: Mentor[] = supabaseMentors.length > 0
    ? supabaseMentors.map((p, i) => ({
        id:        i + 1,
        uuid:      p.id,
        name:      p.full_name,
        title:     p.position ?? p.role,
        firm:      p.company ?? '—',
        expertise: p.mentor_bio ?? p.sector ?? '—',
        initials:  initials(p.full_name),
      }))
    : MENTORS;

  const handleSent = async (message: string): Promise<boolean> => {
    if (!modalMentor) return false;

    if (modalMentor.uuid && session?.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('mentorship_requests').insert({
        mentee_id: session.user.id,
        mentor_id: modalMentor.uuid,
        message,
      });
      if (error) {
        showToast('Başvuru gönderilemedi — bu mentora zaten başvurmuş olabilirsiniz.', 'error');
        return false;
      }
      setSentTo(prev => new Map([...prev, [modalMentor.uuid!, 'pending']]));
    } else {
      addMentorRequest(modalMentor.id);
    }

    showToast(`${modalMentor.name} için başvuru gönderildi`, 'success');
    return true;
  };

  const statusLabel = (uuid?: string): string | undefined => {
    if (!uuid) return undefined;
    const st = sentTo.get(uuid);
    if (st === 'accepted') return '✓ Kabul edildi — mentörünüz sizinle iletişime geçecek';
    if (st === 'rejected') return 'Bu dönem eşleşme sağlanamadı';
    if (st === 'pending')  return '✓ Değerlendirmeye alındı';
    return undefined;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tabContent}
      >
        {profile?.is_mentor && (
          <MentorInbox
            onResponded={(name, accepted) =>
              showToast(accepted ? `${name} başvurusu kabul edildi` : `${name} başvurusu reddedildi`, accepted ? 'success' : 'info')
            }
          />
        )}

        {displayMentors.length === 0 && (
          <Text style={styles.tabIntro}>
            Mentor listesi henüz oluşturulmadı. Yönetim mentor atadığında
            burada görünecekler.
          </Text>
        )}

        {displayMentors.map((m) => (
          <MentorCard
            key={m.id}
            mentor={m}
            pending={m.uuid ? sentTo.has(m.uuid) : mentorRequests.has(m.id)}
            statusText={statusLabel(m.uuid)}
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
        {activeTab === 'BÜLTEN' && <BulletinTab />}
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

  // Mentor gelen kutusu
  inboxWrap:       { marginHorizontal: 24, marginBottom: 8 },
  inboxHeader:     { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 2, color: Colors.gold, fontWeight: '700', marginBottom: 12 },
  inboxCard:       { borderWidth: 0.5, borderColor: Colors.gold, backgroundColor: 'rgba(217,200,150,0.05)', padding: 16, marginBottom: 12 },
  inboxName:       { fontFamily: Fonts.cormorant, fontSize: 18, color: Colors.ivory, fontWeight: '500' },
  inboxFirm:       { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, marginTop: 2, marginBottom: 8 },
  inboxMsg:        { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.ivory, opacity: 0.8, fontStyle: 'italic', lineHeight: 17, marginBottom: 12 },
  inboxBtnRow:     { flexDirection: 'row', gap: 8 },
  inboxAccept:     { flex: 1, backgroundColor: Colors.gold, paddingVertical: 10, alignItems: 'center' },
  inboxAcceptText: { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.navyDeep, fontWeight: '700' },
  inboxReject:     { paddingHorizontal: 18, borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 10, alignItems: 'center' },
  inboxRejectText: { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '600' },
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
  courseEnrollBtn: {
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: Colors.gold,
    paddingVertical: 8,
    alignItems: 'center',
  },
  courseEnrollText: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.gold,
    fontWeight: '700',
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
