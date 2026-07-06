import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSize } from '@/theme';
import { useAuthContext } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/components/Toast';
import type { Profile } from '@/types/database';

const ADMIN_ROLES = ['board', 'president', 'admin'];

type AdminTab = 'ONAYLAR' | 'DUYURU' | 'ETKİNLİK';

function initials(name: string) {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '—';
}

// ─── Bekleyen başvuru kartı ───────────────────────────────────────────────────

function PendingCard({ p, onApprove }: { p: Profile; onApprove: (role: 'member' | 'student') => void }) {
  const [busy, setBusy] = useState(false);

  const confirm = (role: 'member' | 'student') => {
    Alert.alert(
      'Başvuruyu Onayla',
      `${p.full_name || 'İsimsiz başvuru'} — ${role === 'member' ? 'ÜYE' : 'ÖĞRENCİ ÜYE'} olarak onaylansın mı?\n\nÜye kodu otomatik atanacaktır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Onayla', onPress: () => { setBusy(true); onApprove(role); } },
      ]
    );
  };

  return (
    <View style={s.pCard}>
      <View style={s.pTop}>
        <View style={s.pAvatar}>
          <Text style={s.pAvatarText}>{initials(p.full_name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pName}>{p.full_name || 'İsimsiz başvuru'}</Text>
          <Text style={s.pFirm}>{[p.company, p.city].filter(Boolean).join(' · ') || '—'}</Text>
          <Text style={s.pMeta}>{p.phone ?? '—'}{p.sector ? `  ·  ${p.sector}` : ''}</Text>
        </View>
      </View>
      <View style={s.pBtnRow}>
        <TouchableOpacity
          style={[s.pBtn, s.pBtnFill, busy && s.disabled]}
          onPress={() => confirm('member')}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={s.pBtnFillText}>✓ ÜYE OLARAK ONAYLA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.pBtn, s.pBtnOutline, busy && s.disabled]}
          onPress={() => confirm('student')}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={s.pBtnOutlineText}>ÖĞRENCİ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Duyuru formu ─────────────────────────────────────────────────────────────

const ANN_TYPES: { key: 'general' | 'event' | 'system'; label: string }[] = [
  { key: 'general', label: 'GENEL' },
  { key: 'event',   label: 'ETKİNLİK' },
  { key: 'system',  label: 'SİSTEM' },
];

function AnnouncementForm({ onPublish }: { onPublish: (input: { title: string; body: string; type: 'general' | 'event' | 'system' }) => Promise<boolean> }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'general' | 'event' | 'system'>('general');
  const [busy, setBusy] = useState(false);

  const valid = title.trim().length > 3 && body.trim().length > 10;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const ok = await onPublish({ title: title.trim(), body: body.trim(), type });
    setBusy(false);
    if (ok) { setTitle(''); setBody(''); setType('general'); }
  };

  return (
    <View style={s.form}>
      <Text style={s.fieldLabel}>BAŞLIK</Text>
      <TextInput
        style={s.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Duyuru başlığı"
        placeholderTextColor={Colors.textMuted}
        maxLength={80}
      />
      <View style={s.underline} />

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>METİN</Text>
      <TextInput
        style={[s.input, s.textArea]}
        value={body}
        onChangeText={setBody}
        placeholder="Duyuru metni — üyelerin ana sayfasında ve bildirimlerinde görünür."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        maxLength={400}
      />
      <View style={s.underline} />
      <Text style={s.charCount}>{body.length} / 400</Text>

      <Text style={[s.fieldLabel, { marginTop: 16 }]}>KATEGORİ</Text>
      <View style={s.pillRow}>
        {ANN_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.pill, type === t.key && s.pillActive]}
            onPress={() => setType(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.pillText, type === t.key && s.pillTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.cta, (!valid || busy) && s.disabled]}
        onPress={submit}
        disabled={!valid || busy}
        activeOpacity={0.8}
      >
        <Text style={s.ctaText}>{busy ? 'YAYINLANIYOR...' : 'DUYURUYU YAYINLA'}</Text>
      </TouchableOpacity>
      <Text style={s.helper}>Yayınlanan duyuru tüm üyelerin uygulamasında anında görünür.</Text>
    </View>
  );
}

// ─── Etkinlik formu ───────────────────────────────────────────────────────────

function EventForm({ onCreate }: { onCreate: (input: { title: string; description?: string; location?: string; city?: string; starts_at: string; max_attendees?: number | null }) => Promise<boolean> }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');   // GG.AA.YYYY
  const [time, setTime] = useState('');   // SS:DD
  const [quota, setQuota] = useState('');
  const [busy, setBusy] = useState(false);

  const parseDateTime = (): Date | null => {
    const m = date.trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (!m) return null;
    const t = time.trim().match(/^(\d{1,2})[:.](\d{2})$/) ?? ['', '10', '00'];
    const d = new Date(
      parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10),
      parseInt(t[1] as string, 10), parseInt(t[2] as string, 10)
    );
    return isNaN(d.getTime()) ? null : d;
  };

  const valid = title.trim().length > 3 && parseDateTime() !== null;

  const submit = async () => {
    const dt = parseDateTime();
    if (!dt || !valid || busy) return;
    setBusy(true);
    const ok = await onCreate({
      title: title.trim(),
      description: desc.trim() || undefined,
      location: location.trim() || undefined,
      city: city.trim() || undefined,
      starts_at: dt.toISOString(),
      max_attendees: quota.trim() ? parseInt(quota.trim(), 10) || null : null,
    });
    setBusy(false);
    if (ok) { setTitle(''); setDesc(''); setLocation(''); setCity(''); setDate(''); setTime(''); setQuota(''); }
  };

  return (
    <View style={s.form}>
      <Text style={s.fieldLabel}>ETKİNLİK ADI</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Örn. Denizli Fabrika Ziyareti" placeholderTextColor={Colors.textMuted} maxLength={80} />
      <View style={s.underline} />

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>AÇIKLAMA</Text>
      <TextInput style={[s.input, s.textArea, { minHeight: 70 }]} value={desc} onChangeText={setDesc} placeholder="Program detayı (opsiyonel)" placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" maxLength={400} />
      <View style={s.underline} />

      <View style={s.row2}>
        <View style={{ flex: 1 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>YER</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="Örn. OSB Konferans Salonu" placeholderTextColor={Colors.textMuted} />
          <View style={s.underline} />
        </View>
        <View style={{ width: 110 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>ŞEHİR</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="İstanbul" placeholderTextColor={Colors.textMuted} />
          <View style={s.underline} />
        </View>
      </View>

      <View style={s.row2}>
        <View style={{ flex: 1 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>TARİH</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="24.07.2026" placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" maxLength={10} />
          <View style={s.underline} />
        </View>
        <View style={{ width: 90 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>SAAT</Text>
          <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="10:00" placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" maxLength={5} />
          <View style={s.underline} />
        </View>
        <View style={{ width: 90 }}>
          <Text style={[s.fieldLabel, { marginTop: 20 }]}>KONTENJAN</Text>
          <TextInput style={s.input} value={quota} onChangeText={setQuota} placeholder="—" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={4} />
          <View style={s.underline} />
        </View>
      </View>

      <TouchableOpacity style={[s.cta, (!valid || busy) && s.disabled]} onPress={submit} disabled={!valid || busy} activeOpacity={0.8}>
        <Text style={s.ctaText}>{busy ? 'EKLENİYOR...' : 'ETKİNLİĞİ YAYINLA'}</Text>
      </TouchableOpacity>
      <Text style={s.helper}>Etkinlik, takvim sekmesinde tüm üyelere anında açılır.</Text>
    </View>
  );
}

// ─── Ana ekran ────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { profile, status } = useAuthContext();
  const { pending, stats, loading, refetch, approve, publishAnnouncement, createEvent } = useAdmin();
  const [tab, setTab] = useState<AdminTab>('ONAYLAR');
  const [refreshing, setRefreshing] = useState(false);
  const { show: showToast, ToastComponent } = useToast();

  const isAdmin = !!profile && ADMIN_ROLES.includes(profile.role);

  // Yetkisiz erişimi engelle
  useEffect(() => {
    if (status !== 'loading' && !isAdmin) router.replace('/(tabs)');
  }, [status, isAdmin]);

  if (!isAdmin) return <View style={{ flex: 1, backgroundColor: Colors.navy }} />;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleApprove = async (p: Profile, role: 'member' | 'student') => {
    const error = await approve(p.id, role);
    if (error) {
      showToast('Onay başarısız — yetkinizi kontrol edin.', 'error');
    } else {
      showToast(`${p.full_name || 'Üye'} onaylandı — üye kodu atandı.`, 'success');
    }
  };

  const handlePublish = async (input: { title: string; body: string; type: 'general' | 'event' | 'system' }) => {
    const error = await publishAnnouncement(input);
    if (error) { showToast('Duyuru yayınlanamadı.', 'error'); return false; }
    showToast('Duyuru yayınlandı.', 'success');
    return true;
  };

  const handleCreateEvent = async (input: { title: string; description?: string; location?: string; city?: string; starts_at: string; max_attendees?: number | null }) => {
    const error = await createEvent(input);
    if (error) { showToast('Etkinlik eklenemedi.', 'error'); return false; }
    showToast('Etkinlik yayınlandı.', 'success');
    return true;
  };

  const STAT_CELLS = [
    { value: stats.pending,       label: 'BEKLEYEN' },
    { value: stats.members,       label: 'ÜYE' },
    { value: stats.events,        label: 'ETKİNLİK' },
    { value: stats.announcements, label: 'DUYURU' },
  ];

  const TABS: AdminTab[] = ['ONAYLAR', 'DUYURU', 'ETKİNLİK'];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerOverline}>GENÇ TETSİAD</Text>
          <Text style={s.headerTitle}>Yönetim Paneli</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {STAT_CELLS.map((c, i) => (
          <View key={c.label} style={[s.statCell, i < STAT_CELLS.length - 1 && s.statCellBorder]}>
            <Text style={[s.statValue, c.label === 'BEKLEYEN' && c.value > 0 && { color: Colors.gold }]}>
              {String(c.value).padStart(2, '0')}
            </Text>
            <Text style={s.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tabItem, tab === t && s.tabItemActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>
              {t}{t === 'ONAYLAR' && stats.pending > 0 ? ` (${stats.pending})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} progressBackgroundColor={Colors.navyDeep} />
          }
        >
          {tab === 'ONAYLAR' && (
            <View>
              {pending.length === 0 ? (
                <View style={s.empty}>
                  <View style={s.emptyDot} />
                  <Text style={s.emptyTitle}>{loading ? 'Yükleniyor...' : 'Bekleyen başvuru yok.'}</Text>
                  <Text style={s.emptySub}>Yeni başvurular burada listelenir; onayladığınız üyeye otomatik üye kodu atanır.</Text>
                </View>
              ) : (
                pending.map(p => (
                  <PendingCard key={p.id} p={p} onApprove={(role) => handleApprove(p, role)} />
                ))
              )}
            </View>
          )}

          {tab === 'DUYURU' && <AnnouncementForm onPublish={handlePublish} />}
          {tab === 'ETKİNLİK' && <EventForm onCreate={handleCreateEvent} />}
        </ScrollView>
      </KeyboardAvoidingView>

      {ToastComponent}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.navy },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: Colors.navyDeep, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  backBtn:        { width: 32, height: 32, justifyContent: 'center' },
  backText:       { fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.gold },
  headerOverline: { fontFamily: Fonts.mono, fontSize: 7, letterSpacing: 3, color: Colors.gold, textAlign: 'center', marginBottom: 4 },
  headerTitle:    { fontFamily: Fonts.cormorant, fontSize: 24, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', textAlign: 'center' },

  statsRow:       { flexDirection: 'row', backgroundColor: Colors.navyDeep, borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine, paddingVertical: 16 },
  statCell:       { flex: 1, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 0.5, borderRightColor: Colors.goldLine },
  statValue:      { fontFamily: Fonts.cormorant, fontSize: 26, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', lineHeight: 30 },
  statLabel:      { fontFamily: Fonts.mono, fontSize: 6.5, letterSpacing: 1.5, color: Colors.textMuted, marginTop: 4 },

  tabRow:         { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: Colors.goldLine },
  tabItem:        { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive:  { borderBottomColor: Colors.gold },
  tabLabel:       { fontFamily: Fonts.jakarta, fontSize: 9, letterSpacing: 2, color: Colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: Colors.gold },

  // Pending cards
  pCard:          { marginHorizontal: 20, marginTop: 16, borderWidth: 0.5, borderColor: Colors.goldLine, backgroundColor: Colors.navyMid, padding: 16 },
  pTop:           { flexDirection: 'row', gap: 14, marginBottom: 14 },
  pAvatar:        { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.navyDeep },
  pAvatarText:    { fontFamily: Fonts.mono, fontSize: 11, color: Colors.gold },
  pName:          { fontFamily: Fonts.cormorant, fontSize: 18, color: Colors.ivory, fontWeight: '500', marginBottom: 2 },
  pFirm:          { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, marginBottom: 4 },
  pMeta:          { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5 },
  pBtnRow:        { flexDirection: 'row', gap: 8 },
  pBtn:           { paddingVertical: 11, alignItems: 'center' },
  pBtnFill:       { flex: 1, backgroundColor: Colors.gold },
  pBtnFillText:   { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.navyDeep, fontWeight: '700' },
  pBtnOutline:    { paddingHorizontal: 16, borderWidth: 0.5, borderColor: Colors.goldLine },
  pBtnOutlineText:{ fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '600' },

  // Forms
  form:           { paddingHorizontal: 24, paddingTop: 24 },
  fieldLabel:     { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: 8 },
  input:          { fontFamily: Fonts.cormorant, fontSize: 18, color: Colors.ivory, paddingBottom: 8, paddingTop: 0 },
  textArea:       { minHeight: 100, fontSize: 14, fontFamily: Fonts.jakarta, lineHeight: 21 },
  underline:      { height: 0.5, backgroundColor: Colors.goldLine },
  charCount:      { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textMuted, textAlign: 'right', marginTop: 6 },
  pillRow:        { flexDirection: 'row', gap: 8, marginTop: 4 },
  pill:           { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 0.5, borderColor: Colors.goldLine },
  pillActive:     { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText:       { fontFamily: Fonts.jakarta, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted, fontWeight: '600' },
  pillTextActive: { color: Colors.navyDeep },
  row2:           { flexDirection: 'row', gap: 16 },
  cta:            { backgroundColor: Colors.gold, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  ctaText:        { fontFamily: Fonts.jakarta, fontSize: FontSize.xs, fontWeight: '700', color: Colors.navyDeep, letterSpacing: 2.5 },
  helper:         { fontFamily: Fonts.jakarta, fontSize: 9, color: Colors.textMuted, marginTop: 12, lineHeight: 14 },
  disabled:       { opacity: 0.4 },

  // Empty state
  empty:          { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40 },
  emptyDot:       { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: Colors.goldLine, marginBottom: 20 },
  emptyTitle:     { fontFamily: Fonts.cormorant, fontSize: 20, color: Colors.ivory, fontStyle: 'italic', fontWeight: '300', marginBottom: 10 },
  emptySub:       { fontFamily: Fonts.jakarta, fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
