import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Fonts, FontSize } from '@/theme';

// ── Data ────────────────────────────────────────────────────────────────────

type Member = {
  id: number;
  name: string;
  role: string;
  firm: string;
  city: string;
  memberNo: string;
  phone: string;
  sector: string;
};

const MEMBERS: Member[] = [
  { id: 1, name: 'Resul Öden',      role: 'Başkan',          firm: 'ROSSA HOME',            city: 'İstanbul', memberNo: 'TG-2026-0001', phone: '+90 532 101 00 01', sector: 'Ev Tekstili' },
  { id: 2, name: 'Fatih Özdemir',   role: 'Yönetim Kurulu',  firm: 'ORMEN TEKSTİL',         city: 'Ankara',   memberNo: 'TG-2026-0002', phone: '+90 542 312 04 60', sector: 'Dokuma' },
  { id: 3, name: 'Elif Yıldız',     role: 'Üye',             firm: 'YILDIZ HOME',            city: 'Bursa',    memberNo: 'TG-2026-0003', phone: '+90 505 234 56 78', sector: 'Tasarım' },
  { id: 4, name: 'Kerem Bayraktar', role: 'Üye',             firm: 'BAYRAKTAR TEKSTİL',     city: 'İstanbul', memberNo: 'TG-2026-0004', phone: '+90 533 456 78 90', sector: 'İhracat' },
  { id: 5, name: 'Ayşe Kaya',       role: 'Öğrenci Üye',    firm: 'İTÜ Tekstil Müh.',      city: 'İstanbul', memberNo: 'TG-2026-0005', phone: '+90 544 567 89 01', sector: 'Öğrenci' },
];

const ACTIVITY = [
  { id: 1, label: 'ETKİNLİK KATILIMI', desc: 'HOMETEX 2026 Fuar Çalışması', date: '14 MAYIS' },
  { id: 2, label: 'KURS TAMAMLAMA',   desc: 'AB Sürdürülebilirlik Direktifleri', date: '02 NİSAN' },
  { id: 3, label: 'MENTORLUK BAŞVURUSU', desc: 'Sektörel Mentorluk Programı', date: '18 MART' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildVCard(member: Member): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${member.name}`,
    `ORG:${member.firm}`,
    `TITLE:Genç TETSİAD ${member.role}`,
    `TEL;TYPE=CELL:${member.phone}`,
    'EMAIL:genctetsiad@tetsiad.org',
    `ADR:;;${member.city};;;Türkiye`,
    `NOTE:GENÇ TETSİAD · ${member.memberNo}`,
    'END:VCARD',
  ].join('\n');
}

// ── AppHeader ────────────────────────────────────────────────────────────────

function AppHeader({
  section,
  title,
  onSwitcher,
}: {
  section: string;
  title: string;
  onSwitcher: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[headerStyles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={headerStyles.row}>
        <View>
          <Text style={headerStyles.section}>{section}</Text>
          <Text style={headerStyles.title}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onSwitcher} activeOpacity={0.7} style={headerStyles.switcherBtn}>
          <Text style={headerStyles.switcherText}>ÜYE DEĞİŞTİR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.goldLine,
    backgroundColor: Colors.navyDeep,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  section: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 3,
    color: Colors.gold,
    marginBottom: 10,
  },
  title: {
    fontFamily: Fonts.cormorant,
    fontSize: 28,
    color: Colors.ivory,
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 32,
  },
  switcherBtn: {
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 2,
  },
  switcherText: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});

// ── QR Modal ─────────────────────────────────────────────────────────────────

function QRModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const vcard = buildVCard(member);
  return (
    <Modal
      visible
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={qrStyles.backdrop}>
        <View style={qrStyles.sheet}>

          {/* Branded header */}
          <View style={qrStyles.sheetHeader}>
            <Text style={qrStyles.sheetHeaderLabel}>GENÇ TETSİAD</Text>
            <Text style={qrStyles.sheetHeaderSub}>DİJİTAL KARTVİZİT</Text>
          </View>

          <View style={qrStyles.divider} />

          {/* Corner brackets */}
          <View style={[qrStyles.corner, qrStyles.cornerTL]} />
          <View style={[qrStyles.corner, qrStyles.cornerTR]} />
          <View style={[qrStyles.corner, qrStyles.cornerBL]} />
          <View style={[qrStyles.corner, qrStyles.cornerBR]} />

          {/* QR code */}
          <View style={qrStyles.qrWrap}>
            <QRCode
              value={vcard}
              size={200}
              backgroundColor="#FFFFFF"
              color={Colors.greenDark}
            />
          </View>

          {/* Member No */}
          <Text style={qrStyles.memberNo}>{member.memberNo}</Text>

          <View style={qrStyles.divider} />

          {/* Info */}
          <Text style={qrStyles.memberName}>{member.name}</Text>
          <Text style={qrStyles.memberRole}>{member.role}</Text>
          <Text style={qrStyles.memberFirm}>{member.firm} · {member.city}</Text>

          <TouchableOpacity
            style={qrStyles.phoneRow}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(`tel:${member.phone.replace(/\s/g, '')}`)}
          >
            <Text style={qrStyles.phoneText}>{member.phone}</Text>
          </TouchableOpacity>

          <View style={qrStyles.divider} />

          <Text style={qrStyles.hint}>QR'ı telefon kameranızla okutun — rehbere otomatik kaydedilir.</Text>

          <TouchableOpacity style={qrStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={qrStyles.closeBtnText}>KAPAT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const qrStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,15,9,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: Colors.navyMid,
    borderWidth: 0.5,
    borderColor: Colors.gold,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetHeaderLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 3,
    color: Colors.gold,
    fontWeight: '700',
  },
  sheetHeaderSub: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.goldLine,
    width: '100%',
    marginVertical: 16,
  },
  qrWrap: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  memberNo: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    color: Colors.gold,
    marginBottom: 4,
  },
  memberName: {
    fontFamily: Fonts.cormorant,
    fontSize: 22,
    color: Colors.ivory,
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 4,
  },
  memberRole: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.gold,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberFirm: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  phoneRow: {
    paddingVertical: 4,
  },
  phoneText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.ivory,
  },
  hint: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  closeBtn: {
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: 9,
    letterSpacing: 2.5,
    color: Colors.gold,
    fontWeight: '600',
  },
  // corner brackets
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: Colors.gold,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.gold,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: Colors.gold,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.gold,
  },
});

// ── Membership card ───────────────────────────────────────────────────────────

function MembershipCard({ member }: { member: Member }) {
  const initials = getInitials(member.name);
  return (
    <View style={cardStyles.wrap}>
      <LinearGradient
        colors={[Colors.navyMid, Colors.navyDeep]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Corner brackets */}
      <View style={[cardStyles.corner, cardStyles.cornerTL]} />
      <View style={[cardStyles.corner, cardStyles.cornerTR]} />
      <View style={[cardStyles.corner, cardStyles.cornerBL]} />
      <View style={[cardStyles.corner, cardStyles.cornerBR]} />

      {/* Top row */}
      <View style={cardStyles.topRow}>
        <Text style={cardStyles.orgLabel}>GENÇ TETSİAD</Text>
        <Text style={cardStyles.memberNoTop}>{member.memberNo}</Text>
      </View>

      {/* Name */}
      <Text style={cardStyles.memberName}>{member.name}</Text>

      {/* Role */}
      <Text style={cardStyles.memberRole}>{member.role.toUpperCase()}</Text>

      {/* Firm */}
      <Text style={cardStyles.memberFirm}>{member.firm}</Text>

      {/* Gold bottom strip */}
      <View style={cardStyles.bottomStrip}>
        <Text style={cardStyles.bottomStripNo}>{member.memberNo}</Text>
        <Text style={cardStyles.bottomStripCity}>{member.city.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: {
    borderWidth: 0.5,
    borderColor: Colors.gold,
    height: 200,
    marginHorizontal: 24,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 0,
    justifyContent: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orgLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 8,
    letterSpacing: 2.5,
    color: Colors.gold,
    fontWeight: '700',
  },
  memberNoTop: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },
  memberName: {
    fontFamily: Fonts.cormorant,
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '300',
    color: Colors.ivory,
    lineHeight: 34,
    marginBottom: 6,
  },
  memberRole: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    letterSpacing: 2,
    color: Colors.gold,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberFirm: {
    fontFamily: Fonts.jakarta,
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  bottomStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bottomStripNo: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.navyDeep,
    fontWeight: '700',
  },
  bottomStripCity: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    letterSpacing: 2,
    color: Colors.navyDeep,
    fontWeight: '700',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: 'rgba(217,200,150,0.4)',
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(217,200,150,0.4)',
  },
  cornerBL: {
    bottom: 38,
    left: 8,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: 'rgba(217,200,150,0.4)',
  },
  cornerBR: {
    bottom: 38,
    right: 8,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(217,200,150,0.4)',
  },
});

// ── ProfileScreen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [memberIdx, setMemberIdx] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const member = MEMBERS[memberIdx];

  const handleSwitcher = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...MEMBERS.map((m) => m.name), 'İPTAL'],
          cancelButtonIndex: MEMBERS.length,
          title: 'ÜYE SEÇ',
        },
        (idx) => {
          if (idx < MEMBERS.length) setMemberIdx(idx);
        }
      );
    } else {
      // On Android, cycle through members
      setMemberIdx((prev) => (prev + 1) % MEMBERS.length);
    }
  };

  const STATS = [
    { value: '08', label: 'ETKİNLİK' },
    { value: '03', label: 'KURS' },
    { value: '01', label: 'MENTORLUK' },
    { value: '24', label: 'BAĞLANTI' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <AppHeader
        section="KART"
        title="Üyelik & QR Kartvizit"
        onSwitcher={handleSwitcher}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Membership card ─────────────────────────────── */}
        <View style={styles.cardSection}>
          <MembershipCard member={member} />
        </View>

        {/* ── QR button ───────────────────────────────────── */}
        <View style={styles.qrBtnWrap}>
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => setShowQR(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.qrBtnText}>QR KARTVİZİT</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats row ────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View
              key={s.label}
              style={[
                styles.statCell,
                i < STATS.length - 1 && styles.statCellBorder,
              ]}
            >
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Recent activity ──────────────────────────────── */}
        <View style={styles.activitySection}>
          <Text style={styles.activityHeader}>SON AKTİVİTE</Text>
          {ACTIVITY.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.activityRow,
                i > 0 && styles.activityRowBorder,
              ]}
            >
              <View style={styles.activityLeft}>
                <Text style={styles.activityLabel}>{item.label}</Text>
                <Text style={styles.activityDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.activityDate}>{item.date}</Text>
            </View>
          ))}
        </View>

        {/* ── Member info footer ───────────────────────────── */}
        <View style={styles.infoFooter}>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>ŞEHİR</Text>
            <Text style={styles.infoVal}>{member.city}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoKey}>SEKTÖR</Text>
            <Text style={styles.infoVal}>{member.sector}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoKey}>E-POSTA</Text>
            <Text style={styles.infoVal}>genctetsiad@tetsiad.org</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoKey}>DURUM</Text>
            <Text style={[styles.infoVal, { color: Colors.gold }]}>AKTİF ÜYE · 2026</Text>
          </View>
        </View>

        {/* ── Footer note ──────────────────────────────────── */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            GENÇ TETSİAD · v1.0 BETA · YALNIZCA{' '}
            <Text style={{ color: Colors.gold }}>DAVETLİ</Text> ÜYELER
          </Text>
        </View>
      </ScrollView>

      {showQR && (
        <QRModal member={member} onClose={() => setShowQR(false)} />
      )}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Card
  cardSection: {
    marginTop: 28,
    marginBottom: 16,
  },

  // QR button
  qrBtnWrap: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  qrBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBtnText: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.navyDeep,
    letterSpacing: 3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.goldLine,
    paddingVertical: 20,
    paddingHorizontal: 8,
    backgroundColor: Colors.navyDeep,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statCellBorder: {
    borderRightWidth: 0.5,
    borderRightColor: Colors.goldLine,
  },
  statValue: {
    fontFamily: Fonts.cormorant,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 30,
    color: Colors.ivory,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: Fonts.jakarta,
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginTop: 6,
  },

  // Activity
  activitySection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 4,
  },
  activityHeader: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 2.5,
    color: Colors.gold,
    marginBottom: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  activityRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
  },
  activityLeft: {
    flex: 1,
    marginRight: 12,
  },
  activityLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.gold,
    marginBottom: 4,
  },
  activityDesc: {
    fontFamily: Fonts.cormorant,
    fontSize: 16,
    color: Colors.ivory,
    fontWeight: '500',
    lineHeight: 20,
  },
  activityDate: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Info footer
  infoFooter: {
    marginTop: 28,
    marginHorizontal: 24,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
  },
  infoKey: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },
  infoVal: {
    fontFamily: Fonts.jakarta,
    fontSize: 11,
    color: Colors.ivory,
    fontWeight: '400',
  },

  // Footer note
  footerNote: {
    marginTop: 32,
    paddingHorizontal: 24,
    borderTopWidth: 0.5,
    borderTopColor: Colors.goldLine,
    paddingTop: 20,
    alignItems: 'center',
  },
  footerNoteText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
