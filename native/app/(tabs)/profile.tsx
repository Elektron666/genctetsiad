import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
  ActivityIndicator,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

// ── Constants ─────────────────────────────────────────────────────────────────

const CITIES = ['Ankara','İstanbul','İzmir','Bursa','Gaziantep','Konya','Adana','Kayseri','Mersin','Denizli','Tekirdağ','Antalya','Eskişehir','Samsun','Trabzon','Diyarbakır'];

const SECTORS = [
  'Kumaş Üreticisi','Döşemelik Kumaş Üreticisi','Perdelik Kumaş Üreticisi',
  'Havlu & Bornoz Üreticisi','Yatak & Nevresim Üreticisi','Perde & Tül Üreticisi',
  'Halı & Kilim Üreticisi','Battaniye & Pike Üreticisi','Banyo Tekstili',
  'Mutfak & Sofra Tekstili','Bebek & Çocuk Tekstili','Masa Örtüsü & Runner',
  'Kumaş Mağazası','Ev Tekstili Mağazası','Toptan & Dağıtım',
  'İhracat & Dış Ticaret','E-ticaret & Online Satış',
  'Tasarım & Marka','Dijital & Tekstil Baskı','Boyama & Apre',
  'İplik & Hammadde','Aksesuar (Fermuar, Düğme, Etiket)',
  'Teknik & Endüstriyel Tekstil','Lojistik & Tedarik Zinciri','Diğer',
];

const ROLE_LABELS: Record<string, string> = {
  pending:   'Onay Bekliyor',
  rejected:  'Reddedildi',
  member:    'Üye',
  student:   'Öğrenci Üye',
  board:     'Yönetim Kurulu',
  president: 'Başkan',
  admin:     'Admin',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildVCard(p: Profile): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${p.full_name}`,
    p.company ? `ORG:${p.company}` : '',
    p.position ? `TITLE:${p.position}` : `TITLE:Genç TETSİAD ${ROLE_LABELS[p.role] ?? p.role}`,
    p.phone   ? `TEL;TYPE=CELL:${p.phone}` : '',
    p.email   ? `EMAIL:${p.email}` : '',
    p.city    ? `ADR:;;${p.city};;;Türkiye` : '',
    p.member_code ? `NOTE:GENÇ TETSİAD · ${p.member_code}` : 'NOTE:GENÇ TETSİAD',
    'END:VCARD',
  ].filter(Boolean).join('\n');
}

// ── QR Modal ──────────────────────────────────────────────────────────────────

function QRModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const vcard = buildVCard(profile);
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={qrS.backdrop}>
        <View style={qrS.sheet}>
          <View style={[qrS.corner, qrS.cTL]} /><View style={[qrS.corner, qrS.cTR]} />
          <View style={[qrS.corner, qrS.cBL]} /><View style={[qrS.corner, qrS.cBR]} />

          <View style={qrS.header}>
            <Text style={qrS.headerLabel}>GENÇ TETSİAD</Text>
            <Text style={qrS.headerSub}>DİJİTAL KARTVİZİT</Text>
          </View>
          <View style={qrS.divider} />

          <View style={qrS.qrWrap}>
            <QRCode value={vcard} size={200} backgroundColor="#FFFFFF" color={Colors.greenDark} />
          </View>

          {profile.member_code && <Text style={qrS.memberNo}>{profile.member_code}</Text>}
          <View style={qrS.divider} />

          <Text style={qrS.name}>{profile.full_name}</Text>
          <Text style={qrS.role}>{(ROLE_LABELS[profile.role] ?? profile.role).toUpperCase()}</Text>
          {(profile.company || profile.city) ? (
            <Text style={qrS.firm}>
              {[profile.company, profile.city].filter(Boolean).join(' · ')}
            </Text>
          ) : null}

          {profile.phone ? (
            <TouchableOpacity
              style={qrS.phoneRow}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(`tel:${profile.phone!.replace(/\s/g, '')}`)}
            >
              <Text style={qrS.phoneText}>{profile.phone}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={qrS.divider} />
          <Text style={qrS.hint}>QR'ı telefon kameranızla okutun — rehbere otomatik kaydedilir.</Text>

          <View style={qrS.btnRow}>
            <TouchableOpacity style={qrS.shareBtn} activeOpacity={0.8} onPress={() => Share.share({ message: vcard })}>
              <Text style={qrS.shareBtnText}>PAYLAŞ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={qrS.closeBtn} activeOpacity={0.8} onPress={onClose}>
              <Text style={qrS.closeBtnText}>KAPAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const qrS = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(3,15,9,0.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  sheet:       { backgroundColor: Colors.navyMid, borderWidth: 0.5, borderColor: Colors.gold, padding: 28, width: '100%', alignItems: 'center' },
  header:      { alignItems: 'center', marginBottom: 14 },
  headerLabel: { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 3, color: Colors.gold, fontWeight: '700' },
  headerSub:   { fontFamily: Fonts.mono, fontSize: 7, letterSpacing: 2, color: Colors.textMuted, marginTop: 4 },
  divider:     { height: 0.5, backgroundColor: Colors.goldLine, width: '100%', marginVertical: 16 },
  qrWrap:      { padding: 14, backgroundColor: '#FFFFFF', marginBottom: 12 },
  memberNo:    { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2.5, color: Colors.gold, marginBottom: 4 },
  name:        { fontFamily: Fonts.cormorant, fontSize: 22, color: Colors.ivory, fontStyle: 'italic', fontWeight: '500', marginBottom: 4 },
  role:        { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.gold, fontWeight: '600', marginBottom: 4 },
  firm:        { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  phoneRow:    { paddingVertical: 4 },
  phoneText:   { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1, color: Colors.ivory },
  hint:        { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 14, marginTop: 4, marginBottom: 4 },
  btnRow:      { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  shareBtn:    { flex: 1, borderWidth: 0.5, borderColor: Colors.goldLine, paddingVertical: 12, alignItems: 'center' },
  shareBtnText:{ fontFamily: Fonts.jakarta, fontSize: 9, letterSpacing: 2.5, color: Colors.textMuted, fontWeight: '600' },
  closeBtn:    { flex: 1, borderWidth: 0.5, borderColor: Colors.gold, paddingVertical: 12, alignItems: 'center' },
  closeBtnText:{ fontFamily: Fonts.jakarta, fontSize: 9, letterSpacing: 2.5, color: Colors.gold, fontWeight: '600' },
  corner:      { position: 'absolute', width: 16, height: 16 },
  cTL:         { top: 8, left: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: Colors.gold },
  cTR:         { top: 8, right: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: Colors.gold },
  cBL:         { bottom: 8, left: 8, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: Colors.gold },
  cBR:         { bottom: 8, right: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: Colors.gold },
});

// ── Edit Profile Modal ────────────────────────────────────────────────────────

function EditProfileModal({
  profile,
  onSave,
  onClose,
}: {
  profile: Profile;
  onSave: (updates: Partial<Profile>) => Promise<{ error: unknown }>;
  onClose: () => void;
}) {
  const [fullName, setFullName]   = useState(profile.full_name ?? '');
  const [company, setCompany]     = useState(profile.company ?? '');
  const [position, setPosition]   = useState(profile.position ?? '');
  const [email, setEmail]         = useState(profile.email ?? '');
  const [city, setCity]           = useState(profile.city ?? '');
  const [sector, setSector]       = useState(profile.sector ?? '');
  const [isMentor, setIsMentor]   = useState(profile.is_mentor ?? false);
  const [mentorBio, setMentorBio] = useState(profile.mentor_bio ?? '');
  const [saving, setSaving]       = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    const { error } = await onSave({
      full_name: fullName.trim(),
      company: company.trim() || null,
      position: position.trim() || null,
      email: email.trim() || null,
      city: city || null,
      sector: sector || null,
      is_mentor: isMentor,
      mentor_bio: isMentor ? (mentorBio.trim() || null) : null,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Hata', 'Profil kaydedilemedi. Tekrar deneyin.');
    } else {
      onClose();
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={editS.overlay}>
        <View style={editS.sheet}>
          <View style={editS.handle} />
          <View style={editS.sheetHeader}>
            <Text style={editS.sheetTitle}>PROFİL DÜZENLE</Text>
            <TouchableOpacity onPress={onClose}><Text style={editS.closeX}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={editS.scroll}>
            {[
              { label: 'AD SOYAD *', value: fullName, set: setFullName, keyboard: 'default' as const },
              { label: 'FİRMA', value: company, set: setCompany, keyboard: 'default' as const },
              { label: 'POZİSYON', value: position, set: setPosition, keyboard: 'default' as const },
              { label: 'E-POSTA', value: email, set: setEmail, keyboard: 'email-address' as const },
            ].map(f => (
              <View key={f.label} style={editS.fieldWrap}>
                <Text style={editS.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={editS.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
                />
                <View style={editS.underline} />
              </View>
            ))}

            <View style={editS.fieldWrap}>
              <Text style={editS.fieldLabel}>ŞEHİR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {CITIES.map(c => (
                  <TouchableOpacity key={c} style={[editS.pill, city === c && editS.pillActive]} onPress={() => setCity(c)}>
                    <Text style={[editS.pillText, city === c && editS.pillTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={editS.fieldWrap}>
              <Text style={editS.fieldLabel}>SEKTÖR</Text>
              <View style={editS.pillGrid}>
                {SECTORS.map(sec => (
                  <TouchableOpacity key={sec} style={[editS.pill, sector === sec && editS.pillActive]} onPress={() => setSector(sec)}>
                    <Text style={[editS.pillText, sector === sec && editS.pillTextActive]}>{sec}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={editS.fieldWrap}>
              <Text style={editS.fieldLabel}>MENTÖRLÜK</Text>
              <TouchableOpacity
                style={[editS.mentorToggle, isMentor && editS.mentorToggleActive]}
                onPress={() => setIsMentor(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[editS.mentorDot, isMentor && editS.mentorDotActive]} />
                <Text style={[editS.mentorToggleText, isMentor && editS.mentorToggleTextActive]}>
                  {isMentor ? 'Mentör olarak listeleniyorum' : 'Mentör olmak istiyorum'}
                </Text>
              </TouchableOpacity>
              {isMentor && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[editS.fieldLabel, { marginBottom: 6 }]}>UZMANLIK & BİYOGRAFİ</Text>
                  <TextInput
                    style={[editS.input, { borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine, paddingBottom: 8, minHeight: 60, textAlignVertical: 'top' }]}
                    value={mentorBio}
                    onChangeText={setMentorBio}
                    placeholder="Uzmanlık alanı, deneyim..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={200}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[editS.saveBtn, (!fullName.trim() || saving) && editS.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!fullName.trim() || saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color={Colors.navyDeep} />
                : <Text style={editS.saveBtnText}>KAYDET</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const editS = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(3,15,9,0.88)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: Colors.navyDeep, borderTopWidth: 0.5, borderTopColor: Colors.goldLine, maxHeight: '92%', paddingTop: 12 },
  handle:         { width: 36, height: 3, backgroundColor: Colors.goldLine, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  sheetTitle:     { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.ivory, letterSpacing: 2 },
  closeX:         { fontFamily: Fonts.jakarta, fontSize: 16, color: Colors.textMuted, padding: 4 },
  scroll:         { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 },
  fieldWrap:      { marginBottom: 24 },
  fieldLabel:     { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 10 },
  input:          { fontFamily: Fonts.cormorant, fontSize: 20, color: Colors.ivory, paddingBottom: 8 },
  underline:      { height: 0.5, backgroundColor: Colors.goldLine },
  pill:           { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: Colors.goldLine, marginRight: 8, marginBottom: 8 },
  pillActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pillText:       { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted },
  pillTextActive: { color: Colors.navyDeep, fontWeight: '600' },
  saveBtn:             { backgroundColor: Colors.gold, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled:     { opacity: 0.4 },
  saveBtnText:         { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 3 },
  mentorToggle:        { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 0.5, borderColor: Colors.goldLine, paddingHorizontal: 14, paddingVertical: 10 },
  mentorToggleActive:  { backgroundColor: 'rgba(217,200,150,0.08)', borderColor: Colors.gold },
  mentorDot:           { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.goldLine },
  mentorDotActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  mentorToggleText:    { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  mentorToggleTextActive: { color: Colors.ivory },
});

// ── Membership Card ───────────────────────────────────────────────────────────

function MembershipCard({ profile }: { profile: Profile }) {
  const initials = getInitials(profile.full_name || '?');
  const roleLabel = (ROLE_LABELS[profile.role] ?? profile.role).toUpperCase();
  const hasCode = !!profile.member_code;

  return (
    <View style={cardS.wrap}>
      <LinearGradient
        colors={[Colors.navyMid, Colors.navyDeep]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={[cardS.corner, cardS.cTL]} /><View style={[cardS.corner, cardS.cTR]} />
      <View style={[cardS.corner, cardS.cBL]} /><View style={[cardS.corner, cardS.cBR]} />

      <View style={cardS.topRow}>
        <Text style={cardS.orgLabel}>GENÇ TETSİAD</Text>
        <Text style={cardS.memberNoTop}>{hasCode ? profile.member_code : 'ONAY BEKLENİYOR'}</Text>
      </View>

      <View style={cardS.avatarRow}>
        <View style={cardS.avatar}>
          <Text style={cardS.avatarText}>{initials}</Text>
        </View>
        <View style={cardS.nameBlock}>
          <Text style={cardS.memberName}>{profile.full_name || '—'}</Text>
          <Text style={cardS.memberRole}>{roleLabel}</Text>
          {profile.company ? <Text style={cardS.memberFirm}>{profile.company}</Text> : null}
        </View>
      </View>

      <View style={cardS.bottomStrip}>
        <Text style={cardS.bottomStripNo}>{hasCode ? profile.member_code : '—'}</Text>
        <Text style={cardS.bottomStripCity}>{(profile.city ?? '—').toUpperCase()}</Text>
      </View>
    </View>
  );
}

const cardS = StyleSheet.create({
  wrap:          { borderWidth: 0.5, borderColor: Colors.gold, height: 220, marginHorizontal: 24, overflow: 'hidden', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 0 },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orgLabel:      { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 2.5, color: Colors.gold, fontWeight: '700' },
  memberNoTop:   { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1, color: Colors.textMuted },
  avatarRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatar:        { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.navyMid },
  avatarText:    { fontFamily: Fonts.mono, fontSize: 14, color: Colors.gold, fontWeight: '500' },
  nameBlock:     { flex: 1 },
  memberName:    { fontFamily: Fonts.cormorant, fontSize: 26, fontStyle: 'italic', fontWeight: '300', color: Colors.ivory, lineHeight: 28, marginBottom: 4 },
  memberRole:    { fontFamily: Fonts.jakarta, fontSize: 7, letterSpacing: 2, color: Colors.gold, fontWeight: '600', marginBottom: 2 },
  memberFirm:    { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, fontWeight: '300' },
  bottomStrip:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.gold, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7 },
  bottomStripNo: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, color: Colors.navyDeep, fontWeight: '700' },
  bottomStripCity:{ fontFamily: Fonts.jakarta, fontSize: 7, letterSpacing: 2, color: Colors.navyDeep, fontWeight: '700' },
  corner:        { position: 'absolute', width: 16, height: 16 },
  cTL:           { top: 8, left: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(217,200,150,0.4)' },
  cTR:           { top: 8, right: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(217,200,150,0.4)' },
  cBL:           { bottom: 38, left: 8, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(217,200,150,0.4)' },
  cBR:           { bottom: 38, right: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(217,200,150,0.4)' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

type Stats = { events: number; courses: number; mentorships: number };

export default function ProfileScreen() {
  const { profile, signOut, updateProfile } = useAuthContext();
  const insets = useSafeAreaInsets();
  const [showQR, setShowQR]     = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [stats, setStats]       = useState<Stats>({ events: 0, courses: 0, mentorships: 0 });

  useEffect(() => {
    if (!profile?.id) return;
    const uid = profile.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    Promise.all([
      db.from('event_attendees').select('event_id', { count: 'exact', head: true }).eq('user_id', uid),
      db.from('course_enrollments').select('course_id', { count: 'exact', head: true }).eq('user_id', uid),
      db.from('mentorship_requests').select('id', { count: 'exact', head: true }).eq('mentee_id', uid),
    ]).then(([ev, co, me]: [{ count: number | null }, { count: number | null }, { count: number | null }]) => {
      setStats({ events: ev.count ?? 0, courses: co.count ?? 0, mentorships: me.count ?? 0 });
    });
  }, [profile?.id]);

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </SafeAreaView>
    );
  }

  const fmt = (n: number) => String(n).padStart(2, '0');
  const STATS = [
    { value: fmt(stats.events),      label: 'ETKİNLİK' },
    { value: fmt(stats.courses),     label: 'KURS' },
    { value: fmt(stats.mentorships), label: 'MENTORLUK' },
    { value: ROLE_LABELS[profile.role]?.substring(0, 3).toUpperCase() ?? '—', label: 'STATÜ' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerSection}>KART</Text>
          <Text style={styles.headerTitle}>Üyelik & QR Kartvizit</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)} activeOpacity={0.7}>
          <Text style={styles.editBtnText}>DÜZENLE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Membership card ─────────────────────────────── */}
        <View style={styles.cardSection}>
          <MembershipCard profile={profile} />
        </View>

        {/* ── QR button ───────────────────────────────────── */}
        <View style={styles.qrBtnWrap}>
          <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(true)} activeOpacity={0.8}>
            <Text style={styles.qrBtnText}>QR KARTVİZİT</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats row ────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={s.label} style={[styles.statCell, i < STATS.length - 1 && styles.statCellBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Profile info ─────────────────────────────────── */}
        <View style={styles.infoFooter}>
          {[
            ['ŞEHİR',    profile.city ?? '—'],
            ['SEKTÖR',   profile.sector ?? '—'],
            ['POZİSYON', profile.position ?? '—'],
            ['E-POSTA',  profile.email ?? '—'],
            ['TELEFON',  profile.phone ?? '—'],
            ['DURUM',    profile.role === 'pending' ? 'ONAY BEKLENİYOR' : 'AKTİF ÜYE · 2026'],
          ].map(([k, v], i) => (
            <View key={k} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
              <Text style={styles.infoKey}>{k}</Text>
              <Text style={[styles.infoVal, k === 'DURUM' && { color: profile.role === 'pending' ? Colors.textMuted : Colors.gold }]}>{v}</Text>
            </View>
          ))}
        </View>

        {/* ── Sign out ─────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Çıkış', 'Hesabınızdan çıkmak istiyor musunuz?', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Çıkış Yap', style: 'destructive', onPress: signOut },
            ])
          }
        >
          <Text style={styles.signOutText}>ÇIKIŞ YAP</Text>
        </TouchableOpacity>

        {/* ── Footer ───────────────────────────────────────── */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            GENÇ TETSİAD · v1.0 BETA · YALNIZCA{' '}
            <Text style={{ color: Colors.gold }}>DAVETLİ</Text> ÜYELER
          </Text>
        </View>
      </ScrollView>

      {showQR   && <QRModal profile={profile} onClose={() => setShowQR(false)} />}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onSave={updateProfile}
          onClose={() => setShowEdit(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  header: {
    backgroundColor: Colors.navyDeep,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerSection: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 3,
    color: Colors.gold,
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: Fonts.cormorant,
    fontSize: 22,
    color: Colors.ivory,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  editBtn: {
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 2,
  },
  editBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  cardSection: { marginTop: 28, marginBottom: 16 },

  qrBtnWrap: { paddingHorizontal: 24, marginBottom: 28 },
  qrBtn: { backgroundColor: Colors.gold, paddingVertical: 14, alignItems: 'center' },
  qrBtnText: { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 3 },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingVertical: 20,
    paddingHorizontal: 8,
    backgroundColor: Colors.navyDeep,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 0.5, borderRightColor: Colors.goldLine },
  statValue: { fontFamily: Fonts.cormorant, fontStyle: 'italic', fontWeight: '300', fontSize: 28, color: Colors.ivory, lineHeight: 30 },
  statLabel: { fontFamily: Fonts.jakarta, fontSize: 7, color: Colors.textMuted, letterSpacing: 1.5, fontWeight: '600', marginTop: 6 },

  infoFooter: { marginTop: 28, marginHorizontal: 24, borderWidth: 0.5, borderColor: Colors.goldLine },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  infoRowBorder: { borderTopWidth: 0.5, borderTopColor: Colors.goldLine },
  infoKey: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted },
  infoVal: { fontFamily: Fonts.jakarta, fontSize: 11, color: Colors.ivory, fontWeight: '400', flex: 1, textAlign: 'right' },

  signOutBtn: { margin: 24, borderWidth: 0.5, borderColor: 'rgba(229,115,115,0.4)', paddingVertical: 14, alignItems: 'center' },
  signOutText: { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: 'rgba(229,115,115,0.7)', letterSpacing: 2, fontWeight: '600' },

  footerNote: { paddingHorizontal: 24, alignItems: 'center' },
  footerNoteText: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1, color: Colors.textMuted, textAlign: 'center' },
});
